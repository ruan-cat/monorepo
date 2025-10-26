import { defineConfig, type DefaultTheme, type UserConfig } from "vitepress";
export { defineConfig };
import { generateSidebar } from "vitepress-sidebar";

import { GitChangelog, GitChangelogMarkdownSection } from "@nolebase/vitepress-plugin-git-changelog/vite";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";

import { merge, isUndefined, cloneDeep } from "lodash-es";
import consola from "consola";
import type { ExtraConfig } from "./types.ts";

import {
	addChangelog2doc,
	hasChangelogMd,
	copyReadmeMd,
	copyClaudeAgents,
	copyChangelogMd,
} from "@ruan-cat/utils/node-esm";
export { addChangelog2doc, copyReadmeMd, copyClaudeAgents, copyChangelogMd };

import { transformerTwoslash } from "@shikijs/vitepress-twoslash";

import llmstxt, { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";

import { defaultTeekConfig, handleTeekConfig, handlePlugins } from "./config/index.ts";

/** @see https://vitepress-ext.leelaa.cn/Mermaid.html#扩展-md-插件 */
import { MermaidPlugin } from "@leelaa/vitepress-plugin-extended";

// https://vp.teek.top/guide/quickstart.html#teek-引入
import { defineTeekConfig } from "vitepress-theme-teek/config";

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

/** 默认用户配置 */
const defaultUserConfig: UserConfig<DefaultTheme.Config> = {
	/**
	 * 使用默认的 Teek 主题配置
	 * 后续会有函数重新设置 Teek 主题配置，并覆盖默认配置
	 */
	extends: defineTeekConfig(defaultTeekConfig),

	title: "请填写有意义的标题",
	description: "请填写有意义的描述",

	lang: "zh",
	// 暂不需要
	// srcDir: "./src",

	themeConfig: {
		i18nRouting: true,

		search: { provider: "local" },

		// https://vitepress.dev/reference/default-theme-config
		nav: [{ text: "首页", link: "/" }],

		outline: {
			label: "本页目录",
			level: "deep",
		},

		// 自动化侧边栏
		sidebar: setGenerateSidebar(),

		socialLinks: [{ icon: "github", link: "https://github.com/ruan-cat" }],

		editLink: {
			pattern:
				"https://github.com/ruan-cat/monorepo/blob/dev/packages/vitepress-preset-config/src/docs/please-reset-themeConfig-editLink.md",
			text: "在 github 上打开此页面以预览原版 markdown 文档",
		},
	},

	vite: {
		server: { open: true, port: 8080 },

		/**
		 * 插件
		 * @description
		 * 这里留空 插件在 config/plugins.ts 中配置
		 */
		plugins: [],

		optimizeDeps: { exclude: ["vitepress", "@nolebase/ui"] },

		ssr: {
			noExternal: [
				// 如果还有别的依赖需要添加的话，并排填写和配置到这里即可
				"@nolebase/ui",
			],
		},
	},

	markdown: {
		config(md) {
			md.use(vitepressDemoPlugin);

			// @ts-ignore
			MermaidPlugin(md);

			// @ts-ignore
			md.use(copyOrDownloadAsMarkdownButtons);
		},

		codeTransformers: [
			// @ts-ignore FIXME: 这里出现奇怪的类型报错 屏蔽了
			transformerTwoslash(),
		],
		// languages: ["js", "jsx", "ts", "tsx"],

		/**
		 * FIXME: 在开启 twoslash 后 ，行号显示是不正确的。 这个故障是vitepress的bug，暂时没有好的方案来解决。
		 */
		lineNumbers: true,

		/** @see https://vitepress-ext.leelaa.cn/Mermaid.html#扩展-md-插件 */
		lazyLoading: true,
		breaks: true,
		math: true,

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
export function setUserConfig(
	config?: UserConfig<DefaultTheme.Config>,
	extraConfig?: ExtraConfig,
): UserConfig<DefaultTheme.Config> {
	/** 最终的用户数据 */
	const resUserConfig = merge({}, cloneDeep(defaultUserConfig), isUndefined(config) ? {} : config);

	// 增加导航栏
	handleChangeLog(resUserConfig);

	// 设置插件
	handlePlugins(resUserConfig, extraConfig);

	// 设置 Teek 主题配置
	handleTeekConfig(resUserConfig, extraConfig);

	return resUserConfig;
}
