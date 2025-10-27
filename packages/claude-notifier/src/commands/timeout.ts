import { Command } from "commander";
import { sendNotification } from "../core/notifier.ts";
import { TimeoutOptions, SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 超时通知命令
 */
export function createTimeoutCommand(): Command {
	const command = new Command("timeout");

	command
		.description("发送连接超时通知")
		.option("-m, --message <message>", "自定义通知消息", "连接超时 ⏱️")
		.option("-t, --title <title>", "自定义通知标题", "Claude Code - 超时")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.ERROR)
		.option("-i, --icon <icon>", "图标预设或自定义图标路径", IconPreset.ERROR)
		.option("--timeout-details <details>", "超时详情")
		.action(async (options: TimeoutOptions & { title?: string }) => {
			try {
				let message = options.message || "连接超时 ⏱️";

				if (options.timeoutDetails) {
					message += `\n详情: ${options.timeoutDetails}`;
				}

				await sendNotification({
					title: options.title || "Claude Code - 超时",
					message,
					sound: options.sound,
					icon: options.icon,
				});

				console.log("⏱️ 超时通知已发送");
			} catch (error) {
				console.error("❌ 发送通知失败:", error);
				process.exit(1);
			}
		});

	return command;
}
