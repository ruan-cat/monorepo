// @ts-check
import antfu from "@antfu/eslint-config";
import gitignore from "eslint-config-flat-gitignore";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
// const eslintConfigPrettier =   require("eslint-config-prettier");
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
	recommendedConfig: js.configs.recommended,
});

export default antfu(
	{
		// Enable stylistic formatting rules
		// stylistic: true,

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
			/**
			 * Format Markdown files
			 * Supports Prettier and dprint
			 * By default uses Prettier
			 */
			markdown: "prettier",
		},
	},

	// Legacy config
	...compat.config({
		extends: ["eslint:recommended"],
	}),

	/** https://github.com/antfu/eslint-config-flat-gitignore */
	gitignore({
		root: true,
		strict: false,
		files: [".gitignore", ".eslintignore"],
	}),

	{
		rules: {
			"no-console": "off",
			// "style/semi": ["error", "never"],
		},
	},

	{
		rules: {
			"prettier/prettier": [
				"off",
				{
					usePrettierrc: true,
				},
			],
		},
	},

	// {
	//   rules: {
	// 		indent: ["error", 2], // 用于指定代码缩进的方式
	//     // quotes: ["error", "single"], // 用于指定字符串的引号风格，这里配置为使用单引号作为字符串的引号。
	//     semi: ["error", "always"], // 用于指定是否需要在语句末尾添加分号，这里配置为必须始终添加分号。
	//     "@typescript-eslint/no-explicit-any": ["off"], // 用于配置 TypeScript 中的 "any" 类型的使用规则，这里配置为关闭禁止显式使用 "any" 类型的检查。
	// 	},
	// },

	eslintPluginPrettierRecommended,
	eslintConfigPrettier,
);
