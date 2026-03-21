// npm/pnpm/yarn 会在 npm_config_user_agent 环境变量中暴露当前包管理器信息。
// 在 preinstall 钩子中读取该值，强制只允许使用 pnpm 安装依赖。
const agent = process.env.npm_config_user_agent;

// 当包管理器不是 pnpm（或环境变量不存在）时，中断安装流程。
if (!agent || !agent.startsWith("pnpm")) {
	console.error("\x1b[31mError: This project requires pnpm as the package manager.\x1b[0m");
	console.error('Please use "pnpm install" to install dependencies.');
	process.exit(1);
}
