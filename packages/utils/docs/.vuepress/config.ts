import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";

import { addChangelog2doc } from "@ruan-cat/utils/node-esm";

addChangelog2doc({
	target: "./docs",
	data: {
		order: 940,
		dir: {
			order: 940,
		},
	},
});

export default defineRuanCatVuepressConfig({
	title: "阮喵喵工具包",
});
