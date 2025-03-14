import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";

import { addChangelog2doc } from "@ruan-cat/utils/node-esm";

addChangelog2doc({
	target: "./docs",
	data: {
		order: 1000,
		dir: {
			order: 1000,
		},
	},
});

export default defineRuanCatVuepressConfig({
	title: "阮喵喵域名文档",
});
