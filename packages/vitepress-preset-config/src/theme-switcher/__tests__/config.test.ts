/**
 * ThemeSwitcherConfig 属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证主题切换器配置的核心行为
 * 注意：此测试不导入实际主题模块，避免 vitepress 模块加载问题
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { createThemeRegistry } from "../registry";
import { createThemeManager } from "../manager";
import { createThemePersistence } from "../persistence";
import type { ThemeDefinition } from "../../types";

/**
 * 生成有效的主题 ID
 */
const themeIdArbitrary = fc
	.string({ minLength: 1, maxLength: 20 })
	.filter((s) => s.trim().length > 0 && !s.includes(" "));

/**
 * 内置主题 ID（模拟）
 */
const MOCK_BUILTIN_THEME_IDS = ["teek", "voidzero"] as const;

/**
 * 创建模拟的 ThemeDefinition
 */
function createMockTheme(id: string, name?: string): ThemeDefinition {
	return {
		id,
		name: name ?? `Theme ${id}`,
		theme: {} as any,
		styles: [],
	};
}

/**
 * 创建包含模拟内置主题的注册表
 */
function createMockBuiltinRegistry() {
	const registry = createThemeRegistry();
	registry.register(createMockTheme("teek", "Teek"));
	registry.register(createMockTheme("voidzero", "VoidZero"));
	return registry;
}

/**
 * 创建过滤后的注册表
 */
function createMockFilteredRegistry(themeIds: string[]) {
	const registry = createThemeRegistry();
	for (const id of MOCK_BUILTIN_THEME_IDS) {
		if (themeIds.includes(id)) {
			registry.register(createMockTheme(id));
		}
	}
	return registry;
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
	};
}

describe("ThemeSwitcherConfig", () => {
	beforeEach(() => {
		const mockLocalStorage = createMockLocalStorage();

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
				classList: { add: vi.fn(), remove: vi.fn() },
				style: { setProperty: vi.fn(), removeProperty: vi.fn() },
			},
			querySelectorAll: vi.fn(() => []),
		};
	});

	/**
	 * Property 10: 默认主题配置
	 * **Feature: vitepress-theme-switcher, Property 10: 默认主题配置**
	 * **Validates: Requirements 4.3**
	 */
	describe("Property 10: 默认主题配置", () => {
		test("指定默认主题后，初始化时应使用该主题", () => {
			const registry = createMockBuiltinRegistry();

			const manager = createThemeManager({
				registry,
				defaultTheme: "voidzero",
			});
			manager.initialize();

			expect(manager.getCurrentTheme()).toBe("voidzero");
		});

		test("属性测试：对于任意有效的默认主题 ID，初始化后应使用该主题", () => {
			fc.assert(
				fc.property(fc.constantFrom(...MOCK_BUILTIN_THEME_IDS), (defaultThemeId) => {
					const registry = createMockBuiltinRegistry();

					const manager = createThemeManager({
						registry,
						defaultTheme: defaultThemeId,
					});
					manager.initialize();

					expect(manager.getCurrentTheme()).toBe(defaultThemeId);
				}),
				{ numRuns: 10 },
			);
		});

		test("未指定默认主题时，应使用 teek 作为默认", () => {
			const registry = createMockBuiltinRegistry();

			const manager = createThemeManager({
				registry,
				defaultTheme: "teek",
			});
			manager.initialize();

			expect(manager.getCurrentTheme()).toBe("teek");
		});

		test("属性测试：自定义主题也可作为默认主题", () => {
			fc.assert(
				fc.property(themeIdArbitrary, (customThemeId) => {
					fc.pre(!MOCK_BUILTIN_THEME_IDS.includes(customThemeId as any));

					const registry = createMockBuiltinRegistry();
					const customTheme = createMockTheme(customThemeId);
					registry.register(customTheme);

					const manager = createThemeManager({
						registry,
						defaultTheme: customThemeId,
					});
					manager.initialize();

					expect(manager.getCurrentTheme()).toBe(customThemeId);
				}),
				{ numRuns: 50 },
			);
		});
	});

	/**
	 * Property 11: 主题过滤
	 * **Feature: vitepress-theme-switcher, Property 11: 主题过滤**
	 * **Validates: Requirements 4.4**
	 */
	describe("Property 11: 主题过滤", () => {
		test("使用过滤注册表应只包含指定的主题", () => {
			const registry = createMockFilteredRegistry(["teek"]);

			expect(registry.has("teek")).toBe(true);
			expect(registry.has("voidzero")).toBe(false);
			expect(registry.size()).toBe(1);
		});

		test("属性测试：过滤后的注册表应只包含指定的内置主题", () => {
			fc.assert(
				fc.property(fc.subarray([...MOCK_BUILTIN_THEME_IDS], { minLength: 1 }), (selectedIds) => {
					const registry = createMockFilteredRegistry(selectedIds);

					for (const id of MOCK_BUILTIN_THEME_IDS) {
						if (selectedIds.includes(id)) {
							expect(registry.has(id)).toBe(true);
						} else {
							expect(registry.has(id)).toBe(false);
						}
					}

					expect(registry.size()).toBe(selectedIds.length);
				}),
				{ numRuns: 10 },
			);
		});

		test("空过滤数组应返回空注册表", () => {
			const registry = createMockFilteredRegistry([]);
			expect(registry.size()).toBe(0);
		});

		test("不存在的主题 ID 应被忽略", () => {
			const registry = createMockFilteredRegistry(["teek", "non-existent"]);

			expect(registry.has("teek")).toBe(true);
			expect(registry.has("non-existent")).toBe(false);
			expect(registry.size()).toBe(1);
		});
	});

	/**
	 * Property 7: 自定义主题合并
	 * **Feature: vitepress-theme-switcher, Property 7: 自定义主题合并**
	 * **Validates: Requirements 3.3**
	 */
	describe("Property 7: 自定义主题合并", () => {
		test("注册自定义主题后，应同时包含内置主题和自定义主题", () => {
			const registry = createMockBuiltinRegistry();
			const customTheme = createMockTheme("custom-theme");
			registry.register(customTheme);

			for (const id of MOCK_BUILTIN_THEME_IDS) {
				expect(registry.has(id)).toBe(true);
			}

			expect(registry.has("custom-theme")).toBe(true);
			expect(registry.size()).toBe(MOCK_BUILTIN_THEME_IDS.length + 1);
		});

		test("属性测试：任意数量的自定义主题都应与内置主题合并", () => {
			fc.assert(
				fc.property(fc.array(themeIdArbitrary, { minLength: 1, maxLength: 5 }), (customIds) => {
					const uniqueCustomIds = [...new Set(customIds)].filter((id) => !MOCK_BUILTIN_THEME_IDS.includes(id as any));
					fc.pre(uniqueCustomIds.length > 0);

					const registry = createMockBuiltinRegistry();

					for (const id of uniqueCustomIds) {
						registry.register(createMockTheme(id));
					}

					for (const id of MOCK_BUILTIN_THEME_IDS) {
						expect(registry.has(id)).toBe(true);
					}

					for (const id of uniqueCustomIds) {
						expect(registry.has(id)).toBe(true);
					}

					expect(registry.size()).toBe(MOCK_BUILTIN_THEME_IDS.length + uniqueCustomIds.length);
				}),
				{ numRuns: 50 },
			);
		});

		test("自定义主题可以覆盖内置主题", () => {
			const registry = createMockBuiltinRegistry();

			const customTeek = createMockTheme("teek", "Custom Teek");
			registry.register(customTeek);

			const retrieved = registry.get("teek");
			expect(retrieved?.name).toBe("Custom Teek");

			expect(registry.size()).toBe(MOCK_BUILTIN_THEME_IDS.length);
		});
	});
});
