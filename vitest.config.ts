import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
	plugins: [
		// 放弃在vitest内使用路径别名 跳过
		/**
		 * 用于解决 vitest 测试用例的路径别名问题
		 * @see https://cn.vitest.dev/guide/common-errors.html#cannot-find-module-relative-path
		 */
		// tsconfigPaths({
		// 	projects: ["./tsconfig.test.json"],
		// }),
		// tsconfigPaths(),
		// tsAlias({
		// 	tsConfigName: "./tsconfig.test.json",
		// }),
	],

	test: {
		reporters: ["html"],
		outputFile: "./.vitest-reporter-html/index.html",
		// 放弃在测试用例中使用别名 这些p配置都无效
		// alias: {
		// 	"@utils": resolve(__dirname, "packages/utils/src/index.ts"),
		// 	"@utils-tests": resolve(__dirname, "./packages/utils/tests"),
		// },
	},
});
