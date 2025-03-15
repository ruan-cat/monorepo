// @ts-check

/**
 * @type { import('typedoc').TypeDocOptions &
 * import('typedoc-plugin-markdown').PluginOptions &
 * import('typedoc-plugin-frontmatter').PluginOptions
 * }
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
	entryPoints: ["./src/index.ts", "./src/node-cjs/index.ts", "./src/node-esm/index.ts"],
	plugin: ["typedoc-plugin-markdown", "typedoc-plugin-frontmatter"],
	// 指定输出目录
	out: "./src/typedoc-md",
	// 排除不需要生成文档的目录
	exclude: ["node_modules", "libs", "./src/typedoc-md"],
	// 指定 TypeScript 配置文件
	tsconfig: "./tsconfig.json",
	gitRevision: "main",
	lang: "zh",
	excludeExternals: true,
	excludePrivate: true,
	excludeProtected: true,
	// 不需要专门移动readme文件
	readme: "none",

	/**
	 * 入口文件的文件名 默认为 index
	 * @see https://typedoc-plugin-markdown.org/docs/options/file-options#entryfilename
	 */
	entryFileName: "index",

	hidePageHeader: true,
	hideBreadcrumbs: true,
	enumMembersFormat: "table",
	parametersFormat: "table",
	propertiesFormat: "table",
	typeDeclarationFormat: "table",
	indexFormat: "table",
	useCodeBlocks: true,
	expandObjects: true,

	/**
	 * 设置生成文件首页的信息
	 * @description
	 * 让生成出来的首页带有特定的排序值
	 *
	 * 配置语法：
	 * @see https://typedoc-plugin-markdown.org/plugins/frontmatter/options#readmefrontmatter
	 *
	 * 配置参数语法：
	 * @see https://theme-hope.vuejs.press/zh/config/frontmatter/layout.html#dir
	 * @see https://theme-hope.vuejs.press/zh/config/frontmatter/layout.html#order
	 *
	 * @deprecated 不使用，在vitepress和相关的侧边栏插件的帮助下 不需要配置order排序了
	 */
	// readmeFrontmatter: {
	// 	order: 10,
	// 	dir: {
	// 		order: 10,
	// 	},
	// },
};

export default config;
