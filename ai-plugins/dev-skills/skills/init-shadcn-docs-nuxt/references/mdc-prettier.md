# MDC 语法与 Prettier 防护完整参考

## 模板文件

| 模板                                                        | 说明                                       |
| ----------------------------------------------------------- | ------------------------------------------ |
| [`templates/prettierrc.json`](../templates/prettierrc.json) | Prettier overrides 配置 — MDC 防护兜底方案 |
| [`templates/prettierignore`](../templates/prettierignore)   | .prettierignore 内容 — MDC 防护主方案      |

> **使用时请直接阅读模板文件中的注释**，注释说明了 Prettier 破坏 MDC 的已知行为模式。

---

## MDC 容器是什么

MDC（Markdown Components）是 Nuxt Content 的扩展语法，允许在 Markdown 中使用 Vue 组件。`shadcn-docs-nuxt` 预置了多个 MDC 容器，最常用的是 `::demo-playground`（组件演示）。

---

## `::demo-playground` 标准语法

````md
## ::demo-playground

title: 示例标题
description: 示例描述

---

#preview
这里放预览组件，例如：
<CuiTable :columns="columns" :data="data" />

#code

```vue
<template>
	<CuiTable :columns="columns" :data="data" />
</template>
```

::
````

### 语法要素

| 要素             | 规则                                                       |
| ---------------- | ---------------------------------------------------------- |
| 开标记           | `::demo-playground`（行首，前面不加 `#` 或 `##`）          |
| frontmatter      | 紧跟开标记后的 `---` 包裹块，包含 `title` 和 `description` |
| slot 标记        | `#preview` 和 `#code`，行首，前面不加任何前缀              |
| 闭标记           | `::`（独占一行）                                           |
| frontmatter 顺序 | `---` → 键值对 → `---`（不可颠倒）                         |

---

## 常见错误写法与修复对照

### 错误 1：把容器名写成标题

```md
<!-- ❌ 错误：被 Markdown 解析器当成二级标题 -->

## ::demo-playground

<!-- ✅ 正确：行首直接写 -->

::demo-playground
```

**后果**：`::demo-playground` 被当成标题文本渲染，内部 slot 和 frontmatter 全部作为裸文本输出。

### 错误 2：frontmatter 顺序错误

```md
<!-- ❌ 错误：title/description 在前，--- 在后 -->

::demo-playground
title: 示例标题
description: 示例描述

---

<!-- ✅ 正确：--- 包裹在键值对的上下两侧 -->

## ::demo-playground

title: 示例标题
description: 示例描述

---
```

**后果**：frontmatter 未被正确解析，title/description 作为裸文本显示在页面上。

### 错误 3：开闭标记不匹配

```md
<!-- ❌ 错误：用了三个冒号开头但两个冒号结尾，或反过来 -->

:::demo-playground
...
::

<!-- ✅ 正确：使用一致的冒号数量 -->

::demo-playground
...
::
```

**后果**：MDC 解析器无法正确匹配容器边界，导致后续内容被吞入容器或裸文本泄漏。

### 错误 4：slot 标记前有空格或前缀

```md
<!-- ❌ 错误 -->

#preview

- #code

<!-- ✅ 正确 -->

#preview
#code
```

### 错误 5：代码块与容器嵌套冲突

在 MDC 容器中嵌套代码块时，确保代码块的反引号数量不会与外层容器的反引号冲突。

---

## MDC 与 Hydration Mismatch 的因果关系

**这是最容易误诊的问题：**

1. MDC 语法错误 → Nuxt Content 解析出错误的 AST
2. 服务端按错误 AST 渲染 HTML
3. 客户端按正确 AST（或不同的错误 AST）渲染 Virtual DOM
4. 两者不匹配 → Vue 报 hydration mismatch
5. Hydration mismatch → 部分组件未正确 hydrate → 交互失效

**因此，看到 hydration mismatch 错误时，除了查模块导入问题（见 [`compat.md`](compat.md)），也要检查当前页面的 MDC 语法。**

### 诊断信号

- 页面上出现 `::demo-playground`、`title:`、`#preview`、`#code` 等裸文本 → MDC 语法错误
- console 报 hydration mismatch 且定位到 content 页面 → 检查该页面的 MDC 语法
- 只有特定页面有问题，其他页面正常 → 几乎肯定是该页面的 MDC 语法问题

---

## Prettier 防护（双保险）

### 问题

Prettier 会重新格式化 Markdown 文件，可能破坏 MDC 容器语法。已知破坏行为见 [`templates/prettierignore`](../templates/prettierignore) 和 [`templates/prettierrc.json`](../templates/prettierrc.json) 中的注释。

### 推荐做法

**两种方案同时使用**（双保险）：

1. 复制 [`templates/prettierignore`](../templates/prettierignore) 内容到项目的 `.prettierignore` — 主保护
2. 将 [`templates/prettierrc.json`](../templates/prettierrc.json) 的 overrides 段合并到项目的 prettier 配置中 — 兜底保护

### 事后验证

如果怀疑 prettier 已经破坏了 MDC 文件：

1. `git diff content/` 查看是否有非预期的格式变化
2. 启动 `nuxt dev`，逐页检查是否有裸 marker 文本
3. 检查浏览器 console 是否有 hydration mismatch
4. 如果确认被破坏，使用 `git checkout content/` 恢复

---

## MDC 验证清单

在编写或修改 MDC 内容后，检查以下项目：

- [ ] 容器开标记 `::demo-playground` 在行首，前面无 `#` 或 `##`
- [ ] frontmatter 被 `---` 正确包裹（上下各一行 `---`）
- [ ] `#preview` 和 `#code` slot 在行首
- [ ] 闭标记 `::` 独占一行
- [ ] 页面上无 `::demo-playground`、`title:`、`#preview`、`#code` 等裸文本
- [ ] console 无 hydration mismatch 错误
- [ ] `.prettierignore` 已排除 `content/**/*.md`
