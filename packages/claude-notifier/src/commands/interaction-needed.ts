import { Command } from "commander";
import { sendNotification } from "../core/notifier.ts";
import { InteractionNeededOptions, SoundPreset, IconPreset } from "../types/index.ts";

/**
 * 需要交互通知命令
 */
export function createInteractionNeededCommand(): Command {
	const command = new Command("interaction-needed");

	command
		.description("发送需要交互通知")
		.option("-m, --message <message>", "自定义通知消息", "需要您的交互 🔔")
		.option("-t, --title <title>", "自定义通知标题", "Claude Code - 需要交互")
		.option("-s, --sound <sound>", "音频预设或自定义音频路径", SoundPreset.WARNING)
		.option("-i, --icon <icon>", "图标预设或自定义图标路径", IconPreset.ALICE_TIMEOUT)
		.option("--interaction-details <details>", "交互详情")
		.action(async (options: InteractionNeededOptions & { title?: string }) => {
			try {
				let message = options.message || "需要您的交互 🔔";

				if (options.interactionDetails) {
					message += `\n详情: ${options.interactionDetails}`;
				}

				await sendNotification({
					title: options.title || "Claude Code - 需要交互",
					message,
					sound: options.sound,
					icon: options.icon,
				});

				console.log("🔔 需要交互通知已发送");
			} catch (error) {
				console.error("❌ 发送通知失败:", error);
				process.exit(1);
			}
		});

	return command;
}
