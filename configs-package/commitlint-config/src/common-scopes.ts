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
	{
		code: "turbo",
		value: "turbo",
		desc: "任务调度器",
		glob: ["**/turbo.json"],
	},
	{
		code: "root",
		value: "root",
		desc: "根目录",
	},
	{
		code: "package.json",
		value: "package.json",
		desc: "包配置",
		glob: ["**/package.json", "pnpm-workspace.yaml"],
	},
	{
		code: "vite.config.js/ts",
		value: "vite",
		desc: "vite打包工具配置",
		glob: ["**/vite.config.js", "**/vite.config.ts"],
	},
	{
		code: "vitepress",
		value: "文档配置",
		desc: "vitepress文档工具配置",
		glob: ["**/.vitepress/config.mts", "**/.vitepress/theme/index.ts"],
	},
	{
		code: "commitlint.config.cjs",
		value: "commitlint",
		desc: "cz配置，即git提交工具的配置",
		glob: ["**/commitlint.config.cjs"],
	},
	{
		code: "tsconfig",
		value: "tsc",
		desc: "typescript项目配置",
		glob: ["**/tsconfig*.json"],
	},
	{
		code: "router",
		value: "router",
		desc: "路由配置",
		glob: ["**/router/**/*.ts", "**/routers/**/*.ts"],
	},
	{
		code: "vscode/settings.json",
		value: "vsc",
		desc: "vscode配置",
		glob: ["**/.vscode/**"],
	},
	{
		code: "i18n",
		value: "i18n",
		desc: "国际化",
		// TODO: 国际化配置的 glob 匹配路径。 需要先去看看 i18n 常见的路径配置才能得知。
		// glob: ["**/i18n/**"],
	},
	{
		code: "prompt",
		value: "prompt",
		desc: "提示词。特指和AI协作使用的提示词文件。",
		glob: ["**/prompts/**/*.md", ".github/prompts/**/*.md"],
	},
	{
		code: "api",
		value: "api",
		desc: "API接口",
	},
	{
		code: "claude",
		value: "claude",
		desc: "claude code的配置。特指在claude code生成或使用的文件。包括配置、提示词、代理、记忆文件等。",
		glob: ["**/.claude/**", "CLAUDE.md"],
	},
];
