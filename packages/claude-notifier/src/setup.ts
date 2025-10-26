// src/setup.ts
import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

// Claude Code 配置文件的标准路径
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");

// 我们插件的绝对路径 (这个脚本所在的目录的上级)
const PLUGIN_DIR = path.resolve(__dirname, "..");

// 要执行的 hook 命令 (使用 npm run)
// npm --prefix 会确保在正确的插件目录中执行 npm 脚本
const HOOK_COMMAND = `npm --prefix "${PLUGIN_DIR}" run notify`;

// 我们要注入的 hook 配置
const HOOK_CONFIG = {
	type: "command",
	command: HOOK_COMMAND,
	// (可选) 只在 Windows 上运行此钩子
	// "matcher": "os == 'windows'"
};

async function setupHooks() {
	if (os.platform() !== "win32") {
		console.warn("此插件目前主要针对 Windows 设计，已跳过 hooks 配置。");
		return;
	}

	try {
		// 确保 .claude 目录存在
		await fs.ensureDir(path.dirname(CLAUDE_SETTINGS_PATH));

		// 读取或创建 settings.json
		let settings: any = {};
		if (await fs.pathExists(CLAUDE_SETTINGS_PATH)) {
			try {
				settings = await fs.readJson(CLAUDE_SETTINGS_PATH);
			} catch (e) {
				console.warn("~/.claude/settings.json 解析失败，将创建一个新的配置。");
				settings = {};
			}
		}

		// 初始化 hooks
		if (!settings.hooks) {
			settings.hooks = {};
		}

		// --- 注入或更新 Hook ---
		// 我们同时注入 "Stop" (任务完成) 和 "Notification" (需要注意)
		const hookTypes = ["Stop", "Notification"];

		for (const type of hookTypes) {
			if (!settings.hooks[type]) {
				settings.hooks[type] = [];
			}

			// 检查是否已存在此命令
			const existingHookIndex = settings.hooks[type].findIndex((h: any) => h.hooks?.[0]?.command === HOOK_COMMAND);

			if (existingHookIndex !== -1) {
				console.log(`Hook [${type}] 已配置，跳过...`);
			} else {
				// 添加新的 hook 配置
				// 注意：Claude 的 hook 结构是两层的
				settings.hooks[type].push({
					matcher: "os == 'windows'", // 明确指定只在 windows 运行
					hooks: [HOOK_CONFIG],
				});
				console.log(`成功添加 Hook [${type}]。`);
			}
		}

		// 写回配置文件
		await fs.writeJson(CLAUDE_SETTINGS_PATH, settings, { spaces: 2 });

		console.log("\n✅ Claude Code 通知插件配置成功！");
		console.log("请重启您的 Claude Code 终端会话以使配置生效。");
	} catch (err) {
		console.error("配置 hooks 时发生错误:", err);
		console.error(`请检查您是否有权限读写 ${CLAUDE_SETTINGS_PATH}`);
	}
}

setupHooks();
