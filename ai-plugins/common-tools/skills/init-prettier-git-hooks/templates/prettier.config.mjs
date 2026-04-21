import * as prettierPluginOxc from "@prettier/plugin-oxc";
import prettierPluginLintMd from "prettier-plugin-lint-md";

// @ts-check
/** @type {import("prettier").Config} */
const config = {
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
		// 按需启用：仅当项目保留带注释的 JSON 配置文件时使用 JSONC parser。
		// 不要把 `**/*.json` 全部配置为 JSONC，`package.json` 等仍应保持严格 JSON。
		// {
		// 	files: [".vscode/extensions.json", ".vscode/settings.json"],
		// 	parser: "jsonc",
		// 	trailingComma: "none",
		// },
	],

	singleQuote: false,
	printWidth: 120,
	semi: true,
	jsxSingleQuote: true,
	useTabs: true,
	tabWidth: 2,
	endOfLine: "lf",
	"space-around-alphabet": true,
	"space-around-number": true,
	"no-empty-code-lang": false,
	"no-empty-code": false,
};

export default config;
