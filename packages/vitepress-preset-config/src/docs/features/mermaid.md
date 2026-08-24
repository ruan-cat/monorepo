---
order: 2
---

# Mermaid 流程图

## 用途

预设在 Markdown 配置中注册 Mermaid 渲染能力，可直接用 Mermaid 代码块表达流程图、时序图和关系图。

## 最小示例

````md
```mermaid
flowchart LR
    A[安装依赖] --> B[配置站点]
    B --> C[编写文档]
```
````

渲染效果：

```mermaid
flowchart LR
    A[安装依赖] --> B[配置站点]
    B --> C[编写文档]
```

图表语法遵循 Mermaid 本身。需要调整图表内容时，优先在普通 Markdown 代码块中验证语法，再放入页面。

## 限制

该预设只负责注册 Markdown 与主题侧的 Mermaid 能力；复杂图表的语法、主题和兼容性由 `@leelaa/vitepress-plugin-extended` 及 Mermaid 决定。
