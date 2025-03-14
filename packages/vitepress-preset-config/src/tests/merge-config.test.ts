import { describe, it, expect } from "vitest";

import defConfig, { setGenerateSidebar, setUserConfig } from "@ruan-cat/vitepress-preset-config/config.mts";

describe("测试合并配置", () => {
	it("setUserConfig 设置vitepress用户配置", () => {
		const testTitle = "测试标题";
		const resConfig = setUserConfig({ title: testTitle });
		const resTitle = resConfig.title;

		expect(resTitle).toBe(testTitle);
		expect(resConfig.vite?.server?.open).toBe(defConfig.vite?.server?.open);

		console.log("  setUserConfig 设置vitepress用户配置", resConfig);
	});
});
