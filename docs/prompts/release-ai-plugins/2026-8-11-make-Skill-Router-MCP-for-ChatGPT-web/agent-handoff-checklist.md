# Skill Router MCP Server AI Agent 交接清单

## 文档目的

避免后续 Agent 回退到旧 KV/深层索引/无 pin/单一测试/抢跑 MCP upstream/无版本发布架构。

---

# Compatibility

- [ ] Production MCP SDK 以 OpenAI 当前 ChatGPT 官方 `Build an MCP server` 指引为准。
- [ ] 当前使用 `@modelcontextprotocol/sdk` / `McpServer` / Streamable HTTP compatibility profile。
- [ ] initialization / server info / tools/list / tools/call 真实工作。
- [ ] Future MCP SDK/protocol major 只有 OpenAI current docs + Inspector + ChatGPT Web 全绿才迁移。

---

# Runtime

- [ ] Cloudflare Workers。
- [ ] Nitro v3。
- [ ] H3 由 Nitro 管理。
- [ ] 无 Node HTTP server/fs persistence。
- [ ] MVP 无 KV/R2/D1/DO。

---

# MCP Version / Tool Self-description

- [ ] MCP package 有独立 SemVer。
- [ ] `McpServer.version == package.json.version`。
- [ ] `CF_VERSION_METADATA` binding 已配置。
- [ ] buildGitSha 构建期注入。
- [ ] `get_server_info` 已实现。
- [ ] 标准 `tools/list` 完整。
- [ ] `toolDefinitions` 同时驱动 SDK registration / tools/list / get_server_info / tests。

Core tools：

```text
get_server_info
list_skills
search_skills
load_skill
```

---

# Skill Source / Snapshot

- [ ] GitHub `ai-plugins` 是 Skill Source of Truth。
- [ ] unpinned call：GITHUB_REF resolve once -> exact SHA。
- [ ] list/search 返回 sourceCommitSha。
- [ ] load 支持 optional pin。
- [ ] registry/Skill/related file 同 SHA。
- [ ] input 不能覆盖 configured owner/repo。

---

# Registry

- [ ] Registry v1 = `id/plugin/name/description/version/entry`。
- [ ] deterministic / low-churn。
- [ ] 不含 timestamp/current commit SHA。
- [ ] 不枚举 references/templates/examples。
- [ ] 多 Skill release 只生成一次 registry。

---

# 三个 Freshness Domain

## Skill data

- [ ] Skill-only Git push 后 next live call 可见。
- [ ] 不部署 Worker。
- [ ] 不刷新 ChatGPT tool metadata。

## Worker runtime

- [ ] Runtime code/config change -> MCP SemVer bump。
- [ ] Worker immutable version upload。
- [ ] Preview/Staging smoke。
- [ ] exact version production promote。
- [ ] Production smoke。

## ChatGPT tool metadata

- [ ] Tool contrac t不变：Runtime release 即可。
- [ ] Tool name/schema/description/annotation 变化：Developer Mode refresh/rescan。
- [ ] eval/use cases 重跑。
- [ ] Workspace review/publish when applicable。
- [ ] 不假设 Cloudflare deploy 自动更新 ChatGPT approved tool snapshot。

---

# Testing

- [ ] Root Vitest 3.x 不被强制升级。
- [ ] MCP package-local Vitest 4.1+ compatible Workers stack。
- [ ] Node unit。
- [ ] Workers Vitest/workerd。
- [ ] MCP SDK contract / Inspector-compatible test。
- [ ] Nitro production build。
- [ ] Wrangler createTestHarness。
- [ ] Preview/Staging smoke。
- [ ] Production read-only smoke。
- [ ] ChatGPT Web acceptance。

---

# Release Version Checks

每次 Runtime release：

- [ ] package SemVer 正确。
- [ ] get_server_info.server.version 正确。
- [ ] Worker Version ID/tag 正确。
- [ ] buildGitSha 正确。
- [ ] tools/list / get_server_info.tools 同源。
- [ ] rollback target 已知。

---

# Deployment Authority

- [ ] 只使用一个 production deployment authority。
- [ ] 推荐 GitHub Actions + package-local Wrangler。
- [ ] 如果使用 Cloudflare Git Integration，不再另设 Actions 自动 deploy 同一 Worker。
- [ ] Build Watch Paths/path filters 排除 Skill-only update 的 Worker rebuild。

---

# Rollback

- [ ] Runtime bug -> Worker rollback。
- [ ] Skill content bug -> Git revert/fix。
- [ ] Tool-contract rollback -> 同时检查 ChatGPT tool metadata snapshot compatibility。

---

# 禁止项

- [ ] 不抢跑 OpenAI 尚未明确支持的 MCP major/protocol。
- [ ] 不恢复 KV/R2 主链路。
- [ ] 不恢复 deep-file Registry mirror。
- [ ] 不用 server session 解决 Git snapshot。
- [ ] 不仅凭 git push/CI green/wrangler exit 0 声称 production 已更新。
- [ ] 不把 Worker Version ID 当 MCP SemVer。

---

# 交付证据

最终 Agent 提供：

```text
1. dependency/lockfile versions
2. server identity / package SemVer evidence
3. toolDefinitions/tools-list/get_server_info consistency evidence
4. Node/workerd/production harness test evidence
5. Worker candidate version + Preview smoke
6. production active version + smoke
7. latest/pinned Skill snapshot evidence
8. ChatGPT refresh/rescan/eval evidence（仅 Tool Contract 变化时）
9. rollback target
10. any unverified product/governance item
```
