import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import { consola } from "consola";
import type { VercelDeployConfig, DeployTarget } from "../config/schema";
import { VERCEL_NULL_CONFIG_PATH } from "../utils/vercel-null-config";

export const MIN_VERCEL_CLI_VERSION = "47.2.2";

/**
 * 获取 Vercel 项目名称参数
 */
export function getVercelProjectNameArg(config: VercelDeployConfig): string[] {
	return ["--project", config.vercelProjectName];
}

/**
 * 获取 Vercel scope 参数
 */
export function getVercelScopeArg(config: VercelDeployConfig): string[] {
	return ["--scope", config.vercelOrgId];
}

/**
 * 获取 Vercel token 参数
 */
export function getVercelTokenArg(config: VercelDeployConfig): string[] {
	return ["--token", config.vercelToken];
}

/**
 * 获取 Vercel 本地配置文件参数
 */
export function getVercelLocalConfigArg(): string[] {
	return ["--local-config", VERCEL_NULL_CONFIG_PATH];
}

/**
 * 获取目标工作目录参数
 */
export function getTargetCWDArg(target: DeployTarget): string[] {
	return ["--cwd", target.targetCWD];
}

/**
 * 统一的 Vercel CLI spawn 配置
 * @param stdoutMode stdout 行为，默认继承终端；需要读取 stdout 时传入 "pipe"
 */
export function createVercelSpawnOptions(stdoutMode: "inherit" | "pipe" = "inherit"): SpawnSyncOptions {
	const base: SpawnSyncOptions = {
		encoding: "utf8",
		shell: process.platform === "win32",
	};

	if (stdoutMode === "pipe") {
		return { ...base, stdio: ["inherit", "pipe", "inherit"] };
	}

	return { ...base, stdio: "inherit" };
}

/**
 * 从 Vercel CLI 的版本输出中解析语义化版本号
 * @param output `vercel --version` 的 stdout 输出
 */
export function parseVercelCliVersion(output: string): string | null {
	const match = output.match(/\b(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\b/);
	return match?.[1] ?? null;
}

function compareSemverLike(current: string, expected: string): number {
	const currentParts = current.split(/[.-]/).slice(0, 3).map(Number);
	const expectedParts = expected.split(/[.-]/).slice(0, 3).map(Number);

	for (let index = 0; index < 3; index++) {
		const currentPart = currentParts[index] ?? 0;
		const expectedPart = expectedParts[index] ?? 0;

		if (currentPart > expectedPart) return 1;
		if (currentPart < expectedPart) return -1;
	}

	return 0;
}

export function isVercelCliVersionSupported(version: string): boolean {
	return compareSemverLike(version, MIN_VERCEL_CLI_VERSION) >= 0;
}

export function assertVercelCliAvailable(): void {
	const result = spawnSync("vercel", ["--version"], createVercelSpawnOptions("pipe"));

	if (result.error) {
		throw new Error(
			`未找到 Vercel CLI。@ruan-cat/vercel-deploy-tool 已将 vercel 改为 peerDependency，请在使用方项目中安装：pnpm add -D vercel@latest`,
		);
	}

	if (result.status !== 0) {
		throw new Error("无法读取 Vercel CLI 版本，请确认项目中已安装可用的 vercel CLI。");
	}

	const output = String(result.stdout ?? "");
	const version = parseVercelCliVersion(output);

	if (!version) {
		consola.warn(`无法解析 Vercel CLI 版本，原始输出为: ${output.trim()}`);
		return;
	}

	if (!isVercelCliVersionSupported(version)) {
		throw new Error(
			`Vercel CLI 版本过低：当前 ${version}，最低需要 ${MIN_VERCEL_CLI_VERSION}。请升级：pnpm add -D vercel@latest`,
		);
	}

	consola.info(`Vercel CLI 版本检查通过: ${version}`);
}
