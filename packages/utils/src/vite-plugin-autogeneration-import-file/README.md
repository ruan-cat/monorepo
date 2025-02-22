---
dir:
  collapsible: false
  link: true
---

# 自动类型生成插件的二次封装

[vite-plugin-autogeneration-import-file](https://github.com/yuntian001/vite-plugin-autogeneration-import-file)，这个 vite 插件可以实现自动类型导入。在实际使用过程中，需要配置很多东西，故此处对该插件的使用做一些二次封装，并讲解该如何使用。

## 安装依赖

毕竟属于对该插件的二次封装，请自行安装依赖：

```bash
pnpm i -D vite-plugin-autogeneration-import-file
```

## 在 vite 配置内使用

使用示例如下：

::: details

@[code](./tests/vite.config.ts)

:::

## 使用的模板

类型文件使用的模板如下：

::: details

@[code](./template/components.template.ts)

:::
