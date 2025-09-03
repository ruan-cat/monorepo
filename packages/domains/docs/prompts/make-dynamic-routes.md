# 生成基于 vitepress 的动态路由

<!-- TODO: 未使用 -->

请深度思考。

我希望用现有的数据，制作出基于 vitepress 动态路由的页面。

## 术语说明

- **目标文件夹** ： `packages\domains\docs\domain`
- **模板文档** ：`packages\domains\docs\domain\[domain].md`
- **路径加载器** ：`packages\domains\docs\domain\[domain].path.ts`
- **域名集信息** ： `packages\domains\src\domains.ts` 即全部要被展示出来的信息。

## 具体要求

1. 请阅读 https://vitepress.dev/zh/guide/routing#dynamic-routes 文档。明白 vitepress 动态路由的知识点。
2. 在 `目标文件夹` 内实现基于动态路由的文档。
3. 阅读 `域名集信息` 。明确清楚那些信息要被展示出来。
4. 新建 `模板文档` 和 `路径加载器` 。
5. 根据 域名集信息 的内容，请充分发挥你的创造力，想象力。制作出合适的 vue 组件，使得域名信息可以美观的展示出来。

## 001 优化动效

<!-- 后面再考虑 -->

- https://vue-bits.dev/animations/electric-border
