import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		/**
		 * 用于解决 vitest 测试用例的路径别名问题
		 * @see https://cn.vitest.dev/guide/common-errors.html#cannot-find-module-relative-path
		 */
		tsconfigPaths(),
	],

	test: {
		reporters: ["html"],
		outputFile: "./.vitest-reporter-html/index.html",
	},
});
