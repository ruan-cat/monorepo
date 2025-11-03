import { Command } from "commander";
import { sendNotification } from "../core/notifier.ts";
import { SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 长任务通知命令选项
 */
interface LongTaskNotifyOptions {
	/** 自定义消息 */
	message?: string;
	/** 音频预设 */
	sound?: SoundPreset | string;
	/** 图标预设 */
	icon?: IconPreset | string;
}

/**
 * 长任务样式化通知命令
 *
 * 这是一个纯样式化的通知命令，不处理任何定时逻辑。
 * 定时逻辑由 check-and-notify 命令负责。
 */
export function createLongTaskCommand(): Command {
	const command = new Command("long-task");

	command
		.description("发送长任务样式的通知")
		.option("-m, --message <message>", "自定义通知消息", "claude code 长任务正在运行")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.WARNING)
		.option("--icon <icon>", "图标预设或自定义图标路径", IconPreset.ALICE_TIMEOUT)
		.action(async (options: LongTaskNotifyOptions) => {
			try {
				await sendNotification({
					title: "Claude Code - 长任务提醒",
					message: options.message || "claude code 长任务正在运行",
					sound: options.sound || SoundPreset.WARNING,
					icon: options.icon || IconPreset.ALICE_TIMEOUT,
				});

				console.log("✅ 长任务通知已发送");
			} catch (error) {
				console.error("❌ 发送长任务通知失败:", error);
				process.exit(1);
			}
		});

	return command;
}
