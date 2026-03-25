import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import consola from "consola";
import { parsePnpmWorkspaceYaml } from "pnpm-workspace-yaml";
import type { PackageJson } from "pkg-types";

/**
 * 本脚本将（经本节所述规整后的）参数转发给 relizy CLI。
 *
 * **`release` / `bump` 默认附带 `--yes`（内部预设）**：`relizy` 在应用版本计划前会交互询问
 * 「Do you want to proceed with these version updates?」。在终端、CI、`pnpm` 脚本中若
 * 未关闭该提示，进程会一直等待 stdin，看起来像“卡死”。`--yes` 对应上游选项
 * *Skip confirmation prompt about bumping packages*，与改发版算法无关。
 *
 * 若需在本地逐步人工确认，可传入 **runner 专用** 的 `--no-yes`：该参数不会转发给 relizy，
 * 且会关闭上述自动注入（仅对 `release` / `bump` 生效）。
 */

const WINDOWS_GNU_COMMANDS = ["grep", "head", "sed"] as const;

/** 发版基线 tag 校验所需的最小字段，由 {@link PackageJson} 派生。 */
export type WorkspacePackageInfo = Required<Pick<PackageJson, "name" | "version">>;

// ── 工作区包发现 ──────────────────────────────────────────────────────────────

/**
 * 解析根目录 `pnpm-workspace.yaml` 并展开 glob 模式，
 * 收集所有含 `package.json` 的子包目录，返回其 name 与 version。
 *
 * 使用 [pnpm-workspace-yaml](https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/pnpm-workspace-yaml)
 * 解析工作区清单，再用 `pkg-types` 的 `PackageJson` 约束子包字段。
 */
export function getWorkspacePackages(workspaceRoot?: string): WorkspacePackageInfo[] {
	const root = workspaceRoot ?? process.cwd();
	const yamlPath = resolve(root, "pnpm-workspace.yaml");

	if (!existsSync(yamlPath)) {
		consola.error("release:relizy：未在当前目录找到 pnpm-workspace.yaml，请从仓库根目录执行。");
		return [];
	}

	const globs = parsePnpmWorkspaceYaml(readFileSync(yamlPath, "utf8")).toJSON().packages ?? [];
	const packages: WorkspacePackageInfo[] = [];

	for (const pattern of globs) {
		const parts = pattern.split("/");

		if (parts.length !== 2 || parts[1] !== "*") {
			continue;
		}

		const dir = resolve(root, parts[0]);

		if (!existsSync(dir)) {
			continue;
		}

		const discovered = readdirSync(dir, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => join(dir, entry.name, "package.json"))
			.filter((pkgPath) => existsSync(pkgPath))
			.map((pkgPath) => {
				const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;

				return { name: pkg.name, version: pkg.version };
			})
			.filter((pkg): pkg is WorkspacePackageInfo => typeof pkg.name === "string" && typeof pkg.version === "string");

		packages.push(...discovered);
	}

	return packages;
}

// ── Windows GNU 工具兼容层 ────────────────────────────────────────────────────

function runLookup(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
	return spawnSync(command, args, {
		cwd: process.cwd(),
		env,
		encoding: "utf8",
		stdio: "pipe",
	});
}

function hasExecutable(command: string, env: NodeJS.ProcessEnv = process.env) {
	const lookupCommand = process.platform === "win32" ? "where" : "which";

	return runLookup(lookupCommand, [command], env).status === 0;
}

function listExecutableMatches(command: string) {
	const lookupCommand = process.platform === "win32" ? "where" : "which";
	const result = runLookup(lookupCommand, [command]);

	if (result.status !== 0) {
		return [];
	}

	return result.stdout
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter(Boolean);
}

function resolveGitUsrBinPath() {
	if (process.platform !== "win32") {
		return null;
	}

	const candidates = new Set<string>();

	for (const executablePath of [...listExecutableMatches("bash"), ...listExecutableMatches("git")]) {
		const executableDir = dirname(executablePath);

		candidates.add(resolve(executableDir, "..", "usr", "bin"));
		candidates.add(resolve(executableDir, "usr", "bin"));
	}

	for (const candidate of candidates) {
		const hasAllCommands = WINDOWS_GNU_COMMANDS.every((command) => existsSync(join(candidate, `${command}.exe`)));

		if (hasAllCommands) {
			return candidate;
		}
	}

	return null;
}

/**
 * 确保 relizy 所需的 GNU 工具（grep / head / sed）在 PATH 中可用。
 * Windows 下会自动补齐 Git for Windows 的 `usr\bin` 路径。
 */
export function ensureRelizyShellEnv() {
	if (process.platform !== "win32") {
		return { ...process.env };
	}

	if (WINDOWS_GNU_COMMANDS.every((command) => hasExecutable(command))) {
		return { ...process.env };
	}

	const gitUsrBinPath = resolveGitUsrBinPath();

	if (!gitUsrBinPath) {
		consola.error("[release:relizy] 在 Windows 上未找到 relizy 所需的 GNU 工具（grep / head / sed）。");
		consola.error("请先安装 Git for Windows，或将其安装目录下的 usr\\bin 加入 PATH。");
		process.exit(1);
	}

	const env = {
		...process.env,
		PATH: `${gitUsrBinPath};${process.env.PATH ?? ""}`,
	};

	if (!WINDOWS_GNU_COMMANDS.every((command) => hasExecutable(command, env))) {
		consola.error("[release:relizy] 已定位到 Git for Windows，但 grep / head / sed 仍不可用。");
		consola.error(`请检查 PATH，或手动确认该目录是否存在所需可执行文件：${gitUsrBinPath}`);
		process.exit(1);
	}

	consola.info(`[release:relizy] Windows 下已补齐 GNU 工具路径：${gitUsrBinPath}`);

	return env;
}

// ── independent 模式 baseline tag 检查 ───────────────────────────────────────

function getPackageTags(packageName: string, env: NodeJS.ProcessEnv) {
	const stdout = execFileSync("git", ["tag", "--list", `${packageName}@*`], {
		cwd: process.cwd(),
		env,
		encoding: "utf8",
	});

	return stdout
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter(Boolean);
}

/**
 * 判断当前 relizy 子命令是否需要检查 independent 基线 tag。
 * 仅 `release` 与 `bump` 需要。
 */
export function shouldCheckIndependentBootstrap(relizyArgs: string[]) {
	const [command] = relizyArgs;

	return command === "release" || command === "bump";
}

const RELIZY_SUBCOMMANDS_WITH_YES_PRESET = new Set(["release", "bump"]);

/**
 * 规整即将交给 relizy 的参数：移除 runner 专用选项，并在适当时追加 `--yes`。
 *
 * - 对 `release` / `bump`：若未出现 `--yes` 且未要求 `--no-yes`，则在末尾追加 `--yes`。
 * - `--no-yes` 仅由 relizy-runner 识别，不会传递给 relizy。
 */
export function prepareRelizySpawnArgs(relizyArgs: string[]): string[] {
	const optOutYes = relizyArgs.includes("--no-yes");
	const forward = relizyArgs.filter((arg) => arg !== "--no-yes");
	const [command] = forward;

	const shouldInjectYes =
		!optOutYes &&
		command !== undefined &&
		RELIZY_SUBCOMMANDS_WITH_YES_PRESET.has(command) &&
		!forward.includes("--yes");

	return shouldInjectYes ? [...forward, "--yes"] : forward;
}

function getPackagesMissingBootstrapTags(env: NodeJS.ProcessEnv) {
	return getWorkspacePackages().filter((pkg) => getPackageTags(pkg.name, env).length === 0);
}

/**
 * 根据缺少基线 tag 的包列表，生成包含补打 tag 命令的提示文本。
 */
export function buildBootstrapInstructions(missingPackages: WorkspacePackageInfo[]) {
	const tagCommands = missingPackages.map((pkg) => `git tag "${pkg.name}@${pkg.version}"`);
	const pushArgs = missingPackages.map((pkg) => `"${pkg.name}@${pkg.version}"`).join(" ");

	return [
		"[release:relizy] 检测到本仓库尚未为以下包建立基线 tag（independent 模式首次发版前需要）：",
		...missingPackages.map((pkg) => `- ${pkg.name}@${pkg.version}`),
		"",
		"请按当前 package.json 版本创建基线 tag，并推送到远端：",
		...tagCommands,
		`git push origin ${pushArgs}`,
	].join("\n");
}

function printBootstrapInstructions(missingPackages: WorkspacePackageInfo[]) {
	consola.error(buildBootstrapInstructions(missingPackages));
}

// ── 帮助信息 ──────────────────────────────────────────────────────────────────

/**
 * 获取 relizy-runner CLI 的帮助文本。
 */
export function getRelizyRunnerHelpText() {
	return [
		"relizy-runner <relizy 子命令与参数>",
		"",
		"在 relizy 执行前补齐 Windows GNU 工具路径，并在首次 independent 发版前",
		"校验基线 tag。不改变 relizy 自身的发版与版本计算逻辑。",
		"",
		"用法：",
		"  relizy-runner release --no-publish --no-provider-release",
		"  relizy-runner changelog --dry-run",
		"  relizy-runner bump",
		"",
		"runner 行为：对 release / bump 默认在末尾追加 --yes（跳过上游确认）；",
		"  需要交互确认时请加上 --no-yes（仅 runner 识别，不传给 relizy）。",
		"",
		"常用参数（节选，由 relizy 处理；除 --no-yes 外 runner 仅透传）：",
		"  --dry-run              预览，不写文件、不打 tag、不提交",
		"  --no-push              不 push 到远端",
		"  --no-publish           不执行 npm publish",
		"  --no-provider-release  不在 GitHub/GitLab 创建 Release",
		"  --no-commit            不创建提交与 tag",
		"  --no-changelog         不生成 changelog 文件",
		"  --no-verify            提交时跳过 git hooks",
		"  --yes                  跳过 relizy 的确认提示（release/bump 下 runner 也会自动追加）",
		"",
		"以上仅为常用参数节选，完整参数请查阅 relizy 包自身文档：",
		"  npx relizy --help",
		"  npx relizy release --help",
		"  npx relizy changelog --help",
		"",
		"示例：",
		"  npx relizy-runner release --no-publish --no-provider-release",
		"  npx ruan-cat-utils relizy-runner release --dry-run",
		"",
		"选项：",
		"  --no-yes               关闭 release/bump 的自动 --yes，恢复 relizy 交互确认",
		"  -h, --help             查看帮助信息",
	].join("\n");
}

// ── 主入口 ────────────────────────────────────────────────────────────────────

function resolveRelizyEntrypoint() {
	return resolve(process.cwd(), "node_modules", "relizy", "bin", "relizy.mjs");
}

/**
 * 执行 relizy-runner。
 *
 * @description
 * 在 relizy 执行前做两件事：
 * 1. Windows 下自动补齐 Git for Windows 的 `usr\bin` 路径，避免 relizy 内部调用 `grep`/`head`/`sed` 失败。
 * 2. 在 `release`/`bump` 前校验 independent 基线 tag，缺失时打印补打命令并终止。
 *
 * @param relizyArgs - 透传给 relizy 的子命令与参数（会先经 {@link prepareRelizySpawnArgs} 规整）
 * @returns 退出码
 */
export function runRelizyRunner(relizyArgs: string[]) {
	if (relizyArgs.length === 0) {
		consola.error("用法：relizy-runner <relizy 子命令与参数>");
		consola.error("示例：relizy-runner release --no-publish --no-provider-release");
		return 1;
	}

	const spawnArgs = prepareRelizySpawnArgs(relizyArgs);

	consola.start(`[release:relizy] 执行命令：relizy ${spawnArgs.join(" ")}`);

	const env = ensureRelizyShellEnv();

	if (shouldCheckIndependentBootstrap(spawnArgs)) {
		consola.info("[release:relizy] 检查 independent 基线 tag...");
		const missingPackages = getPackagesMissingBootstrapTags(env);

		if (missingPackages.length > 0) {
			printBootstrapInstructions(missingPackages);
			return 1;
		}

		consola.success("[release:relizy] 基线 tag 检查通过。");
	}

	const relizyEntrypoint = resolveRelizyEntrypoint();

	if (!existsSync(relizyEntrypoint)) {
		consola.error("未在 node_modules 中找到 relizy 命令行入口，请先执行 pnpm install。");
		return 1;
	}

	consola.info(`[release:relizy] 调用 relizy 入口：${relizyEntrypoint}`);

	const result = spawnSync(process.execPath, [relizyEntrypoint, ...spawnArgs], {
		cwd: process.cwd(),
		env,
		stdio: "inherit",
	});

	if (result.status === 0) {
		consola.success("[release:relizy] relizy 执行完毕。");
	} else {
		consola.error(`[release:relizy] relizy 以退出码 ${result.status} 结束。`);
	}

	return result.status ?? 1;
}

/**
 * 解析 relizy-runner CLI 参数。
 * 如果首个参数是 `--help` 或 `-h`，返回 `{ help: true }`。
 * 否则将所有参数透传给 relizy。
 */
export function parseRelizyRunnerCliArgs(args: string[]): { help: boolean; relizyArgs: string[] } {
	if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
		return { help: true, relizyArgs: [] };
	}

	return { help: false, relizyArgs: args };
}

/**
 * 执行 relizy-runner CLI。
 */
export function runRelizyRunnerCli(args: string[] = process.argv.slice(2)) {
	const parsed = parseRelizyRunnerCliArgs(args);

	if (parsed.help) {
		console.log(getRelizyRunnerHelpText());
		return;
	}

	const exitCode = runRelizyRunner(parsed.relizyArgs);
	process.exitCode = exitCode;
}

function isRunningAsCli() {
	const currentFilePath = fileURLToPath(import.meta.url);
	const entryPath = process.argv[1];

	if (!entryPath) {
		return false;
	}

	return resolve(entryPath) === currentFilePath;
}

if (isRunningAsCli()) {
	runRelizyRunnerCli();
}
