import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";
import type { EnhanceAppContext } from "vitepress";

// export default defineRuancatPresetTheme();

// 增加用户自定义样式
import "./style.css";

import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";

import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";

import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";

// export default {
// 	extends: Teek,
// 	enhanceApp({ app, router, siteData }: EnhanceAppContext) {
// 		app.use(NolebaseGitChangelogPlugin);
// 		app.use(TwoslashFloatingVue);
// 	},
// };

export default defineRuancatPresetTheme();
