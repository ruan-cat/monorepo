import { Command } from "commander";
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
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
- SessionStart: 跳过通知
- UserPromptSubmit: 开始新任务（无条件删除旧任务并创建新任务）
- SessionEnd: 删除任务
- Stop/SubagentStop: 删除任务
- 其他事件: 检查并通知`,
		)
		.option("--verbose", "显示详细日志")
		.option("--no-cleanup", "跳过清理过期任务")
		.option("-i, --intervals <intervals>", "提醒时间点（分钟），逗号分隔", "6,10,18,25,45")
		.action(async (options: CheckAndNotifyOptions) => {
			// ====== 计时和日志配置 ======
			const startTime = Date.now();
			const verbose = options.verbose || false;

			// 日志目录
			const logDir = path.join(os.tmpdir(), "claude-notifier-debug");
			if (!existsSync(logDir)) {
				mkdirSync(logDir, { recursive: true });
			}

			const logFile = path.join(logDir, `check-and-notify-${Date.now()}.log`);

			// 日志函数
			const log = (message: string, forceOutput = false) => {
				const timestamp = new Date().toISOString();
				const elapsed = Date.now() - startTime;
				const logLine = `[${timestamp}] [+${elapsed}ms] ${message}\n`;

				// 写入日志文件
				try {
					appendFileSync(logFile, logLine);
				} catch {
					// 忽略写入失败
				}

				// 输出到控制台
				if (verbose || forceOutput) {
					console.log(logLine.trim());
				}
			};

			try {
				log("====== check-and-notify 开始执行 ======", true);
				log(`日志文件: ${logFile}`);
				log(`verbose: ${verbose}`);

				const shouldCleanup = options.cleanup !== false;

				// 解析时间间隔
				let intervals: number[] = DEFAULT_INTERVALS;
				if (typeof options.intervals === "string") {
					intervals = options.intervals
						.split(",")
						.map((s) => parseInt(s.trim()))
						.filter((n) => !isNaN(n));
				}
				log(`提醒间隔: ${intervals.join(", ")} 分钟`);

				// 1. 读取 stdin 获取 hook 数据
				log("====== 开始读取 stdin ======");
				const readStartTime = Date.now();
				const hookInput = await readHookInput();
				const readElapsed = Date.now() - readStartTime;
				log(`stdin 读取完成，耗时: ${readElapsed}ms`);

				if (!hookInput) {
					log("⚠️  未接收到 stdin 数据 (hookInput = null)");
					log("可能原因：stdin 已被前面的钩子消费，或 stdin 在 500ms 内未提供数据");
					log("====== 提前返回，避免执行不必要的逻辑 ======", true);
					log(`====== 总耗时: ${Date.now() - startTime}ms ======`, true);
					return;
				} else {
					const { cwd, hook_event_name, stop_hook_active } = hookInput;

					log(`📥 接收到 hook 数据:`);
					log(`   - cwd: ${cwd}`);
					log(`   - hook_event_name: ${hook_event_name}`);
					log(`   - stop_hook_active: ${stop_hook_active || false}`);

					// 2. 根据 hook_event_name 处理不同逻辑
					if (hook_event_name === "SessionStart") {
						log("ℹ️ SessionStart 事件，跳过通知并立即返回");
						log(`====== 总耗时: ${Date.now() - startTime}ms ======`, true);
						return;
					}

					// UserPromptSubmit: 无条件删除旧任务并创建新任务
					if (hook_event_name === "UserPromptSubmit") {
						if (cwd) {
							log(`开始添加/重置任务 (cwd: ${cwd})`);
							const taskStartTime = Date.now();
							addOrResetTask(cwd);
							const taskElapsed = Date.now() - taskStartTime;
							log(`✅ 已添加/重置任务，耗时: ${taskElapsed}ms`);
						}
						log(`====== 总耗时: ${Date.now() - startTime}ms ======`, true);
						return;
					}

					// SessionEnd: 删除任务，不做通知
					if (hook_event_name === "SessionEnd") {
						if (cwd) {
							log(`开始删除任务 (cwd: ${cwd})`);
							const removeStartTime = Date.now();
							removeTask(cwd);
							const removeElapsed = Date.now() - removeStartTime;
							log(`🗑️  SessionEnd - 已删除任务，耗时: ${removeElapsed}ms`);
						}
						log(`====== 总耗时: ${Date.now() - startTime}ms ======`, true);
						return;
					}

					// Stop/SubagentStop: 删除任务（移除 stop_hook_active 判断，因为它总是 false）
					if (hook_event_name === "Stop" || hook_event_name === "SubagentStop") {
						log(`====== Stop/SubagentStop 事件 ======`);
						log(`stop_hook_active: ${stop_hook_active || false}`);

						// 删除任务
						if (cwd) {
							log(`开始删除任务 (cwd: ${cwd})`);
							const removeStartTime = Date.now();
							removeTask(cwd);
							const removeElapsed = Date.now() - removeStartTime;
							log(`🗑️  已删除任务，耗时: ${removeElapsed}ms`);
						}
						log(`Stop 阶段不做任何通知，立即返回`);
						log(`====== 总耗时: ${Date.now() - startTime}ms ======`, true);
						return;
					}

					// 3. 其他事件: 检查并通知
					log("ℹ️ 其他事件，继续执行清理和通知逻辑");
				}

				// 4. 清理过期任务
				log("====== 开始清理过期任务 ======");
				if (shouldCleanup) {
					const cleanupStartTime = Date.now();
					const cleanedCount = cleanupExpiredTasks();
					const cleanupElapsed = Date.now() - cleanupStartTime;
					log(`🧹 清理完成，清理了 ${cleanedCount} 个过期任务，耗时: ${cleanupElapsed}ms`);
				} else {
					log("⏭️  跳过清理过期任务");
				}

				// 5. 检查所有任务并发送通知
				log("====== 开始检查并通知所有任务 ======");
				const notifyStartTime = Date.now();
				const notificationsSent = await checkAndNotifyAllTasks(intervals);
				const notifyElapsed = Date.now() - notifyStartTime;
				log(`📬 检查完成，发送了 ${notificationsSent} 条通知，耗时: ${notifyElapsed}ms`);

				// 总结
				const totalElapsed = Date.now() - startTime;
				log(`====== check-and-notify 执行完成 ======`, true);
				log(`总耗时: ${totalElapsed}ms`, true);
				log(`各阶段耗时:`, true);
				log(`  - stdin 读取: ${readElapsed}ms`, true);
				log(`  - 清理任务: ${shouldCleanup ? "已执行" : "已跳过"}`, true);
				log(`  - 检查通知: ${notifyElapsed}ms`, true);
				log(`日志文件: ${logFile}`, true);

				// 如果总耗时接近或超过 5 秒（hooks.json 中配置的 timeout），给出警告
				if (totalElapsed >= 4500) {
					log(`⚠️  警告：总耗时 ${totalElapsed}ms 接近或超过 timeout 限制（5000ms）`, true);
					log(`⚠️  建议增加 hooks.json 中 check-and-notify 的 timeout 设置`, true);
				}
			} catch (error) {
				const totalElapsed = Date.now() - startTime;
				log(`❌ check-and-notify 命令执行失败: ${error}`, true);
				log(`失败时已耗时: ${totalElapsed}ms`, true);
				console.error("❌ check-and-notify 命令执行失败:", error);
				process.exit(1);
			}
		});

	return command;
}
