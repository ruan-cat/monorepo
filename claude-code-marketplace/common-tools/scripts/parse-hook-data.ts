#!/usr/bin/env tsx
/**
 * 解析 Claude Code 钩子输入数据
 * 从 stdin 读取 JSON，提取指定字段
 */

import * as fs from "node:fs";

function main() {
	const args = process.argv.slice(2);
	const field = args[0];

	if (!field || field === "--help" || field === "-h") {
		console.error("Usage: tsx parse-hook-data.ts <field_name>");
		console.error("Available fields: session_id, transcript_path, cwd, cwd_sanitized");
		process.exit(field ? 0 : 1);
	}

	try {
		// 从 stdin 读取数据（设置超时避免卡住）
		let input = fs.readFileSync(0, "utf8");

		if (!input || !input.trim()) {
			console.log("");
			process.exit(0);
		}

		// 修复 Windows 路径中未转义的反斜杠问题
		// 简单粗暴但有效的方法：将所有单个反斜杠替换为双反斜杠
		// 首先将已经是双反斜杠的标记为特殊字符，然后替换单个反斜杠，最后恢复
		input = input.replace(/\\\\/g, "\x00"); // 暂时标记双反斜杠
		input = input.replace(/\\/g, "\\\\"); // 将所有单反斜杠转为双反斜杠
		input = input.replace(/\x00/g, "\\\\"); // 恢复双反斜杠

		const data = JSON.parse(input);

		// 特殊处理 cwd 字段（需要转义）
		if (field === "cwd_sanitized") {
			const cwd = data.cwd || process.env.PWD || process.cwd();
			const sanitized = cwd.replace(/[\\/:*?"<>|]/g, "_");
			console.log(sanitized);
		} else {
			// 输出指定字段，如果不存在则输出空字符串
			const value = data[field];
			console.log(value !== undefined ? value : "");
		}
	} catch (error) {
		// 解析失败时输出空字符串，并在 stderr 输出错误信息（用于调试）
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`ERROR parsing JSON: ${errorMessage}`);
		console.log("");
	}
}

main();
