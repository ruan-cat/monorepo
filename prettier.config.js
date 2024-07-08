// @ts-check
/** @type {import("prettier").Config} */
const config = {
	// FIXME: 等待修复
	plugins: ["prettier-plugin-lint-md/dist/prettier-plugin-lint-md.js"],
	singleQuote: false,
	printWidth: 120,
	semi: true,
	jsxSingleQuote: true,
	useTabs: true,
	tabWidth: 2,
	endOfLine: "auto",
	"space-around-alphabet": true,
	"space-around-number": true,
	"no-empty-code-lang": false,
	"no-empty-code": false,
};

export default config;
