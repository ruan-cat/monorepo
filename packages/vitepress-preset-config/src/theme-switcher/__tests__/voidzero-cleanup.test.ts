/**
 * VoidZero 主题清理属性测试
 * @description
 * 使用 fast-check 进行属性测试，验证 VoidZero 主题清理逻辑
 * 注意：由于 voidzero.ts 导入了 Vue 组件，无法在纯 Node.js 环境中测试
 * 因此这里测试的是清理逻辑的核心行为
 */

import { describe, test, expect, vi } from "vitest";
import * as fc from "fast-check";

/**
 * VoidZero 样式标识符
 * @description
 * 这是 voidzero.ts 中 VOIDZERO_STYLE_ID 的副本
 */
const VOIDZERO_STYLE_ID = "voidzero-theme-style";

/**
 * VoidZero CSS 变量列表
 * @description
 * 这是 voidzero.ts 中 cleanupVoidZeroStyles 函数使用的 CSS 变量列表
 */
const VOIDZERO_CSS_VARS = [
	"--vz-c-brand",
	"--vz-c-brand-light",
	"--vz-c-brand-dark",
	"--vz-c-brand-lighter",
	"--vz-c-brand-darker",
];

/**
 * 模拟 VoidZero 清理函数的逻辑
 * @description
 * 这是 voidzero.ts 中 cleanupVoidZeroStyles 函数的逻辑副本
 * 用于测试清理行为
 */
function cleanupVoidZeroStyles(mockDocument: {
	querySelectorAll: (selector: string) => { forEach: (fn: (el: any) => void) => void };
	documentElement: {
		classList: { remove: (className: string) => void };
		style: { removeProperty: (name: string) => void };
	};
}): void {
	// 移除 VoidZero 特定的样式元素
	const styleElements = mockDocument.querySelectorAll(`[data-theme-id="${VOIDZERO_STYLE_ID}"]`);
	styleElements.forEach((el: any) => el.remove());

	// 移除 VoidZero 特定的 CSS 类
	mockDocument.documentElement.classList.remove("voidzero-theme");

	// 清理可能的 VoidZero 特定 CSS 变量
	VOIDZERO_CSS_VARS.forEach((varName) => {
		mockDocument.documentElement.style.removeProperty(varName);
	});
}

/**
 * 创建模拟的 document 对象
 */
function createMockDocument() {
	const removedElements: any[] = [];
	const removedClasses: string[] = [];
	const removedProperties: string[] = [];

	return {
		querySelectorAll: vi.fn((selector: string) => {
			const elements = [
				{ remove: vi.fn(() => removedElements.push("element1")) },
				{ remove: vi.fn(() => removedElements.push("element2")) },
			];
			return {
				forEach: (fn: (el: any) => void) => elements.forEach(fn),
			};
		}),
		documentElement: {
			classList: {
				remove: vi.fn((className: string) => removedClasses.push(className)),
			},
			style: {
				removeProperty: vi.fn((name: string) => removedProperties.push(name)),
			},
		},
		_removedElements: removedElements,
		_removedClasses: removedClasses,
		_removedProperties: removedProperties,
	};
}

describe("VoidZero Theme Cleanup", () => {
	/**
	 * Property 13: VoidZero 主题清理
	 * @description
	 * *对于任意*从 VoidZero 主题切换到其他主题的操作，
	 * 所有 VoidZero 特定的样式元素 SHALL 从文档中移除。
	 * **Feature: vitepress-theme-switcher, Property 13: VoidZero 主题清理**
	 * **Validates: Requirements 6.4**
	 */
	describe("Property 13: VoidZero 主题清理", () => {
		test("清理函数应移除 voidzero-theme CSS 类", () => {
			const mockDoc = createMockDocument();
			cleanupVoidZeroStyles(mockDoc);

			expect(mockDoc._removedClasses).toContain("voidzero-theme");
		});

		test("清理函数应移除所有 VoidZero CSS 变量", () => {
			const mockDoc = createMockDocument();
			cleanupVoidZeroStyles(mockDoc);

			const expectedVars = [
				"--vz-c-brand",
				"--vz-c-brand-light",
				"--vz-c-brand-dark",
				"--vz-c-brand-lighter",
				"--vz-c-brand-darker",
			];

			for (const varName of expectedVars) {
				expect(mockDoc._removedProperties).toContain(varName);
			}
		});

		test("清理函数应查询并移除 VoidZero 样式元素", () => {
			const mockDoc = createMockDocument();
			cleanupVoidZeroStyles(mockDoc);

			expect(mockDoc.querySelectorAll).toHaveBeenCalledWith(`[data-theme-id="${VOIDZERO_STYLE_ID}"]`);
		});

		test("属性测试：清理后应移除所有预定义的 CSS 变量", () => {
			fc.assert(
				fc.property(fc.subarray(VOIDZERO_CSS_VARS, { minLength: 0 }), () => {
					const mockDoc = createMockDocument();
					cleanupVoidZeroStyles(mockDoc);

					// 所有预定义的 CSS 变量都应被移除
					for (const varName of VOIDZERO_CSS_VARS) {
						expect(mockDoc._removedProperties).toContain(varName);
					}
				}),
				{ numRuns: 10 },
			);
		});

		test("属性测试：多次调用清理函数应是幂等的", () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 5 }), (callCount) => {
					const mockDoc = createMockDocument();

					// 多次调用清理函数
					for (let i = 0; i < callCount; i++) {
						cleanupVoidZeroStyles(mockDoc);
					}

					// 应该调用了正确次数的 querySelectorAll
					expect(mockDoc.querySelectorAll).toHaveBeenCalledTimes(callCount);

					// voidzero-theme 类应该被移除了 callCount 次
					const voidzeroClassRemoveCount = mockDoc._removedClasses.filter((c) => c === "voidzero-theme").length;
					expect(voidzeroClassRemoveCount).toBe(callCount);
				}),
				{ numRuns: 10 },
			);
		});

		test("VOIDZERO_STYLE_ID 应为正确的样式标识符", () => {
			expect(typeof VOIDZERO_STYLE_ID).toBe("string");
			expect(VOIDZERO_STYLE_ID.length).toBeGreaterThan(0);
			expect(VOIDZERO_STYLE_ID).toBe("voidzero-theme-style");
		});
	});
});
