---
"@ruan-cat/vitepress-preset-config": minor
---

重构 Claude 文件复制功能，支持同时处理 `.claude/agents` 和 `.claude/commands` 文件夹：

- **API 重命名**：`copyClaudeAgents` 函数重命名为 `copyClaudeFiles`，更准确地反映其功能范围
- **类型重命名**：`CopyClaudeAgentsOptions` 接口重命名为 `CopyClaudeFilesOptions`
- **新增导出**：`ClaudeFolderName` 类型，用于约束文件夹名称（`"agents" | "commands"`）
- **新增功能**：
  - 现在会自动复制 `.claude/commands` 文件夹到目标位置，与 `.claude/agents` 保持相同的处理逻辑
  - 新增 `items` 配置项，支持选择性复制文件夹（默认复制 `agents` 和 `commands`）
  - 支持灵活配置：可选择只复制 `agents`、只复制 `commands`，或两者都复制
- **行为变更**：
  - `target` 参数现在指向父文件夹，函数会自动创建 `agents` 和 `commands` 子文件夹
  - 例如：`target: 'src/docs/prompts'` 会生成 `src/docs/prompts/agents/` 和 `src/docs/prompts/commands/`
  - 使用 `items` 可以选择只复制部分文件夹，例如：`items: ['agents']` 只复制 agents 文件夹
  - 对于不存在的文件夹会打印警告并跳过，不影响其他文件夹的复制

**破坏性变更**：

- 已删除 `copyClaudeAgents` 导出，请改用 `copyClaudeFiles`
- 已删除 `CopyClaudeAgentsOptions` 类型，请改用 `CopyClaudeFilesOptions`
