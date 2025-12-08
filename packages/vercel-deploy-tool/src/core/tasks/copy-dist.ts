import { resolve } from "node:path";
import { rmSync, mkdirSync, cpSync } from "node:fs";
import { consola } from "consola";
import type { DeployTargetWithUserCommands } from "../../config/schema";
import { VERCEL_OUTPUT_STATIC } from "../../utils/vercel-null-config";

/**
 * 创建文件复制任务列表
 * @description
 * 针对单个部署目标，生成一系列移动目录的任务：
 * 1. 删除目录
 * 2. 新建目录
 * 3. 复制粘贴
 */
export function createCopyDistTasks(target: DeployTargetWithUserCommands) {
	const targetCWD = target.targetCWD;
	const outputDirectory = target.outputDirectory;

	/**
	 * 路径拼接工具
	 * @private
	 * 仅考虑为内部使用，不是通用工具
	 */
	function joinPath<T extends string>(dir: T) {
		return resolve(process.cwd(), targetCWD, dir);
	}

	const pathVercelOutputStatic = joinPath(VERCEL_OUTPUT_STATIC);
	const pathOutputDirectory = joinPath(outputDirectory);

	return [
		{
			name: `删除目录: ${pathVercelOutputStatic}`,
			fn: async () => {
				consola.start(`开始删除文件任务: ${pathVercelOutputStatic}`);
				rmSync(pathVercelOutputStatic, { recursive: true, force: true });
				consola.success(`删除该路径的文件: ${pathVercelOutputStatic}`);
			},
		},
		{
			name: `创建目录: ${pathVercelOutputStatic}`,
			fn: async () => {
				consola.start(`开始创建文件夹任务: ${pathVercelOutputStatic}`);
				mkdirSync(pathVercelOutputStatic, { recursive: true });
				consola.success(`创建的新目录为: ${pathVercelOutputStatic}`);
			},
		},
		{
			name: `复制文件: ${pathOutputDirectory} -> ${pathVercelOutputStatic}`,
			fn: async () => {
				consola.start(`开始文件复制任务`);
				consola.info(`从 ${pathOutputDirectory} 开始`);
				consola.info(`复制到 ${pathVercelOutputStatic} 内`);
				cpSync(pathOutputDirectory, pathVercelOutputStatic, { recursive: true });
				consola.success(`完成文件复制任务`);
			},
		},
	];
}
