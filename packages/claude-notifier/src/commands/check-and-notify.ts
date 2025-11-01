import { Command } from "commander";
import {
	readHookInput,
	addOrUpdateSession,
	removeSession,
	cleanupExpiredSessions,
	checkAndNotifyAll,
} from "../core/timer.ts";

/**
 * 检查并通知命令
 *
 * 这是一个高频调用的命令，用于配置到 Claude Code hooks 中
 * 主要功能：
 * 1. 自动创建新会话任务（当检测到新 session_id 时）
 * 2. 删除已完成的任务（当 stop_hook_active 为 true 时）
 * 3. 清理过期任务（超过 8 小时）
 * 4. 检查所有任务并发送到期通知
 */
export function createCheckAndNotifyCommand(): Command {
	const command = new Command("check-and-notify");

	command
		.description(
			`检查并通知长任务（配置到 Claude Code hooks 使用）

这是一个高频调用的命令，主要用于：
- 自动管理会话任务
- 清理过期任务（8小时）
- 发送到期通知`,
		)
		.option("--verbose", "显示详细日志")
		.option("--no-cleanup", "跳过清理过期任务")
		.option("--no-auto-create", "禁用自动创建新会话任务")
		.action(async (options: { verbose?: boolean; cleanup?: boolean; autoCreate?: boolean }) => {
			try {
				const verbose = options.verbose || false;
				const shouldCleanup = options.cleanup !== false;
				const shouldAutoCreate = options.autoCreate !== false;

				// 1. 读取 stdin 获取 hook 数据
				const hookInput = await readHookInput();

				if (!hookInput) {
					if (verbose) {
						console.log("ℹ️ 未接收到 stdin 数据，跳过会话管理");
					}
				} else {
					const { session_id, stop_hook_active } = hookInput;

					if (verbose) {
						console.log(`📥 接收到会话数据:`);
						console.log(`   - session_id: ${session_id}`);
						console.log(`   - stop_hook_active: ${stop_hook_active || false}`);
					}

					// 2. 处理 stop_hook_active
					if (stop_hook_active === true) {
						// 删除对应的会话任务
						removeSession(session_id);
						if (verbose) {
							console.log(`🗑️  已删除会话 ${session_id} 的任务（stop_hook_active = true）`);
						}
						// 停止任务后直接返回，不继续执行后续检查
						return;
					}

					// 3. 自动创建新会话任务
					if (shouldAutoCreate && session_id) {
						// addOrUpdateSession 会自动判断是否为新会话
						// 如果是新会话，会使用默认配置创建
						// 如果是已存在的会话，不会重置时间
						addOrUpdateSession(session_id);
						if (verbose) {
							console.log(`✅ 会话 ${session_id} 已注册/更新`);
						}
					}
				}

				// 4. 清理过期任务
				if (shouldCleanup) {
					const cleanedCount = cleanupExpiredSessions();
					if (verbose && cleanedCount > 0) {
						console.log(`🧹 已清理 ${cleanedCount} 个过期任务（超过 8 小时）`);
					}
				}

				// 5. 检查所有任务并发送通知
				const notificationsSent = await checkAndNotifyAll();
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
