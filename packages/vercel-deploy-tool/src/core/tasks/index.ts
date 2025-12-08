import fs from "node:fs";
import { resolve } from "node:path";
import { consola } from "consola";
import { task, executeSequential } from "../executor";
import type { VercelDeployConfig } from "../../config/schema";
import { isDeployTargetWithUserCommands, isNeedVercelBuild, getIsCopyDist } from "../../utils/type-guards";
import { VERCEL_NULL_CONFIG, VERCEL_NULL_CONFIG_PATH } from "../../utils/vercel-null-config";
import { createLinkTask } from "./link";
import { createBuildTask } from "./build";
import { createAfterBuildTasks } from "./after-build";
import { createUserCommandTasks } from "./user-commands";
import { createCopyDistTasks } from "./copy-dist";
import { createDeployTask } from "./deploy";
import { createAliasTask } from "./alias";

/**
 * 生成 Vercel 空配置文件
 * @description
 * 在根目录创建 vercel.null.def.json 文件
 */
async function generateVercelNullConfig() {
	fs.writeFileSync(VERCEL_NULL_CONFIG_PATH, JSON.stringify(VERCEL_NULL_CONFIG, null, 2));
	consola.success(`生成 Vercel 空配置文件: ${VERCEL_NULL_CONFIG_PATH}`);
}

/**
 * 执行 Vercel 部署工作流
 * @description
 * 这是整个部署流程的总入口，使用 tasuku 编排所有任务
 *
 * 任务执行顺序：
 * 1. Link 阶段（并行）
 * 2. Build 阶段（并行）
 * 3. AfterBuild 阶段（串行）
 * 4. UserCommands + CopyDist 阶段（并行目标，串行步骤）
 * 5. Deploy + Alias 阶段（并行目标，串行步骤）
 */
export async function executeDeploymentWorkflow(config: VercelDeployConfig) {
	// 0. 生成 Vercel 空配置文件
	await generateVercelNullConfig();

	const { deployTargets } = config;

	// 过滤不存在的目标目录，避免后续 Vercel CLI 抛出 ENOENT
	const availableTargets = deployTargets.filter((target) => {
		const targetPath = resolve(target.targetCWD);

		if (!fs.existsSync(targetPath)) {
			consola.warn(`目标目录不存在，已跳过: ${target.targetCWD}`);
			return false;
		}

		return true;
	});

	if (availableTargets.length === 0) {
		consola.error("没有可用的部署目标，请先构建产物");
		return;
	}

	await task("Vercel 部署工作流", async ({ task }) => {
		// 1. Link 阶段（并行）
		await task("1. Link 项目", async () => {
			const linkTasks = availableTargets.map((target) => createLinkTask(config, target));

			await task.group((task) => linkTasks.map((t) => task(t.name, t.fn)));
		});

		// 2. Build 阶段（并行）
		await task("2. 构建项目", async () => {
			const buildTasks = availableTargets.filter(isNeedVercelBuild).map((target) => createBuildTask(config, target));

			if (buildTasks.length === 0) {
				consola.warn("没有需要执行 build 的目标");
				return;
			}

			await task.group((task) => buildTasks.map((t) => task(t.name, t.fn)));
		});

		// 3. AfterBuild 阶段（串行）
		await task("3. 执行 AfterBuild 任务", async () => {
			const afterBuildTasks = createAfterBuildTasks(config);

			await executeSequential("AfterBuild", afterBuildTasks);
		});

		// 4. UserCommands + CopyDist 阶段（并行目标，串行步骤）
		await task("4. 执行用户命令与文件复制", async () => {
			const targetTasks = availableTargets.map((target) => ({
				name: `处理目标: ${target.targetCWD}`,
				fn: async () => {
					// 如果不是 userCommands 类型，跳过
					if (!isDeployTargetWithUserCommands(target)) {
						consola.warn(`目标 ${target.targetCWD} 不属于 userCommands 类型`);
						return;
					}

					// 4.1 执行用户命令（串行）
					const userCommandTasks = createUserCommandTasks(target);
					await executeSequential(`UserCommands: ${target.targetCWD}`, userCommandTasks);

					// 4.2 复制文件（串行）
					if (getIsCopyDist(target)) {
						const copyDistTasks = createCopyDistTasks(target);
						await executeSequential(`CopyDist: ${target.targetCWD}`, copyDistTasks);
					} else {
						consola.warn(`目标 ${target.targetCWD} 不需要复制文件`);
					}
				},
			}));

			// 并行处理所有目标
			await task.group((task) => targetTasks.map((t) => task(t.name, t.fn)));
		});

		// 5. Deploy + Alias 阶段（并行目标，串行步骤）
		await task("5. 部署与设置别名", async () => {
			const deployAliasTasks = availableTargets.map((target) => ({
				name: `部署与别名: ${target.targetCWD}`,
				fn: async () => {
					// 5.1 部署
					const deployTask = createDeployTask(config, target);
					const deployResult = await task(deployTask.name, deployTask.fn);
					const vercelUrl = deployResult.result;

					// 5.2 设置别名（并行）
					if (target.url && target.url.length > 0) {
						const aliasTasks = target.url.map((userUrl) => createAliasTask(config, vercelUrl, userUrl));

						await task.group((task) => aliasTasks.map((t) => task(t.name, t.fn)));
					} else {
						consola.warn(`目标 ${target.targetCWD} 没有配置别名`);
					}
				},
			}));

			// 并行处理所有目标的部署和别名
			await task.group((task) => deployAliasTasks.map((t) => task(t.name, t.fn)));
		});
	});

	consola.success("🎉 Vercel 部署工作流完成！");
}
