import { describe, it, expect } from "vitest";

import { setGenerateSidebar, setUserConfig } from "@ruan-cat/vitepress-preset-config/config.mts";

describe("测试合并配置", () => {
	it("setUserConfig 设置vitepress用户配置", () => {
		const testTitle = "测试标题";
		const resTitle = setUserConfig({ title: testTitle }).title;
		expect(resTitle).toBe(testTitle);
	});
});
