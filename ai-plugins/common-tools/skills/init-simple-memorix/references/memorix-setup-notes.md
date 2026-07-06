# Memorix Setup Notes

本文件用于理解 `memorix setup`、全局安装和插件升级对 hooks / MCP 配置的影响。用户刚执行 setup、升级 Memorix 插件，或怀疑默认 hooks 覆盖了精简配置时读取。

## 核心结论

- `memorix setup` 可能重新安装或覆盖默认 hooks。
- setup 后如果用户目标是“减少记忆噪音”，应再次执行 hooks 精简。
- MCP full mode 和 hooks 精简是两条链路：工具缺失优先查 MCP，记忆噪音优先查 hooks。
- 不要把 setup 验证里的通过项数量当成 full mode 工具数量；full mode 只应描述为“完整工具面”，不要写死工具数。

## 常见 agent 影响

| Agent       | setup 影响                           | hooks 关注点                                           | MCP 关注点                                    |
| :---------- | :----------------------------------- | :----------------------------------------------------- | :-------------------------------------------- |
| Claude Code | 安装本地插件、插件缓存、全局记忆指引 | hooks 位于插件缓存，路径含版本号                       | MCP 可能已存在，setup 幂等跳过。              |
| Codex       | 启用插件目录和 config 插件项         | hooks 由插件目录提供；全局模板可精简                   | Windows 下 stdio MCP 启动链需注意 shim 问题。 |
| Cursor      | 安装或更新全局 hooks / skills        | Windows hook 命令可为 `memorix.cmd hook`；检查高频事件 | MCP 通常在 `~/.cursor/mcp.json`。             |
| Antigravity | 安装 bundled plugin                  | 默认可能包含 `PreToolUse` / `PostToolUse`，需精简      | MCP 位于 Gemini/Antigravity 配置体系。        |
| Trae        | 主要是 MCP 和 rules                  | 无 hooks 系统                                          | 只处理 MCP entry。                            |
| Qoder       | 可能需要手动补齐 MCP                 | 无 hooks 系统                                          | 只处理 MCP entry。                            |

Trae / Qoder 没有 hooks 系统时，不要承诺可精简 hooks；只处理 MCP。

## setup 后的推荐流程

如果用户已经执行 setup：

1. 明确用户诉求：工具缺失还是记忆噪音。
2. 工具缺失：检查 MCP full mode、启动环境和对应 agent 的配置文件。
3. 记忆噪音：读取 `references/hooks-reference.md`，检查高频 hooks。
4. 全局 hooks：使用 `templates-global/` 作为目标形态，但不要在未授权时写入用户主目录。
5. 项目 hooks：使用 `templates/` 作为目标形态，只处理当前项目。

如果用户尚未执行 setup，不要主动运行 setup。最多提供帮助或 dry-run 类命令，让用户确认。

## 插件升级覆盖风险

| Agent       | 风险                                                                            |
| :---------- | :------------------------------------------------------------------------------ |
| Claude Code | 全局 hooks 文件路径含 `{version}`，升级后会出现新版本目录，旧精简文件不再生效。 |
| Codex       | 插件目录固定，但升级可能覆盖 hooks 文件内容。                                   |
| Cursor      | 全局 hooks 文件可能被 setup 或更新重写。                                        |
| Antigravity | bundled plugin 的 hooks 可能随插件升级恢复默认高频事件。                        |

升级后建议重新检查：

- 是否重新出现 `PreToolUse` / `PostToolUse`。
- Cursor 是否重新出现 `afterFileEdit`、`afterMCPExecution`、`beforeShellExecution`。
- Kiro 文件保存 hook 是否仍保持 `enabled: false`。
- WorkBuddy 是否仍只保留四个生命周期事件。

## Cursor Windows 命令格式

Windows 下 Cursor hooks 可使用：

```json
{ "command": "memorix.cmd hook" }
```

这比 `cmd /c memorix hook` 更直接。当前模板以 `memorix.cmd hook` 为准。

## 避免误读

- setup 端到端验证中的 “PASS 数量” 是检查项数量，不是 MCP full mode 工具数。
- 不要在文档中写死 full mode 的工具数量；不同 memorix 版本可能变化。
- setup 创建的 rules / memory 指引不等于 hooks 已精简。
- setup 幂等跳过 MCP 不代表 MCP 已是 full mode；仍需检查 args。
- hooks 精简不是 cleanup 历史记忆；不要主动清理用户已有记忆。
