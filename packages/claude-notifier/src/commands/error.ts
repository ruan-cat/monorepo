import { Command } from "commander";
import { sendNotification } from "../core/notifier.ts";
import { ErrorOptions, SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 错误通知命令
 */
export function createErrorCommand(): Command {
	const command = new Command("error");

	command
		.description("发送错误通知")
		.option("-m, --message <message>", "自定义通知消息", "发生错误 ❌")
		.option("-t, --title <title>", "自定义通知标题", "Claude Code - 错误")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.ERROR)
		.option("-i, --icon <icon>", "图标预设或自定义图标路径", IconPreset.ALICE_ERROR)
		.option("-e, --error-details <details>", "错误详情")
		.action(async (options: ErrorOptions & { title?: string }) => {
			try {
				let message = options.message || "发生错误 ❌";

				if (options.errorDetails) {
					message += `\n错误详情: ${options.errorDetails}`;
				}

				await sendNotification({
					title: options.title || "Claude Code - 错误",
					message,
					sound: options.sound,
					icon: options.icon,
				});

				console.log("❌ 错误通知已发送");
			} catch (error) {
				console.error("❌ 发送通知失败:", error);
				process.exit(1);
			}
		});

	return command;
}
