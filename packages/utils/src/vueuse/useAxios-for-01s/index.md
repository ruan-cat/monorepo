---
order: 20
---

# 01s 内封装好的 useAxios 函数

这里将作品集内常用的接口请求封装方案，统一有本库导出。作为跨项目公用的请求工具。

::: tip 01s 项目是什么？

是作者自己维护的一系列作品集的代号。

:::

## 额外的依赖

本工具预设的请求头中，会使用 qs 完成字段格式化。故需要额外安装生产环境依赖。

```bash
pnpm i -P qs
```

## 自动导入插件的配置

针对 `unplugin-auto-import` 插件，推荐提供以下全局配置

::: details 配置全局类型

<<< ./tests/unplugin-auto-import.ts#snipaste{ts twoslash}

:::

## 使用本工具

点此[阅读本工具](./use.md)。
