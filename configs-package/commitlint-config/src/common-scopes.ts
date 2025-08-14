/**
 * 用户自己额外配置的范围项 拆分出表述文本的配置项
 * @description
 */
export type ScopesItemWithDesc = {
	/** 输入时的提示词 */
	code: string;

	/** 最终显示在 git commit 的文本 */
	value: string;

	/** 表述文本 */
	desc: string;
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
	},
	{
		code: "turbo",
		value: "turbo",
		desc: "任务调度器",
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
	},
	{
		code: "vite.config.js/ts",
		value: "vite",
		desc: "vite打包工具配置",
	},
	{
		code: "vitepress",
		value: "文档配置",
		desc: "vitepress文档工具配置",
	},
	{
		code: "commitlint.config.cjs",
		value: "commitlint",
		desc: "cz配置，即git提交工具的配置",
	},
	{
		code: "tsconfig",
		value: "tsc",
		desc: "typescript项目配置",
	},
	{
		code: "router",
		value: "router",
		desc: "路由配置",
	},
	{
		code: "vscode/settings.json",
		value: "vsc",
		desc: "vscode配置",
	},
	{
		code: "i18n",
		value: "i18n",
		desc: "国际化",
	},
	{
		code: "prompt",
		value: "prompt",
		desc: "提示词。特指和AI协作使用的提示词文件。",
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
	},
];
