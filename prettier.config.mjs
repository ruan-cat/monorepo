import * as prettierPluginOxc from "@prettier/plugin-oxc";

// @ts-check
/** @type {import("prettier").Config} */
const config = {
	// FIXME: 临时禁用 @prettier/plugin-oxc 插件，因为 0.0.4 版本在处理某些 TypeScript 语法时有 bug
	// 错误: Cannot read properties of undefined (reading 'value')
	// 参考: https://github.com/prettier/plugin-oxc/issues
	/* prettierPluginOxc */
	plugins: ["prettier-plugin-lint-md"],

	/** @see https://github.com/prettier/prettier/tree/main/packages/plugin-oxc */
	overrides: [
		{
			files: ["**/*.{js,mjs,cjs,jsx}"],
			parser: "oxc",
			plugins: [prettierPluginOxc],
		},
		{
			files: ["**/*.{ts,mts,cts,tsx}"],
			parser: "oxc-ts",
			plugins: [prettierPluginOxc],
		},
	],

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
