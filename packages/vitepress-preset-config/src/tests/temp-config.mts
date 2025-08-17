import { defineConfig } from "vitepress";
import { defineTeekConfig } from "vitepress-theme-teek/config";
import { merge, isUndefined, cloneDeep } from "lodash-es";
import { generateSidebar } from "vitepress-sidebar";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";
import llmstxt from "vitepress-plugin-llms";
import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";

/** Teek 主题配置 */
const teekConfig = defineTeekConfig({
	/** @see https://vp.teek.top/reference/config/global-config.html#sidebartrigger */
	sidebarTrigger: true,

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
});

type VitePressSidebarOptions = Parameters<typeof generateSidebar>[0];
/** 默认侧边栏配置 */
const defaultSidebarOptions: VitePressSidebarOptions = {
	// documentRootPath: "src",

	// 侧边栏需要折叠
	collapsed: true,

	// 不需要配置折叠嵌套深度
	// collapseDepth: 4,

	// 不需要索引首页 首页直接在标题内找到即可
	// includeRootIndexFile: true,

	// 不需要索引文件夹
	// includeFolderIndexFile: true,

	// 用文件的 h1 标题作为侧边栏标题
	useTitleFromFileHeading: true,

	// 用index文件的标题作为折叠栏的标题
	useFolderTitleFromIndexFile: true,

	// 折叠栏链接到index文件
	useFolderLinkFromIndexFile: true,

	// 用order字段做菜单排序
	sortMenusByFrontmatterOrder: true,

	// 不使用倒序排序
	// sortMenusOrderByDescending: true,
	sortMenusByName: false,

	useFolderLinkFromSameNameSubFile: true,

	// 不输出调试信息了
	debugPrint: false,
};

/** 获得合并后的侧边栏配置 */
function getMergeSidebarOptions(options?: VitePressSidebarOptions) {
	return merge({}, cloneDeep(defaultSidebarOptions), isUndefined(options) ? {} : options);
}

/**
 * 设置自动生成侧边栏的配置
 * @see https://vitepress-sidebar.cdget.com/zhHans/guide/options
 */
export function setGenerateSidebar(options?: VitePressSidebarOptions) {
	return generateSidebar(getMergeSidebarOptions(options));
}

export const config = defineConfig({
	extends: teekConfig,
	title: "请填写有意义的标题",
	description: "请填写有意义的描述",
	lang: "zh",
	themeConfig: {
		i18nRouting: true,
		search: {
			provider: "local",
		},
		// https://vitepress.dev/reference/default-theme-config
		nav: [{ text: "首页", link: "/" }],
		outline: {
			label: "本页目录",
			level: "deep",
		},
		// 自动化侧边栏
		sidebar: setGenerateSidebar(),
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat",
			},
		],
	},
	vite: {
		server: {
			open: true,
		},
		plugins: [
			/** @see https://github.com/okineadev/vitepress-plugin-llms */
			// @ts-ignore
			llmstxt(),
			// @ts-ignore
			GitChangelog({
				// 填写在此处填写您的仓库链接
				repoURL: () => "https://github.com/ruan-cat/monorepo",
				// 最大日志深度为10, 避免获取过多无意义的历史日志
				maxGitLogCount: 10,
			}),
			// @ts-ignore
			GitChangelogMarkdownSection(),
		],
		optimizeDeps: {
			exclude: ["vitepress", "@nolebase/ui"],
		},
		ssr: {
			noExternal: [
				// 如果还有别的依赖需要添加的话，并排填写和配置到这里即可
				"@nolebase/ui",
			],
		},
	},
});
