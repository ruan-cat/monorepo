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
