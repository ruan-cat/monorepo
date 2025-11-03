import { Command } from "commander";
import {
	readHookInput,
	addOrResetTask,
	removeTask,
	cleanupExpiredTasks,
	checkAndNotifyAllTasks,
	DEFAULT_INTERVALS,
} from "../core/timer.ts";

/**
 * 检查并通知命令选项
 */
interface CheckAndNotifyOptions {
	/** 显示详细日志 */
	verbose?: boolean;
	/** 跳过清理过期任务 */
	cleanup?: boolean;
	/** 自定义提醒时间点（分钟），逗号分隔 */
	intervals?: string;
}

/**
 * 检查并通知命令
 *
 * 这是一个高频调用的命令，用于配置到 Claude Code hooks 中。
 * 根据 hook_event_name 的不同，执行不同的逻辑：
 *
 * 1. UserPromptSubmit: 添加或重置任务（删除旧任务，创建新任务）
 * 2. Stop/SubagentStop (stop_hook_active=true): 删除任务
 * 3. 其他事件: 检查并通知长任务
 *
 * 主要功能：
 * - 基于 cwd 区分任务
 * - 自动管理任务生命周期
 * - 清理过期任务（超过 8 小时）
 * - 精确计算时间差并发送通知
 */
export function createCheckAndNotifyCommand(): Command {
	const command = new Command("check-and-notify");

	command
		.description(
			`检查并通知长任务（配置到 Claude Code hooks 使用）

这是一个高频调用的命令，根据 hook_event_name 执行不同逻辑：
- UserPromptSubmit: 开始新任务
- Stop/SubagentStop: 删除任务
- 其他事件: 检查并通知`,
		)
		.option("--verbose", "显示详细日志")
		.option("--no-cleanup", "跳过清理过期任务")
		.option("-i, --intervals <intervals>", "提醒时间点（分钟），逗号分隔", "6,10,18,25,45")
		.action(async (options: CheckAndNotifyOptions) => {
			try {
				const verbose = options.verbose || false;
				const shouldCleanup = options.cleanup !== false;

				// 解析时间间隔
				let intervals: number[] = DEFAULT_INTERVALS;
				if (typeof options.intervals === "string") {
					intervals = options.intervals
						.split(",")
						.map((s) => parseInt(s.trim()))
						.filter((n) => !isNaN(n));
				}

				// 1. 读取 stdin 获取 hook 数据
				const hookInput = await readHookInput();

				if (!hookInput) {
					if (verbose) {
						console.log("ℹ️ 未接收到 stdin 数据，跳过任务管理");
					}
					// 即使没有 stdin 数据，也可能需要清理过期任务和检查通知
				} else {
					const { cwd, hook_event_name, stop_hook_active } = hookInput;

					if (verbose) {
						console.log(`📥 接收到 hook 数据:`);
						console.log(`   - cwd: ${cwd}`);
						console.log(`   - hook_event_name: ${hook_event_name}`);
						console.log(`   - stop_hook_active: ${stop_hook_active || false}`);
					}

					// 2. 根据 hook_event_name 处理不同逻辑
					if (hook_event_name === "UserPromptSubmit") {
						// UserPromptSubmit: 添加或重置任务
						if (cwd) {
							addOrResetTask(cwd);
							if (verbose) {
								console.log(`✅ 已添加/重置任务 (cwd: ${cwd})`);
							}
						}
						// UserPromptSubmit 阶段不做任何通知
						return;
					}

					if ((hook_event_name === "Stop" || hook_event_name === "SubagentStop") && stop_hook_active === true) {
						// Stop/SubagentStop: 删除任务
						if (cwd) {
							removeTask(cwd);
							if (verbose) {
								console.log(`🗑️  已删除任务 (cwd: ${cwd})`);
							}
						}
						// Stop 阶段不做任何通知
						return;
					}

					// 3. 其他事件: 检查并通知
					// 不做特殊处理，继续执行后续的检查和通知逻辑
				}

				// 4. 清理过期任务
				if (shouldCleanup) {
					const cleanedCount = cleanupExpiredTasks();
					if (verbose && cleanedCount > 0) {
						console.log(`🧹 已清理 ${cleanedCount} 个过期任务（超过 8 小时）`);
					}
				}

				// 5. 检查所有任务并发送通知
				const notificationsSent = await checkAndNotifyAllTasks(intervals);
				if (verbose && notificationsSent > 0) {
					console.log(`📬 已发送 ${notificationsSent} 条通知`);
				}

				// 静默模式下不输出任何内容
				if (!verbose && notificationsSent === 0) {
					// 什么都不做
				}
			} catch (error) {
				console.error("❌ check-and-notify 命令执行失败:", error);
				process.exit(1);
			}
		});

	return command;
}
