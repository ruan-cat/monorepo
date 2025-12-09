#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import consola from "consola";
import { isMonorepoProject } from "@ruan-cat/utils/node-esm";

// 获取当前模块的文件名和目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 模板文件所在目录
const TEMPLATE_DIR = join(__dirname, "..", "templates");

// 读取 package.json 获取版本号
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const { version } = packageJson;

// 需要复制的模板文件列表
const TEMPLATE_FILES = ["taze.config.ts"] as const;

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
 * 在 package.json 的 scripts 对象中插入 up-taze 命令到第一行
 * @param targetDir 目标目录
 * @param isMonorepo 是否为 monorepo 项目
 */
function addUpTazeScript(targetDir: string, isMonorepo: boolean): void {
	const pkgJsonPath = join(targetDir, "package.json");

	// 检查 package.json 是否存在
	if (!existsSync(pkgJsonPath)) {
		consola.warn("package.json not found, skipping script addition");
		return;
	}

	try {
		// 读取 package.json
		const content = readFileSync(pkgJsonPath, "utf-8");
		const pkg = JSON.parse(content);

		// 确保 scripts 对象存在
		if (!pkg.scripts) {
			pkg.scripts = {};
		}

		// 根据项目类型确定命令
		const upTazeCommand = isMonorepo
			? "pnpm -w up @ruan-cat/taze-config -L && npx taze -r"
			: "pnpm up @ruan-cat/taze-config -L && npx taze -r";

		// 创建新的 scripts 对象，将 up-taze 放在第一行
		const newScripts: Record<string, string> = {
			"up-taze": upTazeCommand,
		};

		// 将其他脚本添加到新对象中（排除已存在的 up-taze）
		for (const [key, value] of Object.entries(pkg.scripts)) {
			if (key !== "up-taze") {
				newScripts[key] = value as string;
			}
		}

		// 更新 scripts
		pkg.scripts = newScripts;

		// 写回 package.json，保持格式化
		writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, "\t") + "\n", "utf-8");

		const projectType = isMonorepo ? "monorepo" : "standard";
		consola.success(`Added "up-taze" script to package.json (${projectType} project)`);
	} catch (error) {
		consola.error("Failed to update package.json:", error);
	}
}

/**
 * 执行初始化命令
 * @param options 命令选项
 */
function initCommand(options: { force?: boolean }): void {
	const cwd = process.cwd();

	consola.info("正在初始化 @ruan-cat/taze-config 配置文件...");
	consola.info("Initializing @ruan-cat/taze-config configuration files...");

	// 检查哪些文件将被覆盖
	const existingFiles = TEMPLATE_FILES.filter((file) => existsSync(join(cwd, file)));

	// 如果有文件将被覆盖且没有 --force 选项，给出警告
	if (existingFiles.length > 0 && !options.force) {
		consola.warn(`以下文件将被覆盖 / The following files will be overwritten: ${existingFiles.join(", ")}`);
		consola.info("使用 --force 选项可以跳过此警告 / Use --force option to skip this warning");
	}

	// 复制所有模板文件
	for (const file of TEMPLATE_FILES) {
		copyTemplateFile(file, cwd);
	}

	// 判断项目类型并添加 up-taze 脚本
	const isMonorepo = isMonorepoProject();
	addUpTazeScript(cwd, isMonorepo);

	consola.success("配置文件初始化成功！");
	consola.success("Configuration files initialized successfully!");

	// 特别提示 taze.config.ts 文件被覆盖
	if (existingFiles.includes("taze.config.ts")) {
		consola.info("注意：已覆盖现有的 taze.config.ts 文件");
		consola.info("Note: The existing taze.config.ts file has been overwritten.");
	}

	// 显示后续操作提示
	const projectType = isMonorepo ? "Monorepo" : "Standard";
	const upTazeCommand = isMonorepo
		? "pnpm -w up @ruan-cat/taze-config -L && npx taze -r"
		: "pnpm up @ruan-cat/taze-config -L && npx taze -r";

	consola.box(`🎉 初始化完成！/ Initialization completed!

项目类型 / Project type: ${projectType}

创建的文件 / Created files:
  • taze.config.ts - Taze 配置文件

添加的脚本 / Added scripts:
  • up-taze: ${upTazeCommand}

下一步 / Next steps:
  1. 安装依赖 / Install dependencies:
     pnpm i -D @ruan-cat/taze-config taze

  2. 开始使用 / Start using:
     pnpm run up-taze`);
}

// 创建 commander 程序实例
const program = new Command();

// 设置程序基本信息
program
	.name("@ruan-cat/taze-config")
	.description(
		`阮喵喵自用的 taze 配置工具
Ruan Cat's taze configuration tool`,
	)
	.version(version);

// 添加 init 命令
program
	.command("init")
	.description(
		`初始化配置文件
Initialize configuration files`,
	)
	.option(
		"-f, --force",
		`强制覆盖已存在的文件
Force overwrite existing files`,
	)
	.action((options) => {
		initCommand(options);
	});

// 自定义帮助信息
program.on("--help", () => {
	consola.box(`🚀 使用示例 / Usage Examples

# 基本用法 / Basic usage
pnpm dlx @ruan-cat/taze-config init
npx @ruan-cat/taze-config init

# 强制覆盖 / Force overwrite
pnpm dlx @ruan-cat/taze-config init --force

# 查看帮助 / Show help
pnpm dlx @ruan-cat/taze-config --help

# 查看版本 / Show version
pnpm dlx @ruan-cat/taze-config --version`);
});

// 解析命令行参数
program.parse();
