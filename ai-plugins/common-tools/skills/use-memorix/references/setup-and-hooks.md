# setup 与 hooks 治理

本文件只处理两件事：官方 setup/升级的边界，以及 Memorix hooks 的去噪与合并。读写记忆、归档、健康检查不在本文件。

## 官方 setup 与升级的所有权

| 事项                  | 权威所有者         | 本技能的行为                                 |
| :-------------------- | :----------------- | :------------------------------------------- |
| 安装 Memorix          | 官方安装路径       | 只给当前 `--help` 暴露的命令，不代跑         |
| `memorix setup`       | 官方 setup         | 用户明确要求后才执行，执行前后都要确认影响面 |
| 七个 `memorix-*` 技能 | 官方 setup/升级    | 保持可见，只读审计，不复制、不覆盖           |
| hooks 默认内容        | 官方 setup         | setup 后可再次精简，但精简动作本身要确认     |
| MCP entry 的 mode     | 本技能的手工兼容器 | 只校准 `--mode`，不重写官方 setup 产物       |

执行纪律：

1. 需要 setup 时，先读当前 `memorix setup --help`，把将要触碰的 agent 与路径列给用户。
2. 不提供「帮你跑一下 setup」的默认动作；默认只给帮助命令与 dry-run 形态。
3. setup 会重装或覆盖默认 hooks。若用户目标是降噪，setup 之后仍需重新检查高频事件。
4. 升级后必须回归：全局 hooks 路径是否换版本目录、是否重新出现工具级事件、Kiro 是否仍 `enabled: false`。

## 作用域模型

| 模式     | 触发条件                             | 行为                                     |
| :------- | :----------------------------------- | :--------------------------------------- |
| 项目级   | 用户没有明确要求全局                 | 只处理当前项目根目录下的 hooks 配置      |
| 全局级   | 用户明确说全局、`--global`、setup 后 | 只处理用户主目录下的全局 hooks 配置      |
| 双作用域 | 用户同时要全局与项目级               | 先全局、再项目；两类路径不混在一次写入里 |

## 支持目标与模板

项目级：

| 工具        | 目标路径                                  | 模板                                               |
| :---------- | :---------------------------------------- | :------------------------------------------------- |
| Claude Code | `.claude/settings.local.json`             | `templates/hooks/claude-code.settings.local.json`  |
| Cursor      | `.cursor/hooks.json`                      | `templates/hooks/cursor.hooks.json`                |
| Windsurf    | `.windsurf/hooks.json`                    | `templates/hooks/windsurf.hooks.json`              |
| Gemini CLI  | `.gemini/settings.json`                   | `templates/hooks/gemini-cli.settings.json`         |
| Kiro        | `.kiro/hooks/memorix-file-save.kiro.hook` | `templates/hooks/kiro.memorix-file-save.kiro.hook` |
| Antigravity | `.agents/hooks.json`                      | `templates/hooks/antigravity.hooks.json`           |

全局级：

| 工具        | 目标路径                                                                   | 模板                                            |
| :---------- | :------------------------------------------------------------------------- | :---------------------------------------------- |
| Claude Code | `~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json` | `templates/hooks-global/claude.hooks.json`      |
| Codex       | `~/.codex/plugins/memorix/hooks/hooks.json`                                | `templates/hooks-global/codex.hooks.json`       |
| Cursor      | `~/.cursor/hooks.json`                                                     | `templates/hooks-global/cursor.hooks.json`      |
| Antigravity | `~/.gemini/config/plugins/memorix/hooks.json`                              | `templates/hooks-global/antigravity.hooks.json` |

边界说明：

- Codex 只在全局模板中出现，不要承诺项目级 Codex hooks 模板。
- Claude Code 全局路径含 `{version}`，必须动态发现已安装的最新版本目录。
- WorkBuddy 没有 hook surface：只处理 MCP 与 AGENTS guidance，不创建、不合并 `.workbuddy/hooks/`。
- ZCode 的 lifecycle 配置不由本技能维护；本技能只为检索候选捕获安装 `.zcode/config.json` 的 `PostToolUse` 条目（见 retrieval 域）。

## 高频噪音事件

| 工具        | 高频事件                                                     | 处理                  |
| :---------- | :----------------------------------------------------------- | :-------------------- |
| Claude Code | `PreToolUse`, `PostToolUse`                                  | 移除 Memorix hook     |
| Codex       | `PostToolUse`                                                | 全局模板中不保留      |
| Cursor      | `afterFileEdit`, `afterMCPExecution`, `beforeShellExecution` | 移除                  |
| Windsurf    | `post_write_code`, `post_run_command`, `post_mcp_tool_use`   | 移除                  |
| Gemini CLI  | `AfterTool`                                                  | 移除                  |
| Kiro        | `memorix-file-save` / `onFileSave`                           | 保持 `enabled: false` |
| Antigravity | `PreToolUse`, `PostToolUse`                                  | 移除                  |

不要把 `UserPromptSubmit`、`beforeSubmitPrompt`、`PreCompact`、`preCompact` 误判为噪音：它们在支持这些事件的平台上是低频生命周期节点。

## 生命周期事件

| 节点     | Claude Code        | Codex              | Cursor               | Windsurf                | Gemini CLI     | Antigravity              |
| :------- | :----------------- | :----------------- | :------------------- | :---------------------- | :------------- | :----------------------- |
| 会话开始 | `SessionStart`     | `SessionStart`     | `sessionStart`       | `pre_user_prompt`       | `SessionStart` | `PreInvocation`          |
| 用户提交 | `UserPromptSubmit` | `UserPromptSubmit` | `beforeSubmitPrompt` | -                       | -              | -                        |
| 压缩前   | `PreCompact`       | -                  | `preCompact`         | -                       | `PreCompress`  | -                        |
| 会话结束 | `Stop`             | `Stop`             | `stop`               | `post_cascade_response` | -              | `PostInvocation`, `Stop` |

Codex 缺少 `PreCompact`；不要为了凑齐「四件套」创造不存在的事件。

## 合并策略

- 已存在配置时不做全量覆盖：只移除明确属于 Memorix 的高频 hooks，补齐或保留生命周期 hooks。
- 保留用户字段：`permissions`、自定义 hooks、非 Memorix 配置、未知扩展字段。
- 同一生命周期事件已有合格 Memorix hook 时不要重复添加。
- Cursor hooks 是对象数组 `{ "command": "memorix.cmd hook" }`，不是 command 字符串数组。
- Kiro 用 `enabled: false` 禁用，不要删除文件让用户误以为没配置。
- Antigravity 保留顶层 `memorix` 结构，不改写成 Claude 风格。
- 合并前备份目标文件；写入前展示 diff 摘要并取得确认。

## 升级后回归检查

- 是否重新出现工具级事件（`PreToolUse` / `PostToolUse` / `afterFileEdit` / `AfterTool`）。
- Claude Code 全局路径是否指向新的 `{version}` 目录。
- Kiro 是否仍 `enabled: false`。
- 项目级模板是否仍在 `templates/hooks/`，全局是否仍在 `templates/hooks-global/`。
- 是否存在 WorkBuddy hooks 文件被意外创建（应始终没有）。

## 验证清单

- 作用域没有混写，写入前已确认目标路径。
- 高频事件已移除或禁用，生命周期事件仍保留。
- JSON / YAML 可解析，未知字段仍在。
- 没有承诺不存在的模板或 hook surface。
- 命令示例只有 `--help` 或 dry-run 形态，不直接改用户配置。
