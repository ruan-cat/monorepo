// @ts-check
/** @type {import("typedoc").TypeDocOptions & import("typedoc-plugin-markdown").PluginOptions} */
module.exports = {
	// 指定项目的入口点
	entryPoints: ["./src/index.ts"],
	// 指定输出目录
	out: ".typedoc",
	// 使用 Markdown 插件
	plugin: ["typedoc-plugin-markdown"],
	// 排除不需要生成文档的目录
	exclude: ["node_modules", "libs"],
	excludeExternals: true,
	excludePrivate: true,
	excludeProtected: true,
	// 指定 TypeScript 配置文件
	tsconfig: "./tsconfig.json",
};
