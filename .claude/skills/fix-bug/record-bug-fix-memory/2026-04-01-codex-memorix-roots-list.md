# Codex 与 Memorix 的 roots/list 兼容问题

> 原始记录时间：2026-04。本条事故在 SKILL.md 中内嵌存放，后因 record-bug-fix-memory 升级至双层存储架构而拆分为独立案例文件。文件日期取原始记录月份的首日作为归档标记。

- **问题现象**：即使把 Windows 下的 Codex MCP 配置从 stdio 切到 HTTP，Memorix 服务也能正常启动并响应 `/mcp`，但 Codex 会话里仍然可能拿不到 `mcp__memorix__*`，且运行日志会出现 `Received unexpected message ... ListRootsRequest` 一类告警。
- **实际根因**：这不是“Memorix 没启动”，也不是“项目没有历史记忆”，而是 **Memorix 在 stdio / HTTP 两条链路里都会主动发送 standalone `roots/list`**。该请求不是嵌套在某个正在处理的 client request 中，而是会话建立后异步主动发起，触发 Codex client 的兼容性边界。
- **关键线索**：
  1. direct probe 可证明 Memorix 自身 `initialize`、`tools/list` 正常；
  2. Codex 运行日志明确出现 `Received unexpected message Request(... ListRootsRequest ...)`；
  3. source map 可定位到 Memorix 源码中的显式调用点：
     - `src/cli/commands/serve.ts`：`const { roots } = await server.server.listRoots();`
     - `src/cli/commands/serve-http.ts`：`const { roots } = await server.server.listRoots();`
- **关键误导点**：不要把“切到 HTTP 后后台健康”误判为“兼容问题已解决”。HTTP 只绕开了 Windows stdio/shim 启动链问题，**没有解决 roots/list 主动请求的协议时序问题**。
- **有效修复**：
  1. **本地最小绕过**：将全局 Codex 配置改为 HTTP：
     - `[mcp_servers.memorix]`
     - `type = "http"`
     - `url = "http://127.0.0.1:3211/mcp"`
  2. **真正上游修复**：Memorix 不应在 connect 后立即主动 `listRoots()`；应改为只在明确的 client request 处理链内读取 roots，或优先依赖 `memorix_session_start({ projectRoot })` 的显式绑定。
- **验证方式**：
  1. 本地配置验证：`codex mcp get memorix` 显示 `transport: streamable_http` 与正确的 `/mcp` URL；
  2. 控制面验证：`memorix background status` 显示 `Running & Healthy`；
  3. 根因验证：检查 source map 能定位到 `serve.ts` / `serve-http.ts` 内对 `server.server.listRoots()` 的显式调用；
  4. 协议边界验证：Codex 侧日志出现 `unexpected message ... ListRootsRequest`。
- **后续约束**：以后遇到“Codex 会话没有 Memorix 工具”时，要区分两层问题：
  1. **启动链问题**：Windows stdio/shim 是否导致 server 根本没拉起；
  2. **协议兼容问题**：服务端是否主动发送了 `roots/list` / `sampling` / `elicitation` 这类不应脱离 client request 独立发送的请求。不要把两类问题混成一个结论。
