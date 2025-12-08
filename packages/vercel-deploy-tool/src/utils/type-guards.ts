import type { DeployTarget, DeployTargetWithUserCommands, DeployTargetBase } from "../config/schema";

/**
 * 类型守卫：判断是否为 static 类型的部署目标
 */
export function isDeployTargetBase(target: DeployTarget): target is DeployTargetBase {
	return target.type === "static";
}

/**
 * 类型守卫：判断是否为 userCommands 类型的部署目标
 */
export function isDeployTargetWithUserCommands(target: DeployTarget): target is DeployTargetWithUserCommands {
	return target.type === "userCommands";
}

/**
 * 获得 isCopyDist 配置
 * @description
 * 提供默认值处理
 */
export function getIsCopyDist(target: DeployTargetWithUserCommands): boolean {
	return target.isCopyDist ?? true;
}

/**
 * 获得 isNeedVercelBuild 配置
 * @description
 * 提供默认值处理
 */
export function isNeedVercelBuild(target: DeployTarget): boolean {
	return target.isNeedVercelBuild ?? true;
}
