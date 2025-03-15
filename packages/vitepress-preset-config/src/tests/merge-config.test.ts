import { describe, it, expect } from "vitest";

import { setGenerateSidebar, setUserConfig } from "@ruan-cat/vitepress-preset-config/config";

describe("测试合并配置", () => {
	it("setUserConfig 设置vitepress用户配置", () => {
		const testTitle = "测试标题";
		const resConfig = setUserConfig({ title: testTitle });
		const resTitle = resConfig.title;

		expect(resTitle).toBe(testTitle);
		expect(resConfig.vite?.server?.open).toBe(true);

		console.log("  setUserConfig 设置vitepress用户配置", resConfig);
	});
});
