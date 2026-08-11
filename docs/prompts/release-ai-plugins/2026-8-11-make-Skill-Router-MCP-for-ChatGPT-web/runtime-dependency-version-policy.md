# Skill Router MCP Server Runtime 与测试依赖版本策略

## 文档目的

本文约束 Nitro、H3、MCP TypeScript SDK、Wrangler、Vitest 和 Cloudflare Workers 测试工具的版本边界。

目标：

```text
MCP 2026-07-28 modern protocol
+
Cloudflare Worker production compatibility
+
package-local test isolation
+
不顺手升级整个 monorepo
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
H3 Runtime Layer (Nitro-managed)
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
@modelcontextprotocol/server v2
  |
MCP 2026-07-28 / Streamable HTTP
```

---

# 2. Nitro v3 / H3

Nitro 负责 build、routes、runtime abstraction 和 Cloudflare adapter。

使用 Nitro v3.x；minor/patch 由实施时官方兼容情况与 `pnpm-lock.yaml` 固化。

H3 默认由 Nitro 依赖树管理，不作为平行顶层框架人工 pin。只有真实业务需要直接 import Nitro 没有公开提供的 H3 API 时，才经过兼容验证增加直接依赖。

---

# 3. MCP TypeScript SDK v2

早期规格使用：

```text
@modelcontextprotocol/sdk
```

这是 v1 单体包线，主要对应 2025-era initialize/session lifecycle。

本项目正式实现的协议基线已经冻结为：

```text
MCP 2026-07-28
```

因此服务端直接依赖使用 v2 稳定拆包：

```text
@modelcontextprotocol/server
```

测试客户端使用：

```text
@modelcontextprotocol/client
```

如确实需要 raw schemas，再按官方 v2 package boundary 使用 core package。

必须注意：

- modern era 不再把 `initialize/initialized` 当作目标生命周期。
- 实现需显式采用 SDK v2 对 `2026-07-28` 的 serving/version negotiation 能力，不要无意继续服务 legacy era。
- 具体 minor/patch 由 lockfile 固化，不以 floating `latest` 作为生产契约。

---

# 4. MCP Application SemVer

MCP package 的：

```text
package.json.version
```

是唯一：

```text
mcpServerVersion
```

来源，并用于 SDK Server identity version。

不要复制第二份手写版本常量。

PATCH/MINOR/MAJOR 规则、Worker tag 与生产发布流程见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 5. Wrangler

Wrangler 是 package-local 开发/部署依赖，负责：

- local Worker runtime。
- vars / Secrets / routes。
- Worker version upload / deployment / rollback。
- production-build integration harness。

MVP 不要求 KV/R2/D1/DO binding。

CI 不依赖某台机器全局安装的 Wrangler。

---

# 6. Cloudflare Version Metadata Binding

Wrangler config 应启用：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时可读取：

```text
Worker Version ID
Worker Version Tag
Worker Version Timestamp
```

它们与 MCP app SemVer、Skill source commit 分开表达。

---

# 7. Monorepo 当前 Vitest 边界

monorepo root 当前仍使用：

```text
vitest ^3.2.4
@vitest/ui ^3.2.4
vitest.workspace.ts
```

不要为了 MCP package 强制升级全仓。

Cloudflare Workers Vitest integration 当前要求 Vitest 4.1+，因此 Skill Router MCP 使用 package-local 测试版本隔离。

---

# 8. MCP Package-local Testing

MCP package 声明：

```text
vitest >= 4.1（锁定实施时 Cloudflare 官方支持范围）
@cloudflare/vitest-pool-workers
wrangler
```

规则：

1. MCP package-local Vitest 4.x。
2. root Vitest 3.x 保持现状。
3. 不把 Worker project 强塞进旧 root `vitest.workspace.ts` 同进程。
4. tests 用 package scripts / `pnpm --filter`。
5. lockfile 固化 Vitest/Workers pool/Wrangler/MCP SDK 兼容组合。

---

# 9. 测试 Runtime 分层

## Pure Node

负责：

- registry validator/search。
- SourceSnapshot latest/pin。
- tool definitions。
- `get_server_info` pure logic。
- GitHub adapter fake/mock。
- server identity/version contract。

## Workers Vitest / workerd

负责：

- Worker APIs。
- runtime bindings。
- MCP 2026-era endpoint behavior。
- `CF_VERSION_METADATA` binding contract。

## Production-build Integration

```text
Nitro production Worker artifact
+
Wrangler createTestHarness()
+
MCP v2 client
```

负责真实 build 的 HTTP/MCP contract。

---

# 10. Lockfile 规则

必须提交：

```text
pnpm-lock.yaml
```

禁止：

- CI 临时安装 floating `latest`。
- 用全局 Wrangler/Vitest 决定测试结果。
- Worker production server 已升级 modern v2，但 contract tests 仍只使用 v1 legacy client。
- Node tests 通过后就宣称 Cloudflare compatibility。

---

# 11. 升级策略

MCP package 可独立升级：

```text
Nitro patch/minor
@modelcontextprotocol/server/client v2
Wrangler
Vitest 4.x
Workers Vitest integration
```

每次依赖升级至少通过：

```text
Node unit
Workers Vitest/workerd
Nitro production build
createTestHarness integration
```

如果升级 protocol-visible behavior，还必须跑 Cloudflare Preview/Staging 和 ChatGPT Web acceptance。

不随 MCP 自动升级：

```text
root Vitest 3 -> 4
root workspace -> projects migration
```

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
@modelcontextprotocol/server v2
  ↓
MCP 2026-07-28
  ↓
Skill Router
```

测试：

```text
package-local Vitest 4.x
   ├─ Node unit + v2 client contract
   ├─ Workers Vitest/workerd
   └─ Wrangler production-build harness
```

---

# 13. Definition of Done

- [ ] Nitro/H3 依赖边界正确。
- [ ] 服务端使用 MCP TypeScript SDK v2 package line。
- [ ] modern protocol 目标为 `2026-07-28`。
- [ ] MCP app SemVer 来自 package.json。
- [ ] `CF_VERSION_METADATA` 进入 runtime contract。
- [ ] Wrangler/SDK/test packages 由 lockfile 固化。
- [ ] Worker tests 使用 Vitest 4.1+ 兼容版本。
- [ ] 不强制升级 root Vitest 3.x。
- [ ] 依赖升级通过开发、workerd 与 production-build 测试。
