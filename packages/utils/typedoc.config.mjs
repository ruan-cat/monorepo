// @ts-check

/**
 * @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').PluginOptions}
 *
 * 允许使用 `typedoc.config.mjs` 作为配置文件
 * @see https://typedoc.org/documents/Options.Configuration.html#options
 *
 * 类型声明配置
 * @see https://typedoc-plugin-markdown.org/docs/typedoc-usage#javascript-files
 */
// @ts-ignore
const config = {
	name: "本地化示例",
	// 指定项目的入口点
	entryPoints: ["./src/index.ts"],
	plugin: ["typedoc-plugin-markdown"],
	// 指定输出目录
	out: "./docs/typedoc-md",
	// 排除不需要生成文档的目录
	exclude: ["node_modules", "libs"],
	// 指定 TypeScript 配置文件
	tsconfig: "./tsconfig.json",
	gitRevision: "main",
	lang: "zh",
	excludeExternals: true,
	excludePrivate: true,
	excludeProtected: true,
	// 不需要专门移动readme文件
	readme: "none",
	// "readme": "readme.md",
	hidePageHeader: true,
	hideBreadcrumbs: true,
	enumMembersFormat: "table",
	parametersFormat: "table",
	propertiesFormat: "table",
	typeDeclarationFormat: "table",
	indexFormat: "table",
	useCodeBlocks: true,
	expandObjects: true,
};

export default config;
