---
"@ruan-cat/vitepress-preset-config": minor
---

1. `copyClaudeFiles` 函数新增 `skills` 文件夹复制支持，`ClaudeFolderName` 类型扩展为 `"agents" | "commands" | "skills"`。
2. 默认复制列表从 `['agents', 'commands']` 变更为 `['agents', 'commands', 'skills']`，构建产物将自动包含 `.claude/skills` 目录。
