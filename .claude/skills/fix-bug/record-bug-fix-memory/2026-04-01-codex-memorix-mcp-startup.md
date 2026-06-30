# Windows 下 Codex 无法拉起 Memorix MCP

> 原始记录时间：2026-04。本条事故在 SKILL.md 中内嵌存放，后因 record-bug-fix-memory 升级至双层存储架构而拆分为独立案例文件。文件日期取原始记录月份的首日作为归档标记。

- **问题现象**：PowerShell 里 `memorix status` 正常，`codex mcp list` 也能看到 `memorix` 配置项，但 Codex VS Code 插件的新会话始终拿不到 `mcp__memorix__*` 工具。这里应判定为**当前 session 的环境接入问题**，而不是 Memorix 没有历史数据。
- **实际根因**：`C:\Users\pc\.codex\config.toml` 里把 Memorix 配成了 `command = "memorix"`。在 Windows 下，这通常命中 `pnpm` 生成的 shim（如 `.cmd` / `.ps1`）；PowerShell 能执行它，但 Codex app-server 通过 **非 shell 的 child-process** 拉起 stdio MCP 时无法稳定执行这个 shim，导致 Memorix server 没真正启动，工具自然不会暴露到 session。
- **关键线索**：shell 内 `Get-Command memorix` 正常，不等于 Codex 能启动它。真正能打破错误假设的信号是：用 Node 的 child-process 直接 `spawn("memorix")` 失败，而改成 `node <memorix-cli-js> serve` 后可以完成 MCP `initialize` 与 `tools/list`，并列出 `memorix_session_start`、`memorix_search`、`memorix_store` 等工具。
- **关键误导点**：不要被“CLI 能跑”“`memorix status` 正常”“配置里已经有 memorix”“当前 session 没有 Memorix 工具”这几件事带偏。需要验证的是 **Codex 进程启动链**，不是用户终端能否手动执行 shim。
- **有效修复**：把 Memorix 改成显式的 `node.exe + 真实 CLI 入口 JS` 启动，例如：
  - `command = "C:\\Users\\pc\\.nvmd\\bin\\node.exe"`
  - `args = [ "C:\\Users\\pc\\AppData\\Local\\pnpm\\global\\5\\node_modules\\memorix\\dist\\cli\\index.js", "serve" ]`
  - 视情况提高 `startup_timeout_sec`，避免 VS Code 首次拉起时误判超时。
- **验证方式**：`codex mcp get memorix` 应显示新的 `command` 与 `args`；重启 VS Code 或执行 Reload Window 后，必须**新开一个 session**，再确认会话里是否暴露 `mcp__memorix__*` 工具。旧 session 不会热加载新 MCP。
- **后续约束**：以后在 Windows 上给 Codex 配 stdio MCP 时，优先避免把 `pnpm` / `npm` / PowerShell shim 当作最终 `command`，优先使用可被 child-process 直接执行的二进制，或 `node + 真实 JS 入口`。若当前 session 缺少 Memorix 工具，先查 MCP 启动链、配置文件和扩展重启状态，不要先下结论说“项目没有记忆”。
