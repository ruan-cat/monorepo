/**
 * 样式管理器
 * @description
 * 提供动态加载和卸载 CSS 样式的工具函数
 * 用于实现主题切换时的样式隔离
 * @module theme-switcher/style-manager
 */

/**
 * 已加载的样式记录
 * @description
 * 记录每个主题已加载的样式元素，便于卸载时移除
 */
const loadedStyles = new Map<string, HTMLStyleElement[]>();

/**
 * 样式加载状态
 * @description
 * 记录每个主题的样式是否已加载，避免重复加载
 */
const styleLoadStatus = new Map<string, boolean>();

/**
 * 创建样式元素并注入到 DOM
 * @description
 * 将 CSS 文本内容注入到 head 中
 * @param cssText - CSS 文本内容
 * @param themeId - 主题 ID，用于标记样式元素
 * @param styleIndex - 样式索引，用于区分同一主题的多个样式
 * @returns 创建的 style 元素
 */
export function injectStyle(cssText: string, themeId: string, styleIndex: number): HTMLStyleElement | null {
	if (typeof document === "undefined") {
		return null;
	}

	const style = document.createElement("style");
	style.setAttribute("data-theme-id", themeId);
	style.setAttribute("data-style-index", String(styleIndex));
	style.textContent = cssText;

	document.head.appendChild(style);

	// 记录已加载的样式
	const existing = loadedStyles.get(themeId) || [];
	existing.push(style);
	loadedStyles.set(themeId, existing);

	return style;
}

/**
 * 移除指定主题的所有样式
 * @description
 * 从 DOM 中移除该主题注入的所有样式元素
 * @param themeId - 主题 ID
 */
export function removeStyles(themeId: string): void {
	if (typeof document === "undefined") {
		return;
	}

	// 方式 1：从记录中移除
	const styles = loadedStyles.get(themeId);
	if (styles) {
		styles.forEach((style) => {
			if (style.parentNode) {
				style.parentNode.removeChild(style);
			}
		});
		loadedStyles.delete(themeId);
	}

	// 方式 2：通过 data 属性查找并移除（兜底）
	const styleElements = document.querySelectorAll(`style[data-theme-id="${themeId}"]`);
	styleElements.forEach((el) => {
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	});

	// 重置加载状态
	styleLoadStatus.set(themeId, false);
}

/**
 * 检查主题样式是否已加载
 * @param themeId - 主题 ID
 * @returns 是否已加载
 */
export function isStyleLoaded(themeId: string): boolean {
	return styleLoadStatus.get(themeId) === true;
}

/**
 * 标记主题样式已加载
 * @param themeId - 主题 ID
 */
export function markStyleLoaded(themeId: string): void {
	styleLoadStatus.set(themeId, true);
}

/**
 * 移除所有主题样式
 * @description
 * 清理所有已加载的主题样式，用于完全重置
 */
export function removeAllThemeStyles(): void {
	if (typeof document === "undefined") {
		return;
	}

	// 移除所有记录的样式
	loadedStyles.forEach((styles, themeId) => {
		styles.forEach((style) => {
			if (style.parentNode) {
				style.parentNode.removeChild(style);
			}
		});
	});
	loadedStyles.clear();
	styleLoadStatus.clear();

	// 兜底：移除所有带 data-theme-id 属性的样式
	const allThemeStyles = document.querySelectorAll("style[data-theme-id]");
	allThemeStyles.forEach((el) => {
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	});
}

/**
 * 获取已加载的样式数量
 * @param themeId - 主题 ID
 * @returns 样式数量
 */
export function getLoadedStyleCount(themeId: string): number {
	return loadedStyles.get(themeId)?.length || 0;
}
