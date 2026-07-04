import { defineConfig } from "vitest/config";

/**
 * tests/ 目录下各 skill 测试套件的公共 vitest 配置。
 *
 * 子目录内无需放置任何 vitest.config.ts 文件。
 * vitest 会自动向上查找并继承此公共配置。
 *
 * 如需在子目录中覆盖部分配置（如指定不同的 include 模式），
 * 才需要在该子目录内放置 vitest.config.ts，使用 mergeConfig：
 *
 *   import { defineConfig, mergeConfig } from "vitest/config";
 *   import baseConfig from "../vitest.config.ts";
 *   export default mergeConfig(baseConfig, defineConfig({ ... }));
 */
export default defineConfig({
	test: {
		environment: "node",
		include: ["**/*.test.ts"],
	},
});
