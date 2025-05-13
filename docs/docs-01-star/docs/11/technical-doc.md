# 技术文档

在本次项目中，使用了很多外部的库。

考虑到本次项目组的成员水平参差不齐，为了避免大家浪费时间，这里仅列举需要大家专门学习的，必须掌握的知识点。做到有的放矢。

::: tip 提前预备合适的浏览器插件

当你阅读文档时，会不可避免的遇到英文文档。这里推荐你准备好这些[浏览器插件](../09oa/frontend-dev/chrome-extensions.md)。

:::

## lodash

lodash 是基础性质库。是javascript层面上的工具库。

- [merge](https://www.lodashjs.com/docs/lodash.merge)
- [isUndefined](https://www.lodashjs.com/docs/lodash.isUndefined)
- [isNil](https://www.lodashjs.com/docs/lodash.isNil)

::: tip

本次项目使用的是lodash-es包。暂不考虑换成其他类似的竞品。

- [引入 Lodash 的最佳方式](https://juejin.cn/post/6844904116544618503)

:::

## vue3

本次前端项目使用的渲染框架。

- [Slots](https://cn.vuejs.org/guide/components/slots.html)
- [Props](https://cn.vuejs.org/guide/components/props.html)
- [ref](https://cn.vuejs.org/api/reactivity-core.html#ref)
- [computed](https://cn.vuejs.org/api/reactivity-core.html#computed)
- [watch](https://cn.vuejs.org/api/reactivity-core.html#computed)

## vueuse

组合式api的工具。本次项目重点使用的是 useAxios 。

- [useAxios](https://vueuse.org/integrations/useAxios/)

## @ruan-cat/utils

阮喵喵自己封装的工具包。重点学会使用接口请求工具。

- [useAxiosWrapper](https://utils.ruan-cat.com/vueuse/useAxios/)

## monorepo

monorepo是前端项目的一种组织方式，是一种架构。

- [如何发布一个monorepo的npm包？](https://www.bilibili.com/video/BV1Aj411h7F2/)
- https://turborepo.com/docs/crafting-your-repository

## pnpm

一种包管理器。

- [过滤](https://pnpm.io/zh/filtering)
- [-P](https://pnpm.io/zh/cli/install#--prod--p)
- [-D](https://pnpm.io/zh/cli/install#--dev--d)
- [-F](https://pnpm.io/zh/cli/install#--filter-package_selector)
- [rm](https://pnpm.io/zh/cli/remove)
- [dlx](https://pnpm.io/zh/cli/dlx)
- [setup](https://pnpm.io/zh/cli/setup)

## turbo

monorepo下的node命令调度器。

- [配置任务](https://turborepo.com/docs/crafting-your-repository/configuring-tasks)

::: tip

了解任务调度器的配置即可。本次项目不要求大家配置调度器。

:::

## element-plus

组件库。

- [Container](https://element-plus.org/zh-CN/component/container.html)
- [Form](https://element-plus.org/zh-CN/component/form.html)
- [Table](https://element-plus.org/zh-CN/component/table.html)
- [Dialog](https://element-plus.org/zh-CN/component/dialog.html)
- [Message](https://element-plus.org/zh-CN/component/message.html)
- [Tree](https://element-plus.org/zh-CN/component/tree.html)

##
