#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Command } from "commander";
import { createDeployCommand } from "./commands/deploy";
import { createInitCommand } from "./commands/init";

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
program.name("vercel-deploy-tool").description("Vercel 部署工具 - 支持 monorepo 的自动化部署").version(version);

// 注册所有子命令
program.addCommand(createDeployCommand());
program.addCommand(createInitCommand());

// 自定义帮助信息
program.on("--help", () => {
	console.log("");
	console.log("使用示例 / Usage Examples:");
	console.log("");
	console.log("  # 初始化配置文件");
	console.log("  vercel-deploy-tool init");
	console.log("  vdt init");
	console.log("");
	console.log("  # 部署项目");
	console.log("  vercel-deploy-tool deploy");
	console.log("  vdt deploy");
	console.log("");
	console.log("  # 查看帮助");
	console.log("  vercel-deploy-tool --help");
	console.log("  vdt --help");
	console.log("");
	console.log("环境变量 / Environment Variables:");
	console.log("  VERCEL_TOKEN       - Vercel API Token");
	console.log("  VERCEL_ORG_ID      - Vercel 组织 ID");
	console.log("  VERCEL_PROJECT_ID  - Vercel 项目 ID");
	console.log("");
});

// 解析命令行参数
program.parse();
