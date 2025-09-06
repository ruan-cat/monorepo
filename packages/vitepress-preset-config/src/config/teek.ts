import { type DefaultTheme, type UserConfig } from "vitepress";
import type { TeekConfigOptions, ExtraConfig } from "../types";
import { merge, cloneDeep } from "lodash-es";

/**
 * 默认的 Teek 主题配置
 * @see https://vp.teek.top/reference/config.html
 */
export const defaultTeekConfig: TeekConfigOptions = {
	/** @see https://vp.teek.top/reference/config/global-config.html#sidebartrigger */
	sidebarTrigger: true,

	/**
	 * 关闭 Teek 主题的首页风格
	 * @see https://vp.teek.top/reference/config/global-config.html#teekhome
	 */
	teekHome: false,

	vitePlugins: {
		/**
		 * 关闭 vitepress-plugin-permalink 插件
		 * @see https://vp.teek.top/guide/plugins.html#vitepress-plugin-permalink
		 */
		permalink: false,

		/**
		 * 关闭 vitepress-plugin-sidebar-resolve 插件
		 * @see https://vp.teek.top/guide/plugins.html#vitepress-plugin-sidebar-resolve
		 */
		sidebar: false,

		/**
		 * 关闭 vitepress-plugin-md-h1 插件
		 * @see https://vp.teek.top/guide/plugins.html#vitepress-plugin-md-h1
		 */
		mdH1: false,
	},

	/** @see https://vp.teek.top/reference/article-config.html#articleshare */
	articleShare: {
		enabled: true, // 是否开启文章链接分享功能
		text: "分享此页面", // 分享按钮文本
		copiedText: "链接已复制", // 复制成功文本
		query: false, // 是否包含查询参数
		hash: false, // 是否包含哈希值
	},
};

/**
 * 根据用户的额外配置 设置`文档配置`的 teek 主题配置
 * @description
 */
export function handleTeekConfig(userConfig: UserConfig<DefaultTheme.Config>, extraConfig?: ExtraConfig) {
	const { teekConfig = defaultTeekConfig } = extraConfig ?? {};

	// @ts-ignore
	userConfig.extends = merge({}, cloneDeep(defaultTeekConfig), teekConfig);
}
