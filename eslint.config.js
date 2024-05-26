// @ts-check
import antfu from "@antfu/eslint-config"
import gitignore from "eslint-config-flat-gitignore"
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
// const eslintConfigPrettier =   require("eslint-config-prettier");
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({
	recommendedConfig: js.configs.recommended,
})

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
    extends: [
      "eslint:recommended",
			"prettier",
      // Other extends...
    ],
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
      "style/semi": ["error", "never"],
    },
  },

  // @ts-ignore
  eslintConfigPrettier,
  // {
  // 	rules: eslintConfigPrettier
  // },
  eslintPluginPrettierRecommended,
)
