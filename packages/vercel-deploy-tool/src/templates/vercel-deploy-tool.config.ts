import { defineConfig } from "@ruan-cat/vercel-deploy-tool";

/**
 * Vercel 部署工具配置
 * @description
 * 配置 Vercel 部署的各项参数
 *
 * @see https://vercel-deploy-tool.ruancat6312.top
 */
export default defineConfig({
	/**
	 * Vercel 项目名称
	 * @description
	 * 在 Vercel 控制台中创建的项目名称
	 */
	vercelProjectName: "your-project-name",

	/**
	 * Vercel Token
	 * @description
	 * 从 Vercel 账户设置中获取的 API Token
	 * 建议使用环境变量
	 */
	vercelToken: process.env.VERCEL_TOKEN || "",

	/**
	 * Vercel 组织 ID
	 * @description
	 * Vercel 组织的唯一标识符
	 * 建议使用环境变量
	 */
	vercelOrgId: process.env.VERCEL_ORG_ID || "",

	/**
	 * Vercel 项目 ID
	 * @description
	 * Vercel 项目的唯一标识符
	 * 建议使用环境变量
	 */
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",

	/**
	 * 自定义 Vercel 配置文件路径（可选）
	 * @description
	 * 如果需要使用自定义的 vercel.json 配置文件，可以在这里指定路径
	 */
	// vercelJsonPath: "./custom-vercel.json",

	/**
	 * 构建后执行的命令（可选）
	 * @description
	 * 在 Vercel build 阶段后执行的命令
	 */
	// afterBuildTasks: [
	// 	"echo 'Build completed'",
	// 	"pnpm run post-build",
	// ],

	/**
	 * 部署目标
	 * @description
	 * 配置需要部署的项目列表
	 * 支持 monorepo 中的多个子项目
	 */
	deployTargets: [
		{
			/**
			 * 部署类型
			 * @description
			 * - "static": 静态站点
			 * - "userCommands": 需要执行用户命令的项目
			 */
			type: "userCommands",

			/**
			 * 目标工作目录
			 * @description
			 * 项目在 monorepo 中的相对路径
			 */
			targetCWD: "./packages/docs",

			/**
			 * 生产环境访问 URL
			 * @description
			 * 部署后的自定义域名列表
			 */
			url: ["docs.example.com", "www.example.com"],

			/**
			 * 用户命令
			 * @description
			 * 构建项目的命令列表
			 */
			userCommands: ["pnpm build:docs"],

			/**
			 * 输出目录
			 * @description
			 * 构建产物的输出路径（相对于 targetCWD）
			 */
			outputDirectory: "docs/.vitepress/dist",

			/**
			 * 是否复制构建产物（可选）
			 * @description
			 * 是否将构建产物复制到 Vercel 指定的输出目录
			 * @default true
			 */
			// isCopyDist: true,

			/**
			 * 是否需要 Vercel Build（可选）
			 * @description
			 * 是否需要执行 `vercel build` 命令
			 * @default true
			 */
			// isNeedVercelBuild: true,
		},

		// 可以添加更多部署目标
		// {
		// 	type: "userCommands",
		// 	targetCWD: "./packages/app",
		// 	url: ["app.example.com"],
		// 	userCommands: ["pnpm build"],
		// 	outputDirectory: "dist",
		// },
	],
});
