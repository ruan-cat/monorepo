/**
 * ThemePersistence 属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证 ThemePersistence 的核心行为
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { ThemePersistence, createThemePersistence, DEFAULT_STORAGE_KEY } from "../persistence";

/**
 * 生成有效的主题 ID
 * @description
 * 生成非空字符串作为主题 ID
 */
const themeIdArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/**
 * 模拟 localStorage
 */
function createMockLocalStorage() {
	const store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			Object.keys(store).forEach((key) => delete store[key]);
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
		_store: store,
	};
}

describe("ThemePersistence", () => {
	let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;
	let originalWindow: typeof globalThis.window;

	beforeEach(() => {
		mockLocalStorage = createMockLocalStorage();

		// 模拟 window.localStorage
		originalWindow = globalThis.window;
		// @ts-ignore
		globalThis.window = {
			localStorage: mockLocalStorage,
		};
	});

	afterEach(() => {
		// @ts-ignore
		globalThis.window = originalWindow;
		vi.clearAllMocks();
	});

	describe("基础功能测试", () => {
		test("应使用默认存储键", () => {
			const persistence = createThemePersistence();
			expect(persistence.getStorageKey()).toBe(DEFAULT_STORAGE_KEY);
		});

		test("应使用自定义存储键", () => {
			const customKey = "my-custom-key";
			const persistence = createThemePersistence(customKey);
			expect(persistence.getStorageKey()).toBe(customKey);
		});

		test("保存和加载主题 ID", () => {
			const persistence = createThemePersistence();
			const themeId = "test-theme";

			persistence.save(themeId);
			const loaded = persistence.load();

			expect(loaded).toBe(themeId);
		});

		test("清除后应返回 null", () => {
			const persistence = createThemePersistence();
			persistence.save("test-theme");
			persistence.clear();

			expect(persistence.load()).toBeNull();
		});

		test("未保存时应返回 null", () => {
			const persistence = createThemePersistence();
			expect(persistence.load()).toBeNull();
		});
	});

	/**
	 * Property 3: 主题持久化往返
	 * @description
	 * *对于任意*有效主题 ID，将其保存到持久化存储然后加载回来 SHALL 返回相同的主题 ID。
	 * **Feature: vitepress-theme-switcher, Property 3: 主题持久化往返**
	 * **Validates: Requirements 1.4**
	 */
	describe("Property 3: 主题持久化往返", () => {
		test("对于任意有效主题 ID，保存后加载应返回相同的 ID", () => {
			fc.assert(
				fc.property(themeIdArbitrary, (themeId) => {
					// 每次测试使用新的 mock
					const testStore: Record<string, string> = {};
					const testMockStorage = {
						getItem: (key: string) => testStore[key] ?? null,
						setItem: (key: string, value: string) => {
							testStore[key] = value;
						},
						removeItem: (key: string) => {
							delete testStore[key];
						},
						clear: () => {
							Object.keys(testStore).forEach((key) => delete testStore[key]);
						},
						length: 0,
						key: () => null,
					};

					// @ts-ignore
					globalThis.window = { localStorage: testMockStorage };

					const persistence = createThemePersistence();

					// 保存主题 ID
					persistence.save(themeId);

					// 加载并验证
					const loaded = persistence.load();

					expect(loaded).toBe(themeId);
				}),
				{ numRuns: 100 },
			);
		});

		test("使用不同存储键的持久化实例应相互独立", () => {
			fc.assert(
				fc.property(themeIdArbitrary, themeIdArbitrary, fc.string({ minLength: 1 }), (id1, id2, keySuffix) => {
					// 确保两个 ID 不同
					fc.pre(id1 !== id2);

					const testStore: Record<string, string> = {};
					const testMockStorage = {
						getItem: (key: string) => testStore[key] ?? null,
						setItem: (key: string, value: string) => {
							testStore[key] = value;
						},
						removeItem: (key: string) => {
							delete testStore[key];
						},
						clear: () => {},
						length: 0,
						key: () => null,
					};

					// @ts-ignore
					globalThis.window = { localStorage: testMockStorage };

					const persistence1 = createThemePersistence("key1-" + keySuffix);
					const persistence2 = createThemePersistence("key2-" + keySuffix);

					persistence1.save(id1);
					persistence2.save(id2);

					// 各自加载应返回各自保存的值
					expect(persistence1.load()).toBe(id1);
					expect(persistence2.load()).toBe(id2);
				}),
				{ numRuns: 100 },
			);
		});

		test("多次保存应覆盖之前的值", () => {
			fc.assert(
				fc.property(themeIdArbitrary, themeIdArbitrary, (firstId, secondId) => {
					const testStore: Record<string, string> = {};
					const testMockStorage = {
						getItem: (key: string) => testStore[key] ?? null,
						setItem: (key: string, value: string) => {
							testStore[key] = value;
						},
						removeItem: (key: string) => {
							delete testStore[key];
						},
						clear: () => {},
						length: 0,
						key: () => null,
					};

					// @ts-ignore
					globalThis.window = { localStorage: testMockStorage };

					const persistence = createThemePersistence();

					// 保存第一个 ID
					persistence.save(firstId);
					// 保存第二个 ID（覆盖）
					persistence.save(secondId);

					// 应返回最后保存的值
					expect(persistence.load()).toBe(secondId);
				}),
				{ numRuns: 100 },
			);
		});
	});

	describe("错误处理", () => {
		test("localStorage 不可用时 save 不应抛出错误", () => {
			// @ts-ignore
			globalThis.window = undefined;

			const persistence = createThemePersistence();
			expect(() => persistence.save("test")).not.toThrow();
		});

		test("localStorage 不可用时 load 应返回 null", () => {
			// @ts-ignore
			globalThis.window = undefined;

			const persistence = createThemePersistence();
			expect(persistence.load()).toBeNull();
		});

		test("无效的存储数据应返回 null 并清除", () => {
			mockLocalStorage._store[DEFAULT_STORAGE_KEY] = "invalid json";

			const persistence = createThemePersistence();
			const result = persistence.load();

			expect(result).toBeNull();
			expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(DEFAULT_STORAGE_KEY);
		});

		test("缺少必要字段的数据应返回 null", () => {
			mockLocalStorage._store[DEFAULT_STORAGE_KEY] = JSON.stringify({ themeId: "" });

			const persistence = createThemePersistence();
			expect(persistence.load()).toBeNull();
		});
	});
});
