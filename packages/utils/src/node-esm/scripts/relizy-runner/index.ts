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

/**
 * relizy-runner 准备基线 tag 时依赖的最小 git 操作。
 *
 * 这里刻意只抽象出 tag 相关命令，避免测试直接 mock `child_process`：
 * 生产环境使用本文件内的 {@link defaultBootstrapGitRunner}，单测可注入内存实现，
 * 从而精确断言“创建、推送、回滚”的顺序和边界。
 */
export interface BootstrapGitRunner {
	/** 创建 annotated tag；不能改成 lightweight tag，否则 `git push --follow-tags` 不会自动携带。 */
	createAnnotatedTag: (tagName: string, message: string, env: NodeJS.ProcessEnv) => void;

	/** 只删除本地 tag，用于失败回滚；远端 tag 属于共享状态，不在这个接口里提供删除能力。 */
	deleteTag: (tagName: string, env: NodeJS.ProcessEnv) => void;

	/** 查询某个包已有的历史发版 tag；只要存在任意 `name@*` tag，就可作为 relizy 的 independent 基线。 */
	listTags: (packageName: string, env: NodeJS.ProcessEnv) => string[];

	/** 推送本轮创建的 bootstrap tags；生产实现使用 atomic push，避免远端出现半成功 tag 集合。 */
	pushTags: (tagNames: string[], env: NodeJS.ProcessEnv) => void;
}

/**
 * independent 基线 tag 准备阶段的结构化结果。
 *
 * `runRelizyRunner` 需要根据这些字段决定是否继续调用 relizy，以及 relizy 后续失败时
 * 是否可以安全回滚本地 tag。
 */
export interface BootstrapTagPreparationResult {
	/** 原始异常对象，仅在 `ok: false` 时用于日志输出；不要在准备函数内提前吞掉错误语义。 */
	error?: unknown;

	/** 自动处理失败或禁写模式下给用户的手工兜底命令。 */
	instructions?: string;

	/** tag 准备阶段是否完成；为 false 时调用方必须停止后续 relizy 执行。 */
	ok: boolean;

	/** 本轮创建的 tag 是否已经推送到远端；一旦为 true，失败回滚只能告警，不能自动删除。 */
	pushed: boolean;

	/** 本轮期望准备的 tag 名列表，按 workspace 包发现顺序保留。 */
	tagNames: string[];

	/** 是否已经产生本地 tag 副作用；用于区分“无缺失 tag”和“创建后 relizy 失败需回滚”。 */
	wrote: boolean;
}

/**
 * `runRelizyRunner` 的测试接缝。
 *
 * CLI 正常运行时不需要传入这些选项；单测通过它们替换 git、包发现、relizy 入口与子进程执行，
 * 以覆盖发版脚本中最危险的外部副作用，而不真的修改调用者仓库。
 */
export interface RelizyRunnerOptions {
	/** 替换真实 git 命令的执行器，通常只在单测中使用。 */
	bootstrapGitRunner?: BootstrapGitRunner;

	/** 替换 workspace 包扫描逻辑，用于构造缺失基线 tag 的测试场景。 */
	getMissingPackages?: (env: NodeJS.ProcessEnv) => WorkspacePackageInfo[];

	/** 指定 relizy CLI 入口；默认解析当前工作目录下的本地依赖。 */
	relizyEntrypoint?: string;

	/** 替换 relizy 子进程执行逻辑，返回值对齐 `spawnSync().status`。 */
	spawnRelizy?: (relizyEntrypoint: string, spawnArgs: string[], env: NodeJS.ProcessEnv) => number | null;
}

// ── 工作区包发现 ──────────────────────────────────────────────────────────────

/**
 * 解析根目录 `pnpm-workspace.yaml` 并展开一层 `xxx/*` glob 模式，
 * 收集所有含 `package.json` 的子包目录，返回其 name 与 version。
 *
 * 使用 [pnpm-workspace-yaml](https://github.com/antfu/pnpm-workspace-utils/tree/main/packages/pnpm-workspace-yaml)
 * 解析工作区清单，再用 `pkg-types` 的 `PackageJson` 约束子包字段。
 * 其他复杂 glob 会被跳过：本 runner 只需要覆盖仓库内常规 workspace 包，
 * 不尝试复刻 pnpm 的完整 glob 语义，避免发版前置脚本承担过宽职责。
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
 *
 * 返回的是新的 env 对象，不直接修改 `process.env`。后续 git 与 relizy 子进程都使用同一个 env，
 * 保证 baseline tag 检查和 relizy 真正执行时看到一致的 shell 工具环境。
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

/**
 * 查询某个包在当前仓库内已有的 relizy 风格 tag。
 *
 * independent 模式首次发版只需要“有历史比较基线”，因此这里匹配 `${packageName}@*`，
 * 而不是强制要求当前 package.json 版本已经存在 tag。
 */
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
 * 生产环境的 git 执行器。
 *
 * 所有命令都在 `process.cwd()` 下执行，调用方必须从目标仓库根目录运行 runner。
 * `pushTags` 使用 `git push --atomic origin ...`，避免部分 tag 已进远端、部分 tag 失败的共享状态。
 */
const defaultBootstrapGitRunner: BootstrapGitRunner = {
	createAnnotatedTag(tagName, message, env) {
		execFileSync("git", ["tag", "-a", tagName, "-m", message], {
			cwd: process.cwd(),
			env,
			stdio: "inherit",
		});
	},
	deleteTag(tagName, env) {
		execFileSync("git", ["tag", "-d", tagName], {
			cwd: process.cwd(),
			env,
			stdio: "inherit",
		});
	},
	listTags(packageName, env) {
		return getPackageTags(packageName, env);
	},
	pushTags(tagNames, env) {
		execFileSync("git", ["push", "--atomic", "origin", ...tagNames], {
			cwd: process.cwd(),
			env,
			stdio: "inherit",
		});
	},
};

/**
 * 判断当前 relizy 子命令是否需要检查 independent 基线 tag。
 * 仅 `release` 与 `bump` 需要：它们会触发版本计算或写入，缺少基线 tag 时 relizy 会提前失败。
 */
export function shouldCheckIndependentBootstrap(relizyArgs: string[]) {
	const [command] = relizyArgs;

	return command === "release" || command === "bump";
}

const RELIZY_SUBCOMMANDS_WITH_YES_PRESET = new Set(["release", "bump"]);
const RELIZY_SUBCOMMANDS_WITH_COMPAT_ONLY_YES = new Set(["changelog"]);

/**
 * 规整即将交给 relizy 的参数：移除 runner 专用选项，并在适当时追加 `--yes`。
 *
 * - 对 `release` / `bump`：若未出现 `--yes` 且未要求 `--no-yes`，则在末尾追加 `--yes`。
 * - 对 `changelog`：显式传入的 `--yes` 会被 runner 兼容接受，但不会继续传给 relizy。
 * - `--no-yes` 仅由 relizy-runner 识别，不会传递给 relizy。
 */
export function prepareRelizySpawnArgs(relizyArgs: string[]): string[] {
	const optOutYes = relizyArgs.includes("--no-yes");
	const forward = relizyArgs.filter((arg) => arg !== "--no-yes");
	const [command] = forward;
	const normalizedForward =
		command !== undefined && RELIZY_SUBCOMMANDS_WITH_COMPAT_ONLY_YES.has(command)
			? forward.filter((arg) => arg !== "--yes")
			: forward;

	const shouldInjectYes =
		!optOutYes &&
		command !== undefined &&
		RELIZY_SUBCOMMANDS_WITH_YES_PRESET.has(command) &&
		!normalizedForward.includes("--yes");

	return shouldInjectYes ? [...normalizedForward, "--yes"] : normalizedForward;
}

/** 生成 relizy 使用的包级发版 tag 名，例如 `@scope/pkg@1.0.0`。 */
export function getBootstrapTagName(pkg: WorkspacePackageInfo) {
	return `${pkg.name}@${pkg.version}`;
}

/** 按包发现顺序批量生成 bootstrap tag 名，便于日志、命令与测试断言保持稳定。 */
export function getBootstrapTagNames(packages: WorkspacePackageInfo[]) {
	return packages.map((pkg) => getBootstrapTagName(pkg));
}

/** 判断本轮 bootstrap tags 是否应推送到远端；语义跟随 relizy 的 `--no-push`。 */
export function shouldPushBootstrapTags(relizyArgs: string[]) {
	return !relizyArgs.includes("--no-push");
}

/** 判断本轮是否允许产生 git tag 副作用；dry-run / no-commit 下必须保持完全禁写。 */
export function shouldWriteBootstrapTags(relizyArgs: string[]) {
	return !relizyArgs.includes("--dry-run") && !relizyArgs.includes("--no-commit");
}

/** annotated baseline tag 的统一 message，便于 git 历史中识别这些 tag 是 runner 自动补齐的。 */
function getBootstrapTagMessage(tagName: string) {
	return `chore(release): bootstrap ${tagName}`;
}

/**
 * 找出仍缺少 independent 基线 tag 的 workspace 包。
 *
 * 判定标准是“该包是否已有任意 `name@*` tag”。已有 tag 说明 relizy 后续有历史版本可比较；
 * 没有 tag 时，runner 会按当前 package.json 版本补一个 bootstrap baseline。
 */
export function getPackagesMissingBootstrapTags(
	env: NodeJS.ProcessEnv,
	options: {
		gitRunner?: Pick<BootstrapGitRunner, "listTags">;
		packages?: WorkspacePackageInfo[];
	} = {},
) {
	const gitRunner = options.gitRunner ?? defaultBootstrapGitRunner;
	const packages = options.packages ?? getWorkspacePackages();

	return packages.filter((pkg) => gitRunner.listTags(pkg.name, env).length === 0);
}

/**
 * 在调用 relizy 前准备 independent 模式所需的 baseline tags。
 *
 * 执行顺序必须保持：先创建所有本地 annotated tags，再按 `--no-push` 决定是否推送。
 * 如果处于 `--dry-run` / `--no-commit` 禁写模式，本函数不会创建任何 tag，只返回手工兜底命令。
 * 如果创建或推送失败，会尽量回滚本轮已经创建的本地 tag，并把原始错误交给调用方输出。
 */
export function prepareBootstrapTags(
	missingPackages: WorkspacePackageInfo[],
	relizyArgs: string[],
	env: NodeJS.ProcessEnv = process.env,
	gitRunner: BootstrapGitRunner = defaultBootstrapGitRunner,
): BootstrapTagPreparationResult {
	const tagNames = getBootstrapTagNames(missingPackages);

	if (tagNames.length === 0) {
		return { ok: true, pushed: false, tagNames, wrote: false };
	}

	if (!shouldWriteBootstrapTags(relizyArgs)) {
		return {
			instructions: buildBootstrapInstructions(missingPackages),
			ok: false,
			pushed: false,
			tagNames,
			wrote: false,
		};
	}

	let wrote = false;
	const createdTagNames: string[] = [];

	try {
		for (const tagName of tagNames) {
			gitRunner.createAnnotatedTag(tagName, getBootstrapTagMessage(tagName), env);
			wrote = true;
			createdTagNames.push(tagName);
		}

		if (shouldPushBootstrapTags(relizyArgs)) {
			gitRunner.pushTags(tagNames, env);
			return { ok: true, pushed: true, tagNames, wrote };
		}

		return { ok: true, pushed: false, tagNames, wrote };
	} catch (error) {
		for (const tagName of createdTagNames.toReversed()) {
			try {
				gitRunner.deleteTag(tagName, env);
			} catch {
				// 保留原始失败原因；回滚失败会在 fallback 指令中暴露手工处理路径。
			}
		}

		return {
			error,
			instructions: buildBootstrapInstructions(missingPackages),
			ok: false,
			pushed: false,
			tagNames,
			wrote,
		};
	}
}

/**
 * 根据缺少基线 tag 的包列表，生成包含补打 tag 命令的提示文本。
 *
 * 这段文本用于两类路径：禁写模式下的主动失败提示，以及自动创建失败后的兜底说明。
 * 命令刻意使用 annotated tag，和 runner 自动路径、`git push --follow-tags` 语义保持一致。
 */
export function buildBootstrapInstructions(missingPackages: WorkspacePackageInfo[]) {
	const tagNames = getBootstrapTagNames(missingPackages);
	const tagCommands = tagNames.map((tagName) => `git tag -a "${tagName}" -m "${getBootstrapTagMessage(tagName)}"`);
	const pushArgs = tagNames.map((tagName) => `"${tagName}"`).join(" ");

	return [
		"[release:relizy] 检测到本仓库尚未为以下包建立基线 tag（independent 模式首次发版前需要）：",
		...tagNames.map((tagName) => `- ${tagName}`),
		"",
		"若自动创建失败，可按当前 package.json 版本手工兜底创建 annotated 基线 tag，并推送到远端：",
		...tagCommands,
		...(pushArgs.length > 0 ? [`git push --atomic origin ${pushArgs}`] : []),
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
		"自动准备缺失的 annotated 基线 tag。不改变 relizy 自身的发版与版本计算逻辑。",
		"",
		"用法：",
		"  relizy-runner release --no-publish --no-provider-release",
		"  relizy-runner changelog --dry-run",
		"  relizy-runner bump",
		"",
		"runner 行为：对 release / bump 默认在末尾追加 --yes（跳过上游确认）；",
		"  changelog 不会自动追加 --yes，若显式传入也只会被兼容忽略，不传给 relizy。",
		"  需要交互确认时请加上 --no-yes（仅 runner 识别，不传给 relizy）。",
		"  release / bump 若缺少 independent 基线 tag，会先按当前 package.json 版本创建 annotated tag。",
		"  传入 --no-push 时只创建本地 tag；后续 git push --follow-tags 会携带这些 annotated tags。",
		"  传入 --dry-run 或 --no-commit 时不会写 tag，缺失基线 tag 时打印手工兜底命令并退出。",
		"",
		"常用参数（节选，由 relizy 处理；runner 仅做少量兼容规整）：",
		"  --dry-run              预览，不写文件、不打 tag、不提交；runner 也不会创建 bootstrap tags",
		"  --no-push              不 push 到远端；runner 创建的 bootstrap tags 也只保留在本地",
		"  --no-publish           不执行 npm publish",
		"  --no-provider-release  不在 GitHub/GitLab 创建 Release",
		"  --no-commit            不创建提交与 tag；runner 也不会创建 bootstrap tags",
		"  --no-changelog         不生成 changelog 文件",
		"  --no-verify            提交时跳过 git hooks",
		"  --yes                  跳过 relizy 的确认提示（release/bump 下 runner 也会自动追加；changelog 下仅兼容忽略）",
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

/**
 * 解析当前项目安装的 relizy CLI 入口。
 *
 * runner 不调用全局 relizy，避免本机全局版本与项目锁定版本不一致导致发版行为漂移。
 */
function resolveRelizyEntrypoint() {
	return resolve(process.cwd(), "node_modules", "relizy", "bin", "relizy.mjs");
}

/** 将未知异常规整成可读日志，同时保留 Error.message 的主要诊断信息。 */
function formatErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

/**
 * 尽力删除本轮创建但尚未推送的本地 bootstrap tags。
 *
 * 回滚失败只告警，不覆盖原始 relizy 失败；否则用户会丢失真正需要处理的上游错误。
 */
function rollbackLocalBootstrapTags(tagNames: string[], env: NodeJS.ProcessEnv, gitRunner: BootstrapGitRunner) {
	for (const tagName of tagNames.toReversed()) {
		try {
			gitRunner.deleteTag(tagName, env);
		} catch (error) {
			consola.warn(`[release:relizy] 回滚本地 bootstrap tag 失败：${tagName}，原因：${formatErrorMessage(error)}`);
		}
	}
}

/**
 * relizy 后续失败时处理 runner 提前创建的 bootstrap tags。
 *
 * 未推送的本地 tag 可以回滚，避免下一次重试读到半成品本地状态。
 * 已推送的 tag 可能已经成为远端共享基线，甚至触发过 GitHub workflow，因此只告警，不自动删除。
 */
function rollbackBootstrapTagsAfterRelizyFailure(
	bootstrapResult: BootstrapTagPreparationResult | undefined,
	env: NodeJS.ProcessEnv,
	gitRunner: BootstrapGitRunner,
) {
	if (bootstrapResult?.ok && bootstrapResult.wrote && !bootstrapResult.pushed) {
		rollbackLocalBootstrapTags(bootstrapResult.tagNames, env, gitRunner);
		consola.info("[release:relizy] 已删除本轮未推送的本地 bootstrap tags；远端 tag 未做任何删除。");
	} else if (bootstrapResult?.ok && bootstrapResult.pushed) {
		consola.warn("[release:relizy] 本轮 bootstrap tags 已成功推送，relizy 后续失败时不会删除远端或本地 tags。");
	}
}

/**
 * 执行 relizy-runner。
 *
 * @description
 * 围绕 relizy 执行做以下前后置处理：
 * 1. Windows 下自动补齐 Git for Windows 的 `usr\bin` 路径，避免 relizy 内部调用 `grep`/`head`/`sed` 失败。
 * 2. 在 `release`/`bump` 前校验 independent 基线 tag，缺失时自动创建 annotated baseline tags。
 * 3. relizy 后续失败时，只回滚本轮未推送的本地 bootstrap tags，避免误删远端共享状态。
 *
 * @param relizyArgs - 透传给 relizy 的子命令与参数（会先经 {@link prepareRelizySpawnArgs} 规整）
 * @param options - 测试接缝；CLI 正常运行时保持默认值即可
 * @returns 退出码
 */
export function runRelizyRunner(relizyArgs: string[], options: RelizyRunnerOptions = {}) {
	if (relizyArgs.length === 0) {
		consola.error("用法：relizy-runner <relizy 子命令与参数>");
		consola.error("示例：relizy-runner release --no-publish --no-provider-release");
		return 1;
	}

	const spawnArgs = prepareRelizySpawnArgs(relizyArgs);
	const rawForwardArgs = relizyArgs.filter((arg) => arg !== "--no-yes");
	const [command] = rawForwardArgs;

	if (command === "changelog" && rawForwardArgs.includes("--yes") && !spawnArgs.includes("--yes")) {
		consola.info("[release:relizy] `changelog` 子命令不需要 `--yes`，已兼容忽略该参数。");
	}

	consola.start(`[release:relizy] 执行命令：relizy ${spawnArgs.join(" ")}`);

	const env = ensureRelizyShellEnv();
	const gitRunner = options.bootstrapGitRunner ?? defaultBootstrapGitRunner;
	let bootstrapResult: BootstrapTagPreparationResult | undefined;

	if (shouldCheckIndependentBootstrap(spawnArgs)) {
		consola.info("[release:relizy] 检查 independent 基线 tag...");
		const missingPackages = options.getMissingPackages?.(env) ?? getPackagesMissingBootstrapTags(env);

		if (missingPackages.length > 0) {
			const result = prepareBootstrapTags(missingPackages, spawnArgs, env, gitRunner);
			bootstrapResult = result;
			const tagsText = result.tagNames.join(", ");

			if (!shouldWriteBootstrapTags(spawnArgs)) {
				consola.error(`[release:relizy] 缺少 independent 基线 tags：${tagsText}`);
				consola.error(
					"[release:relizy] 当前为 --dry-run 或 --no-commit，不会真实创建 git tag；请移除跳过参数后重试，或按手工兜底命令执行。",
				);
				printBootstrapInstructions(missingPackages);
				return 1;
			}

			if (!result.ok) {
				consola.error(`[release:relizy] 自动准备 independent 基线 tags 失败：${formatErrorMessage(result.error)}`);
				printBootstrapInstructions(missingPackages);
				return 1;
			}

			if (result.pushed) {
				consola.success(`[release:relizy] 已创建并推送 annotated 基线 tags：${tagsText}`);
			} else {
				consola.success(`[release:relizy] 已创建本地 annotated 基线 tags：${tagsText}`);
				consola.info(
					"[release:relizy] 检测到 --no-push，本地 tags 暂不推送；后续执行 git push --follow-tags 会携带这些 annotated tags。",
				);
			}
		}

		consola.success("[release:relizy] 基线 tag 检查通过。");
	}

	const relizyEntrypoint = options.relizyEntrypoint ?? resolveRelizyEntrypoint();

	if (!existsSync(relizyEntrypoint)) {
		consola.error("未在 node_modules 中找到 relizy 命令行入口，请先执行 pnpm install。");
		rollbackBootstrapTagsAfterRelizyFailure(bootstrapResult, env, gitRunner);
		return 1;
	}

	consola.info(`[release:relizy] 调用 relizy 入口：${relizyEntrypoint}`);

	const result =
		options.spawnRelizy === undefined
			? spawnSync(process.execPath, [relizyEntrypoint, ...spawnArgs], {
					cwd: process.cwd(),
					env,
					stdio: "inherit",
				})
			: { status: options.spawnRelizy(relizyEntrypoint, spawnArgs, env) };

	if (result.status === 0) {
		consola.success("[release:relizy] relizy 执行完毕。");
	} else {
		consola.error(`[release:relizy] relizy 以退出码 ${result.status} 结束。`);
	}

	if (result.status !== 0) {
		rollbackBootstrapTagsAfterRelizyFailure(bootstrapResult, env, gitRunner);
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
