---
"@ruan-cat/vitepress-preset-config": minor
---

1. 移除了 `vitepress-theme-teek/theme-chalk/tk-sidebar.css` 的侧边栏样式导入，升级后侧边栏标题将不再沿用原先的加粗视觉效果。
2. 这次调整会直接改变 `@ruan-cat/vitepress-preset-config` 生成站点的侧边栏外观，属于明显且可感知的界面样式变化，因此以 `minor` 版本发布。
3. 如果你的文档站点之前依赖这套侧边栏强调样式来区分标题层级，升级后请重新检查侧边栏的视觉层次，并按需补充自定义样式覆盖。
