---
order: 1
---

# Demo 组件预览

## 用途

Demo 用于在 Markdown 页面中直接展示 Vue 单文件组件，适合组件库说明、交互示例和样式验证。该能力来自 `vitepress-demo-plugin`，不是 Teek 主题本身提供的功能。

## 前置条件

项目安装预设时必须同时安装 peer dependency：

```bash
pnpm add -D vitepress-demo-plugin@^1
```

## 最小示例

新建一个 Vue 组件，例如 `examples/hello-card.vue`：

```vue
<script setup lang="ts">
const message = "你好，VitePress";
</script>

<template>
	<button type="button">{{ message }}</button>
</template>
```

在同一文档目录中引用它：

```md
<demo vue="./examples/hello-card.vue" />
```

当前文档站内的可构建演示如下：

::: details 查看演示

<demo vue="../feat/demo/tests/mini-example.vue" />

:::

`vue` 的路径相对于包含 `<demo>` 的 Markdown 文件解析。组件依赖、样式和资源仍由你的 VitePress 项目负责解析。
