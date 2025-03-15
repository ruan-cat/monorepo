// 特殊写法 避免出现循环依赖
// import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";
import { defineRuanCatVuepressConfig } from "../../../vuepress-preset-config";

import { addChangelog2doc } from "@ruan-cat/utils/node-esm";

addChangelog2doc({
	target: "./src",
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
