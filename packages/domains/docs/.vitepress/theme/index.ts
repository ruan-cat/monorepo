import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";
// import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config";

import ProjectDomainDisplay from "../components/ProjectDomainDisplay.vue";

// 增加用户自定义样式
import "./style.css";

export default defineRuancatPresetTheme({
	enhanceAppCallBack({ app }) {
		// 全局注册组件
		app.component("ProjectDomainDisplay", ProjectDomainDisplay);
	},
});
