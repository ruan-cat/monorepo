import fs from "node:fs";
import path from "node:path";
import consola from "consola";

/** 检查当前运行的根目录 是否存在 .claude/agents 文件夹 */
export function hasClaudeAgents() {
	const res = fs.existsSync(path.resolve(process.cwd(), ".claude/agents"));
	if (!res) {
		consola.log("当前项目根目录为：", process.cwd());
		consola.warn("当前项目根目录不存在 .claude/agents 文件夹");
	}
	return res;
}

/**
 * 将 .claude/agents 文件夹复制到指定要求的位置内
 * @description
 * 该函数相当于实现 `cpx .claude/agents <target>` 命令
 */
export function copyClaudeAgents(/** 目标文件夹 */ target: string) {
	if (!hasClaudeAgents()) {
		return;
	}

	const source = path.resolve(process.cwd(), ".claude/agents");
	const destination = path.resolve(process.cwd(), target);

	// 确保目标文件夹的父目录存在
	fs.mkdirSync(path.dirname(destination), { recursive: true });

	// 递归复制文件夹
	fs.cpSync(source, destination, { recursive: true });

	consola.success(`已成功复制 .claude/agents 到 ${destination}`);
}
