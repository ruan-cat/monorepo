# Hooks Reference

本文件承接 `SKILL.md` 中不适合长期内联的 hooks 细节。只有在用户要求精简 hooks、检查噪音、合并项目级/全局级 hooks，或需要确认各 Agent 模板格式时读取。

## 目标

Memorix hooks 的价值在会话生命周期节点，而不是每次工具调用、文件编辑或命令执行时记录。高频 hooks 会制造大量低价值记忆，让真正的上下文被噪音淹没。

处理 hooks 时优先回答三个问题：

1. 当前要处理项目级还是全局级？
2. 哪些事件是高频噪音，必须移除或禁用？
3. 哪些事件是生命周期节点，必须保留？

## 作用域模型

| 模式     | 触发条件                                     | 行为                                                         |
| :------- | :------------------------------------------- | :----------------------------------------------------------- |
| 项目级   | 用户没有明确要求全局配置                     | 只处理当前项目根目录下的 Agent 配置。                        |
| 全局级   | 用户明确说全局、`--global`、setup 后全局精简 | 只处理用户主目录下的全局 hooks 配置。                        |
| 双作用域 | 用户同时要求全局和项目级                     | 先处理全局，再处理当前项目；不要把两个作用域混在一次写入里。 |

## 支持目标路径

| 工具        | 项目级路径                                | 全局级路径                                                                 |
| :---------- | :---------------------------------------- | :------------------------------------------------------------------------- |
| Claude Code | `.claude/settings.local.json`             | `~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json` |
| Codex       | 不提供项目级模板                          | `~/.codex/plugins/memorix/hooks/hooks.json`                                |
| Cursor      | `.cursor/hooks.json`                      | `~/.cursor/hooks.json`                                                     |
| Windsurf    | `.windsurf/hooks.json`                    | 暂不支持                                                                   |
| Gemini CLI  | `.gemini/settings.json`                   | 暂不支持                                                                   |
| Kiro        | `.kiro/hooks/memorix-file-save.kiro.hook` | 暂不支持                                                                   |
| WorkBuddy   | `.workbuddy/hooks/hooks.json`             | 暂不支持                                                                   |
| Antigravity | `.agents/hooks.json`                      | `~/.gemini/config/plugins/memorix/hooks.json`                              |

Claude Code 全局路径中的 `{version}` 需要动态发现。Memorix 插件升级后版本目录可能变化，不能写死旧版本号。

## 高频噪音 hooks

这些事件会在工具调用、文件编辑或命令执行时频繁触发，应移除或禁用：

| 工具        | 高频事件                                                     | 处理方式                                     |
| :---------- | :----------------------------------------------------------- | :------------------------------------------- |
| Claude Code | `PreToolUse`, `PostToolUse`                                  | 移除 Memorix hook。                          |
| Codex       | `PostToolUse`                                                | 全局模板中不保留。项目级没有 Codex 模板。    |
| Cursor      | `afterFileEdit`, `afterMCPExecution`, `beforeShellExecution` | 移除，避免文件编辑和 shell 执行都写记忆。    |
| Windsurf    | `post_write_code`, `post_run_command`, `post_mcp_tool_use`   | 移除，保留用户 prompt 前后生命周期事件。     |
| Gemini CLI  | `AfterTool`                                                  | 移除，避免每次工具调用写记忆。               |
| Kiro        | `memorix-file-save` / `onFileSave`                           | 保持 `enabled: false`，不要改成启用。        |
| WorkBuddy   | `PreToolUse`, `PostToolUse`                                  | 移除，只保留四个生命周期事件。               |
| Antigravity | `PreToolUse`, `PostToolUse`                                  | 移除，尤其是 `matcher: "*"` 的全局高频配置。 |

不要把 `UserPromptSubmit`、`beforeSubmitPrompt`、`PreCompact`、`preCompact` 误判为噪音。它们是低频生命周期节点。

## 生命周期 hooks

| 事件类型     | Claude Code        | Codex              | Cursor               | Windsurf                | Gemini CLI     | WorkBuddy          | Antigravity              |
| :----------- | :----------------- | :----------------- | :------------------- | :---------------------- | :------------- | :----------------- | :----------------------- |
| 会话开始     | `SessionStart`     | `SessionStart`     | `sessionStart`       | `pre_user_prompt`       | `SessionStart` | `SessionStart`     | `PreInvocation`          |
| 用户提交     | `UserPromptSubmit` | `UserPromptSubmit` | `beforeSubmitPrompt` | -                       | -              | `UserPromptSubmit` | -                        |
| 压缩前       | `PreCompact`       | -                  | `preCompact`         | -                       | `PreCompress`  | `PreCompact`       | -                        |
| 会话结束     | `Stop`             | `Stop`             | `stop`               | `post_cascade_response` | -              | `Stop`             | `PostInvocation`, `Stop` |
| Agent 响应后 | -                  | -                  | -                    | -                       | `AfterAgent`   | -                  | -                        |

Codex 缺少 `PreCompact`；不要为了“补齐四件套”创造不存在的事件。

## 模板格式

项目级模板位于 `templates/`，全局模板位于 `templates-global/`。所有路径都相对于技能安装目录。

| 工具        | 模板形态                                                                                                                 |
| :---------- | :----------------------------------------------------------------------------------------------------------------------- |
| Claude Code | 标准 `hooks` 对象，每个事件下是 hook 数组。                                                                              |
| Codex       | 与 Claude Code 接近，但只在全局模板中出现，且没有 `PreCompact`。                                                         |
| Cursor      | 事件名小写驼峰；hook 条目是对象数组，例如 `{ "command": "memorix.cmd hook" }`。                                          |
| WorkBuddy   | 与 Claude Code 事件名一致，但每个事件数组内是 `{ "matcher": "*", "hooks": [...] }` 嵌套结构，hook 条目带 `description`。 |
| Antigravity | 顶层 key 为 `memorix`，保留 `PreInvocation`、`PostInvocation`、`Stop`，不保留工具级事件。                                |
| Windsurf    | 保留 `pre_user_prompt` 和 `post_cascade_response`。                                                                      |
| Gemini CLI  | 使用 matcher / named hook 结构，保留 `SessionStart`、`PreCompress`、`AfterAgent`。                                       |
| Kiro        | YAML 单文件 hook；通过 `enabled: false` 控制，不删除文件。                                                               |

旧版本文档可能把 Cursor 写成 command 字符串数组；以当前模板为准，Cursor hooks 应是对象数组。

## 合并策略

处理已有配置时使用精确合并，不做全量覆盖：

- 只移除明确属于 Memorix 的高频噪音 hooks。
- 保留 `permissions`、`not-use-now-hooks`、用户自定义 hooks、非 Memorix 配置。
- 同一生命周期事件已有合格 Memorix hook 时不要重复添加。
- WorkBuddy 要保留 `matcher`、`description` 等结构字段，不能扁平化。
- Antigravity 要保留顶层 `memorix` 结构，不要改成 Claude 风格。
- Kiro 保持 `enabled: false`，不要删除文件导致用户误以为没有配置。

如果用户要求清理历史噪音记忆，应先说明风险；不要主动运行 cleanup 类命令。

## 验证清单

完成 hooks 调整后逐项检查：

- 项目级和全局级作用域没有混写。
- 高频事件已移除或禁用。
- 生命周期事件仍保留。
- JSON / YAML 格式可解析。
- 用户自定义字段仍保留。
- Codex 只在全局模板中出现。
- Cursor 使用 `{ "command": "memorix.cmd hook" }` 对象数组。
- WorkBuddy 仍是 matcher 嵌套结构。
- Claude Code 全局路径没有写死旧版本目录。
