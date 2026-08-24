---
order: 3
---

# Twoslash 类型提示

## 用途

Twoslash 会分析 TypeScript 代码片段，并在文档中展示类型信息与悬停提示。它适合讲解类型 API，不适合替代完整的项目类型检查。

## 最小写法

先准备一个 TypeScript 文件：

```ts
export const greeting = "hello";
```

在 Markdown 中导入并追加 `twoslash`：

```md
<<< ./example.ts{ts twoslash}
```

当前文档站可使用的示例：

<<< ../feat/twoslash/twoslash-example-code.ts{ts twoslash}

## 注意事项

- 使用相对路径导入代码片段，路径相对于当前 Markdown 文件。
- `{ts twoslash}` 是推荐写法；`#snipaste{ts twoslash}` 是兼容旧片段时可用的替代写法。
- 当前预设开启 Twoslash 后，代码行号可能与实际行号不一致。这是已知显示限制；需要逐行定位问题时，请以源码为准。
