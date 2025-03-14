import { defineRuanCatVuepressConfig, addChangelog2doc } from "@ruan-cat/vuepress-preset-config";

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
