import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";
import type { EnhanceAppContext } from "vitepress";

// 增加用户自定义样式
import "./style.css";

// 全局导入element-plus组件 并全局注册
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

export default defineRuancatPresetTheme({
	enhanceAppCallBack({ app, router, siteData }) {
		app.use(ElementPlus);
	},
});
