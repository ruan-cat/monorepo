import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/src/theme.ts";

// 导入全部的主题样式
import "@ruan-cat/vitepress-preset-config/theme.css";

// 增加用户自定义样式
import "./style.css";

export default defineRuancatPresetTheme();
