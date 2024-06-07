// @ts-check

/** @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').PluginOptions} */
const config = {
	// $schema: "https://typedoc-plugin-markdown.org/schema.json",
	out: "./src/typedoc-api",

	// FIXME: 这里出现奇怪的类型缺失错误
	// @ts-expect-error 莫名其妙
	docsRoot: "./src",
};

export default config;
