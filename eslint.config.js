// @ts-check
import antfu from "@antfu/eslint-config";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// TODO: md格式化？
// import { FlatCompat } from "@eslint/eslintrc";
// const compat = new FlatCompat();

export default antfu(
	{
		// Or customize the stylistic rules
		stylistic: {
			indent: 2, // 4, or 'tab'
			quotes: "double", // or 'double'
			semi: true, // or 'always'
		},

		// TypeScript and Vue are auto-detected, you can also explicitly enable them:
		typescript: {
			tsconfigPath: "tsconfig.json",
		},

		vue: true,

		javascript: {
			/**
			 * @see https://eslint.org/docs/latest/use/configure/migration-guide#importing-plugins-and-custom-parsers
			 */
			overrides: { "jsdoc/require-description": "error", "jsdoc/check-values": "error" },
		},

		// Disable jsonc and yaml support
		jsonc: false,
		yaml: false,
		// TODO: md格式化？
		// markdown: true,

		// `.eslintignore` is no longer supported in Flat config, use `ignores` instead
		ignores: [
			"**/fixtures",
			// ...globs
		],

		/**
		 * @see https://juejin.cn/post/7338074027281104936
		 */
		formatters: {
			/**
			 * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
			 * By default uses Prettier
			 */
			css: true,
			/**
			 * Format HTML files
			 * By default uses Prettier
			 */
			html: true,
			// TODO: md格式化？
			/**
			 * Format Markdown files
			 * Supports Prettier and dprint
			 * By default uses Prettier
			 */
			markdown: "prettier",
		},
	},

	// TODO: md格式化？
	// Legacy config
	// ...compat.config({
	// 	extends: ["plugin:@lint-md/recommend"],
	// 	overrides: [
	// 		{
	// 			files: ["*.md"],
	// 			// 0.0.x 版本为 '@lint-md/eslint-plugin/src/parser'
	// 			parser: "@lint-md/eslint-plugin/lib/parser",
	// 			rules: {
	// 				// 在这里覆盖已有的 rules
	// 				"@lint-md/recommend": [
	// 					"error",
	// 					{
	// 						"space-around-alphabet": true,
	// 					},
	// 				],
	// 			},
	// 		},
	// 	],
	// }),

	{
		rules: {
			"no-console": "off",
			// 设置为总是警告
			// "style/semi": ["warn", "always"],
		},
	},

	{
		rules: {
			"prettier/prettier": [
				"error",
				{
					usePrettierrc: true,
					singleQuote: false,
					printWidth: 120,
					semi: true,
					jsxSingleQuote: true,
					useTabs: true,
					tabWidth: 2,
					endOfLine: "auto",
					// markdown格式化中文缺少空格，不是解析器的问题，是prettier 3版本的更新移除了该功能。
					// overrides: [
					// 	{
					// 		files: "*.md",
					// 		options: {
					// 			parser: "markdown",
					// 		},
					// 	},
					// ],
				},
			],
		},
	},

	eslintConfigPrettier,
	eslintPluginPrettierRecommended,
);
