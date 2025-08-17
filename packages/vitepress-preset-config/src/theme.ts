// https://vitepress.dev/guide/custom-theme
import type { Theme, EnhanceAppContext } from "vitepress";

/**
 * 警告 将全部的样式集中在专门的文件内 在tsup内被打包出去
 * 不再对外提供专门的样式
 */
// import "./index.css";

import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";

// https://vp.teek.top/guide/quickstart.html#teek-引入
import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";

/**
 * 定义默认主题预设
 */
export function defineRuancatPresetTheme() {
	return {
		extends: Teek,
		enhanceApp({ app, router, siteData }: EnhanceAppContext) {
			app.use(NolebaseGitChangelogPlugin);
			app.use(TwoslashFloatingVue);
		},
	} satisfies Theme;
}
