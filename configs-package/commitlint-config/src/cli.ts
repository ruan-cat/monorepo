#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";

// 获取当前模块的文件名和目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 模板文件所在目录
const TEMPLATE_DIR = join(__dirname, "..", "templates");

// 需要复制的模板文件列表
const TEMPLATE_FILES = [
	".czrc",
	"commitlint.config.cjs",
] as const;

/**
 * 复制模板文件到目标目录
 * @param filename 文件名
 * @param targetDir 目标目录
 */
function copyTemplateFile(filename: string, targetDir: string): void {
	const templatePath = join(TEMPLATE_DIR, filename);
	const targetPath = join(targetDir, filename);

	// 检查模板文件是否存在
	if (!existsSync(templatePath)) {
		consola.error(`Template file not found: ${templatePath}`);
		return;
	}

	try {
		// 读取模板文件内容并写入到目标位置
		const content = readFileSync(templatePath, "utf-8");
		writeFileSync(targetPath, content, "utf-8");
		consola.success(`Created: ${filename}`);
	} catch (error) {
		consola.error(`Failed to copy ${filename}:`, error);
	}
}

/**
 * 执行初始化命令
 */
function initCommand(): void {
	const cwd = process.cwd();
	
	consola.info("Initializing @ruan-cat/commitlint-config configuration files...");

	// 检查哪些文件将被覆盖
	const existingFiles = TEMPLATE_FILES.filter(file => 
		existsSync(join(cwd, file))
	);

	// 如果有文件将被覆盖，给出警告
	if (existingFiles.length > 0) {
		consola.warn(`The following files will be overwritten: ${existingFiles.join(", ")}`);
	}

	// 复制所有模板文件
	for (const file of TEMPLATE_FILES) {
		copyTemplateFile(file, cwd);
	}

	consola.success("Configuration files initialized successfully!");
	
	// 特别提示 commitlint.config.cjs 文件被覆盖
	if (existingFiles.includes("commitlint.config.cjs")) {
		consola.info("Note: The existing commitlint.config.cjs file has been overwritten.");
	}
}

/**
 * 主函数，处理命令行参数
 */
function main(): void {
	const args = process.argv.slice(2);
	const command = args[0];

	switch (command) {
		case "init":
			initCommand();
			break;
		case undefined:
			// 没有提供命令时显示使用说明
			consola.info("Usage: @ruan-cat/commitlint-config <command>");
			consola.info("Commands:");
			consola.info("  init    Initialize configuration files");
			break;
		default:
			// 未知命令时显示错误信息
			consola.error(`Unknown command: ${command}`);
			consola.info("Available commands: init");
			process.exit(1);
	}
}

// 执行主函数
main();