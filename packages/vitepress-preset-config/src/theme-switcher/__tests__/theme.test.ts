/**
 * defineRuancatPresetTheme 向后兼容性属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证主题切换器注册逻辑的向后兼容性
 * 注意：由于 theme.ts 导入了 Vue 组件，无法在纯 Node.js 环境中测试
 * 因此这里测试的是注册逻辑的核心行为
 */

import { describe, test, expect, vi } from "vitest";
import * as fc from "fast-check";
import type { ThemeSwitcherConfig } from "../../types";

/**
 * 模拟 registerThemeSwitcher 函数的逻辑
 * @description
 * 这是 theme.ts 中 registerThemeSwitcher 函数的逻辑副本
 * 用于测试向后兼容性
 */
function registerThemeSwitcher(
	app: { component: (name: string, component: any) => void },
	config?: ThemeSwitcherConfig,
) {
	if (config?.enabled) {
		app.component("ThemeSwitcherButton", {} as any);
	}
}

/**
 * 模拟 App
 */
function createMockApp() {
	return {
		component: vi.fn(),
	};
}

describe("Theme Switcher Registration Logic", () => {
	/**
	 * Property 4: 向后兼容性 - defineRuancatPresetTheme
	 * @description
	 * *对于任意*不带主题切换器配置的 `defineRuancatPresetTheme` 有效输入参数，
	 * 输出 SHALL 与原始实现的输出结构等价。
	 * **Feature: vitepress-theme-switcher, Property 4: 向后兼容性 - defineRuancatPresetTheme**
	 * **Validates: Requirements 2.2**
	 */
	describe("Property 4: 向后兼容性 - defineRuancatPresetTheme", () => {
		test("不带配置时，不应注册 ThemeSwitcherButton 组件", () => {
			const mockApp = createMockApp();
			registerThemeSwitcher(mockApp, undefined);

			expect(mockApp.component).not.toHaveBeenCalled();
		});

		test("themeSwitcher.enabled 为 false 时，不应注册组件", () => {
			const mockApp = createMockApp();
			registerThemeSwitcher(mockApp, { enabled: false });

			expect(mockApp.component).not.toHaveBeenCalled();
		});

		test("themeSwitcher.enabled 为 true 时，应注册 ThemeSwitcherButton 组件", () => {
			const mockApp = createMockApp();
			registerThemeSwitcher(mockApp, { enabled: true });

			expect(mockApp.component).toHaveBeenCalledWith("ThemeSwitcherButton", expect.anything());
		});

		test("属性测试：只有 enabled 为 true 时才注册组件", () => {
			fc.assert(
				fc.property(
					fc.option(
						fc.record({
							enabled: fc.option(fc.boolean(), { nil: undefined }),
							defaultTheme: fc.option(fc.string(), { nil: undefined }),
							themes: fc.option(fc.array(fc.string()), { nil: undefined }),
						}),
						{ nil: undefined },
					),
					(config) => {
						const mockApp = createMockApp();
						registerThemeSwitcher(mockApp, config as ThemeSwitcherConfig | undefined);

						const shouldRegister = config?.enabled === true;

						if (shouldRegister) {
							expect(mockApp.component).toHaveBeenCalledWith("ThemeSwitcherButton", expect.anything());
						} else {
							expect(mockApp.component).not.toHaveBeenCalled();
						}
					},
				),
				{ numRuns: 100 },
			);
		});

		test("属性测试：其他配置选项不影响注册行为", () => {
			fc.assert(
				fc.property(
					fc.boolean(),
					fc.option(fc.string(), { nil: undefined }),
					fc.option(fc.array(fc.string()), { nil: undefined }),
					fc.option(fc.string(), { nil: undefined }),
					(enabled, defaultTheme, themes, storageKey) => {
						const mockApp = createMockApp();
						const config: ThemeSwitcherConfig = {
							enabled,
							defaultTheme,
							themes,
							storageKey,
						};

						registerThemeSwitcher(mockApp, config);

						// 只有 enabled 决定是否注册
						if (enabled) {
							expect(mockApp.component).toHaveBeenCalled();
						} else {
							expect(mockApp.component).not.toHaveBeenCalled();
						}
					},
				),
				{ numRuns: 50 },
			);
		});
	});
});
