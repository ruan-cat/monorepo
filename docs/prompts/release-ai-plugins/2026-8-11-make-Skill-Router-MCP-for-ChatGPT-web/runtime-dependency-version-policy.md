# Skill Router MCP Server Runtime 与测试依赖版本策略

## 文档目的

本文约束 Nitro、H3、MCP SDK、Wrangler、Vitest 和 Workers testing 的版本边界。

核心：

```text
ChatGPT compatibility first
+
package-local lockfile
+
不抢跑 MCP upstream major
+
不升级整个 monorepo 测试栈
```

---

# 1. Runtime 依赖层

```text
Application
  ↓
Nitro v3
  ↓
H3 Runtime Layer (Nitro-managed)
  ↓
Cloudflare Worker Adapter
```

协议层：

```text
Application
  ↓
@modelcontextprotocol/sdk
  ↓
McpServer / Streamable HTTP
```

---

# 2. Nitro / H3

Nitro v3 负责 build/routes/runtime abstraction/Cloudflare adapter。

H3 默认由 Nitro 依赖树管理；不要人工添加一个可能冲突的 H3 主版本。

具体 Nitro minor/patch 与内部 H3 版本由 package.json + `pnpm-lock.yaml` 固化。

---

# 3. MCP SDK Production Baseline

当前 OpenAI ChatGPT 官方 `Build an MCP server` 文档明确安装：

```text
@modelcontextprotocol/sdk
zod
```

并使用：

```text
@modelcontextprotocol/sdk/server/mcp.js
```

因此当前 production direct dependencies 按该 compatibility profile 实施。

不要因为 MCP upstream 发布 SDK major/package split 就立即替换为另一套 package，除非：

```text
OpenAI current docs support
+
Inspector passes
+
ChatGPT Web Developer Mode passes
```

详细：

```text
chatgpt-web-mcp-compatibility-profile.md
```

---

# 4. MCP SDK Version Lock

实施时：

1. 核对 OpenAI 当前构建文档。
2. 核对 MCP SDK 官方 release/compatibility。
3. 选择当前 ChatGPT-compatible minor/patch。
4. `pnpm-lock.yaml` 固化 exact installed version。
5. Node/workerd/production harness/Inspector/ChatGPT 验收。

禁止 CI 使用 floating `latest` 决定生产 protocol 行为。

---

# 5. MCP Application SemVer

MCP package：

```text
package.json.version
```

是 server application version 唯一来源。

它驱动：

```text
new McpServer({ name, version })
get_server_info.server.version
Worker version tag suffix
release checks
```

详细 SemVer / production release 见：

```text
mcp-release-versioning-and-production-maintenance.md
```

---

# 6. Wrangler

Wrangler 是 package-local 开发/部署依赖，负责：

- local Worker runtime。
- vars/Secrets/routes/version metadata。
- version upload/deployment/rollback。
- production-build integration harness。

MVP 不要求 KV/R2/D1/DO。

---

# 7. Worker Version Metadata

Wrangler：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时可读：

```text
id
tag
timestamp
```

它与 MCP application SemVer 和 Skill source commit 分开。

---

# 8. Monorepo Vitest Boundary

root 当前：

```text
vitest ^3.2.4
@vitest/ui ^3.2.4
vitest.workspace.ts
```

Cloudflare Workers Vitest integration 当前要求 Vitest 4.1+。

因此 MCP package 使用 package-local Vitest 4.x compatible stack，而不是升级整个 monorepo。

---

# 9. MCP Package Test Dependencies

建议 package-local：

```text
vitest >= 4.1（按 Cloudflare 当前支持范围锁定）
@cloudflare/vitest-pool-workers
wrangler
@modelcontextprotocol/sdk
```

Node contract tests 和 Worker runtime tests 使用与 production 相同 MCP SDK package/version，避免测试与生产协议 era 漂移。

---

# 10. 测试 Runtime 分层

## Node

- registry/search。
- SourceSnapshot。
- toolDefinitions。
- get_server_info pure logic。
- GitHub fake/mock。
- server version contract。

## Workers Vitest/workerd

- bindings。
- Nitro adapter。
- MCP initialization/Streamable HTTP behavior。
- Worker version metadata。

## Production build harness

```text
Nitro production build
+
Wrangler createTestHarness()
+
MCP client/Inspector-compatible protocol calls
```

---

# 11. MCP Major/Protocol Migration Policy

Future migration only when：

```text
1. OpenAI current ChatGPT docs explicitly support/recommend new path
2. stable MCP SDK release
3. Nitro/Worker adapter compatible
4. automated tests pass
5. Inspector pass
6. ChatGPT Web real acceptance pass
7. tool contract backward compatibility assessed
8. rollback plan exists
```

不要根据 MCP upstream changelog alone 自动升级 production。

---

# 12. Root Test Stack Non-goals

MCP implementation 不要求：

```text
root Vitest 3 -> 4
root vitest.workspace.ts migration
全仓 testing refactor
```

这属于独立项目级升级。

---

# 13. Definition of Done

- [ ] Nitro/H3 边界正确。
- [ ] MCP SDK 与 OpenAI 当前 ChatGPT 官方指引一致。
- [ ] MCP SDK/Window/Workers test package 全部 lockfile 固化。
- [ ] MCP app SemVer 来自 package.json。
- [ ] CF_VERSION_METADATA 配置。
- [ ] package-local Vitest 4.1+ Workers testing。
- [ ] root Vitest 3.x 不被强制升级。
- [ ] future MCP major 有明确 ChatGPT compatibility gate。
