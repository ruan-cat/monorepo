import type { Theme, EnhanceAppContext } from "vitepress";
import { h, defineComponent, ref, onMounted, shallowRef } from "vue";

// 增加用户自定义样式（这个保留，因为是用户自定义的）
import "./style.css";

// 全局导入element-plus组件 并全局注册
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// 导入插件
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";

// @ts-ignore
import CopyOrDownloadAsMarkdownButtons from "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue";

// @ts-ignore
import { Mermaid } from "@leelaa/vitepress-plugin-extended";

// 导入主题切换器组件
import ThemeSwitcherNav from "../../../theme-switcher/components/ThemeSwitcherNav.vue";

/**
 * 获取保存的主题 ID
 */
function getSavedThemeId(): string {
	if (typeof window === "undefined" || !window.localStorage) {
		return "teek";
	}

	try {
		const stored = window.localStorage.getItem("vitepress-theme");
		if (!stored) {
			return "teek";
		}

		const data = JSON.parse(stored);
		if (data && typeof data.themeId === "string") {
			return data.themeId;
		}
	} catch {
		// 忽略解析错误
	}

	return "teek";
}

/**
 * 动态加载主题模块和样式
 * @description
 * 根据主题 ID 动态导入对应的主题模块和 CSS
 * 这样可以避免两个主题的样式同时加载导致冲突
 */
async function loadThemeModule(themeId: string): Promise<{ Layout: any; enhanceApp?: any }> {
	if (themeId === "voidzero") {
		// 动态导入 VoidZero 主题
		const [themeModule] = await Promise.all([
			import("@voidzero-dev/vitepress-theme/src/vite"),
			import("@voidzero-dev/vitepress-theme/src/styles/index.css"),
		]);

		// 添加主题类
		if (typeof document !== "undefined") {
			document.documentElement.classList.add("theme-voidzero");
			document.documentElement.classList.remove("theme-teek");
		}

		return themeModule.default || themeModule;
	} else {
		// 动态导入 Teek 主题
		const [themeModule] = await Promise.all([
			import("vitepress-theme-teek"),
			import("vitepress-theme-teek/index.css"),
			import("vitepress-theme-teek/theme-chalk/tk-doc-h1-gradient.css"),
			import("vitepress-theme-teek/theme-chalk/tk-nav-blur.css"),
			import("vitepress-theme-teek/theme-chalk/tk-scrollbar.css"),
			import("vitepress-theme-teek/theme-chalk/tk-sidebar.css"),
			import("vitepress-theme-teek/theme-chalk/tk-aside.css"),
			import("vitepress-theme-teek/theme-chalk/tk-fade-up-animation.css"),
		]);

		// 添加主题类
		if (typeof document !== "undefined") {
			document.documentElement.classList.add("theme-teek");
			document.documentElement.classList.remove("theme-voidzero");
		}

		return themeModule.default || themeModule;
	}
}

/**
 * 动态 Layout 组件
 * @description
 * 根据 localStorage 中保存的主题偏好动态渲染对应的 Layout
 */
const DynamicLayout = defineComponent({
	name: "DynamicLayout",
	setup(_, { slots }) {
		const currentThemeId = ref<string>("teek");
		const isLoaded = ref(false);
		const CurrentLayout = shallowRef<any>(null);

		onMounted(async () => {
			currentThemeId.value = getSavedThemeId();

			// 动态加载主题模块和样式
			const themeModule = await loadThemeModule(currentThemeId.value);
			CurrentLayout.value = themeModule.Layout;

			isLoaded.value = true;
		});

		return () => {
			if (!isLoaded.value || !CurrentLayout.value) {
				return h("div", { class: "dynamic-layout-loading" }, [h("div", { class: "loading-spinner" })]);
			}

			const isVoidZero = currentThemeId.value === "voidzero";

			// 根据主题选择正确的插槽名称
			const slotName = isVoidZero ? "nav-bar-title-after" : "nav-bar-content-after";

			// 渲染当前主题的 Layout，并添加主题切换按钮
			return h(CurrentLayout.value, null, {
				[slotName]: () => h(ThemeSwitcherNav, { buttonText: "切换主题" }),
				...slots,
			});
		};
	},
});

/**
 * 动态主题配置
 * @description
 * 不再在顶层静态导入主题，而是在运行时动态加载
 * 这样可以避免两个主题的样式同时加载导致冲突
 */
const theme: Theme = {
	Layout: DynamicLayout,
	async enhanceApp({ app, router, siteData }: EnhanceAppContext) {
		// 获取当前主题 ID
		const themeId = getSavedThemeId();

		// 动态加载当前主题并调用其 enhanceApp
		const themeModule = await loadThemeModule(themeId);
		if (themeModule.enhanceApp) {
			themeModule.enhanceApp({ app, router, siteData });
		}

		// 注册插件
		app.use(NolebaseGitChangelogPlugin);
		app.use(TwoslashFloatingVue);
		app.use(ElementPlus);

		// 注册全局组件
		app.component("Mermaid", Mermaid);
		app.component("CopyOrDownloadAsMarkdownButtons", CopyOrDownloadAsMarkdownButtons);
		app.component("ThemeSwitcherNav", ThemeSwitcherNav);
	},
};

export default theme;
