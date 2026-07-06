---
name: init-simple-memorix
user-invocable: true
description: >-
  Use when 用户提到 init-simple-memorix、Memorix hooks 过多或噪音、项目级或全局 hooks 配置、Memorix MCP 工具缺失、full 模式、WorkBuddy MCP 启动失败、信任审批、Node 参数兼容、setup 或升级后重新精简等场景。
metadata:
  version: "2.3.0"
---

# init-simple-memorix

## Overview

本技能用于精简 Memorix hooks 和检查 Memorix MCP 配置。核心原则是先判断问题属于 hooks 噪音还是 MCP 连接/工具暴露问题，再只处理对应层面。

- hooks 目标：移除工具调用、文件编辑、命令执行等高频触发器，只保留会话生命周期事件。
- MCP 目标：确认 memorix server entry 使用 `serve --mode full`，并避免 WorkBuddy 注入的 Node 参数破坏 stdio MCP 启动。
- 分发视角：脚本、模板、源码索引都以技能安装目录为根，不引用仓库源码路径或开发期产物。

## When to Use

- 用户明确提到 `init-simple-memorix`、初始化 Memorix、精简 Memorix hooks、移除记忆噪音。
- 用户完成 Memorix setup 或升级后，怀疑默认 hooks 又引入高频噪音。
- 用户需要项目级或全局级 hooks 模板参考。
- 用户反馈 Memorix MCP 工具缺失、不是 full 模式、MCP server 启动失败。
- 用户在 WorkBuddy 中看到 memorix MCP 反复断开、审批后仍不可用、`NODE_OPTIONS` 或 Node ABI 相关错误。

## When Not to Use

- 用户只是询问如何使用已有 Memorix 工具读写记忆，且没有 hooks/MCP 配置问题。
- 用户要求记录事故、沉淀经验或同步记忆时，优先使用 `record-bug-fix-memory`。
- 用户要求发版、写 changeset、提交代码或生成报告时，本技能只提供背景信息，不接管这些流程。
- 现场症状是普通业务代码 bug、测试失败或构建失败，且没有 Memorix hooks/MCP 线索。

## Decision Path

1. 先定性问题。
   - 记忆太多、太杂、每次工具调用都记录：处理 hooks。
   - MCP 工具缺失、full 模式不可用、server 断开：检查 MCP 配置。
   - WorkBuddy 审批、Node 参数、better-sqlite3 报错：进入 WorkBuddy Notes。
2. 再定作用域。
   - 只影响当前项目：使用 `templates/` 下的项目级模板。
   - 影响用户全局 Agent：参考 `templates-global/`，但不要在未获明确授权时写入用户主目录配置。
3. 最后选执行方式。
   - 只需要确认脚本行为：运行帮助或 dry-run。
   - 需要真实写入：必须由用户明确要求，并在执行前说明会修改哪些用户配置文件。
4. hooks 噪音场景优先处理 hooks，不要把 WorkBuddy MCP 信任链路排查放到主路径上。

## Reference Routing

本技能正文只保留判断入口和高频规则。需要细节时按场景读取对应参考文件，不要一次性加载全部 references。

| 参考文件                            | 何时读取                                                                                                                         |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `references/hooks-reference.md`     | 用户要求精简 hooks、检查噪音、合并项目级/全局级 hooks，或需要旧版完整 hooks 表格与模板格式细节。                                 |
| `references/workbuddy-mcp-notes.md` | 用户反馈 WorkBuddy 中 memorix MCP 连接失败、untrusted/disabled、`Connection closed`、Node/ABI、`NODE_OPTIONS` 或审批 hash 问题。 |
| `references/memorix-setup-notes.md` | 用户刚执行 `memorix setup`、全局安装、升级 Memorix 插件，或需要理解 setup 后哪些 hooks/MCP 配置可能被覆盖。                      |

如果用户只抱怨“记忆太吵”或“每次工具调用都记录”，优先读取 `references/hooks-reference.md`。只有同时出现 MCP 连接、工具缺失、审批或 Node 错误时，才读取 `references/workbuddy-mcp-notes.md`。

## Safety Rules

- 不要主动运行 Memorix setup 或 cleanup；如果需要提命令，只提供 `--help` 或 `--dry-run` / `-DryRun` / `-d` 形式。
- 不要在未获明确授权时修改用户主目录配置。
- 不要删除用户的非 Memorix 配置字段，例如 permissions、自定义 hooks、其他 MCP server entries。
- 不要承诺不存在的模板：项目级没有 Codex hooks 模板；Codex 只在全局模板中出现。
- 不要写死 full 模式的工具数量；只要求 full 模式暴露完整工具面。
- 不要在正文命令或资源索引中引用开发期路径、测试目录、CI 配置、报告目录或依赖安装目录。
- 合并配置时保留未知字段，只精确调整 Memorix 相关 entry。

## Hooks Quick Reference

作用域模型：

| 场景     | 行为                                                                                    |
| :------- | :-------------------------------------------------------------------------------------- |
| 项目级   | 用户没有要求全局配置时，只处理当前项目根目录下的 IDE hooks 配置。                       |
| 全局级   | 用户明确要求全局、`--global`、setup 后全局精简时，才处理用户主目录下的全局 hooks 配置。 |
| 双作用域 | 用户同时需要全局和项目级时，先处理全局，再处理当前项目；不要把两类路径混在一次写入里。  |

支持的 hooks 配置目标：

| 工具        | 项目级目标                                | 全局级目标                                                                 |
| :---------- | :---------------------------------------- | :------------------------------------------------------------------------- |
| Claude Code | `.claude/settings.local.json`             | `~/.claude/plugins/cache/memorix-local/memorix/{version}/hooks/hooks.json` |
| Codex       | 不提供项目级模板                          | `~/.codex/plugins/memorix/hooks/hooks.json`                                |
| Cursor      | `.cursor/hooks.json`                      | `~/.cursor/hooks.json`                                                     |
| Windsurf    | `.windsurf/hooks.json`                    | 暂不支持                                                                   |
| Gemini CLI  | `.gemini/settings.json`                   | 暂不支持                                                                   |
| Kiro        | `.kiro/hooks/memorix-file-save.kiro.hook` | 暂不支持                                                                   |
| WorkBuddy   | `.workbuddy/hooks/hooks.json`             | 暂不支持                                                                   |
| Antigravity | `.agents/hooks.json`                      | `~/.gemini/config/plugins/memorix/hooks.json`                              |

项目级模板：

| 工具        | 模板                                         | 目标形态                                  |
| :---------- | :------------------------------------------- | :---------------------------------------- |
| Claude Code | `templates/claude-code.settings.local.json`  | `.claude/settings.local.json`             |
| Cursor      | `templates/cursor.hooks.json`                | `.cursor/hooks.json`                      |
| Windsurf    | `templates/windsurf.hooks.json`              | `.windsurf/hooks.json`                    |
| Gemini CLI  | `templates/gemini-cli.settings.json`         | `.gemini/settings.json`                   |
| Kiro        | `templates/kiro.memorix-file-save.kiro.hook` | `.kiro/hooks/memorix-file-save.kiro.hook` |
| WorkBuddy   | `templates/workbuddy.hooks.json`             | `.workbuddy/hooks/hooks.json`             |
| Antigravity | `templates/antigravity.hooks.json`           | `.agents/hooks.json`                      |

全局模板：

| 工具        | 模板                                      | 说明               |
| :---------- | :---------------------------------------- | :----------------- |
| Claude Code | `templates-global/claude.hooks.json`      | 版本目录需动态发现 |
| Codex       | `templates-global/codex.hooks.json`       | 仅全局模板         |
| Cursor      | `templates-global/cursor.hooks.json`      | 全局 hooks         |
| Antigravity | `templates-global/antigravity.hooks.json` | 全局 hooks         |

应移除或禁用的高频事件：

| 工具        | 高频噪音事件                                                 |
| :---------- | :----------------------------------------------------------- |
| Claude Code | `PreToolUse`, `PostToolUse`                                  |
| Codex       | `PostToolUse`                                                |
| Cursor      | `afterFileEdit`, `afterMCPExecution`, `beforeShellExecution` |
| Windsurf    | `post_write_code`, `post_run_command`, `post_mcp_tool_use`   |
| Gemini CLI  | `AfterTool`                                                  |
| Kiro        | 文件保存 hook 保持 `enabled: false`                          |
| WorkBuddy   | `PreToolUse`, `PostToolUse`                                  |
| Antigravity | `PreToolUse`, `PostToolUse`                                  |

应保留的生命周期事件：

| 工具        | 生命周期事件                                               |
| :---------- | :--------------------------------------------------------- |
| Claude Code | `SessionStart`, `UserPromptSubmit`, `PreCompact`, `Stop`   |
| Codex       | `SessionStart`, `UserPromptSubmit`, `Stop`                 |
| Cursor      | `sessionStart`, `beforeSubmitPrompt`, `preCompact`, `stop` |
| Windsurf    | `pre_user_prompt`, `post_cascade_response`                 |
| Gemini CLI  | `SessionStart`, `PreCompress`, `AfterAgent`                |
| WorkBuddy   | `SessionStart`, `UserPromptSubmit`, `PreCompact`, `Stop`   |
| Antigravity | `PreInvocation`, `PostInvocation`, `Stop`                  |

格式要点：

- Cursor hooks 是对象数组，例如 `{ "command": "memorix.cmd hook" }`，不是 command 字符串数组。
- WorkBuddy hooks 使用 matcher 嵌套结构，每个事件数组内包含 `{ "matcher": "*", "hooks": [...] }`。
- Antigravity 项目级模板真实存在于 `templates/antigravity.hooks.json`。
- 项目级 Codex hooks 模板不存在；Codex 只在全局模板中说明。
- Claude Code 全局路径包含 `{version}`，必须动态发现已安装的最新 Memorix 插件版本目录。
- Kiro 文件保存 hook 是通过 `enabled: false` 禁用，而不是删除文件。

合并策略：

- 已存在配置时，不做全量覆盖；只移除明确的高频 Memorix hooks，并补齐或保留生命周期 hooks。
- 保留用户字段，例如 `permissions`、`not-use-now-hooks`、自定义 hooks、非 Memorix MCP server entries。
- WorkBuddy 配置要保留 `matcher`、`description` 等结构字段，不能用模板替换导致语义丢失。
- 同一事件已有合格 lifecycle hook 时不要重复添加。
- 用户要求清理历史噪音记忆时，先说明风险；不要主动运行 `memorix cleanup`。

## MCP Full Mode

memorix MCP server entry 的通用核心要求是 `command` 与 `args` 指向 full 模式：

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

TOML 形态：

```toml
[mcpServers.memorix]
command = "memorix"
args = ["serve", "--mode", "full"]
```

脚本入口只在技能安装目录下使用：

```bash
tsx scripts/install-mcp.ts --help
tsx scripts/install-mcp.ts --dry-run
```

Windows PowerShell 兜底：

```powershell
.\fallback\install-mcp.ps1 -DryRun
```

Bash 兜底：

```bash
./fallback/install-mcp.sh -d
```

维护要点：

- `scripts/install-mcp.ts` 支持 dry-run 和额外配置文件参数；真实写入前先 dry-run。
- MCP 配置中已有 memorix entry 时，只检查 `args` 是否包含 `--mode full`。
- WorkBuddy 相关 MCP entry 应额外保留或建议 `env.NODE_OPTIONS = ""`，避免继承父进程注入的 Node 参数；当前脚本主责是校准 full args，不要声称 dry-run 一定会补齐 WorkBuddy env。

已知 MCP 配置平台：

| 平台        | 配置路径                                                    | 格式 |
| :---------- | :---------------------------------------------------------- | :--- |
| Codex       | `~/.codex/config.toml`, `~/.codex/config-2026-6-13-bg.toml` | TOML |
| Claude Code | `~/.claude.json`                                            | JSON |
| Cursor      | `~/.cursor/mcp.json`                                        | JSON |
| WorkBuddy   | `~/.workbuddy/mcp.json`, `~/.workbuddy/.mcp.json`           | JSON |
| ZCode       | `~/.zcode/cli/config.json`                                  | JSON |
| Qoder       | `~/AppData/Roaming/Qoder/SharedClientCache/mcp.json`        | JSON |
| Kiro        | `~/.kiro/settings/mcp.json`                                 | JSON |

脚本输出状态：

| 状态      | 含义                                                               |
| :-------- | :----------------------------------------------------------------- |
| `created` | 配置文件不存在，脚本会创建新文件；dry-run 下只预览。               |
| `updated` | 配置文件存在，memorix entry 需要改为 full 模式；dry-run 下只预览。 |
| `skipped` | 配置已满足要求，或 dry-run 下跳过实际写入。                        |
| `error`   | 配置解析、读写或格式处理失败，需要先排除该文件问题。               |

与 `memorix setup` / 升级配合：

- `memorix setup` 可能重新安装默认 hooks；setup 后如果用户要求降噪，应再次执行 hooks 精简。
- Memorix 插件升级后，全局 hooks 文件可能被新版本目录或默认内容覆盖；尤其是 Claude Code 全局路径含版本号，需要重新动态发现。
- MCP full 模式和 hooks 精简是两条链路：工具缺失优先查 MCP，记忆噪音优先查 hooks。

## WorkBuddy Notes

- WorkBuddy 可能向子进程注入 `NODE_OPTIONS`。旧 Node 版本不识别 `--use-system-ca` 时，stdio MCP 会在启动阶段退出。memorix MCP entry 中建议显式设置 `env.NODE_OPTIONS = ""`。
- WorkBuddy 的 MCP 信任 hash 基于 server entry 的 `JSON.stringify` 结果再做 SHA-256。任何 `mcp.json` entry 变化都可能触发重新审批。
- 修改 `mcp.json` 后需要完全重启 WorkBuddy；只刷新窗口或重开会话可能仍使用旧信任状态。
- Node 22.x 的 ABI 都是 127。同 major 内一般不需要重建 `better-sqlite3`；跨 major 升级或降级后才优先考虑 rebuild。
- `trustLevel=gray` 不是充分失败条件。判断重点是 server `status=connected`，以及 Memorix 工具是否实际暴露。
- 用户抱怨记忆噪音时，优先检查 hooks 模板和高频事件，不要先把问题归因到 MCP 信任链路。

## Verification Checklist

- YAML frontmatter 合法，`metadata.version` 已更新。
- `description` 只写触发条件，不写流程说明，不使用第一人称。
- 项目级模板表包含 `templates/antigravity.hooks.json`。
- 项目级模板表没有 Codex；Codex 只出现在 `templates-global/codex.hooks.json`。
- Cursor 格式说明是对象数组，不是 command 字符串数组。
- 文档没有写死 full 模式工具数量。
- 命令示例只有帮助或 dry-run，不会写入用户配置。
- 资源索引只列技能安装目录内的相对路径。

可建议用户或主线程运行：

```bash
tsx scripts/install-mcp.ts --help
tsx scripts/install-mcp.ts --dry-run
```

```powershell
.\fallback\install-mcp.ps1 -DryRun
```

```bash
./fallback/install-mcp.sh -d
```

## Resource Index

| 路径                                         | 用途                                                                  |
| :------------------------------------------- | :-------------------------------------------------------------------- |
| `scripts/install-mcp.ts`                     | MCP 配置检查与安装 CLI 入口                                           |
| `fallback/install-mcp.ps1`                   | Windows PowerShell 兜底入口                                           |
| `fallback/install-mcp.sh`                    | Bash 兜底入口                                                         |
| `src/platforms.ts`                           | MCP 平台注册表                                                        |
| `src/install-mcp.ts`                         | MCP 配置读写逻辑                                                      |
| `templates/`                                 | 项目级 hooks 模板目录                                                 |
| `templates/claude-code.settings.local.json`  | Claude Code 项目级模板                                                |
| `templates/cursor.hooks.json`                | Cursor 项目级模板                                                     |
| `templates/windsurf.hooks.json`              | Windsurf 项目级模板                                                   |
| `templates/gemini-cli.settings.json`         | Gemini CLI 项目级模板                                                 |
| `templates/kiro.memorix-file-save.kiro.hook` | Kiro 项目级模板                                                       |
| `templates/workbuddy.hooks.json`             | WorkBuddy 项目级模板                                                  |
| `templates/antigravity.hooks.json`           | Antigravity 项目级模板                                                |
| `templates-global/`                          | 全局 hooks 模板目录                                                   |
| `templates-global/claude.hooks.json`         | Claude Code 全局模板                                                  |
| `templates-global/codex.hooks.json`          | Codex 全局模板                                                        |
| `templates-global/cursor.hooks.json`         | Cursor 全局模板                                                       |
| `templates-global/antigravity.hooks.json`    | Antigravity 全局模板                                                  |
| `references/hooks-reference.md`              | hooks 作用域、噪音事件、生命周期事件、模板格式与合并策略详解          |
| `references/workbuddy-mcp-notes.md`          | WorkBuddy MCP 连接、信任审批、`NODE_OPTIONS`、Node ABI 与日志检查详解 |
| `references/memorix-setup-notes.md`          | `memorix setup` / 插件升级后的全局配置影响与重新精简策略              |
