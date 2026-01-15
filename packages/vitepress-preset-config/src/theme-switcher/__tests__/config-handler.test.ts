/**
 * setUserConfig 向后兼容性属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证 handleThemeSwitcher 的向后兼容性
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
	handleThemeSwitcher,
	mergeThemeSwitcherConfig,
	getThemeSwitcherConfig,
	defaultThemeSwitcherConfig,
} from "../../config/theme-switcher";
import type { ThemeSwitcherConfig, ExtraConfig } from "../../types";

describe("Theme Switcher Config Handler", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("mergeThemeSwitcherConfig", () => {
		test("不带参数时应返回默认配置", () => {
			const config = mergeThemeSwitcherConfig();

			expect(config.enabled).toBe(false);
			expect(config.defaultTheme).toBe("teek");
			expect(config.storageKey).toBe("vitepress-theme");
		});

		test("用户配置应覆盖默认配置", () => {
			const userConfig: ThemeSwitcherConfig = {
				enabled: true,
				defaultTheme: "voidzero",
			};

			const config = mergeThemeSwitcherConfig(userConfig);

			expect(config.enabled).toBe(true);
			expect(config.defaultTheme).toBe("voidzero");
			expect(config.storageKey).toBe("vitepress-theme"); // 保持默认值
		});
	});

	describe("getThemeSwitcherConfig", () => {
		test("不带 extraConfig 时应返回默认配置", () => {
			const config = getThemeSwitcherConfig();

			expect(config).toEqual(defaultThemeSwitcherConfig);
		});

		test("extraConfig 不含 themeSwitcher 时应返回默认配置", () => {
			const config = getThemeSwitcherConfig({});

			expect(config).toEqual(defaultThemeSwitcherConfig);
		});
	});

	/**
	 * Property 5: 向后兼容性 - setUserConfig
	 * @description
	 * *对于任意*不带主题切换器配置的 `setUserConfig` 有效输入参数，
	 * 输出 SHALL 与原始实现的输出结构等价。
	 * **Feature: vitepress-theme-switcher, Property 5: 向后兼容性 - setUserConfig**
	 * **Validates: Requirements 2.3**
	 */
	describe("Property 5: 向后兼容性 - setUserConfig", () => {
		test("handleThemeSwitcher 不带 extraConfig 时不应修改 resUserConfig", () => {
			const resUserConfig = { title: "Test" };
			const originalConfig = { ...resUserConfig };

			handleThemeSwitcher(resUserConfig as any, undefined);

			expect(resUserConfig).toEqual(originalConfig);
		});

		test("handleThemeSwitcher 带空 extraConfig 时不应修改 resUserConfig", () => {
			const resUserConfig = { title: "Test" };
			const originalConfig = { ...resUserConfig };

			handleThemeSwitcher(resUserConfig as any, {});

			expect(resUserConfig).toEqual(originalConfig);
		});

		test("handleThemeSwitcher 带 themeSwitcher.enabled=false 时不应修改 resUserConfig", () => {
			const resUserConfig = { title: "Test" };
			const originalConfig = { ...resUserConfig };

			handleThemeSwitcher(resUserConfig as any, {
				themeSwitcher: { enabled: false },
			});

			expect(resUserConfig).toEqual(originalConfig);
		});

		test("属性测试：不带 themeSwitcher 或 enabled=false 时，配置不变", () => {
			fc.assert(
				fc.property(
					fc.record({
						title: fc.option(fc.string(), { nil: undefined }),
						description: fc.option(fc.string(), { nil: undefined }),
					}),
					fc.option(
						fc.record({
							enabled: fc.constant(false),
						}),
						{ nil: undefined },
					),
					(baseConfig, themeSwitcher) => {
						const resUserConfig = { ...baseConfig };
						const originalConfig = { ...resUserConfig };

						const extraConfig: ExtraConfig | undefined = themeSwitcher ? { themeSwitcher } : undefined;

						handleThemeSwitcher(resUserConfig as any, extraConfig);

						// 配置应保持不变
						expect(resUserConfig).toEqual(originalConfig);
					},
				),
				{ numRuns: 50 },
			);
		});

		test("属性测试：合并配置应保留所有默认值", () => {
			fc.assert(
				fc.property(
					fc.record({
						enabled: fc.boolean(),
						defaultTheme: fc.string({ minLength: 1 }),
						themes: fc.array(fc.string()),
						storageKey: fc.string({ minLength: 1 }),
					}),
					(partialConfig) => {
						const config = mergeThemeSwitcherConfig(partialConfig as ThemeSwitcherConfig);

						// 所有字段都应有值（来自用户配置或默认值）
						expect(typeof config.enabled).toBe("boolean");
						expect(typeof config.defaultTheme).toBe("string");
						expect(typeof config.storageKey).toBe("string");

						// 用户提供的值应被保留
						expect(config.enabled).toBe(partialConfig.enabled);
						expect(config.defaultTheme).toBe(partialConfig.defaultTheme);
						expect(config.storageKey).toBe(partialConfig.storageKey);
					},
				),
				{ numRuns: 100 },
			);
		});

		test("属性测试：getThemeSwitcherConfig 应正确提取配置", () => {
			fc.assert(
				fc.property(
					fc.option(
						fc.record({
							themeSwitcher: fc.option(
								fc.record({
									enabled: fc.boolean(),
									defaultTheme: fc.string({ minLength: 1 }),
								}),
								{ nil: undefined },
							),
						}),
						{ nil: undefined },
					),
					(extraConfig) => {
						const config = getThemeSwitcherConfig(extraConfig as ExtraConfig | undefined);

						// 应始终返回有效配置
						expect(config).toBeDefined();
						// enabled 应该是布尔值（来自用户配置或默认值 false）
						expect(typeof config.enabled).toBe("boolean");
						// defaultTheme 应该是字符串
						expect(typeof config.defaultTheme).toBe("string");
						// storageKey 应该是字符串
						expect(typeof config.storageKey).toBe("string");
					},
				),
				{ numRuns: 50 },
			);
		});
	});
});
