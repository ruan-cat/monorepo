import notifier from "node-notifier";
import os from "node:os";
import { existsSync } from "node:fs";
import { NotificationOptions } from "../types/index.ts";
import { resolveSoundConfig } from "../config/sounds.ts";
import { resolveIconConfig } from "../config/icons.ts";

/**
 * 默认通知配置
 */
const DEFAULT_CONFIG = {
	timeout: 2.5,
	wait: false,
};

/**
 * 发送系统通知
 * @param options - 通知配置选项
 */
export async function sendNotification(options: NotificationOptions): Promise<void> {
	// 仅在 Windows 系统上运行
	if (os.platform() !== "win32") {
		console.warn("此工具目前仅支持 Windows 系统");
		return;
	}

	const {
		title = "Claude Code",
		message,
		sound,
		icon,
		timeout = DEFAULT_CONFIG.timeout,
		wait = DEFAULT_CONFIG.wait,
	} = options;

	// 解析音频配置
	const soundConfig = resolveSoundConfig(sound);

	// 解析图标配置
	const iconPath = resolveIconConfig(icon);

	// 验证图标文件是否存在
	if (iconPath && !existsSync(iconPath)) {
		console.warn(`图标文件不存在: ${iconPath}`);
	}

	// 构建通知参数
	const notificationConfig: any = {
		title,
		message,
		sound: soundConfig,
		wait,
		timeout: timeout * 1000, // 转换为毫秒
	};

	// 添加图标（如果存在）
	if (iconPath && existsSync(iconPath)) {
		notificationConfig.icon = iconPath;
	}

	// 发送通知
	return new Promise((resolve, reject) => {
		notifier.notify(notificationConfig, (err, response) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

/**
 * 快速发送带预设标题的通知
 * @param message - 通知消息
 * @param title - 通知标题（可选）
 */
export async function quickNotify(message: string, title?: string): Promise<void> {
	await sendNotification({
		title: title || "Claude Code",
		message,
	});
}
