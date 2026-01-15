/**
 * ThemeManager 属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证 ThemeManager 的核心行为
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { createThemeManager } from "../manager";
import { createThemeRegistry } from "../registry";
import { createThemePersistence } from "../persistence";
import type { ThemeDefinition } from "../../types";
import { ThemeSwitcherError } from "../../types";

/**
 * 生成有效的主题 ID
 */
const themeIdArbitrary = fc
	.string({ minLength: 1, maxLength: 20 })
	.filter((s) => s.trim().length > 0 && !s.includes(" "));

/**
 * 创建模拟的 ThemeDefinition
 */
function createMockTheme(id: string, name?: string): ThemeDefinition {
	return {
		id,
		name: name ?? `Theme ${id}`,
		theme: {} as any,
		styles: [],
		cleanup: vi.fn(),
	};
}

/**
 * 创建模拟的 localStorage
 */
function createMockLocalStorage() {
	const store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			Object.keys(store).forEach((key) => delete store[key]);
		},
		length: 0,
		key: () => null,
		_store: store,
	};
}

describe("ThemeManager", () => {
	let registry: ReturnType<typeof createThemeRegistry>;
	let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

	beforeEach(() => {
		registry = createThemeRegistry();
		mockLocalStorage = createMockLocalStorage();

		// @ts-ignore
		globalThis.window = {
			localStorage: mockLocalStorage,
			dispatchEvent: vi.fn(),
			CustomEvent: class {
				type: string;
				detail: any;
				constructor(type: string, options?: { detail?: any }) {
					this.type = type;
					this.detail = options?.detail;
				}
			},
		};

		// @ts-ignore
		globalThis.document = {
			documentElement: {
				classList: {
					add: vi.fn(),
					remove: vi.fn(),
				},
				style: {
					setProperty: vi.fn(),
					removeProperty: vi.fn(),
				},
			},
			querySelectorAll: vi.fn(() => []),
		};
	});

	describe("基础功能测试", () => {
		test("创建管理器后应返回默认主题 ID", () => {
			const theme = createMockTheme("default");
			registry.register(theme);

			const manager = createThemeManager({
				registry,
				defaultTheme: "default",
			});

			expect(manager.getCurrentTheme()).toBe("default");
		});

		test("初始化后应能获取可用主题列表", () => {
			const theme1 = createMockTheme("theme1");
			const theme2 = createMockTheme("theme2");
			registry.register(theme1);
			registry.register(theme2);

			const manager = createThemeManager({ registry });
			manager.initialize("theme1");

			const themes = manager.getAvailableThemes();
			expect(themes).toHaveLength(2);
			expect(themes.map((t) => t.id)).toContain("theme1");
			expect(themes.map((t) => t.id)).toContain("theme2");
		});

		test("切换到不存在的主题应抛出错误", async () => {
			const theme = createMockTheme("existing");
			registry.register(theme);

			const manager = createThemeManager({
				registry,
				defaultTheme: "existing",
			});

			await expect(manager.switchTheme("non-existing")).rejects.toThrow(ThemeSwitcherError);
		});
	});

	/**
	 * Property 1: 主题应用一致性
	 * **Feature: vitepress-theme-switcher, Property 1: 主题应用一致性**
	 * **Validates: Requirements 1.2**
	 */
	describe("Property 1: 主题应用一致性", () => {
		test("对于任意已注册的主题 ID，切换后 getCurrentTheme 应返回该 ID", async () => {
			const themeIds = ["alpha", "beta", "gamma", "delta", "epsilon"];

			themeIds.forEach((id) => {
				registry.register(createMockTheme(id));
			});

			const manager = createThemeManager({
				registry,
				defaultTheme: themeIds[0],
			});
			manager.initialize();

			for (const targetId of themeIds) {
				await manager.switchTheme(targetId);
				expect(manager.getCurrentTheme()).toBe(targetId);
			}
		});

		test("属性测试：切换到任意已注册主题后，当前主题应等于目标主题", async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(themeIdArbitrary, { minLength: 2, maxLength: 5 }),
					fc.nat(),
					async (themeIds, targetIndex) => {
						const uniqueIds = [...new Set(themeIds)];
						fc.pre(uniqueIds.length >= 2);

						const testRegistry = createThemeRegistry();
						uniqueIds.forEach((id) => {
							testRegistry.register(createMockTheme(id));
						});

						const manager = createThemeManager({
							registry: testRegistry,
							defaultTheme: uniqueIds[0],
						});
						manager.initialize();

						const targetId = uniqueIds[targetIndex % uniqueIds.length];
						await manager.switchTheme(targetId);

						expect(manager.getCurrentTheme()).toBe(targetId);
					},
				),
				{ numRuns: 50 },
			);
		});

		test("切换到同一主题应保持状态不变", async () => {
			const theme = createMockTheme("same-theme");
			registry.register(theme);

			const manager = createThemeManager({
				registry,
				defaultTheme: "same-theme",
			});
			manager.initialize();

			await manager.switchTheme("same-theme");
			await manager.switchTheme("same-theme");

			expect(manager.getCurrentTheme()).toBe("same-theme");
		});
	});

	/**
	 * Property 12: CSS 动态更新
	 * **Feature: vitepress-theme-switcher, Property 12: CSS 动态更新**
	 * **Validates: Requirements 5.2**
	 */
	describe("Property 12: CSS 动态更新", () => {
		test("切换主题时应添加新主题的 CSS 类", async () => {
			// 创建新的 registry 和 mock
			const testRegistry = createThemeRegistry();
			const theme1 = createMockTheme("theme1");
			const theme2 = createMockTheme("theme2");
			testRegistry.register(theme1);
			testRegistry.register(theme2);

			const addClassMock = vi.fn();
			const removeClassMock = vi.fn();

			// @ts-ignore - 在创建 manager 之前设置 mock
			globalThis.document = {
				documentElement: {
					classList: { add: addClassMock, remove: removeClassMock },
					style: { setProperty: vi.fn(), removeProperty: vi.fn() },
				},
				querySelectorAll: vi.fn(() => []),
			};

			const manager = createThemeManager({
				registry: testRegistry,
				defaultTheme: "theme1",
			});
			manager.initialize();

			await manager.switchTheme("theme2");

			expect(removeClassMock).toHaveBeenCalledWith("theme1-theme");
			expect(addClassMock).toHaveBeenCalledWith("theme2-theme");
		});

		test("切换主题时应调用旧主题的清理函数", async () => {
			const cleanupMock = vi.fn();
			const theme1: ThemeDefinition = {
				id: "theme1",
				name: "Theme 1",
				theme: {} as any,
				cleanup: cleanupMock,
			};
			const theme2 = createMockTheme("theme2");

			registry.register(theme1);
			registry.register(theme2);

			const manager = createThemeManager({
				registry,
				defaultTheme: "theme1",
			});
			manager.initialize();

			await manager.switchTheme("theme2");

			expect(cleanupMock).toHaveBeenCalled();
		});

		test("切换主题时应注入 CSS 变量", async () => {
			// 创建新的 registry 和 mock
			const testRegistry = createThemeRegistry();
			const setPropertyMock = vi.fn();

			// @ts-ignore - 在创建 manager 之前设置 mock
			globalThis.document = {
				documentElement: {
					classList: { add: vi.fn(), remove: vi.fn() },
					style: { setProperty: setPropertyMock, removeProperty: vi.fn() },
				},
				querySelectorAll: vi.fn(() => []),
			};

			const theme1 = createMockTheme("theme1");
			const theme2: ThemeDefinition = {
				id: "theme2",
				name: "Theme 2",
				theme: {} as any,
				cssVars: {
					"--primary-color": "#ff0000",
					"--secondary-color": "#00ff00",
				},
			};

			testRegistry.register(theme1);
			testRegistry.register(theme2);

			const manager = createThemeManager({
				registry: testRegistry,
				defaultTheme: "theme1",
			});
			manager.initialize();

			await manager.switchTheme("theme2");

			expect(setPropertyMock).toHaveBeenCalledWith("--primary-color", "#ff0000");
			expect(setPropertyMock).toHaveBeenCalledWith("--secondary-color", "#00ff00");
		});
	});

	describe("持久化集成", () => {
		test("切换主题后应保存到持久化存储", async () => {
			const theme1 = createMockTheme("theme1");
			const theme2 = createMockTheme("theme2");
			registry.register(theme1);
			registry.register(theme2);

			const persistence = createThemePersistence();
			const manager = createThemeManager({
				registry,
				persistence,
				defaultTheme: "theme1",
			});
			manager.initialize();

			await manager.switchTheme("theme2");

			expect(persistence.load()).toBe("theme2");
		});

		test("初始化时应从持久化存储恢复主题", () => {
			const theme1 = createMockTheme("theme1");
			const theme2 = createMockTheme("theme2");
			registry.register(theme1);
			registry.register(theme2);

			const persistence = createThemePersistence();
			persistence.save("theme2");

			const manager = createThemeManager({
				registry,
				persistence,
				defaultTheme: "theme1",
			});
			manager.initialize();

			expect(manager.getCurrentTheme()).toBe("theme2");
		});
	});
});
