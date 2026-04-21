import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { consola } from "consola";

// 获取当前模块的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 创建 init 命令
 * @description
 * 初始化配置文件，生成 vercel-deploy-tool.config.ts 模板
 *
 * @example
 * ```bash
 * vercel-deploy-tool init
 * vercel-deploy-tool init --force
 * ```
 */
export function createInitCommand(): Command {
	const command = new Command("init");

	command
		.description("初始化配置文件")
		.option("-f, --force", "强制覆盖已存在的文件")
		.action((options) => {
			const cwd = process.cwd();
			const configFile = "vercel-deploy-tool.config.ts";
			const targetPath = join(cwd, configFile);

			// 检查文件是否已存在
			if (existsSync(targetPath) && !options.force) {
				consola.warn(`配置文件已存在: ${configFile}`);
				consola.info("使用 --force 选项可以覆盖");
				return;
			}

			// 读取模板文件
			const templatePath = join(__dirname, "..", "templates", configFile);

			if (!existsSync(templatePath)) {
				consola.error(`模板文件不存在: ${templatePath}`);
				consola.error("请确保 @ruan-cat/vercel-deploy-tool 包已正确安装");
				process.exit(1);
			}

			const content = readFileSync(templatePath, "utf-8");

			// 写入配置文件
			writeFileSync(targetPath, content, "utf-8");
			consola.success(`已创建配置文件: ${configFile}`);

			// 更新 package.json
			const pkgPath = join(cwd, "package.json");
			if (existsSync(pkgPath)) {
				try {
					const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
					if (!pkg.scripts) pkg.scripts = {};

					// 添加 deploy-vercel 脚本
					pkg.scripts["deploy-vercel"] = "vercel-deploy-tool deploy";

					writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
					consola.success('已添加脚本: "deploy-vercel"');
				} catch (error) {
					consola.warn("更新 package.json 失败:", error);
				}
			}

			// 显示后续操作提示
			consola.box(`🎉 初始化完成！

创建的文件:
  • ${configFile} - Vercel 部署配置文件

添加的脚本:
  • deploy-vercel: vercel-deploy-tool deploy

下一步:
  1. 安装 Vercel CLI peer 依赖:
     pnpm add -D vercel@latest
  2. 编辑 ${configFile} 填写你的配置
  3. 确保环境变量已设置:
     - VERCEL_TOKEN
     - VERCEL_ORG_ID
     - VERCEL_PROJECT_ID
  4. 运行部署:
     pnpm run deploy-vercel`);
		});

	return command;
}
