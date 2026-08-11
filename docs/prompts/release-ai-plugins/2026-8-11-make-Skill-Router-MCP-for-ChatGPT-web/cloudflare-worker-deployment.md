# Cloudflare Worker 部署实施规范

## 1. 部署目标

将 Skill Router MCP Server 部署为面向 ChatGPT Web Developer Mode 的公网 Remote MCP 服务。

目标链路：

```text
ChatGPT Web
      |
      v
HTTPS Streamable HTTP MCP
      |
      v
Cloudflare Worker
      |
      v
Nitro v3 Runtime
      |
      v
MCP Server
      |
      v
GitHub ai-plugins @ exact commit SHA
```

第一版要求：

- 全球 HTTPS 可访问。
- Serverless 执行。
- 无 Node 长驻环境依赖。
- 支持自动部署。
- 不要求 Cloudflare KV、R2、D1 或 Durable Objects。

---

# 2. 配置职责边界

## Nitro 配置

负责：

- Nitro Cloudflare preset
- 构建行为
- route rules
- request runtime integration

## Wrangler 配置

负责：

- Worker 名称
- `compatibility_date`
- public vars
- Secret 管理
- routes / custom domain
- deployment

第一版不要求任何 Cloudflare storage binding。

禁止把 Cloudflare 平台配置复制进 `nitro.config.ts`。

---

# 3. 推荐域名

建议：

```text
mcp.ai.ruan-cat.com
```

MCP Endpoint：

```text
https://mcp.ai.ruan-cat.com/mcp
```

健康检查：

```text
GET /health
```

不要为了调试而额外暴露未受控的 GitHub proxy endpoint。

---

# 4. Worker 运行链路

```text
Request
 |
Cloudflare Edge
 |
Nitro Worker
 |
MCP SDK Adapter
 |
Skill Service
 |
GitHub Repository Adapter
 |
resolve ref -> commit SHA
 |
read registry/skill @ SHA
```

Cloudflare 只承担计算和公网入口；Skill 真源仍在 GitHub。

---

# 5. Runtime 约束

禁止：

```text
fs
child_process
listen()
node:http server
本地持久状态
```

允许：

- `fetch`
- Web Crypto
- URL / Request / Response / Headers
- Cloudflare Cache API（未来可选优化，不是必需项）

不要把“Cloudflare Worker 可使用 KV/R2”误写成“本项目必须使用 KV/R2”。

---

# 6. Wrangler 配置要求

第一版配置示意：

```toml
name = "skill-router-mcp"
compatibility_date = "2026-08-11"

[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

Secret：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止在第一版无需求情况下增加：

```toml
[[kv_namespaces]]
[[r2_buckets]]
[[d1_databases]]
```

每增加一种 binding 都会扩大部署、环境复制、权限和调试面，必须由明确指标或功能需求驱动。

---

# 7. GitHub Freshness 模型

高频更新 skills 时，运行时按请求解析：

```text
GITHUB_REF=dev
      |
      v
HEAD commit SHA
      |
      v
SourceSnapshot
```

随后读取：

```text
ai-plugins/skill-registry.json @ SHA
SKILL.md @ SHA
references @ SHA
```

这样 freshness 由 Git ref 的最新 HEAD 决定，而不是由 KV 复制延迟决定。

同一次 tool call 内固定 SHA，避免跨提交混读。

---

# 8. 可选缓存

第一版先无持久缓存上线并测量。

如果重复 GitHub 读取成为明显瓶颈，优先设计 commit-addressed cache：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

新 commit 使用新 key，不依赖主动失效旧缓存。

是否采用 Cloudflare Cache API、KV 或其他方式必须在独立性能评估后决定；R2 不属于默认升级路线。

---

# 9. 自动部署流程

```text
Git Push
 |
CI
 |
Install
 |
Build Nitro
 |
wrangler deploy
 |
MCP Smoke Test
```

Skill 内容更新本身不要求重新部署 Worker；只要 Worker 指向的 `GITHUB_REF` 已推进，新请求即可解析新 commit snapshot。

---

# 10. 验收

必须验证：

- HTTPS 正常。
- `/health` 正常。
- MCP initialize 正常。
- tools/list 正常。
- `search_skills` 正常。
- `load_skill` 正常。
- 结果包含或可诊断 `sourceCommitSha`。
- skills push 后新请求能够读取新 HEAD。
- 同一请求不跨 commit 混读。
- 无 KV/R2 binding 也可完整运行。

---

# 11. 回滚策略

Worker 代码问题：回滚 Worker deployment。

Skill 内容问题：GitHub 回滚/修复目标 branch，并通过新的 HEAD SHA 生效。

记录：

- Worker deployment version
- `GITHUB_REF`
- 每次 MCP 响应使用的 source commit SHA

不需要维护 KV registry rollback 或 R2 object rollback。

---

# 12. AI Agent 实施要求

实施顺序：

1. Nitro Worker 基础工程。
2. 最小 Wrangler vars / secret。
3. MCP SDK + Streamable HTTP。
4. GitHub SourceSnapshot Repository。
5. Skill Registry + exact-SHA loader。
6. ChatGPT Web 验证。
7. 最后才根据测量结果评估缓存。
