---
"@ruan-cat/utils": patch
---

修复 `copy-claude-agents.ts` 中的 monorepo 寻址问题

**问题描述**：
在 monorepo 子项目中运行脚本时，`process.cwd()` 指向子项目根目录而非 monorepo 根目录，导致 `.claude/agents` 目录查找失败。

**解决方案**：

- 新增 `findMonorepoRoot()` 函数：通过向上查找 `pnpm-workspace.yaml` 自动定位 monorepo 根目录
- 新增 `resolveRootDir()` 函数：支持手动指定根目录路径（支持相对路径如 `../../../`）
- 重构 `hasClaudeAgents()` 和 `copyClaudeAgents()` 函数：支持可选的 `rootDir` 参数
- 新增 `CopyClaudeAgentsOptions` 接口：规范化配置选项

**API 变更**：

- `hasClaudeAgents()` → `hasClaudeAgents(options?: { rootDir?: string })`
- `copyClaudeAgents(target: string)` → `copyClaudeAgents(options: CopyClaudeAgentsOptions)`

路径解析优先级：显式 `rootDir` > 自动检测 monorepo 根目录 > `process.cwd()` 回退
