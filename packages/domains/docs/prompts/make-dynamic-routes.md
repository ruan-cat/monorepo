# 生成基于 vitepress 的动态路由

请深度思考。

我希望用现有的数据，制作出基于 vitepress 动态路由的页面。

## 术语说明

- **目标文件夹** ： `packages\domains\docs\domain`
- **模板文档** ：`packages\domains\docs\domain\[project].md`
- **路径加载器** ：`packages\domains\docs\domain\[project].path.ts`
- **域名集信息** ： `packages\domains\src\domains.ts` 即全部要被展示出来的信息。
- **组件文件夹** ： `packages\domains\docs\.vitepress\components`
- **渲染用组件** ： 存储在 `组件文件夹` 的组件。在 `模板文档` 内使用。并在组件内部使用 `域名集信息` 的数据。

## 具体要求

1. 请阅读 https://vitepress.dev/zh/guide/routing#dynamic-routes 文档。明白 vitepress 动态路由的知识点。
2. 在 `目标文件夹` 内实现基于动态路由的文档。
3. 阅读 `域名集信息` 。明确清楚那些信息要被展示出来。
4. 新建 `模板文档` 和 `路径加载器` 。
5. 根据 域名集信息 的内容，请充分发挥你的创造力，想象力。制作出合适的 vue 组件，使得域名信息可以美观的展示出来。

## `路径加载器` 的编写规范

1. 路径加载器，返回值必须包含一个 project 字段。这个值应该来自于 packages\domains\src\types.ts 的 projects 数组。
2. project 字段应该是项目的名称。
3. `路径加载器` 应该返回 project 字段。

## 渲染用途的 vue 组件编写规范

你应该主动的设计合适的组件，用于展示 `域名集信息` 。制作出合适的 vue 组件，使得域名信息可以美观的展示出来。

### 开发大致步骤

1. 必须使用 useData 函数来获取 `路径加载器` 提供的数据。用 `import { useData } from 'vitepress'` 的方式导入，比获取数据。请阅读文档： https://vitepress.dev/zh/reference/runtime-api#usedata
2. 在 `渲染用组件` 内，先通过 路径加载器 获取 project 字段。
3. 然后再利用 project 字段查询项目信息、渲染 `域名集信息` 信息。
4. 请充分发挥想象力，编写美观好看的展示组件。

### 代码规范

1. 用 typescript
2. 不使用 props
3. 用 setup 组合式 api
4. script 脚本在前面， template 模板在后面。

## `模板文档` 的规范

模板文档不应该直接使用任何传递下来的变量。应该将 `路径加载器` 获取的数据，传递给 vue 组件。

## 001 优化动效

<!-- TODO: 后面再考虑提供更好看的动效 现在暂时没有需求 -->

- https://vue-bits.dev/animations/electric-border
