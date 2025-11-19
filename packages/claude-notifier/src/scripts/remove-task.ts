#!/usr/bin/env tsx
/**
 * 删除任务脚本
 *
 * 用于在 Bash 脚本中通过 tsx 直接调用，删除指定 cwd 的任务。
 *
 * 使用方式：
 *   tsx remove-task.ts [cwd]
 *
 * 参数：
 *   cwd - 当前工作目录（可选，默认使用 process.cwd()）
 *
 * 示例：
 *   tsx remove-task.ts /path/to/project
 *   tsx remove-task.ts  # 使用当前目录
 */

import { removeTask } from "../core/timer.ts";
import path from "node:path";

// 获取 cwd 参数
const cwdArg = process.argv[2];
const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

try {
	// 删除任务
	removeTask(cwd);
	console.log(`✅ Task removed successfully for: ${cwd}`);
	process.exit(0);
} catch (error) {
	console.error(`❌ Failed to remove task for: ${cwd}`);
	console.error(error);
	process.exit(1);
}
