// src/notify.ts
import notifier from "node-notifier";
import os from "node:os";

/**
 * 从 stdin 异步读取所有数据
 */
async function getStdinData(): Promise<string> {
	let result = "";
	if (process.stdin.isTTY) {
		return result; // 没有管道输入
	}
	for await (const chunk of process.stdin) {
		result += chunk;
	}
	return result;
}

/**
 * 主通知函数
 */
async function sendNotification() {
	const input = await getStdinData();

	let title = "Claude Code";
	let message = "任务已完成 ✅"; // "Stop" 钩子的默认消息

	try {
		// 尝试解析 Claude 传来的 JSON 数据
		if (input) {
			const hookData = JSON.parse(input);

			// 根据钩子类型定制消息
			// 'Notification' 钩子通常是 Claude 在提问或请求许可
			if (hookData.type === "Notification" && hookData.message) {
				title = "Claude Code 需要您 ⚠️";
				message = hookData.message;
			}
			// 'Stop' 钩子表示一次响应结束
			else if (hookData.type === "Stop") {
				title = "Claude Code";
				message = "任务已完成 ✅";
			}
		}
	} catch (e) {
		// 解析失败，使用默认消息
		// console.error("Failed to parse hook JSON, using default message.");
	}

	// --- 发送通知 ---
	// node-notifier 会自动在 Windows 上使用 'WindowsToaster'
	notifier.notify({
		title: title,
		message: message,
		sound: true, // 播放系统提示音
		wait: false, // 不等待用户交互
		// (可选) 为 Windows 10/11 指定使用现代 Toast 通知
		// notifier.WindowsToaster 在内部处理这个
	});
}

// 确保只在 Windows 上运行 (虽然 node-notifier 是跨平台的)
if (os.platform() === "win32") {
	sendNotification();
}
