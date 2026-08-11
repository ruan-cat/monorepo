# Skill Router MCP Server Runtime 依赖版本策略

## 文档目的

本文用于约束 AI Agent 在实现 Skill Router MCP Server 时的依赖选择，避免错误理解 Nitro、H3、MCP SDK、Wrangler 之间的关系。

目标运行环境：

- Cloudflare Workers
- Nitro v3
- MCP TypeScript SDK
- Streamable HTTP Remote MCP

---

# 1. 核心依赖关系

正确关系：

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
        |
        v
Workers Runtime
```

H3 是 Nitro 的底层 HTTP runtime 层，不应该被 AI Agent 当作独立 Web Framework 管理。

---

# 2. Nitro v3 依赖策略

Nitro 是项目主要 Runtime Framework。

负责：

- server build
- route handling
- runtime abstraction
- Cloudflare adapter

实现时优先固定 Nitro 主版本：

```text
Nitro v3.x
```

具体 patch/minor 版本由项目 package manager lockfile 管理。

禁止：

- 单独升级 Nitro 内部依赖
- 强制覆盖 Nitro 使用的 runtime 包

---

# 3. H3 依赖策略

不要直接设计：

```json
{
  "dependencies": {
    "nitro": "3.x",
    "h3": "x.x"
  }
}
```

除非业务代码明确直接 import H3 API，并经过兼容性验证。

默认策略：

```text
Nitro 管理 H3 版本
```

原因：

- 避免 Nitro 与 H3 主版本冲突。
- 避免 AI Agent 自行选择错误版本。
- 保持 Nitro 官方兼容矩阵。

---

# 4. MCP SDK 依赖策略

MCP SDK 是业务直接依赖。

原因：

项目代码需要直接使用：

- McpServer
- tool registration
- Streamable HTTP transport

依赖：

```text
@modelcontextprotocol/sdk
```

与 Nitro/H3 不同，MCP SDK 属于应用协议层。

---

# 5. Wrangler 依赖策略

Wrangler 属于部署工具：

负责：

- Worker deployment
- KV bindings
- vars
- secrets

不属于运行时代码依赖。

---

# 6. AI Agent 实施约束

禁止：

- 手动安装任意 H3 版本替换 Nitro 内部依赖。
- 根据 Nitro v2 经验推断 Nitro v3 runtime 行为。
- 将 Wrangler 配置写入 Nitro 配置。

必须：

- 使用 lockfile 固化依赖树。
- 使用官方 adapter 支持的版本组合。
- 在 Cloudflare Worker runtime 中验证。

---

# 7. 最终技术栈

```text
Cloudflare Workers
        |
        v
Nitro v3
        |
        v
H3 Runtime Layer
        |
        v
MCP TypeScript SDK
        |
        v
Skill Router Domain Logic
```
