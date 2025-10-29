// 特殊写法 避免出现循环依赖
// import { defineRuanCatVuepressConfig } from "@ruan-cat/vuepress-preset-config";
import { defineRuanCatVuepressConfig } from "../../../vuepress-preset-config";

// 注意：这里没有使用 addChangelog2doc ， 反正 vuepress 我后续也不用了

export default defineRuanCatVuepressConfig({
	title: "阮喵喵工具包",
});
