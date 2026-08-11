# Skill Router MCP Server Runtime 与测试依赖版本策略

## 文档目的

本文约束 AI Agent 在实现 Skill Router MCP Server 时的依赖选择，避免错误理解 Nitro、H3、MCP SDK、Wrangler、Vitest 和 Cloudflare Workers 测试工具之间的关系。

目标：

```text
生产 Runtime 依赖稳定
+
测试 Runtime 版本兼容
+
不为了 MCP 子项目强制升级整个 monorepo
```

---

# 1. 生产依赖关系

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

协议层：

```text
Application
  |
@modelcontextprotocol/sdk
  |
MCP protocol / Streamable HTTP
```

H3 是 Nitro 管理的底层 HTTP runtime，不作为本项目独立 Web Framework 管理。

---

# 2. Nitro v3

Nitro 是应用 Runtime Framework，负责：

- build。
- route handling。
- runtime abstraction。
- Cloudflare adapter。

实现使用 Nitro v3.x。

具体 minor/patch 由实施时官方兼容情况和 `pnpm-lock.yaml` 固化。

禁止单独覆盖 Nitro 内部 runtime dependencies。

---

# 3. H3

默认不要设计成平行直接依赖：

```json
{
  "dependencies": {
    "nitro": "3.x",
    "h3": "<人工选择版本>"
  }
}
```

除非最终业务代码确实需要直接 import 一个 Nitro 没有 re-export/提供的 H3 API，并已验证兼容性。

默认：

```text
Nitro 管理 H3 版本
```

业务开发规范优先使用 Nitro v3 当前公开入口，例如仓库 `nitro-api-development` Skill 所规定的 `nitro/h3` 入口，实际 API 以实施时 Nitro v3 类型定义为准。

---

# 4. MCP SDK

直接应用依赖：

```text
@modelcontextprotocol/sdk
```

因为项目代码直接使用：

- `McpServer`。
- tool registration。
- Streamable HTTP transport/server capability。
- 测试中的 MCP client/server contract。

不要手写 MCP JSON-RPC lifecycle。

---

# 5. Wrangler

Wrangler 是项目直接开发/部署依赖，但不属于 Skill Router 领域逻辑。

负责：

- Worker build/deploy integration。
- vars / Secrets / routes / environments。
- local dev。
- production-build integration test harness。

MVP 不要求 KV/R2/D1/DO binding。

Wrangler 版本同样通过项目 package.json + lockfile 固化，不使用全局未锁版本作为 CI 真源。

---

# 6. Monorepo 当前 Vitest 约束

当前 monorepo 根测试栈仍是：

```text
vitest ^3.2.4
@vitest/ui ^3.2.4
vitest.workspace.ts
```

该测试基础设施服务整个 monorepo，不应为了一个 Cloud MCP 子项目被强制升级。

同时，Cloudflare 当前 Workers Vitest integration：

```text
@cloudflare/vitest-pool-workers
```

要求 Vitest 4.1+。

这意味着本项目不能简单复用根 Vitest 3.x 进程运行 Worker tests。

---

# 7. Cloud MCP 测试版本隔离

Skill Router MCP package 应声明 package-local 测试依赖：

```text
vitest >= 4.1（使用实施时 Cloudflare 官方支持范围）
@cloudflare/vitest-pool-workers
wrangler
```

具体建议：

```text
vitest ^4.1.0 或实施时官方要求的兼容版本
```

`@cloudflare/vitest-pool-workers` 不在规格中猜一个未来具体版本号；实现时查当前 Cloudflare 官方安装建议并通过 lockfile 固化。

原则：

1. Cloud MCP package-local Vitest 4.x。
2. monorepo root 继续保留当前 Vitest 3.x，除非有独立的全仓升级任务。
3. 不把 MCP package 强行加入现有根 `vitest.workspace.ts`。
4. MCP tests 由 package-local scripts / `pnpm --filter` 执行。
5. 不允许同一个 Vitest process 混跑根 Vitest 3 project 与 Workers Vitest 4 project。

---

# 8. 测试 Runtime 分层

## Pure Node Tests

```text
Vitest 4.x
Node environment
```

负责：

- pure domain/service。
- registry validator。
- search。
- SourceSnapshot。
- mock GitHub repository adapter。

## Cloudflare Runtime Tests

```text
Vitest 4.x
+
@cloudflare/vitest-pool-workers
+
workerd
```

负责：

- Worker APIs。
- runtime bindings。
- Worker endpoint/MCP runtime behavior。

不要给这组测试再指定自定义 Vitest environment/runner。

## Production-build Integration

```text
Vitest 4.x Node runner
+
Wrangler createTestHarness()
+
Nitro production Worker build
```

负责从 HTTP/MCP 客户端视角测试真实生产构建产物。

---

# 9. Coverage 版本注意事项

Workers Vitest integration 当前不支持 native V8 coverage 作为正常方案。

如果 Worker runtime tests 需要 coverage，应采用 Cloudflare/Vitest 当前支持的 instrumented/Istanbul 路径。

第一版不要为了覆盖率数字引入复杂覆盖工具链；关键分支行为测试优先。

---

# 10. Lockfile 规则

必须提交：

```text
pnpm-lock.yaml
```

并在 CI 使用 frozen lockfile 安装策略（按仓库既有 CI 规范）。

禁止：

- CI 临时 `pnpm add latest`。
- 本地依赖全局 Wrangler/Vitest 版本决定测试结果。
- 绕过 package-local Vitest 版本去调用根 Vitest 3.x 执行 Worker tests。

---

# 11. 升级策略

依赖升级分两类：

## MCP package 内可独立升级

```text
Nitro patch/minor（兼容验证后）
MCP SDK
Wrangler
Vitest 4.x
Workers Vitest integration
```

升级后必须跑：

```text
unit
worker runtime
production-build integration
```

## 不随 MCP 自动升级

```text
monorepo root Vitest 3.x -> 4.x
root vitest.workspace -> projects migration
```

这属于全仓测试基础设施迁移，单独处理。

---

# 12. 最终技术栈

生产：

```text
Cloudflare Workers
  ↓
Nitro v3
  ↓
Nitro-managed H3
  ↓
MCP TypeScript SDK
  ↓
Skill Router Domain Logic
```

测试：

```text
package-local Vitest 4.x
   ├─ Node unit
   ├─ Workers Vitest / workerd
   └─ Wrangler createTestHarness production-build integration
```

---

# 13. Definition of Done

- [ ] Nitro/H3 依赖边界正确。
- [ ] MCP SDK 是直接依赖。
- [ ] Wrangler 是 package-local 开发/部署依赖。
- [ ] MCP Worker tests 使用 Vitest 4.1+ 兼容版本。
- [ ] 不强制升级 root Vitest 3.x。
- [ ] 不把 Workers Vitest 4 project 混入旧 root workspace process。
- [ ] lockfile 固化实际兼容组合。
- [ ] 依赖升级必须通过三层测试。
