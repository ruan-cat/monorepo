---
order: 3
---

# 功能

预设默认接入以下 Markdown 与主题能力。它们不需要逐项安装额外依赖；安装预设时需要保留 `vitepress-demo-plugin` 这一 peer dependency。

| 功能                       | 适合的内容                           | 开始使用                   |
| -------------------------- | ------------------------------------ | -------------------------- |
| [Demo 组件预览](./demo.md) | 在文档内交互式展示 Vue 组件          | `<demo vue="..." />`       |
| [Mermaid](./mermaid.md)    | 流程图、时序图和架构图               | ` ```mermaid `             |
| [Twoslash](./twoslash.md)  | 在 TypeScript 代码片段中显示类型信息 | `<<< file.ts{ts twoslash}` |

若只需要普通 Markdown 文档，不必使用这些语法；预设的基础主题、搜索与侧边栏仍然可以正常工作。
