---
order: 3
---

# 文档同步辅助函数

配置入口还导出三个会写入文件的辅助函数。它们适用于文档构建前同步仓库已有内容，而不是运行时页面功能。

```ts
import { addChangelog2doc, copyClaudeFiles, copyReadmeMd } from "@ruan-cat/vitepress-preset-config/config";
```

这些函数都依据执行 VitePress 命令时的 `process.cwd()` 解析路径。请确认脚本的工作目录与示例一致，避免把文件复制到意外位置。

## `addChangelog2doc()`

将项目根目录的 `CHANGELOG.md` 复制到指定文档目录，并写入默认排序 frontmatter：

```ts
addChangelog2doc({
	target: "./docs",
});
```

- `target` 是目标文档目录，通常为 `./docs`。
- 若运行目录下没有 `CHANGELOG.md`，函数会直接返回，不创建文件。
- 调用会覆盖目标 `CHANGELOG.md` 的 frontmatter；如需自定义排序，可传入 `data`。

```ts
addChangelog2doc({
	target: "./docs",
	data: {
		order: 1000,
		dir: { order: 1000 },
	},
});
```

## `copyReadmeMd()`

将运行目录根部的 `README.md` 复制到目标目录并重命名为 `index.md`：

```ts
copyReadmeMd("./docs");
```

使用大写文件名 `README.md`，并确保目标目录已经存在。这个函数适合让项目 README 同时作为文档站首页；若文档首页需要不同内容，不要调用它。

## `copyClaudeFiles()`

从 monorepo 根目录或指定根目录复制 `.claude/agents`、`.claude/commands`、`.claude/skills` 到文档目录：

```ts
copyClaudeFiles({
	target: "docs/prompts",
	items: ["agents", "skills"],
});
```

- `target` **只能使用相对路径**，例如 `docs/prompts` 或 `./public/claude`；绝对路径会抛出错误，避免写入系统目录。
- `items` 默认复制 `agents`、`commands`、`skills` 三类目录；不存在的目录会被跳过并输出警告。
- 不传 `rootDir` 时，函数会向上查找包含 `pnpm-workspace.yaml` 的 monorepo 根目录，找不到时回退到当前工作目录。
- `rootDir` 可以传相对路径或绝对路径，用于明确指定 `.claude` 的来源。

```ts
copyClaudeFiles({
	target: "docs/prompts",
	rootDir: "../../../",
	items: ["commands"],
});
```

复制操作会覆盖同名目标内容。把它放在可重复执行的构建准备步骤中之前，先确认目标目录不承载手工维护的文件。
