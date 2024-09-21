// import "@ruan-cat/vuepress-preset-config/dist/style.css";
import { defineRuanCatVuepressPresetConfig, defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";

import { getDirname, path } from "vuepress/utils";

const __dirname = getDirname(import.meta.url);

// export default defineRuanCatVuepressPresetConfig;
export default defineRuanCatVuepressConfig({
	alias: {
		// "@theme-hope/modules/navbar/components/RepoLink": new URL("./components/test.vue", import.meta.url),
		// fileURLToPath(
		// 	new URL("./components/test.vue", import.meta.url),
		// ),
		"@theme-hope/modules/navbar/components/RepoLink": path.resolve(__dirname, "./components/test.vue"),
	},
});
