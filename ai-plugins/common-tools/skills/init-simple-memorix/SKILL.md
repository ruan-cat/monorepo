---
name: init-simple-memorix
description: >-
  初始化或精简 Memorix hooks 配置，移除高频噪音触发器，仅保留会话生命周期事件。
  用于"初始化 memorix""精简 memorix hooks""移除 memorix 噪音""配置 memorix"
  "init-simple-memorix"等场景。支持 Claude Code、Cursor、Windsurf、Gemini CLI、Kiro、
  WorkBuddy 等多种 AI IDE/工具的 hooks 配置文件。
user-invocable: true
metadata:
  version: "1.2.0"
---

# 初始化/精简 Memorix Hooks 配置

本技能用于在任何项目中初始化或精简 Memorix 的 hooks 配置，移除高频噪音触发器，仅保留会话生命周期事件，从而减少无意义的记忆噪音，提升记忆检索质量。

## 背景与动机

Memorix 是一个跨 IDE 的 AI 记忆系统，通过 hooks 在特定事件触发时自动记录上下文。然而，某些高频 hooks（如每次工具调用、文件编辑、命令执行时触发）会产生大量无意义的噪音记忆，严重影响记忆检索质量。

**问题分析**：

- 高频 hooks 每次操作都会触发 Memorix 记录
- 产生的噪音记忆可能占比超过 60%
- 真正有价值的记忆被淹没在噪音中

**解决方案**：

- 移除高频噪音触发器
- 仅保留会话生命周期事件 hooks
- 在关键节点（会话开始、用户提交、压缩前、会话结束）记录有意义的上下文

## 支持的 IDE 配置文件

| IDE/工具      | 配置文件路径                          | 配置格式 |
| :------------ | :------------------------------------ | :------: |
| Claude Code   | `.claude/settings.local.json`         |   JSON   |
| Cursor        | `.cursor/hooks.json`                  |   JSON   |
| Windsurf      | `.windsurf/hooks.json`                |   JSON   |
| Gemini CLI    | `.gemini/settings.json`               |   JSON   |
| Kiro          | `.kiro/hooks/memorix-*.kiro.hook`     |   YAML   |
| **WorkBuddy** | `.workbuddy/hooks/hooks.json`         |   JSON   |

## 高频噪音 Hooks（需移除）

以下 hooks 属于高频噪音触发器，应该移除或禁用：

### Claude Code

- `PostToolUse` - 每次工具调用后触发
- `PreToolUse` - 每次工具调用前触发

### Cursor

- `afterFileEdit` - 每次文件编辑后触发
- `afterMCPExecution` - 每次 MCP 执行后触发
- `beforeShellExecution` - 每次 shell 命令执行前触发

### Windsurf

- `post_write_code` - 每次写入代码后触发
- `post_run_command` - 每次运行命令后触发
- `post_mcp_tool_use` - 每次 MCP 工具使用后触发

### Gemini CLI

- `AfterTool` - 每次工具调用后触发

### Kiro

- `memorix-file-save` hook（设为 `enabled: false`）

### WorkBuddy

WorkBuddy 的 hooks 系统与 Claude Code 使用相同的 hook 事件模型，其高频噪音 hooks 与 Claude Code 一致：

- `PostToolUse` - 每次工具调用后触发（如存在该配置时需移除）
- `PreToolUse` - 每次工具调用前触发（如存在该配置时需移除）

> WorkBuddy 的 hooks.json 应遵循最小化原则：**仅包含 SessionStart、UserPromptSubmit、PreCompact、Stop 四个会话生命周期事件**，不应有任何工具级高频 hooks。

## 应保留的会话生命周期 Hooks

以下 hooks 在关键节点触发，应该保留：

| 事件类型     | Claude Code        | Cursor               | Windsurf                | Gemini CLI     | **WorkBuddy**      |
| :----------- | :----------------- | :------------------- | :---------------------- | :------------- | :----------------- |
| 会话开始     | `SessionStart`     | `sessionStart`       | `pre_user_prompt`       | `SessionStart` | `SessionStart`     |
| 用户提交     | `UserPromptSubmit` | `beforeSubmitPrompt` | -                       | -              | `UserPromptSubmit` |
| 压缩前       | `PreCompact`       | `preCompact`         | -                       | `PreCompress`  | `PreCompact`       |
| 会话结束     | `Stop`             | `stop`               | `post_cascade_response` | -              | `Stop`             |
| Agent 响应后 | -                  | -                    | -                       | `AfterAgent`   | -                  |

## 配置模板

具体的 hooks 配置文件模板统一存放在 `templates/` 目录下，按 `{agent}.{文件名}` 命名。执行时读取对应模板文件写入项目根目录即可。

| 工具        | 模板文件                                  | 目标路径                    | 格式 |
| :---------- | :---------------------------------------- | :-------------------------- | :--: |
| Claude Code | `templates/claude-code.settings.local.json` | `.claude/settings.local.json` | JSON |
| Cursor      | `templates/cursor.hooks.json`               | `.cursor/hooks.json`         | JSON |
| Windsurf    | `templates/windsurf.hooks.json`             | `.windsurf/hooks.json`       | JSON |
| Gemini CLI  | `templates/gemini-cli.settings.json`        | `.gemini/settings.json`      | JSON |
| WorkBuddy   | `templates/workbuddy.hooks.json`            | `.workbuddy/hooks/hooks.json` | JSON |
| Kiro        | `templates/kiro.memorix-file-save.kiro.hook` | `.kiro/hooks/memorix-file-save.kiro.hook` | YAML |

### 各模板格式说明

- **Claude Code** — 标准 `version` + `hooks` 结构，每事件内嵌套 `hooks` 数组，无额外字段。
- **Cursor** — 事件名小写驼峰（`sessionStart`、`beforeSubmitPrompt`、`preCompact`、`stop`），hooks 为 `command` 字符串数组。
- **Windsurf** — 仅保留两个事件（`pre_user_prompt` + `post_cascade_response`），Windosw 下命令为 `cmd /c memorix hook`，需 `show_output: false`。
- **Gemini CLI** — 使用 `matcher` + 命名 hook（`name`、`type`、`command`、`description`）结构，无 `Stop` 事件，保留 `AfterAgent`。
- **WorkBuddy** — 与 Claude Code 同款事件模型（SessionStart、UserPromptSubmit、PreCompact、Stop），采用 `matcher` 嵌套结构，每个 hook 携带 `description` 字段说明语义。
- **Kiro** — YAML 格式单文件 hook，噪音控制通过 `enabled: false` 禁用而非删除文件。`event: onFileSave` 是高频噪音源，需保持禁用状态。

## 执行流程

### 步骤 1：检测项目中的 IDE 配置

扫描项目根目录，检测存在哪些 IDE 配置目录：

```bash
ls -la .claude/ .cursor/ .windsurf/ .gemini/ .kiro/ .workbuddy/ 2>/dev/null
```

### 步骤 2：处理各 IDE 配置文件

对于每个检测到的 IDE 配置：

1. **文件不存在**：使用模板创建新文件
2. **文件已存在**：
   - 读取现有配置
   - 移除高频噪音 hooks
   - 保留会话生命周期 hooks
   - 保留用户的其他自定义配置（如 `permissions`、`not-use-now-hooks` 等）
   - 写回文件

### 步骤 3：清理已有噪音记忆（可选）

如果用户要求清理已有的噪音记忆，可以运行：

```bash
memorix.cmd cleanup --noise --force
```

### 步骤 4：验证配置

确认各配置文件格式正确：

```bash
# 验证 JSON 格式
cat .claude/settings.local.json | jq . > /dev/null 2>&1 && echo "Claude Code: OK"
cat .cursor/hooks.json | jq . > /dev/null 2>&1 && echo "Cursor: OK"
cat .windsurf/hooks.json | jq . > /dev/null 2>&1 && echo "Windsurf: OK"
cat .gemini/settings.json | jq . > /dev/null 2>&1 && echo "Gemini CLI: OK"
cat .workbuddy/hooks/hooks.json | jq . > /dev/null 2>&1 && echo "WorkBuddy: OK"
```

## 自检清单

完成配置后，请逐项检查：

- [ ] 1. **高频 hooks 已移除**：
  - [ ] Claude Code: 无 `PostToolUse`、`PreToolUse`
  - [ ] Cursor: 无 `afterFileEdit`、`afterMCPExecution`、`beforeShellExecution`
  - [ ] Windsurf: 无 `post_write_code`、`post_run_command`、`post_mcp_tool_use`
  - [ ] Gemini CLI: 无 `AfterTool`
  - [ ] Kiro: `memorix-file-save` 已禁用
  - [ ] WorkBuddy: 仅包含会话生命周期事件，无工具级高频 hooks

- [ ] 2. **会话生命周期 hooks 已保留**：
  - [ ] 会话开始事件
  - [ ] 用户提交事件（如适用）
  - [ ] 压缩前事件
  - [ ] 会话结束事件

- [ ] 3. **配置文件格式正确**：
  - [ ] 所有 JSON 文件可被正确解析
  - [ ] YAML 文件格式正确

- [ ] 4. **用户自定义配置已保留**：
  - [ ] `permissions` 字段（如存在）
  - [ ] `not-use-now-hooks` 字段（如存在）
  - [ ] 其他项目特化配置

## 合并策略

### 保留用户配置

本技能采用**精确修改**策略，而非全量覆盖：

1. 保留用户已有的 `permissions`、`not-use-now-hooks` 等字段
2. 仅移除明确的高频噪音 hooks
3. 仅添加/保留会话生命周期 hooks
4. 不修改与 Memorix 无关的配置
5. **WorkBuddy 特化**：保留用户已有的 `matcher`、`description` 等 WorkBuddy 特有字段，不因模板替换而丢失

### 处理冲突

如果用户配置中同时存在噪音 hooks 和生命周期 hooks：

- 移除噪音 hooks
- 保留生命周期 hooks
- 不重复添加已存在的 hooks

## 触发场景

本技能应在以下场景**主动调用**：

### 明确触发

1. 用户提及 "init-simple-memorix"
2. 用户提及 "初始化 memorix"
3. 用户提及 "精简 memorix hooks"
4. 用户提及 "移除 memorix 噪音"

### 上下文触发

5. 用户抱怨 Memorix 记忆太多/太杂
6. 用户询问如何优化 Memorix 配置
7. 用户想要在新项目中配置 Memorix
8. 用户提到 hooks 产生太多噪音

## 注意事项

1. **Windows 兼容性**：Windsurf 配置中使用 `cmd /c memorix hook` 而非直接 `memorix.cmd hook`
2. **保留用户配置**：不要删除用户的其他自定义配置
3. **JSON 格式**：确保所有 JSON 文件格式正确，使用 2 空格缩进
4. **Kiro 特殊处理**：Kiro 使用 YAML 格式，通过 `enabled: false` 禁用而非删除
5. **WorkBuddy matcher 字段**：WorkBuddy 的 hooks 采用 matcher 嵌套结构，每个 hook 条目需包含 `matcher`（值固定为 `"*"`）、`type`、`command`、`timeout`、`description` 等字段。配置时注意保留这些结构完整性
6. **WorkBuddy 目录初始化**：若项目中尚无 `.workbuddy/hooks/` 目录，需先创建 `mkdir -p .workbuddy/hooks/`
