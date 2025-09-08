import { type DefaultTheme, type UserConfig } from "vitepress";
import { defineTeekConfig } from "vitepress-theme-teek/config";
import { merge, cloneDeep } from "lodash-es";

import type { TeekConfigOptions, ExtraConfig } from "../types";

/**
 * 默认的 Teek 主题配置
 * @see https://vp.teek.top/reference/config.html
 */
export const defaultTeekConfig: TeekConfigOptions = {
	/**
	 * 启用侧边栏展开/折叠触发器
	 * @see https://vp.teek.top/reference/config/global-config.html#sidebartrigger
	 */
	sidebarTrigger: true,

	/**
	 * 关闭 Teek 主题的首页风格
	 * @see https://vp.teek.top/reference/config/global-config.html#teekhome
	 */
	teekHome: false,

	/**
	 * 启用新版代码块
	 * @see https://vp.teek.top/reference/config/global-config.html#codeblock
	 */
	codeBlock: {
		enabled: true, // 是否启用新版代码块
		collapseHeight: 700, // 超出高度后自动折叠，设置 true 则默认折叠，false 则默认不折叠
		overlay: true, // 代码块底部是否显示展开/折叠遮罩层
		overlayHeight: 400, // 当出现遮罩层时，指定代码块显示高度，当 overlay 为 true 时生效
		langTextTransform: "lowercase", // 语言文本显示样式，为 text-transform 的值:none, capitalize, lowercase, uppercase
		copiedDone: (TkMessage) => TkMessage.success("复制成功！"), // 复制代码完成后的回调
	},

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
	userConfig.extends = defineTeekConfig(merge({}, cloneDeep(defaultTeekConfig), teekConfig));
}
