# Nitro v3 生产级接口开发指导

## 文档定位

本文档用于指导 AI Agent 实现 Skill Router MCP Server 时正确使用 Nitro v3 Runtime。

目标：构建运行于 Cloudflare Workers 的 Remote MCP Server。

核心技术链路：

```text
ChatGPT Web Developer Mode
        |
        | MCP Streamable HTTP
        v
Nitro v3 Runtime
        |
        v
MCP TypeScript SDK
        |
        v
Skill Router Services
```

---

# 1. Nitro v3 与 H3 依赖边界

本项目使用：

```text
Nitro v3
```

作为应用 Runtime。

Nitro 内部使用 H3 Runtime Layer 提供 HTTP event abstraction。

依赖关系：

```text
Application Code
        |
        v
Nitro v3
        |
        v
H3 Runtime Layer
        |
        v
Cloudflare Worker Adapter
```

重要原则：

> H3 是 Nitro Runtime 的底层 HTTP 能力，不作为本项目独立 Web Framework 管理。

禁止 AI Agent 自行：

```bash
pnpm add h3
```

然后手动 pin H3 主版本。

H3 版本应该由 Nitro v3 的依赖树和 lockfile 管理。

---

# 2. 依赖策略

直接依赖：

```text
nitro
@modelcontextprotocol/sdk
```

间接 Runtime 依赖：

```text
h3
unenv
Nitro runtime dependencies
```

不要将 Nitro 内部依赖提升为业务层依赖。

---

# 3. MCP 与 Nitro 分工

Nitro 负责：

- Worker runtime abstraction
- HTTP lifecycle
- route handling
- deployment adapter

MCP SDK 负责：

- initialize
- tools/list
- tools/call
- JSON-RPC lifecycle

H3 Runtime Layer 负责：

- event handling abstraction

---

# 4. Handler 编写规范

使用 Nitro/H3 风格：

```ts
export default defineEventHandler(async (event) => {
  // adapter only
})
```

禁止：

- 在 handler 中写业务逻辑
- 自己实现 HTTP Server
- 使用 node:http

---

# 5. Cloudflare Worker 约束

禁止：

- fs
- child_process
- listen()
- process 环境依赖
- 长驻内存状态

允许：

- fetch API
- KV
- Cache API
- Web Crypto

---

# 6. AI Agent 实施检查

- [ ] 使用 Nitro v3
- [ ] 不手动管理 H3 版本
- [ ] 使用 MCP TypeScript SDK
- [ ] 使用 Cloudflare Worker preset
- [ ] 通过 lockfile 固化依赖
- [ ] 在 Worker runtime 验证
