/**
 * 用户自己额外配置的范围项 拆分出表述文本的配置项
 * @description
 */
export type ScopesItemWithDesc = {
	/** 输入时的提示词 */
	code: string;

	/**
	 * 最终显示在 git commit 的文本
	 * @description
	 * 即 git commit 的 scope 值。
	 */
	value: string;

	/** 表述文本 */
	desc: string;

	/**
	 * 生成git提交范围用的 glob 匹配路径
	 * @description
	 * 如果 glob 存在，则表示该范围的提交范围，会根据 glob 的匹配结果，进行范围的合并。
	 */
	glob?: string[];
};

/**
 * 常用的范围配置
 * @description
 * 该配置是为了提供更多的范围配置，以便于更好的管理提交范围。
 *
 * 这里罗列一些高频更改配置的文件，并定位为专门的提交范围。
 *
 * 这些配置范围，大多数是从具体项目中 不断提炼出来的常用范围
 */
export const commonScopes: ScopesItemWithDesc[] = [
	// 根目录
	{
		code: "root",
		value: "root",
		desc: "根目录",
		glob: [
			// === 基础点配置文件 ===
			".gitignore",
			".gitattributes",
			".czrc",
			".nvmrc",
			".npmrc",
			".editorconfig",

			// Prettier 配置
			".prettierrc",
			".prettierrc.js",
			".prettierrc.cjs",
			".prettierrc.mjs",
			".prettierrc.json",
			".prettierrc.yaml",
			".prettierrc.yml",
			".prettierignore",

			// ESLint 配置（根目录的）
			".eslintrc",
			".eslintrc.js",
			".eslintrc.cjs",
			".eslintrc.json",
			".eslintrc.yaml",
			".eslintrc.yml",
			".eslintignore",

			// === 文档文件 ===
			"README",
			"README.md",
			"README.txt",
			"LICENSE",
			"LICENSE.md",
			"LICENSE.txt",
			"CHANGELOG",
			"CHANGELOG.md",
			"CONTRIBUTING",
			"CONTRIBUTING.md",
			"CODE_OF_CONDUCT",
			"CODE_OF_CONDUCT.md",
			"SECURITY",
			"SECURITY.md",

			// === 根目录脚本 ===
			"*.sh", // Shell 脚本
			"*.bat", // Windows 批处理
			"*.ps1", // PowerShell 脚本
			"*.cmd", // Windows 命令脚本

			// === 其他常见根目录配置 ===
			"Makefile",
			"Dockerfile",
			".dockerignore",
		],
	},

	// 配置文件
	{
		code: "config",
		value: "config",
		desc: "各种配置文件",
		glob: [
			"**/*.config.js",
			"**/*.config.ts",
			"**/*.config.cjs",
			"**/*.config.mjs",
			"**/*.config.json",
			".config/**",
			"**/turbo.json",
		],
	},

	// 任务调度器
	{
		code: "turbo",
		value: "turbo",
		desc: "任务调度器",
		glob: ["**/turbo.json"],
	},

	// 包配置
	{
		code: "package.json",
		value: "package.json",
		desc: "包配置",
		glob: ["**/package.json", "pnpm-workspace.yaml"],
	},

	// vite打包工具配置
	{
		code: "vite.config.js/ts",
		value: "vite",
		desc: "vite打包工具配置",
		glob: ["**/vite.config.js", "**/vite.config.ts"],
	},

	// vitepress文档工具配置
	{
		code: "vitepress",
		value: "vitepress",
		desc: "vitepress文档工具配置",
		glob: ["**/.vitepress/config.mts", "**/.vitepress/config.ts", "**/.vitepress/theme/index.ts"],
	},

	// cz配置，即git提交工具的配置
	{
		code: "commitlint.config.cjs",
		value: "commitlint",
		desc: "cz配置，即git提交工具的配置",
		glob: ["**/commitlint.config.cjs"],
	},

	// typescript项目配置
	{
		code: "tsconfig",
		value: "tsc",
		desc: "typescript项目配置",
		glob: ["**/tsconfig*.json"],
	},

	// server 服务端接口
	{
		code: "server",
		value: "server",
		desc: "服务端接口",
		glob: ["**/server/**/*.ts", "**/servers/**/*.ts"],
	},

	// 路由
	{
		code: "router",
		value: "router",
		desc: "路由配置",
		glob: ["**/router/**/*.ts", "**/routers/**/*.ts"],
	},

	// vscode配置
	{
		code: "vscode/settings.json",
		value: "vsc",
		desc: "vscode配置",
		glob: ["**/.vscode/**"],
	},

	// 国际化
	{
		code: "i18n",
		value: "i18n",
		desc: "国际化",
		// TODO: 国际化配置的 glob 匹配路径。 需要先去看看 i18n 常见的路径配置才能得知。
		// glob: ["**/i18n/**"],
	},

	// 提示词
	{
		code: "prompt",
		value: "prompt",
		desc: "提示词。特指和AI协作使用的提示词文件。",
		glob: ["**/prompts/**/*.md", ".github/prompts/**/*.md"],
	},

	// API接口
	{
		code: "api",
		value: "api",
		desc: "API接口",
	},

	// openspec 提示词文档配置
	{
		code: "openspec",
		value: "openspec",
		desc: "openspec提示词文档配置。特指高强度在 openspec 目录内迭代更新的任务说明文档。",
		glob: ["**/openspec/**/*.md"],
	},

	// claude code的配置
	{
		code: "claude",
		value: "claude",
		desc: "claude code的配置。特指在claude code生成或使用的文件。包括配置、提示词、代理、记忆文件等。",
		glob: ["**/.claude/**", "**/.claude-plugin/**", "**/CLAUDE*.md"],
	},
];
