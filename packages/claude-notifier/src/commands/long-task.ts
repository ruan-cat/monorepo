import { Command } from "commander";
import { startLongTaskTimer, stopLongTaskTimer, getTimerState } from "../core/timer.ts";
import { LongTaskOptions, SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 长任务监控命令
 */
export function createLongTaskCommand(): Command {
	const command = new Command("long-task");

	command
		.description("启动长任务定时提醒")
		.option("-i, --intervals <intervals>", "提醒时间点（分钟），逗号分隔", "6,10,18,25,45")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.WARNING)
		.option("--icon <icon>", "图标预设或自定义图标路径", IconPreset.CLOCK)
		.option("-d, --task-description <description>", "任务描述信息")
		.option("--stop", "停止当前运行的长任务定时器")
		.option("--status", "查看当前定时器状态")
		.action(async (options: LongTaskOptions & { stop?: boolean; status?: boolean; intervals?: string }) => {
			try {
				// 停止定时器
				if (options.stop) {
					stopLongTaskTimer();
					return;
				}

				// 查看状态
				if (options.status) {
					const state = getTimerState();
					if (state) {
						const elapsedMinutes = Math.floor((Date.now() - state.startTime) / 1000 / 60);
						console.log("⏰ 长任务定时器状态:");
						console.log(`  - 已运行: ${elapsedMinutes} 分钟`);
						console.log(`  - 提醒时间点: ${state.intervals.join(", ")} 分钟`);
						console.log(`  - 已触发: ${state.triggeredIndexes.length}/${state.intervals.length} 次`);
						if (state.taskDescription) {
							console.log(`  - 任务描述: ${state.taskDescription}`);
						}
					} else {
						console.log("ℹ️ 没有运行中的长任务定时器");
					}
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

				// 启动定时器
				await startLongTaskTimer({
					intervals,
					sound: options.sound,
					icon: options.icon,
					taskDescription: options.taskDescription,
				});

				console.log("⏰ 长任务定时器已启动");
				console.log(`   提醒时间点: ${intervals.join(", ")} 分钟`);
				if (options.taskDescription) {
					console.log(`   任务描述: ${options.taskDescription}`);
				}

				// 保持进程运行
				process.stdin.resume();
			} catch (error) {
				console.error("❌ 启动长任务定时器失败:", error);
				process.exit(1);
			}
		});

	return command;
}
