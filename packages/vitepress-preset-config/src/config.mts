import { defineConfig, type DefaultTheme, type UserConfig } from "vitepress";
import { generateSidebar, withSidebar } from "vitepress-sidebar";

export { defineConfig };

import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";

import { merge, isUndefined, cloneDeep } from "lodash-es";

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

	debugPrint: true,
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

/** 默认用户配置 */
const defaultUserConfig: UserConfig<DefaultTheme.Config> = {
	title: "10wms前端组技术文档",
	description: "本前端项目内的组件使用、api、类型以及使用文档",

	lang: "zh",
	// 暂不需要
	// srcDir: "./src",

	themeConfig: {
		i18nRouting: true,

		search: {
			provider: "local",
		},

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "首页", link: "/" },
			{ text: "更新日志", link: "/CHANGELOG.md" },
			// TODO: 未来项目结束时，在此补充配置
			// { text: "仓库地址", link: "https://github.com/ruan-cat/vercel-monorepo-test/tree/dev/packages/docs-01-star" },
		],

		outline: {
			label: "本页目录",
			level: "deep",
		},

		// 自动化侧边栏
		sidebar: setGenerateSidebar(),

		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/ruan-cat/vercel-monorepo-test/blob/dev/packages/docs-01-star/docs/index.md",
			},
		],
	},

	vite: {
		server: {
			open: true,
		},

		plugins: [
			// @ts-ignore
			GitChangelog({
				// 填写在此处填写您的仓库链接
				repoURL: () => "https://github.com/ruan-cat/vercel-monorepo-test",
			}),
			// @ts-ignore
			GitChangelogMarkdownSection(),
		],

		optimizeDeps: {
			exclude: [
				"@nolebase/vitepress-plugin-breadcrumbs/client",
				"@nolebase/vitepress-plugin-enhanced-readabilities/client",
				"vitepress",
				"@nolebase/ui",
			],
		},

		ssr: {
			noExternal: [
				// 如果还有别的依赖需要添加的话，并排填写和配置到这里即可
				"@nolebase/vitepress-plugin-breadcrumbs",

				"@nolebase/vitepress-plugin-enhanced-readabilities",
				"@nolebase/ui",

				"@nolebase/vitepress-plugin-highlight-targeted-heading",
			],
		},
	},

	markdown: {
		config(md) {
			md.use(vitepressDemoPlugin);
		},
	},
};

/** 设置vitepress主配置 */
export function setUserConfig(config?: UserConfig<DefaultTheme.Config>) {
	return merge({}, cloneDeep(defaultUserConfig), isUndefined(config) ? {} : config);
}

type VitePressSidebarOptions = Parameters<typeof generateSidebar>[0];

// TODO:
/** 设置导航栏的变更日志 */
function handleChangeLog() {}
