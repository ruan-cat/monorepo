---
name: install-mcp
description: >-
  Use when 用户需要盘点、规划或批量安装 MCP 配置，确认各 agent 的配置目标、JSON 或 TOML 形态、合并策略、dry-run、备份或第三方 server entry 时。
user-invocable: true
metadata:
  version: "1.0.0"
---

# install-mcp

## 职责边界

本技能是 MCP 配置的清单与调度入口，不新增安装脚本。执行模型应根据本清单完成预览、备份和精确写入；本技能不替代任何专用安装器。

- Memorix full mode 的实际安装与校验交给 `init-simple-memorix`。
- 通用第三方 MCP 仅在确认 server entry schema、`command`、`args`、`env` 和信任审批影响后处理。
- 所有写入必须以保留既有配置为前提，不能覆盖其他 `mcpServers`。

## 已知配置目标

| 平台        | 配置路径                                             | 格式 |
| :---------- | :--------------------------------------------------- | :--- |
| Codex       | `~/.codex/config.toml`                               | TOML |
| Codex       | `~/.codex/config-2026-6-13-bg.toml`                  | TOML |
| Claude Code | `~/.claude.json`                                     | JSON |
| Cursor      | `~/.cursor/mcp.json`                                 | JSON |
| WorkBuddy   | `~/.workbuddy/mcp.json`                              | JSON |
| WorkBuddy   | `~/.workbuddy/.mcp.json`                             | JSON |
| ZCode       | `~/.zcode/cli/config.json`                           | JSON |
| Qoder       | `~/AppData/Roaming/Qoder/SharedClientCache/mcp.json` | JSON |
| Kiro        | `~/.kiro/settings/mcp.json`                          | JSON |

## 配置合并规则

- JSON 配置通常以 `mcpServers` 对象保存 server entries；只新增或更新目标 entry，保留未知顶层字段和其他 entries。
- TOML 配置使用其既有的 MCP server table 形态；只修改目标 table，保留注释、未知字段和其他 server tables。
- 先解析当前文件并生成 dry-run 预览，再经授权写入；真实写入前为原文件创建可识别的备份。
- 配置不存在时，先确认该平台接受的最小文件结构后才创建；配置解析失败或结构不明时停止写入并报告。
- 不用模板整体覆盖现有配置，也不假设不同平台的 JSON entry 可以直接互换。

## WorkBuddy 特别处理

WorkBuddy 可能向子进程注入 Node 参数。对需要隔离 Node 参数的 MCP entry，可建议设置 `env.NODE_OPTIONS = ""`。这是兼容性建议，不代表所有脚本或所有配置都会自动补齐该字段。

变更 WorkBuddy 的 MCP entry 可能触发新的信任审批；写入后应提示重启应用并重新确认 server 连接状态。

## Memorix 与第三方 MCP 调度

| 场景              | 调度规则                                                                          |
| :---------------- | :-------------------------------------------------------------------------------- |
| Memorix full mode | 交给 `init-simple-memorix`，不要在本技能中重复其安装细节。                        |
| 已知第三方 server | 先核对该 server 的官方 entry schema、命令、参数、环境变量和信任影响，再精确合并。 |
| 未知第三方 server | 不写入；先取得可靠配置来源与用户授权。                                            |

## Future candidates

Antigravity、Trae、Gemini CLI 等仅为候选平台。只有在找到可靠、可验证的 MCP 配置路径及其格式后，才可加入“可写目标”；不得因常见命名或历史印象写死路径。

## 执行与验收

1. 从已知配置清单中选择实际存在且获得授权的目标，确认 JSON 或 TOML 结构。
2. 构造仅影响目标 server entry 的 dry-run 变更，明确说明会保留的字段、备份位置和可能的信任审批影响。
3. 写入后重新解析配置，确认其他 `mcpServers` 未变化，并按平台要求重启或刷新后检查 server 状态。
