import { Command } from "commander";
import {
	addOrUpdateSession,
	removeSession,
	getSessionState,
	getAllSessionStates,
	readHookInput,
} from "../core/timer.ts";
import { LongTaskOptions, SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 长任务监控命令
 */
export function createLongTaskCommand(): Command {
	const command = new Command("long-task");

	command
		.description("启动长任务定时提醒（基于 session_id）")
		.option("-i, --intervals <intervals>", "提醒时间点（分钟），逗号分隔", "6,10,18,25,45")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.WARNING)
		.option("--icon <icon>", "图标预设或自定义图标路径", IconPreset.CLOCK)
		.option("-d, --task-description <description>", "任务描述信息")
		.option("--session-id <sessionId>", "手动指定会话 ID（通常从 stdin 自动获取）")
		.option("--stop", "停止指定会话的长任务定时器")
		.option("--status", "查看定时器状态（不指定 session-id 时查看所有会话）")
		.action(
			async (
				options: LongTaskOptions & { stop?: boolean; status?: boolean; intervals?: string; sessionId?: string },
			) => {
				try {
					// 查看状态
					if (options.status) {
						if (options.sessionId) {
							// 查看指定会话
							const state = getSessionState(options.sessionId);
							if (state) {
								const elapsedMinutes = Math.floor((Date.now() - state.startTime) / 1000 / 60);
								console.log(`⏰ 会话 ${options.sessionId} 的长任务定时器状态:`);
								console.log(`  - 已运行: ${elapsedMinutes} 分钟`);
								console.log(`  - 提醒时间点: ${state.intervals.join(", ")} 分钟`);
								console.log(`  - 已触发: ${state.triggeredIndexes.length}/${state.intervals.length} 次`);
								if (state.taskDescription) {
									console.log(`  - 任务描述: ${state.taskDescription}`);
								}
							} else {
								console.log(`ℹ️ 会话 ${options.sessionId} 没有运行中的长任务定时器`);
							}
						} else {
							// 查看所有会话
							const allStates = getAllSessionStates();
							const sessionIds = Object.keys(allStates);

							if (sessionIds.length === 0) {
								console.log("ℹ️ 没有运行中的长任务定时器");
							} else {
								console.log(`⏰ 共有 ${sessionIds.length} 个活跃的长任务定时器:\n`);
								for (const sessionId of sessionIds) {
									const state = allStates[sessionId];
									const elapsedMinutes = Math.floor((Date.now() - state.startTime) / 1000 / 60);
									console.log(`会话: ${sessionId}`);
									console.log(`  - 已运行: ${elapsedMinutes} 分钟`);
									console.log(`  - 已触发: ${state.triggeredIndexes.length}/${state.intervals.length} 次`);
									if (state.taskDescription) {
										console.log(`  - 任务描述: ${state.taskDescription}`);
									}
									console.log("");
								}
							}
						}
						return;
					}

					// 获取 session_id
					let sessionId = options.sessionId;

					if (!sessionId) {
						// 从 stdin 读取
						const hookInput = await readHookInput();
						if (!hookInput || !hookInput.session_id) {
							console.error("❌ 无法获取 session_id，请通过 --session-id 参数指定或从 stdin 读取");
							process.exit(1);
						}
						sessionId = hookInput.session_id;
					}

					// 停止定时器
					if (options.stop) {
						removeSession(sessionId);
						console.log(`✅ 已停止会话 ${sessionId} 的长任务定时器`);
						return;
					}

					// 解析时间间隔
					let intervals: number[] = [6, 10, 18, 25, 45];
					if (typeof options.intervals === "string") {
						intervals = options.intervals
							.split(",")
							.map((s) => parseInt(s.trim()))
							.filter((n) => !isNaN(n));
					}

					// 添加或更新会话
					addOrUpdateSession(sessionId, {
						intervals,
						sound: options.sound,
						icon: options.icon,
						taskDescription: options.taskDescription,
					});

					console.log(`⏰ 长任务定时器已启动 (会话: ${sessionId})`);
					console.log(`   提醒时间点: ${intervals.join(", ")} 分钟`);
					if (options.taskDescription) {
						console.log(`   任务描述: ${options.taskDescription}`);
					}
				} catch (error) {
					console.error("❌ 长任务命令执行失败:", error);
					process.exit(1);
				}
			},
		);

	return command;
}
