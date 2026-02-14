import { describe, test, expect, vi, beforeEach } from "vitest";

import type { UserConfig, DefaultTheme } from "vitepress";

// Mock consola
vi.mock("consola", () => ({
	default: {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	},
}));

// Mock vitepress
vi.mock("vitepress", () => ({}));

// Mock vitepress-sidebar
vi.mock("vitepress-sidebar", () => ({
	generateSidebar: vi.fn(() => [{ text: "prompts-group", items: [{ text: "prompt-1", link: "/prompts/prompt-1" }] }]),
}));

// Mock lodash-es
vi.mock("lodash-es", () => ({
	merge: (...args: any[]) => Object.assign({}, ...args),
	cloneDeep: (obj: any) => JSON.parse(JSON.stringify(obj)),
}));

// Mock vitepress-project 模块
const { mockHasPromptsIndexMd, mockHasChangelogMd } = vi.hoisted(() => ({
	mockHasPromptsIndexMd: vi.fn(() => true),
	mockHasChangelogMd: vi.fn(() => true),
}));

vi.mock("../../utils/vitepress-project.ts", () => ({
	getVitepressProjectRoot: vi.fn(() => "/mock/project/root"),
	getVitepressSourceDirectory: vi.fn(() => "/mock/project/root"),
	hasPromptsIndexMd: mockHasPromptsIndexMd,
	hasChangelogMd: mockHasChangelogMd,
	PROMPTS_INDEX_MD_PATH: "prompts/index.md",
	CHANGELOG_MD_FILENAME: "CHANGELOG.md",
}));

import { setupMultiSidebar } from "../../config/multi-sidebar.ts";

describe("多侧边栏配置 - setupMultiSidebar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 重置默认 mock 返回值
		mockHasPromptsIndexMd.mockReturnValue(true);
		mockHasChangelogMd.mockReturnValue(true);
	});

	test("有 prompts + CHANGELOG → getter 返回 3 路径多侧边栏", () => {
		const userConfig = {
			themeConfig: {} as any,
		} as UserConfig<DefaultTheme.Config>;

		setupMultiSidebar(userConfig);

		// 赋值业务侧边栏（触发 setter）
		userConfig.themeConfig!.sidebar = [{ text: "业务", items: [] }];

		// 读取 sidebar 时应该返回多侧边栏对象（触发 getter）
		const sidebar = userConfig.themeConfig!.sidebar as Record<string, any>;
		expect(typeof sidebar).toBe("object");
		expect(sidebar).not.toBeNull();
		expect(sidebar).toHaveProperty("/");
		expect(sidebar).toHaveProperty("/prompts/");
		expect(sidebar).toHaveProperty("/CHANGELOG");
	});

	test("仅 prompts → getter 返回 2 路径", () => {
		mockHasChangelogMd.mockReturnValue(false);

		const userConfig = {
			themeConfig: {} as any,
		} as UserConfig<DefaultTheme.Config>;

		setupMultiSidebar(userConfig);

		userConfig.themeConfig!.sidebar = [{ text: "业务", items: [] }];
		const sidebar = userConfig.themeConfig!.sidebar as Record<string, any>;

		expect(sidebar).toHaveProperty("/");
		expect(sidebar).toHaveProperty("/prompts/");
		expect(sidebar).not.toHaveProperty("/CHANGELOG");
	});

	test("仅 CHANGELOG → getter 返回 2 路径", () => {
		mockHasPromptsIndexMd.mockReturnValue(false);
		mockHasChangelogMd.mockReturnValue(true);

		const userConfig = {
			themeConfig: {} as any,
		} as UserConfig<DefaultTheme.Config>;

		setupMultiSidebar(userConfig);

		userConfig.themeConfig!.sidebar = [{ text: "业务", items: [] }];
		const sidebar = userConfig.themeConfig!.sidebar as Record<string, any>;

		expect(sidebar).toHaveProperty("/");
		expect(sidebar).toHaveProperty("/CHANGELOG");
		expect(sidebar).not.toHaveProperty("/prompts/");
	});

	test("都没有 → 不设置 defineProperty，原始 sidebar 不变", () => {
		mockHasPromptsIndexMd.mockReturnValue(false);
		mockHasChangelogMd.mockReturnValue(false);

		const originalSidebar = [{ text: "原始", items: [] }];
		const userConfig = {
			themeConfig: { sidebar: originalSidebar } as any,
		} as UserConfig<DefaultTheme.Config>;

		setupMultiSidebar(userConfig);

		// sidebar 应保持原样（同一引用）
		expect(userConfig.themeConfig!.sidebar).toBe(originalSidebar);
		expect(Array.isArray(userConfig.themeConfig!.sidebar)).toBe(true);
	});

	test("setter 赋值后 getter 正确包裹", () => {
		const userConfig = {
			themeConfig: {} as any,
		} as UserConfig<DefaultTheme.Config>;

		setupMultiSidebar(userConfig);

		// 第一次赋值
		const firstSidebar = [{ text: "第一次", items: [] }];
		userConfig.themeConfig!.sidebar = firstSidebar;
		let sidebar = userConfig.themeConfig!.sidebar as Record<string, any>;
		expect(sidebar["/"]).toEqual(firstSidebar);

		// 第二次赋值（模拟 concat 操作）
		const secondSidebar = [{ text: "域名" }, { text: "自动生成" }];
		userConfig.themeConfig!.sidebar = secondSidebar;

		sidebar = userConfig.themeConfig!.sidebar as Record<string, any>;
		expect(sidebar["/"]).toEqual(secondSidebar);
		expect(sidebar).toHaveProperty("/prompts/");
		expect(sidebar).toHaveProperty("/CHANGELOG");
	});
});
