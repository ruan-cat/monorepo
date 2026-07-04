---
name: init-simple-memorix
user-invocable: true
description: >-
  初始化或精简 Memorix hooks 配置，移除高频噪音触发器，仅保留会话生命周期事件。
  同时维护本地 AI agent 工具的 MCP 配置，确保 memorix 以 full 模式运行（暴露全部 26 个工具）。
  支持项目级和全局级两种模式，覆盖 Claude Code、Cursor、Windsurf、Gemini CLI、Kiro、
  WorkBuddy、Codex、Antigravity 等多种 AI IDE/工具。
  用于"初始化 memorix""精简 memorix hooks""移除 memorix 噪音""配置 memorix"
  "init-simple-memorix""全局 memorix hooks""memorix 噪音全局""setup 完以后精简"
  "升级后重新精简""配置 memorix MCP""memorix full 模式""修复 memorix 工具缺失"等场景。
metadata:
  version: "2.1.0"
---

# 初始化/精简 Memorix Hooks 配置

本技能用于在任何项目或全局环境中初始化或精简 Memorix 的 hooks 配置，移除高频噪音触发器，仅保留会话生命周期事件，从而减少无意义的记忆噪音，提升记忆检索质量。

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

## 作用域

本技能支持**项目级**和**全局级**两种执行模式，通过 `--global` 参数切换：

| 模式     | 参数          | 作用范围 | 目标路径                          |
| :------- | :------------ | :------- | :-------------------------------- |
| 项目级   | 无            | 当前项目 | 项目根目录下的 IDE 配置目录       |
| 全局级   | `--global`    | 用户全局 | `~/` 下各 IDE 的全局配置目录     |

**双作用域执行模型**：

- 用户传入 `--global` → 仅执行全局模式，覆盖用户主目录下的全局 hooks 配置
- 用户在项目目录且无 `--global` → 仅执行项目模式，覆盖项目根目录下的 IDE 配置
- 用户同时需要两者 → 先执行全局模式（`--global`），再执行项目模式（无参数），分别覆盖对应作用域的配置

## 支持的 IDE 配置文件

| IDE/工具      | 项目级配置路径                        | 全局级配置路径                                               | 配置格式 |
| :------------ | :------------------------------------ | :----------------------------------------------------------- | :------: |
| Claude Code   | `.claude/settings.local.json`         | `~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json` |   JSON   |
| Codex         | `.codex/` 目录                        | `~/.codex/plugins/memorix/hooks/hooks.json`                   |   JSON   |
| Cursor        | `.cursor/hooks.json`                | `~/.cursor/hooks.json`                                        |   JSON   |
| Windsurf      | `.windsurf/hooks.json`                | -（暂不支持全局级）                                            |   JSON   |
| Gemini CLI    | `.gemini/settings.json`               | -（暂不支持全局级）                                            |   JSON   |
| Kiro          | `.kiro/hooks/memorix-*.kiro.hook`     | -（暂不支持全局级）                                            |   YAML   |
| Antigravity   | `.agents/hooks.json`                  | `~/.gemini/config/plugins/memorix/hooks.json`                |   JSON   |
| **WorkBuddy** | `.workbuddy/hooks/hooks.json`         | -（暂不支持全局级）                                            |   JSON   |

> 注：Claude 全局路径中的 `{version}` 为 Memorix 插件版本号，需动态发现。Codex 和 Antigravity 为新增支持，全局路径固定。Windsurf、Gemini CLI、Kiro、WorkBuddy 暂仅支持项目级配置。

## 高频噪音 Hooks（需移除）

以下 hooks 属于高频噪音触发器，应该移除或禁用：

### Claude Code

- `PostToolUse` - 每次工具调用后触发
- `PreToolUse` - 每次工具调用前触发

### Codex

- `PostToolUse` - 每次工具调用后触发（全局级与项目级均需移除）

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

### Antigravity

- `PreToolUse`（`matcher=*`）- 每次工具调用前触发
- `PostToolUse`（`matcher=*`）- 每次工具调用后触发

> Antigravity 的 `PreToolUse` 和 `PostToolUse` 使用 `matcher: "*"` 通配匹配，属于全局高频噪音，全局级和项目级均需移除。

## 应保留的会话生命周期 Hooks

以下 hooks 在关键节点触发，应该保留：

| 事件类型     | Claude Code        | Codex              | Cursor               | Antigravity     | Windsurf                | Gemini CLI     | **WorkBuddy**      |
| :----------- | :----------------- | :----------------- | :------------------- | :-------------- | :---------------------- | :------------- | :----------------- |
| 会话开始     | `SessionStart`     | `SessionStart`     | `sessionStart`       | `PreInvocation` | `pre_user_prompt`       | `SessionStart` | `SessionStart`     |
| 用户提交     | `UserPromptSubmit` | `UserPromptSubmit` | `beforeSubmitPrompt` | -               | -                       | -              | `UserPromptSubmit` |
| 压缩前       | `PreCompact`       | -                  | `preCompact`         | -               | -                       | `PreCompress`  | `PreCompact`       |
| 会话结束     | `Stop`             | `Stop`             | `stop`               | `PostInvocation`| `post_cascade_response` | -              | `Stop`             |
| Agent 响应后 | -                  | -                  | -                    | -               | -                       | `AfterAgent`   | -                  |
| 停止         | -                  | `Stop`             | -                    | `Stop`          | -                       | -              | -                  |

> 说明：Codex 缺少 `PreCompact` 生命周期事件，无压缩前钩子。Antigravity 使用 `PreInvocation`/`PostInvocation`/`Stop` 作为会话生命周期事件，不保留 `PreToolUse`/`PostToolUse`。

## 配置模板

### 项目级模板

具体的项目级 hooks 配置文件模板统一存放在 `templates/` 目录下，按 `{agent}.{文件名}` 命名。执行时读取对应模板文件写入项目根目录即可。

| 工具        | 模板文件                                      | 目标路径                    | 格式 |
| :---------- | :-------------------------------------------- | :-------------------------- | :--: |
| Claude Code | `templates/claude-code.settings.local.json`   | `.claude/settings.local.json` | JSON |
| Cursor      | `templates/cursor.hooks.json`                 | `.cursor/hooks.json`         | JSON |
| Windsurf    | `templates/windsurf.hooks.json`               | `.windsurf/hooks.json`       | JSON |
| Gemini CLI  | `templates/gemini-cli.settings.json`          | `.gemini/settings.json`      | JSON |
| WorkBuddy   | `templates/workbuddy.hooks.json`              | `.workbuddy/hooks/hooks.json` | JSON |
| Kiro        | `templates/kiro.memorix-file-save.kiro.hook`  | `.kiro/hooks/memorix-file-save.kiro.hook` | YAML |

### 全局级模板

全局级模板存放在 `templates-global/` 目录下，覆盖各 IDE 的全局 hooks 配置路径：

| 工具        | 模板文件                              | 目标路径                                                                    | 格式 |
| :---------- | :------------------------------------ | :-------------------------------------------------------------------------- | :--: |
| Claude Code | `templates-global/claude.hooks.json`  | `~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json`  | JSON |
| Codex       | `templates-global/codex.hooks.json`   | `~/.codex/plugins/memorix/hooks/hooks.json`                                  | JSON |
| Cursor      | `templates-global/cursor.hooks.json`  | `~/.cursor/hooks.json`                                                       | JSON |
| Antigravity | `templates-global/antigravity.hooks.json` | `~/.gemini/config/plugins/memorix/hooks.json`                            | JSON |

> 全局级 Claude 模板路径含 `{version}` 动态版本号，执行时需扫描 `~/.claude/plugins/cache/memorix-local/memorix/` 目录发现最新版本子目录。Codex、Cursor、Antigravity 全局路径固定，无需动态发现。

### 各模板格式说明

- **结构 A（Claude Code / Codex）** — 标准 `version` + `hooks` 结构，每事件内嵌套 `hooks` 数组，无额外字段。Codex 与 Claude Code 结构相同，但事件集合缺少 `PreCompact`。
- **结构 A+（WorkBuddy）** — 与 Claude Code 同款事件模型（`SessionStart`、`UserPromptSubmit`、`PreCompact`、`Stop`），标准 `version` + `hooks` 结构，但每事件采用 `matcher` 嵌套结构，每个 hook 条目携带 `description` 字段说明语义。
- **结构 B（Cursor）** — 事件名小写驼峰（`sessionStart`、`beforeSubmitPrompt`、`preCompact`、`stop`），hooks 为 `command` 字符串数组。
- **结构 C（Antigravity）** — 顶层 key 为 `"memorix"`，事件数组中直接包含扁平 hook 条目（`type`、`command`、`timeout`），保留 `PreInvocation` / `PostInvocation` / `Stop`，无 `PreToolUse` / `PostToolUse`。
- **Windsurf** — 仅保留两个事件（`pre_user_prompt` + `post_cascade_response`），Windows 下命令为 `cmd /c memorix hook`，需 `show_output: false`。
- **Gemini CLI** — 使用 `matcher` + 命名 hook（`name`、`type`、`command`、`description`）结构，无 `Stop` 事件，保留 `AfterAgent`。
- **Kiro** — YAML 格式单文件 hook，噪音控制通过 `enabled: false` 禁用而非删除文件。`event: onFileSave` 是高频噪音源，需保持禁用状态。

## 执行流程

### 步骤 0：作用域判断

根据用户是否传入 `--global` 参数决定执行模式：

- **全局模式**：用户传入 `--global` → 跳到步骤 1（全局模式）
- **项目模式**：用户无 `--global` 且当前为项目目录 → 跳到步骤 5（项目模式）
- **双模式**：用户先执行 `--global`，再执行无参数 → 先执行全局模式，再执行项目模式

### 全局模式步骤

#### 步骤 1：检测已安装的 Agent

扫描用户主目录 `~/` 下的特征目录，检测已安装并支持 Memorix 的 IDE：

```bash
ls -la ~/.claude/plugins/cache/memorix-local/ 2>/dev/null && echo "Claude Code: 已安装"
ls -la ~/.codex/plugins/memorix/ 2>/dev/null && echo "Codex: 已安装"
ls -la ~/.cursor/hooks.json 2>/dev/null && echo "Cursor: 已安装"
ls -la ~/.gemini/config/plugins/memorix/ 2>/dev/null && echo "Antigravity: 已安装"
```

> 对于 Claude Code，需进一步扫描 `~/.claude/plugins/cache/memorix-local/memorix/` 下的版本子目录以定位具体 hooks 文件路径。

#### 步骤 2：定位全局 hooks 文件

对于每个检测到的 Agent：

- **Claude Code**：动态发现 `~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json`
- **Codex**：固定路径 `~/.codex/plugins/memorix/hooks/hooks.json`
- **Cursor**：固定路径 `~/.cursor/hooks.json`
- **Antigravity**：固定路径 `~/.gemini/config/plugins/memorix/hooks.json`

#### 步骤 3：用全局模板覆盖

读取 `templates-global/` 下对应模板，覆盖目标全局 hooks 文件：

1. 若全局文件不存在 → 用模板创建新文件
2. 若全局文件已存在 → 读取现有配置，移除高频噪音 hooks，保留会话生命周期 hooks，保留其他自定义配置，写回文件

#### 步骤 4：验证并输出 diff

确认全局配置文件格式正确，并输出本次变更摘要：

```bash
# 验证 JSON 格式
cat ~/.claude/plugins/cache/memorix-local/memorix/*/hooks/hooks.json | jq . > /dev/null 2>&1 && echo "Claude Code 全局: OK"
cat ~/.codex/plugins/memorix/hooks/hooks.json | jq . > /dev/null 2>&1 && echo "Codex 全局: OK"
cat ~/.cursor/hooks.json | jq . > /dev/null 2>&1 && echo "Cursor 全局: OK"
cat ~/.gemini/config/plugins/memorix/hooks.json | jq . > /dev/null 2>&1 && echo "Antigravity 全局: OK"
```

### 项目模式步骤（现有逻辑，不变）

#### 步骤 5：检测项目中的 IDE 配置

扫描项目根目录，检测存在哪些 IDE 配置目录：

```bash
ls -la .claude/ .cursor/ .windsurf/ .gemini/ .kiro/ .workbuddy/ .codex/ .agents/ 2>/dev/null
```

#### 步骤 6：处理各 IDE 配置文件

对于每个检测到的 IDE 配置：

1. **文件不存在**：使用模板创建新文件
2. **文件已存在**：
   - 读取现有配置
   - 移除高频噪音 hooks
   - 保留会话生命周期 hooks
   - 保留用户的其他自定义配置（如 `permissions`、`not-use-now-hooks` 等）
   - 写回文件

#### 步骤 7：清理已有噪音记忆（可选）

如果用户要求清理已有的噪音记忆，可以运行：

```bash
memorix.cmd cleanup --noise --force
```

#### 步骤 8：验证配置

确认各配置文件格式正确：

```bash
# 验证 JSON 格式
cat .claude/settings.local.json | jq . > /dev/null 2>&1 && echo "Claude Code: OK"
cat .codex/hooks.json | jq . > /dev/null 2>&1 && echo "Codex: OK"
cat .cursor/hooks.json | jq . > /dev/null 2>&1 && echo "Cursor: OK"
cat .windsurf/hooks.json | jq . > /dev/null 2>&1 && echo "Windsurf: OK"
cat .gemini/settings.json | jq . > /dev/null 2>&1 && echo "Gemini CLI: OK"
cat .agents/hooks.json | jq . > /dev/null 2>&1 && echo "Antigravity: OK"
cat .workbuddy/hooks/hooks.json | jq . > /dev/null 2>&1 && echo "WorkBuddy: OK"
```

## 自检清单

完成配置后，请逐项检查：

- [ ] 1. **高频 hooks 已移除（项目级）**：
  - [ ] Claude Code: 无 `PostToolUse`、`PreToolUse`
  - [ ] Codex: 无 `PostToolUse`
  - [ ] Cursor: 无 `afterFileEdit`、`afterMCPExecution`、`beforeShellExecution`
  - [ ] Windsurf: 无 `post_write_code`、`post_run_command`、`post_mcp_tool_use`
  - [ ] Gemini CLI: 无 `AfterTool`
  - [ ] Kiro: `memorix-file-save` 已禁用
  - [ ] Antigravity: 无 `PreToolUse`、`PostToolUse`
  - [ ] WorkBuddy: 仅包含会话生命周期事件，无工具级高频 hooks

- [ ] 2. **高频 hooks 已移除（全局级）**：
  - [ ] Claude 全局: 无 `PostToolUse`、`PreToolUse`
  - [ ] Codex 全局: 无 `PostToolUse`，有 `Stop`
  - [ ] Cursor 全局: 无 `afterFileEdit`、`beforeShellExecution`、`afterMCPExecution`
  - [ ] Antigravity 全局: 无 `PreToolUse`、`PostToolUse`

- [ ] 3. **会话生命周期 hooks 已保留**：
  - [ ] 会话开始事件
  - [ ] 用户提交事件（如适用）
  - [ ] 压缩前事件（如适用）
  - [ ] 会话结束事件

- [ ] 4. **配置文件格式正确**：
  - [ ] 所有 JSON 文件可被正确解析
  - [ ] YAML 文件格式正确

- [ ] 5. **用户自定义配置已保留**：
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
5. 用户提及 "memorix setup 后处理"
6. 用户提及 "全局 memorix hooks"
7. 用户提及 "memorix 噪音全局"
8. 用户提及 "setup 完以后精简"
9. 用户提及 "升级后重新精简"（覆盖风险）

### 上下文触发

10. 用户抱怨 Memorix 记忆太多/太杂
11. 用户询问如何优化 Memorix 配置
12. 用户想要在新项目中配置 Memorix
13. 用户提到 hooks 产生太多噪音
14. 用户完成 `memorix setup` 后需要精简配置

## 注意事项

1. **Windows 兼容性**：Windsurf 配置中使用 `cmd /c memorix hook` 而非直接 `memorix.cmd hook`
2. **保留用户配置**：不要删除用户的其他自定义配置
3. **JSON 格式**：确保所有 JSON 文件格式正确，使用 2 空格缩进
4. **Kiro 特殊处理**：Kiro 使用 YAML 格式，通过 `enabled: false` 禁用而非删除
5. **WorkBuddy matcher 字段**：WorkBuddy 的 hooks 采用 matcher 嵌套结构，每个 hook 条目需包含 `matcher`（值固定为 `"*"`）、`type`、`command`、`timeout`、`description` 等字段。配置时注意保留这些结构完整性
6. **WorkBuddy 目录初始化**：若项目中尚无 `.workbuddy/hooks/` 目录，需先创建 `mkdir -p .workbuddy/hooks/`
7. **全局路径动态发现**：Claude Code 全局 hooks 路径含版本号，需扫描目录动态发现；若 Memorix 插件升级后版本号变化，原精简配置可能失效，需重新执行本技能

## 与 memorix setup 的配合

推荐工作流：

1. 先执行 `memorix setup --global`（安装 Memorix 全局插件）
2. 再执行 `init-simple-memorix --global`（精简全局 hooks 配置）
3. 如需项目级精简，再执行 `init-simple-memorix`（无参数，精简当前项目）

> 注意：`memorix setup` 会安装默认的 hooks 配置（包含高频噪音事件），`init-simple-memorix` 的作用是覆盖这些默认配置，仅保留会话生命周期事件。两者配合使用才能达到最佳效果。

## 升级覆盖风险

Memorix 插件升级后，各 IDE 的全局 hooks 配置可能被重置为默认值，导致精简配置丢失：

- **Claude Code**：`~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json` 路径含版本号，memorix 升级后版本号变化，需重新执行 `init-simple-memorix --global` 定位新路径并精简
- **Codex**：`~/.codex/plugins/memorix/hooks/hooks.json` 路径固定，但插件升级后可能覆盖文件内容，需重新精简
- **Cursor**：`~/.cursor/hooks.json` 路径固定，但 Cursor 更新后可能重置配置，需重新精简
- **Antigravity**：`~/.gemini/config/plugins/memorix/hooks.json` 路径固定，但插件升级后可能覆盖文件内容，需重新精简

**建议**：每次 Memorix 插件升级后，重新执行 `init-simple-memorix --global` 确保全局 hooks 配置保持精简。

## Memorix MCP 配置维护

除 hooks 精简外，本技能还负责维护各 AI agent 工具的 MCP（Model Context Protocol）配置文件，确保 memorix 以 `full` 模式启动，从而暴露完整的 26 个工具集（包括 `memorix_promote`、`memorix_skills` 等高级工具）。

### 背景：为什么需要维护 MCP 配置

memorix 默认以 `micro` 或 `lite` 模式运行，仅暴露 7~17 个基础工具。关键的高级工具（如 `memorix_promote`，用于将观察记忆提升为持久化 mini-skills）仅在 `full` 模式下可用。如果 MCP 配置未指定 `--mode full`，这些工具将不可用。

| 模式 | 工具数 | 说明 |
| :--- | :--- | :--- |
| `micro` | 7 个 | 默认模式，仅高信号核心工具 |
| `lite` | 17 个 | 扩展的独立记忆操作面 |
| `team` | 20 个 | lite + 团队协调工具 |
| `full` | 26 个 | team + 高级/治理工具（含 `memorix_promote`） |

### 目标 MCP 配置格式

各 agent 的 MCP 配置中，memorix 服务器的启动参数应为：

```json
{
    "mcpServers": {
        "memorix": {
            "command": "memorix",
            "args": ["serve", "--mode", "full"]
        }
    }
}
```

### 已支持的 MCP 配置平台

| 平台 | 配置文件路径（基于用户主目录） | 格式 |
| :--- | :--- | :--- |
| Codex | `~/.codex/config.toml`, `~/.codex/config-2026-6-13-bg.toml` | TOML |
| Claude Code | `~/.claude.json` | JSON |
| Cursor | `~/.cursor/mcp.json` | JSON |
| WorkBuddy | `~/.workbuddy/mcp.json`, `~/.workbuddy/.mcp.json` | JSON |
| ZCode | `~/.zcode/cli/config.json` | JSON |
| Qoder | `~/AppData/Roaming/Qoder/SharedClientCache/mcp.json` | JSON |
| Kiro | `~/.kiro/settings/mcp.json` | JSON |

> **平台扩展**：新增平台时，只需在 `src/platforms.ts` 的 `DEFAULT_MCP_PLATFORMS` 数组中追加条目即可，无需修改核心逻辑。

### 脚本入口

在 skill 安装目录下运行：

```bash
# TypeScript 主脚本（推荐，需要 tsx）
tsx scripts/install-mcp.ts

# 预览模式（不实际写入文件）
tsx scripts/install-mcp.ts --dry-run

# 额外自定义配置文件
tsx scripts/install-mcp.ts -c ~/.my-agent/mcp.json -c ~/.my-agent/extra.toml

# Windows PowerShell 兜底脚本（无 tsx 环境时使用）
.\fallback\install-mcp.ps1
.\fallback\install-mcp.ps1 -DryRun
.\fallback\install-mcp.ps1 -Config "C:\custom\mcp.json"

# Bash 兜底脚本（macOS/Linux/WSL）
./fallback/install-mcp.sh
./fallback/install-mcp.sh -d
./fallback/install-mcp.sh -c ~/.my-agent/mcp.json
```

### 执行行为

脚本对每个平台执行以下操作：

1. **扫描候选路径**：按优先级检查各平台的候选配置文件路径
2. **创建或更新**：
   - 配置文件不存在 → 创建新文件，写入完整 memorix 配置
   - 配置文件存在但无 memorix → 追加 memorix 配置，保留其他配置
   - 配置文件有 memorix 但非 full 模式 → 更新 args 为 `["serve", "--mode", "full"]`
   - 配置文件已是 full 模式 → 跳过
3. **输出结果**：每行输出一个 JSON 对象，包含 `platform`、`configFile`、`status`、`previousArgs`（如适用）

### 状态说明

| 状态 | 含义 |
| :--- | :--- |
| `created` | 配置文件不存在，已创建新文件 |
| `updated` | 配置文件已存在，已更新 memorix 配置 |
| `skipped` | 配置已是 full 模式，无需更改 |
| `error` | 处理过程中发生错误（如 JSON 解析失败） |

### 相关文件索引

| 文件 | 说明 |
| :--- | :--- |
| `src/platforms.ts` | MCP 平台注册表，定义各 agent 的配置文件路径和格式 |
| `src/install-mcp.ts` | 核心 MCP 安装逻辑，支持 JSON 和 TOML 格式 |
| `scripts/install-mcp.ts` | CLI 入口，支持 `--dry-run` 和 `--config` 参数 |
| `fallback/install-mcp.ps1` | Windows PowerShell 兜底脚本 |
| `fallback/install-mcp.sh` | Bash 兜底脚本（macOS/Linux/WSL） |

