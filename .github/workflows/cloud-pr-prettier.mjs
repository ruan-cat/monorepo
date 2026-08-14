import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { extname, join } from "node:path";

/**
 * 与根目录 `format` script 保持一致的可格式化文件扩展名集合。
 *
 * 这里只负责做第一层候选筛选；仓库中的 `.config/.prettierignore`
 * 与 `.gitignore` 仍由 Prettier 自己作为最终 ignore 规则处理。
 */
const supportedExtensions = new Set([
	".js",
	".jsx",
	".ts",
	".tsx",
	".mts",
	".json",
	".css",
	".scss",
	".md",
	".yml",
	".yaml",
	".html",
]);

/**
 * 每批 Prettier 调用共享的 CLI 参数。
 *
 * 具体文件路径会在执行时追加到该参数数组之后，确保只格式化本次 PR
 * 的精准候选文件，而不是扫描整个 monorepo。
 */
const prettierArgs = [
	"exec",
	"prettier",
	"--experimental-cli",
	"--write",
	"--no-parallel",
	"--ignore-path",
	"./.config/.prettierignore",
	"--ignore-path",
	".gitignore",
];

/**
 * 单次命令行参数的近似字节上限。
 *
 * 不直接依赖操作系统的 ARG_MAX，而是使用较保守的阈值主动分块，
 * 避免大型 PR 因文件路径过多导致 `spawnSync` 参数过长。
 */
const maxChunkChars = 100_000;

/**
 * 写入 `$RUNNER_TEMP` 的 NUL 分隔文件名。
 *
 * 后续 workflow 的精准 staging step 会读取同一个文件，配合
 * `git --pathspec-from-file` 与 `--pathspec-file-nul` 只暂存候选路径。
 */
const fileListName = "cloud-pr-prettier-files.zlist";

/**
 * 读取一个必须存在且非空的环境变量。
 *
 * @param {string} name 环境变量名称。
 * @returns {string} 环境变量值。
 * @throws {Error} 当环境变量不存在或为空字符串时抛出异常。
 */
function requireEnvironment(name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`缺少必要环境变量：${name}`);
	}
	return value;
}

/**
 * 获取当前 PR 相对于 base commit 的 ACMR 文件路径。
 *
 * 使用三点 diff (`base...HEAD`) 以 merge-base 为比较基准，只保留：
 * Added、Copied、Modified、Renamed 文件。删除文件不会传给 Prettier。
 * `-z` 让 Git 使用 NUL 分隔路径，避免空格、换行等特殊字符破坏解析。
 *
 * @param {string} baseSha PR base commit SHA，由 workflow 的 `BASE_SHA` 提供。
 * @returns {string[]} PR 中 ACMR 状态文件的仓库相对路径列表。
 */
function getPullRequestFiles(baseSha) {
	const output = execFileSync(
		"git",
		["diff", "--name-only", "-z", "--diff-filter=ACMR", `${baseSha}...HEAD`],
		{ encoding: "utf8" },
	);

	return output.split("\0").filter(Boolean);
}

/**
 * 判断单个 PR 文件是否应进入精准 Prettier 候选集合。
 *
 * 候选文件必须满足：
 * - 扩展名属于 `supportedExtensions`；
 * - 路径中不存在名为 `snippets` 的目录段。
 *
 * 是否被 `.prettierignore` / `.gitignore` 忽略不在这里重复实现，
 * 而是继续交给 Prettier 自身判断，避免维护两套 ignore 规则。
 *
 * @param {string} file 仓库相对文件路径。
 * @returns {boolean} 是否应将该文件传给 Prettier。
 */
function isPrettierCandidate(file) {
	const normalized = file.replaceAll("\\", "/");
	const segments = normalized.split("/");

	return supportedExtensions.has(extname(normalized)) && !segments.includes("snippets");
}

/**
 * 从 PR ACMR 文件中筛选出需要交给 Prettier 的精准候选文件。
 *
 * @param {string[]} prFiles PR 中 ACMR 状态的文件路径列表。
 * @returns {string[]} 满足扩展名和目录边界要求的 Prettier 候选路径。
 */
function selectPrettierFiles(prFiles) {
	return prFiles.filter(isPrettierCandidate);
}

/**
 * 将 Prettier 候选路径写入 Git 可安全消费的 NUL 分隔临时文件。
 *
 * 该文件不仅是本脚本的输出记录，也是 workflow 后续精准 staging 的契约：
 * `git add` 只会读取这里列出的路径，不会无边界暂存 runner 工作树中的其他副作用。
 *
 * @param {string} runnerTemp GitHub Actions 提供的 `$RUNNER_TEMP` 目录。
 * @param {string[]} prettierFiles Prettier 精准候选文件路径列表。
 * @returns {string} 已写入的 NUL 分隔文件绝对路径。
 */
function writePrettierFileList(runnerTemp, prettierFiles) {
	const fileListPath = join(runnerTemp, fileListName);
	const content = prettierFiles.map((file) => `${file}\0`).join("");
	writeFileSync(fileListPath, content, "utf8");
	return fileListPath;
}

/**
 * 执行一批已经带 `./` 前缀的 Prettier 文件参数。
 *
 * 子进程继承标准输入输出，确保 GitHub Actions 日志直接显示 Prettier 输出。
 * 若 pnpm 无法启动或 Prettier 返回非零退出码，则让当前 workflow step 失败。
 *
 * @param {string[]} files 单批传给 Prettier CLI 的文件参数。
 * @returns {void}
 * @throws {Error} 当 `pnpm` 子进程无法创建时抛出异常。
 */
function runPrettierChunk(files) {
	if (files.length === 0) return;

	const result = spawnSync("pnpm", [...prettierArgs, ...files], {
		stdio: "inherit",
	});

	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}

/**
 * 按近似命令行参数字节长度分块格式化所有精准候选文件。
 *
 * 每个仓库相对路径都会加上 `./` 前缀后传给本地 Prettier。
 * 当累计参数长度超过 `maxChunkChars` 时立即执行当前批次，再继续收集下一批。
 * 这种分块只改变执行批次，不改变候选文件集合和格式化规则。
 *
 * @param {string[]} prettierFiles Prettier 精准候选文件路径列表。
 * @returns {void}
 */
function formatPrettierFiles(prettierFiles) {
	let chunk = [];
	let chunkChars = 0;

	for (const file of prettierFiles) {
		const argument = `./${file}`;
		const argumentChars = Buffer.byteLength(argument) + 1;

		if (chunk.length > 0 && chunkChars + argumentChars > maxChunkChars) {
			runPrettierChunk(chunk);
			chunk = [];
			chunkChars = 0;
		}

		chunk.push(argument);
		chunkChars += argumentChars;
	}

	runPrettierChunk(chunk);
}

/**
 * 输出本次精准格式化的可审计摘要。
 *
 * 日志同时展示 PR ACMR 文件数量、实际 Prettier 候选数量、临时文件位置
 * 以及每个候选路径，方便从 GitHub Actions 日志直接复盘文件选择结果。
 *
 * @param {string[]} prFiles PR 中 ACMR 状态的文件路径列表。
 * @param {string[]} prettierFiles Prettier 精准候选文件路径列表。
 * @param {string} fileListPath NUL 分隔候选文件列表的绝对路径。
 * @returns {void}
 */
function printSummary(prFiles, prettierFiles, fileListPath) {
	console.log(`PR ACMR 文件数：${prFiles.length}`);
	console.log(`Prettier 精准候选文件数：${prettierFiles.length}`);
	console.log(`候选文件列表：${fileListPath}`);

	for (const file of prettierFiles) {
		console.log(`- ${file}`);
	}
}

/**
 * GitHub Actions 脚本入口。
 *
 * 执行顺序：
 * 1. 校验 workflow 提供的 `BASE_SHA` 与 GitHub runner 提供的 `RUNNER_TEMP`；
 * 2. 提取 PR ACMR 文件；
 * 3. 筛选 Prettier 精准候选；
 * 4. 写出供后续精准 staging 使用的 NUL 路径列表；
 * 5. 输出审计摘要；
 * 6. 仅格式化候选文件。
 *
 * 该入口不会执行 `git add`、commit 或 push；这些仍由 workflow 编排层负责。
 *
 * @returns {void}
 */
function main() {
	const baseSha = requireEnvironment("BASE_SHA");
	const runnerTemp = requireEnvironment("RUNNER_TEMP");

	const prFiles = getPullRequestFiles(baseSha);
	const prettierFiles = selectPrettierFiles(prFiles);
	const fileListPath = writePrettierFileList(runnerTemp, prettierFiles);

	printSummary(prFiles, prettierFiles, fileListPath);
	formatPrettierFiles(prettierFiles);
}

main();
