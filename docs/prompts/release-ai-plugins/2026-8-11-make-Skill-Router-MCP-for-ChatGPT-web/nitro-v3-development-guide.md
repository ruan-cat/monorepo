# Nitro v3 生产级接口开发指导

## 文档定位

本文档用于指导 AI Agent 实现 Skill Router MCP Server 时正确使用 Nitro v3 Runtime。

目标：构建运行于 Cloudflare Workers 的 Remote MCP Server。

核心链路：

```text
ChatGPT Web
   |
Streamable HTTP
   |
Nitro v3 Runtime
   |
MCP TypeScript SDK
   |
Skill Router
   |
GitHub Repository Adapter
```

---

# 1. Nitro v3 与 H3 依赖边界

本项目直接选择 Nitro v3 作为应用 Runtime。

Nitro 内部使用 H3 Runtime Layer 提供 HTTP event abstraction：

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

H3 不作为本项目独立 Web Framework 管理。

禁止为了“显式版本”自行执行：

```bash
pnpm add h3
```

然后手动 pin 与 Nitro 依赖树不同的 H3 主版本。

---

# 2. 依赖策略

直接应用依赖：

```text
nitro
@modelcontextprotocol/sdk
```

Nitro 间接 Runtime 依赖包括 H3 等，由 package-manager lockfile 固化。

Wrangler 负责 Cloudflare 开发/部署工具链。

---

# 3. MCP 与 Nitro 分工

Nitro：

- Worker runtime abstraction
- HTTP lifecycle
- routing
- Cloudflare adapter

MCP SDK：

- MCP initialization/capabilities
- tools/list
- tools/call
- JSON-RPC lifecycle
- Streamable HTTP protocol support

H3 Runtime Layer：

- Nitro 底层 HTTP/event abstraction

---

# 4. Handler 编写规范

使用当前 Nitro v3 推荐 handler 形式，handler 只做 adapter：

```ts
export default defineEventHandler(async (event) => {
  // extract request runtime
  // delegate to MCP adapter
})
```

具体 helper 名称必须以实现时 Nitro v3 官方 API 为准。

禁止：

- handler 写 Skill 搜索业务逻辑
- handler 直接拼 GitHub Authorization
- 自己创建 Node HTTP Server
- 手写 MCP JSON-RPC router

---

# 5. Cloudflare Worker 约束

禁止：

- filesystem 持久化
- `child_process`
- `listen()`
- Node HTTP server
- 依赖本地状态保存当前 skill 版本

允许并优先使用：

- `fetch`
- Web Crypto
- URL / Request / Response / Headers

Cloudflare KV、R2、D1、Durable Objects 是平台能力，不是本项目第一版依赖。

Cloudflare Cache API 也只能作为未来可选性能优化，不得参与 Source of Truth 判定。

---

# 6. GitHub SourceSnapshot

Nitro request 进入业务层后，应通过 repository/provider 建立：

```text
GITHUB_REF
   |
resolve exact commit
   |
SourceSnapshot
```

之后 registry、Skill、references 全部按该 exact SHA 读取。

Nitro/H3 handler 本身不维护 branch freshness 状态。

---

# 7. Runtime Binding

第一版只需要：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
```

不得把 `SKILL_REGISTRY` KV binding 写成必需类型。

具体 Cloudflare binding 访问方式必须查实现时 Nitro v3 adapter 文档，不能复用 Nitro v2 旧经验。

---

# 8. 错误处理

区分：

- MCP protocol/tool error
- GitHub auth/rate-limit/not-found error
- registry invalid/stale error
- skill not found
- source snapshot resolve failure

Secret 与内部 stack 不进入 MCP user-facing result。

---

# 9. AI Agent 实施检查

- [ ] 使用 Nitro v3。
- [ ] 不手动管理独立 H3 主版本。
- [ ] 使用 MCP TypeScript SDK。
- [ ] Nitro endpoint 只做 adapter。
- [ ] GitHub 读取固定 exact commit SHA。
- [ ] 无 KV/R2 也可完整运行。
- [ ] lockfile 固化实际 Nitro/H3 依赖树。
- [ ] 在真实 Worker runtime 验证。
