/**
 * relizy-runner.ts — 通用 Relizy Runner 模板
 *
 * 本文件同时解决两个独立问题：
 *   1. Windows GNU 工具兼容：在 Windows PowerShell 下找到 Git for Windows 自带的
 *      grep / head / sed，注入 PATH，避免 relizy 内部调用失败。
 *   2. Baseline tag 预检：在 `release` / `bump` 前扫描所有目标子包，若任一包缺少
 *      `@scope/pkg@x.y.z` 形式的 git tag，立即打印补 tag 指令并退出——不执行 relizy。
 *
 * 问题 2 与操作系统无关；只要 monorepo 尚未完成首次独立发版初始化，就可能触发。
 * 这是 runner 成为「默认安全层」而非「Windows 专属选项」的根本原因。
 *
 * ── 定制化说明 ──────────────────────────────────────────────────────────────
 *
 * 唯一需要按仓库调整的函数是 getWorkspacePackages()（见下方标注）：
 *   - 将 readdirSync(appsDir) 中的 `apps` 替换为目标工作区目录。
 *   - 若工作区包含多个 glob（如 `apps/*`、`packages/*`），按需合并扫描结果。
 *   - 扫描逻辑不影响 relizy.config.ts 里的 `monorepo.packages`；两者独立配置。
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const WINDOWS_GNU_COMMANDS = ["grep", "head", "sed"] as const;

export interface WorkspacePackageInfo {
	name: string;
	version: string;
}

// ── 工具函数（无需定制） ────────────────────────────────────────────────────

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
	if (result.status !== 0) return [];
	return result.stdout
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter(Boolean);
}

function resolveGitUsrBinPath() {
	if (process.platform !== "win32") return null;

	const candidates = new Set<string>();
	for (const executablePath of [...listExecutableMatches("bash"), ...listExecutableMatches("git")]) {
		const executableDir = dirname(executablePath);
		candidates.add(resolve(executableDir, "..", "usr", "bin"));
		candidates.add(resolve(executableDir, "usr", "bin"));
	}
	for (const candidate of candidates) {
		const hasAllCommands = WINDOWS_GNU_COMMANDS.every((cmd) => existsSync(join(candidate, `${cmd}.exe`)));
		if (hasAllCommands) return candidate;
	}
	return null;
}

function ensureRelizyShellEnv() {
	if (process.platform !== "win32") return { ...process.env };
	if (WINDOWS_GNU_COMMANDS.every((cmd) => hasExecutable(cmd))) return { ...process.env };

	const gitUsrBinPath = resolveGitUsrBinPath();
	if (!gitUsrBinPath) {
		console.error("release:relizy could not find the GNU tools required by relizy on Windows.");
		console.error("Install Git for Windows first, or add its usr/bin directory to PATH.");
		process.exit(1);
	}

	const env = { ...process.env, PATH: `${gitUsrBinPath};${process.env.PATH ?? ""}` };
	if (!WINDOWS_GNU_COMMANDS.every((cmd) => hasExecutable(cmd, env))) {
		console.error("release:relizy found Git for Windows, but grep/head/sed are still unavailable.");
		console.error(`Check PATH, or verify this directory manually: ${gitUsrBinPath}`);
		process.exit(1);
	}
	return env;
}

// ── 需要定制的函数 ──────────────────────────────────────────────────────────

/**
 * 扫描工作区包，返回 { name, version } 列表。
 *
 * ⚠️ 定制点：将 `apps` 替换为目标工作区目录，或合并多个目录的扫描结果。
 *
 * 示例（多 glob）：
 *   const dirs = ["apps", "packages", "configs"];
 *   return dirs.flatMap(dir => scanDir(resolve(process.cwd(), dir)));
 */
function getWorkspacePackages(): WorkspacePackageInfo[] {
	// ⚠️ 定制点：将 "apps" 改为实际工作区根目录（或多个目录合并）
	const targetDir = resolve(process.cwd(), "apps");

	if (!existsSync(targetDir)) return [];

	return readdirSync(targetDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => join(targetDir, entry.name, "package.json"))
		.filter((pkgPath) => existsSync(pkgPath))
		.map((pkgPath) => {
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as Partial<WorkspacePackageInfo>;
			return { name: pkg.name, version: pkg.version };
		})
		.filter((pkg): pkg is WorkspacePackageInfo => typeof pkg.name === "string" && typeof pkg.version === "string");
}

// ── Baseline tag 预检（无需定制） ───────────────────────────────────────────

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

export function shouldCheckIndependentBootstrap(relizyArgs: string[]) {
	const [command] = relizyArgs;
	return command === "release" || command === "bump";
}

function getPackagesMissingBootstrapTags(env: NodeJS.ProcessEnv) {
	return getWorkspacePackages().filter((pkg) => getPackageTags(pkg.name, env).length === 0);
}

export function buildBootstrapInstructions(missingPackages: WorkspacePackageInfo[]) {
	const tagCommands = missingPackages.map((pkg) => `git tag "${pkg.name}@${pkg.version}"`);
	const pushArgs = missingPackages.map((pkg) => `"${pkg.name}@${pkg.version}"`).join(" ");
	return [
		"release:relizy detected that this repository does not have baseline package tags yet:",
		...missingPackages.map((pkg) => `  - ${pkg.name}@${pkg.version}`),
		"",
		"Before the first independent release, create baseline tags at the current package versions:",
		...tagCommands,
		`git push origin ${pushArgs}`,
	].join("\n");
}

// ── 主入口 ──────────────────────────────────────────────────────────────────

export function runRelizyRunner(relizyArgs: string[]) {
	if (relizyArgs.length === 0) {
		console.error("Usage: tsx scripts/relizy-runner.ts <relizy args>");
		return 1;
	}

	// 步骤 1：准备环境（Windows GNU 工具注入）
	const env = ensureRelizyShellEnv();

	// 步骤 2：Baseline tag 预检（release / bump 前阻断）
	if (shouldCheckIndependentBootstrap(relizyArgs)) {
		const missingPackages = getPackagesMissingBootstrapTags(env);
		if (missingPackages.length > 0) {
			console.error(buildBootstrapInstructions(missingPackages));
			return 1;
		}
	}

	// 步骤 3：运行 relizy
	const relizyEntrypoint = resolve(process.cwd(), "node_modules", "relizy", "bin", "relizy.mjs");
	if (!existsSync(relizyEntrypoint)) {
		console.error("Local relizy CLI was not found. Run pnpm install first.");
		return 1;
	}
	const result = spawnSync(process.execPath, [relizyEntrypoint, ...relizyArgs], {
		cwd: process.cwd(),
		env,
		stdio: "inherit",
	});
	return result.status ?? 1;
}

function isDirectExecution() {
	if (!process.argv[1]) return false;
	return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
	process.exit(runRelizyRunner(process.argv.slice(2)));
}
