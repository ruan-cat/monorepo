import { Command } from "commander";
import { sendNotification } from "../core/notifier.ts";
import { TaskCompleteOptions, SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 任务完成通知命令
 */
export function createTaskCompleteCommand(): Command {
	const command = new Command("task-complete");

	command
		.description("发送任务完成通知")
		.option("-m, --message <message>", "自定义通知消息", "任务已完成 ✅")
		.option("-t, --title <title>", "自定义通知标题", "Claude Code")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.SUCCESS)
		.option("-i, --icon <icon>", "图标预设或自定义图标路径", IconPreset.SUCCESS)
		.option("-d, --task-description <description>", "任务描述信息")
		.action(async (options: TaskCompleteOptions & { title?: string }) => {
			try {
				const message = options.taskDescription
					? `${options.message}\n任务: ${options.taskDescription}`
					: options.message || "任务已完成 ✅";

				await sendNotification({
					title: options.title || "Claude Code",
					message,
					sound: options.sound,
					icon: options.icon,
				});

				console.log("✅ 任务完成通知已发送");
			} catch (error) {
				console.error("❌ 发送通知失败:", error);
				process.exit(1);
			}
		});

	return command;
}
