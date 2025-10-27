#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Command } from "commander";
import { createTaskCompleteCommand } from "./commands/task-complete.ts";
import { createLongTaskCommand } from "./commands/long-task.ts";
import { createTimeoutCommand } from "./commands/timeout.ts";
import { createErrorCommand } from "./commands/error.ts";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 package.json 获取版本号
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const { version } = packageJson;

// 创建主程序
const program = new Command();

// 设置程序基本信息
program
	.name("@ruan-cat/claude-notifier")
	.description(
		`Claude Code 通知工具
在 Claude Code 任务完成后，发送 Windows 系统通知`,
	)
	.version(version);

// 注册所有子命令
program.addCommand(createTaskCompleteCommand());
program.addCommand(createLongTaskCommand());
program.addCommand(createTimeoutCommand());
program.addCommand(createErrorCommand());

// 自定义帮助信息
program.on("--help", () => {
	console.log("");
	console.log("使用示例 / Usage Examples:");
	console.log("");
	console.log("  # 任务完成通知");
	console.log('  npx @ruan-cat/claude-notifier task-complete --message "任务已完成"');
	console.log("");
	console.log("  # 启动长任务监控（6, 10, 18, 25, 45 分钟提醒）");
	console.log("  npx @ruan-cat/claude-notifier long-task");
	console.log("");
	console.log("  # 查看长任务定时器状态");
	console.log("  npx @ruan-cat/claude-notifier long-task --status");
	console.log("");
	console.log("  # 停止长任务定时器");
	console.log("  npx @ruan-cat/claude-notifier long-task --stop");
	console.log("");
	console.log("  # 连接超时通知");
	console.log('  npx @ruan-cat/claude-notifier timeout --message "连接超时"');
	console.log("");
	console.log("  # 错误通知");
	console.log('  npx @ruan-cat/claude-notifier error --error-details "API 调用失败"');
	console.log("");
	console.log("音频预设 / Sound Presets:");
	console.log("  default  - Windows 系统默认通知音");
	console.log("  success  - 成功提示音");
	console.log("  warning  - 警告提示音");
	console.log("  error    - 错误提示音");
	console.log("  manbo    - 自定义预设");
	console.log("  none     - 静音");
	console.log("");
	console.log("图标预设 / Icon Presets:");
	console.log("  success  - 成功图标");
	console.log("  warning  - 警告图标");
	console.log("  error    - 错误图标");
	console.log("  info     - 信息图标");
	console.log("  clock    - 时钟图标");
	console.log("");
});

// 解析命令行参数
program.parse();
