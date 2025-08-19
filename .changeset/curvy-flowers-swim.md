---
"@ruan-cat/vitepress-preset-config": major
---

本依赖包改成默认对 [vitepress-theme-teek](https://github.com/Kele-Bingtang/vitepress-theme-teek) 主题的二次封装。不再是自己封装的一套预设了。

- 移除内置的 [vite-plugin-vercel](https://github.com/magne4000/vite-plugin-vercel/tree/v9) 插件。
- 项目不再会自动生成 `.vercel` 目录，因为移除了 vite-plugin-vercel 插件。
- 移除定义主题时回调函数。
- 移除定义文档配置时的插件配置对象。
