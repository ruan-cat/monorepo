import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";

// 导入全部的主题样式 （事实上冗余，可以不写）
import "@ruan-cat/vitepress-preset-config/theme.css";

// @ts-ignore 记得增加样式
import "./style.css";

export default defineRuancatPresetTheme();
