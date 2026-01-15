/**
 * ThemeRegistry 属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证 ThemeRegistry 的核心行为
 */

import { describe, test, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ThemeRegistry, createThemeRegistry } from "../registry";
import type { ThemeDefinition } from "../../types";

/**
 * 生成有效的主题 ID
 * @description
 * 生成非空字符串作为主题 ID
 */
const themeIdArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/**
 * 生成有效的主题名称
 */
const themeNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

/**
 * 生成模拟的 ThemeDefinition 对象
 * @description
 * 由于 Theme 对象较复杂，这里使用简化的模拟对象
 */
const themeDefinitionArbitrary = fc.record({
	id: themeIdArbitrary,
	name: themeNameArbitrary,
	description: fc.option(fc.string(), { nil: undefined }),
	// 使用空对象模拟 Theme，因为实际 Theme 对象在测试中不需要完整实现
	theme: fc.constant({} as any),
	styles: fc.option(fc.array(fc.string()), { nil: undefined }),
}) as fc.Arbitrary<ThemeDefinition>;

describe("ThemeRegistry", () => {
	let registry: ThemeRegistry;

	beforeEach(() => {
		registry = createThemeRegistry();
	});

	describe("基础功能测试", () => {
		test("新创建的注册表应该为空", () => {
			expect(registry.size()).toBe(0);
			expect(registry.getAll()).toEqual([]);
		});

		test("注册主题后应该能够获取", () => {
			const theme: ThemeDefinition = {
				id: "test-theme",
				name: "Test Theme",
				theme: {} as any,
			};
			registry.register(theme);
			expect(registry.get("test-theme")).toEqual(theme);
		});
	});

	/**
	 * Property 6: 主题注册接受性
	 * @description
	 * *对于任意*有效的 ThemeDefinition 对象，向 ThemeRegistry 注册 SHALL 成功，
	 * 且后续通过 ID 检索 SHALL 返回相同的主题定义。
	 * **Feature: vitepress-theme-switcher, Property 6: 主题注册接受性**
	 * **Validates: Requirements 3.1**
	 */
	describe("Property 6: 主题注册接受性", () => {
		test("对于任意有效的 ThemeDefinition，注册后应能通过 ID 检索到相同的定义", () => {
			fc.assert(
				fc.property(themeDefinitionArbitrary, (themeDef) => {
					const testRegistry = createThemeRegistry();

					// 注册主题
					testRegistry.register(themeDef);

					// 验证可以通过 ID 检索
					const retrieved = testRegistry.get(themeDef.id);

					// 检索到的主题应该与注册的相同
					expect(retrieved).toBeDefined();
					expect(retrieved?.id).toBe(themeDef.id);
					expect(retrieved?.name).toBe(themeDef.name);
					expect(retrieved?.description).toBe(themeDef.description);
				}),
				{ numRuns: 100 },
			);
		});

		test("注册后 has() 应返回 true", () => {
			fc.assert(
				fc.property(themeDefinitionArbitrary, (themeDef) => {
					const testRegistry = createThemeRegistry();
					testRegistry.register(themeDef);
					expect(testRegistry.has(themeDef.id)).toBe(true);
				}),
				{ numRuns: 100 },
			);
		});

		test("注册后 size() 应增加", () => {
			fc.assert(
				fc.property(themeDefinitionArbitrary, (themeDef) => {
					const testRegistry = createThemeRegistry();
					const sizeBefore = testRegistry.size();
					testRegistry.register(themeDef);
					expect(testRegistry.size()).toBe(sizeBefore + 1);
				}),
				{ numRuns: 100 },
			);
		});
	});

	/**
	 * Property 8: 主题覆盖行为
	 * @description
	 * *对于任意*注册两次的主题 ID，ThemeRegistry 在查询时 SHALL 返回后注册的版本。
	 * **Feature: vitepress-theme-switcher, Property 8: 主题覆盖行为**
	 * **Validates: Requirements 3.4**
	 */
	describe("Property 8: 主题覆盖行为", () => {
		test("对于相同 ID 注册两次，应返回后注册的版本", () => {
			fc.assert(
				fc.property(themeIdArbitrary, themeNameArbitrary, themeNameArbitrary, (id, firstName, secondName) => {
					// 确保两个名称不同以便区分
					fc.pre(firstName !== secondName);

					const testRegistry = createThemeRegistry();

					// 第一次注册
					const firstTheme: ThemeDefinition = {
						id,
						name: firstName,
						theme: {} as any,
					};
					testRegistry.register(firstTheme);

					// 第二次注册（相同 ID，不同名称）
					const secondTheme: ThemeDefinition = {
						id,
						name: secondName,
						theme: {} as any,
					};
					testRegistry.register(secondTheme);

					// 查询应返回第二次注册的版本
					const retrieved = testRegistry.get(id);
					expect(retrieved?.name).toBe(secondName);
				}),
				{ numRuns: 100 },
			);
		});

		test("覆盖注册不应增加主题数量", () => {
			fc.assert(
				fc.property(themeIdArbitrary, themeNameArbitrary, themeNameArbitrary, (id, firstName, secondName) => {
					const testRegistry = createThemeRegistry();

					// 第一次注册
					testRegistry.register({ id, name: firstName, theme: {} as any });
					const sizeAfterFirst = testRegistry.size();

					// 第二次注册（相同 ID）
					testRegistry.register({ id, name: secondName, theme: {} as any });
					const sizeAfterSecond = testRegistry.size();

					// 数量应该保持不变
					expect(sizeAfterSecond).toBe(sizeAfterFirst);
				}),
				{ numRuns: 100 },
			);
		});
	});

	/**
	 * Property 9: 主题查找正确性
	 * @description
	 * *对于任意*主题 ID，如果该 ID 存在于注册表中，`get(id)` SHALL 返回主题定义；
	 * 如果该 ID 不存在，`get(id)` SHALL 返回 undefined。
	 * **Feature: vitepress-theme-switcher, Property 9: 主题查找正确性**
	 * **Validates: Requirements 3.5**
	 */
	describe("Property 9: 主题查找正确性", () => {
		test("对于已注册的 ID，get() 应返回主题定义", () => {
			fc.assert(
				fc.property(themeDefinitionArbitrary, (themeDef) => {
					const testRegistry = createThemeRegistry();
					testRegistry.register(themeDef);

					const result = testRegistry.get(themeDef.id);
					expect(result).toBeDefined();
					expect(result?.id).toBe(themeDef.id);
				}),
				{ numRuns: 100 },
			);
		});

		test("对于未注册的 ID，get() 应返回 undefined", () => {
			fc.assert(
				fc.property(themeIdArbitrary, themeIdArbitrary, (registeredId, queryId) => {
					// 确保查询的 ID 与注册的 ID 不同
					fc.pre(registeredId !== queryId);

					const testRegistry = createThemeRegistry();
					testRegistry.register({
						id: registeredId,
						name: "Test",
						theme: {} as any,
					});

					// 查询不存在的 ID 应返回 undefined
					const result = testRegistry.get(queryId);
					expect(result).toBeUndefined();
				}),
				{ numRuns: 100 },
			);
		});

		test("空注册表中查询任意 ID 应返回 undefined", () => {
			fc.assert(
				fc.property(themeIdArbitrary, (id) => {
					const testRegistry = createThemeRegistry();
					expect(testRegistry.get(id)).toBeUndefined();
				}),
				{ numRuns: 100 },
			);
		});

		test("has() 与 get() 的一致性", () => {
			fc.assert(
				fc.property(themeDefinitionArbitrary, themeIdArbitrary, (themeDef, queryId) => {
					const testRegistry = createThemeRegistry();
					testRegistry.register(themeDef);

					// has() 返回 true 当且仅当 get() 返回非 undefined
					const hasResult = testRegistry.has(queryId);
					const getResult = testRegistry.get(queryId);

					if (hasResult) {
						expect(getResult).toBeDefined();
					} else {
						expect(getResult).toBeUndefined();
					}
				}),
				{ numRuns: 100 },
			);
		});
	});
});
