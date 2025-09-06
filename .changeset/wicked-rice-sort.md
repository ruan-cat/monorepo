---
"@ruan-cat/vitepress-preset-config": major
---

1. 增设专门的项目访问入口，使得 @ruan-cat/vitepress-preset-config 可以直接访问到全部**经过打包**代码。
2. 增加 getPlugins 函数，用于配置 vitepress 的插件。实现自定义插件配置。
3. setUserConfig 函数，增加 extraConfig 配置。允许用户做出额外的配置。
