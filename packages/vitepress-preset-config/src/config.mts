import { defineConfig, type DefaultTheme, type UserConfig } from "vitepress";
import { generateSidebar, withSidebar } from "vitepress-sidebar";

export { defineConfig };

import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";

import { merge, isUndefined, cloneDeep } from "lodash-es";
import consola from "consola";

import { addChangelog2doc, hasChangelogMd } from "@ruan-cat/utils/node-esm";
export { addChangelog2doc };

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
	title: "请填写有意义的标题",
	description: "请填写有意义的描述",

	lang: "zh",
	// 暂不需要
	// srcDir: "./src",

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

		container: {
			tipLabel: "提示",
			warningLabel: "警告",
			dangerLabel: "危险",
			infoLabel: "信息",
			detailsLabel: "详情",
		},
	},
};

/**
 * 设置导航栏的变更日志
 * @description
 * 在导航栏内添加一行 变更日志 的入口
 *
 * 直接修改外部传递进来的配置对象即可
 * @private 内部使用即可
 */
function handleChangeLog(userConfig: UserConfig<DefaultTheme.Config>) {
	if (!hasChangelogMd()) {
		consola.warn(` 未找到变更日志文件，不添加变更日志导航栏。 `);
		return;
	}

	const nav = userConfig?.themeConfig?.nav;

	if (isUndefined(nav)) {
		consola.error(` 当前的用户配置为： `, userConfig);
		throw new Error(` nav 默认提供的导航栏配置为空。不符合默认配置，请检查。 `);
	}

	nav.push({ text: "更新日志", link: "/CHANGELOG.md" });
}

/** 设置vitepress主配置 */
export function setUserConfig(config?: UserConfig<DefaultTheme.Config>) {
	/** 最终的用户数据 */
	const resUserConfig = merge({}, cloneDeep(defaultUserConfig), isUndefined(config) ? {} : config);

	// 增加导航栏
	handleChangeLog(resUserConfig);

	return resUserConfig;
}
