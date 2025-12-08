import type { VercelDeployConfig, DeployTarget } from "../config/schema";
import { VERCEL_NULL_CONFIG_PATH } from "../utils/vercel-null-config";
import type { SpawnSyncOptions } from "node:child_process";

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
