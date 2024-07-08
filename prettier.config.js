// @ts-check
/** @type {import("prettier").Config} */
const config = {
	plugins: [`prettier-plugin-lint-md`],
	singleQuote: false,
	printWidth: 120,
	semi: true,
	jsxSingleQuote: true,
	useTabs: true,
	tabWidth: 2,
	endOfLine: "auto",
	"space-around-alphabet": true,
	"space-around-number": true,
	// markdown格式化中文缺少空格，不是解析器的问题，是prettier 3版本的更新移除了该功能。
	// overrides: [
	// 	{
	// 		files: "*.md",
	// 		options: {
	// 			parser: "markdown",
	// 		},
	// 	},
	// ],
};

export default config;
