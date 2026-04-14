<!-- 有价值报告 不予删除 -->

# 2026-04-15 Codex 与 Memorix MCP roots/list 兼容问题分析

## 报告信息

- **日期**：2026-04-15
- **问题**：Codex 新会话无法暴露 `mcp__memorix__*` 工具
- **影响范围**：Windows 下通过 Codex / VS Code 扩展接入 Memorix MCP 的场景
- **当前状态**：
  1. 本地最小绕过方案已落地：全局 Codex MCP 配置已切换为 HTTP
  2. 上游根因已定位：Memorix 在 stdio / HTTP 两条链路里都会主动发起 standalone `roots/list`
  3. 上游兼容修复尚未完成
  4. 已向上游提交中文 issue：`AVIDS2/memorix#79`

## 问题现象

用户已经确认两层状态：

1. 本机 `memorix` 服务正常，`memorix status`、`codex mcp get memorix` 均可工作
2. 但 Codex 新会话里始终没有 `mcp__memorix__*` 工具
3. `list_mcp_resources` 为空，`list_mcp_resource_templates` 里只有 `github`

这说明问题不在“项目没有记忆”，而在“当前会话没有拿到 Memorix MCP 工具注入”。

## 排查环境

- **仓库**：`d:\code\ruan-cat\monorepo`
- **系统**：Windows
- **Memorix**：`1.0.6`
- **shell 侧 codex**：`0.120.0`
- **VS Code 扩展内置 codex.exe**：`0.119.0-alpha.28`
- **关键前提**：
  - shell 侧 `codex mcp get memorix` 正常
  - `memorix status` 正常
  - 但当前 Codex 对话线程没有暴露 `mcp__memorix__*`

## 关键排查过程

### 1. 先排除 Memorix 服务本身故障

直接探测 `memorix serve` 后，可以完成 `initialize` 与 `tools/list`，且能列出完整工具集。这说明 Memorix server 本身不是“起不来”，而是“接入 Codex 会话后没有稳定完成工具注入”。

### 2. 识别 Windows 下 stdio 启动链问题

最初的全局 Codex 配置把 Memorix 写成了 stdio 命令。Windows 下这通常会经过 `pnpm`/PowerShell shim，shell 能跑，不代表 Codex 的非 shell `child_process` 启动链一定能稳定拉起。

因此先做了本地最小绕过：改用 Memorix 的 HTTP 控制面。

全局配置文件 [config.toml](/C:/Users/pc/.codex/config.toml:28) 已修改为：

```toml
[mcp_servers.memorix]
type = "http"
url = "http://127.0.0.1:3211/mcp"
```

后台控制面状态正常，最近日志如下：

```log
[memorix] HTTP transport starting on port 3211
[memorix] Project root: D:\code\ruan-cat\monorepo
[memorix] MCP Streamable HTTP Server listening on http://127.0.0.1:3211/mcp
[memorix] Dashboard:  http://127.0.0.1:3211/
```

### 3. 深挖 `roots/list` 兼容问题

前面的“切到 HTTP”只能解决启动链问题，不能解释为什么会话里仍然拿不到 Memorix 注入。因此继续追查 `roots/list`。

此前已经拿到过一条关键 Codex 运行日志：

```log
WARN rmcp::service::client: Received unexpected message Request(JsonRpcRequest { ... ListRootsRequest ... })
```

这说明 Codex client 把来自服务端的 `roots/list` 视为意外请求。

继续检查 Memorix source map 后，定位到明确调用点：

#### stdio 路径

`memorix` 在 `src/cli/commands/serve.ts` 中，在 `server.connect(transport)` 之后立刻异步请求 roots：

```ts
const tryRootsSwitch = async () => {
	const { roots } = await server.server.listRoots();
	// ...
};

tryRootsSwitch().catch(() => {});
```

#### HTTP 路径

`memorix` 在 `src/cli/commands/serve-http.ts` 中，同样主动请求 roots：

```ts
const tryRootsSwitch = async () => {
	const { roots } = await server.server.listRoots();
	// ...
};

queueMicrotask(() => {
	tryRootsSwitch().catch(() => {});
});
```

这说明：

1. `roots/list` 不是 Codex 发起的
2. 不是 SDK 高层 `McpServer` 自动代发的
3. 是 Memorix 自己显式主动调用了底层 `server.server.listRoots()`

### 4. SDK 行为边界

进一步检查 `@modelcontextprotocol/sdk` 后确认：

1. `Server.listRoots()` 确实存在，会发起 `roots/list`
2. 但其能力检查依赖 `Protocol.request()` 的 `enforceStrictCapabilities === true`
3. 也就是说，SDK 并不会默认阻止 server 在不安全时机主动发送 `roots/list`

因此这不是“SDK 自动越界”，而是“Memorix 主动使用了一个当前不适合的能力”。

## 结论

### 本地层面

本地最小绕过方案是成立的：

1. **把全局 Codex MCP 配置切到 HTTP**
2. 确保 `memorix background start` 或 `memorix serve-http --port 3211` 正常运行

这能绕开 Windows stdio/shim 启动链的脆弱点。

### 上游根因层面

真正的兼容问题主要在 **Memorix 侧实现时序**，而不是“Codex client 无理过严”。

原因如下：

1. Memorix 在 stdio / HTTP 两条链路里都主动发起 standalone `roots/list`
2. Codex 将该请求视为 `unexpected message`
3. MCP 官方已接受的 `SEP-2260` 明确要求：
   - `roots/list`
   - `sampling/createMessage`
   - `elicitation/create`
   - 都必须关联到一个正在处理的 client request
   - 不应作为独立的 server-initiated request 在会话建立后主动发出

因此，Codex 的严格处理是有规范依据的；Memorix 当前的 `roots/list` 使用方式更接近上游待修复问题。

## 建议的上游修复方案

建议 Memorix 调整为以下之一：

1. **不要在 connect 后立即主动 `listRoots()`**
2. **不要在 HTTP `queueMicrotask` 中主动 `listRoots()`**
3. 只在明确的 client request 处理链中读取 roots
4. 对无法提供 roots 的 client，优先依赖显式的 `memorix_session_start({ projectRoot })`
5. 即使保留 roots 能力，也要先确认 client 明确支持，再决定是否使用

## 本地建议

在 Memorix 上游修复前，本地建议保持：

1. 继续使用全局 Codex HTTP 配置
2. 每次新会话都显式验证是否真的注入了 `mcp__memorix__*`
3. 如仍未注入，不要先下结论说“项目没有记忆”，而要先判断是否是环境接入问题

## 可复用结论

- **问题现象**：Codex 新会话没有 `mcp__memorix__*`
- **本地最小绕过**：把全局 Codex MCP 配置从 stdio 切到 HTTP
- **真正根因**：Memorix 主动发送 standalone `roots/list`
- **责任边界**：主要是 Memorix 侧实现时序问题，Codex client 的严格处理有 MCP 规范依据
