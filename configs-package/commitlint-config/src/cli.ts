#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import consola from "consola";

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
 * @param options 命令选项
 */
function initCommand(options: { force?: boolean }): void {
	const cwd = process.cwd();
	
	consola.info("正在初始化 @ruan-cat/commitlint-config 配置文件...");
	consola.info("Initializing @ruan-cat/commitlint-config configuration files...");

	// 检查哪些文件将被覆盖
	const existingFiles = TEMPLATE_FILES.filter(file => 
		existsSync(join(cwd, file))
	);

	// 如果有文件将被覆盖且没有 --force 选项，给出警告并询问用户
	if (existingFiles.length > 0 && !options.force) {
		consola.warn(`以下文件将被覆盖 / The following files will be overwritten: ${existingFiles.join(", ")}`);
		consola.info("使用 --force 选项可以跳过此警告 / Use --force option to skip this warning");
	}

	// 复制所有模板文件
	for (const file of TEMPLATE_FILES) {
		copyTemplateFile(file, cwd);
	}

	consola.success("配置文件初始化成功！");
	consola.success("Configuration files initialized successfully!");
	
	// 特别提示 commitlint.config.cjs 文件被覆盖
	if (existingFiles.includes("commitlint.config.cjs")) {
		consola.info("注意：已覆盖现有的 commitlint.config.cjs 文件");
		consola.info("Note: The existing commitlint.config.cjs file has been overwritten.");
	}

	// 显示后续操作提示
	consola.box(`🎉 初始化完成！/ Initialization completed!

创建的文件 / Created files:
  • .czrc - commitizen 配置文件
  • commitlint.config.cjs - commitlint 配置文件

下一步 / Next steps:
  1. 安装依赖 / Install dependencies:
     pnpm i -D commitizen cz-git @commitlint/cli

  2. 开始使用 / Start using:
     git add .
     pnpm cz  # 或 npm run cz`);
}

// 创建 commander 程序实例
const program = new Command();

// 设置程序基本信息
program
	.name("@ruan-cat/commitlint-config")
	.description(`阮喵喵自用的 commitlint 配置工具
Ruan Cat's commitlint configuration tool`)
	.version(version);

// 添加 init 命令
program
	.command("init")
	.description(`初始化配置文件
Initialize configuration files`)
	.option("-f, --force", `强制覆盖已存在的文件
Force overwrite existing files`)
	.action((options) => {
		initCommand(options);
	});

// 自定义帮助信息
program.on("--help", () => {
	consola.box(`🚀 使用示例 / Usage Examples

# 基本用法 / Basic usage
pnpm dlx @ruan-cat/commitlint-config init
npx @ruan-cat/commitlint-config init

# 强制覆盖 / Force overwrite
pnpm dlx @ruan-cat/commitlint-config init --force

# 查看帮助 / Show help
pnpm dlx @ruan-cat/commitlint-config --help

# 查看版本 / Show version
pnpm dlx @ruan-cat/commitlint-config --version`);
});

// 解析命令行参数
program.parse();