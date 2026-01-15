/**
 * VitePress 主题切换器模块
 * @description
 * 提供运行时主题切换功能，支持在导航栏通过按钮切换不同的 VitePress 主题
 * @module theme-switcher
 */

// 核心模块导出
export * from "./registry";
export * from "./persistence";
export * from "./manager";
export * from "./style-manager";

// 适配器导出
export * from "./adapters";

// 组件导出
export { default as ThemeSwitcherButton } from "./components/ThemeSwitcherButton.vue";
export { default as ThemeSwitcherNav } from "./components/ThemeSwitcherNav.vue";
export { default as DynamicLayout } from "./components/DynamicLayout.vue";

// 组合式函数导出
export * from "./composables/useThemeSwitcher";
