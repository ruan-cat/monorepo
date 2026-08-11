# Skill Router MCP Server 测试方案

## 1. 测试目标

验证：

```text
Cloudflare Worker
+
Nitro v3
+
MCP TypeScript SDK
+
Streamable HTTP
+
GitHub exact-commit Skill Source
```

能在“Skill 数量中等、更新频率高”的真实模式下保持 freshness、一致性和轻量维护。

---

# 2. 测试分层

```text
Unit Test
MCP SDK Integration Test
Protocol Test
Registry Determinism Test
Source Snapshot Consistency Test
Snapshot Pin Test
Runtime Test
Deployment Test
Security Test
Performance Sanity
```

---

# 3. MCP SDK 集成测试

验证：

- `McpServer` 创建。
- tools 注册。
- Streamable HTTP transport。
- tool schema/只读 annotations。

核心 tools：

```text
list_skills
search_skills
load_skill
```

---

# 4. MCP Tool Contract

## list_skills

验证：

- 返回 minimal registry summaries。
- 返回 `sourceCommitSha`。
- 不依赖 tags/references 等不存在于 v1 registry 的字段。

## search_skills

验证：

- query schema。
- `id/name/description/plugin` 匹配。
- 返回候选 + `sourceCommitSha`。
- 不逐个读取所有 Skill 正文。

## load_skill

验证两种模式：

```text
load_skill(skillId)
```

读取最新 HEAD。

```text
load_skill(skillId, sourceCommitSha=A)
```

读取 exact A。

结果包含 metadata、SKILL.md、`sourceCommitSha`，且不泄露 Secret。

---

# 5. Registry Determinism

相同 working tree 连续生成：

```text
bytes(output1) == bytes(output2)
```

验证：

- skills 排序稳定。
- property order 稳定。
- 无 timestamp/random/absolute path/current commit SHA。
- v1 不枚举 references/templates/examples。
- add/delete/rename/discovery metadata/version 变化正确。
- stale Check 非零。

---

# 6. Registry Low-Churn Test

场景：只增删/move reference/template/example 文件。

Registry schema 不应因为“深层文件列表镜像”出现字段变化。

正常 release 若该 Skill 行为发生真实变化，应通过 `metadata.version` 变化体现新版本。

该测试防止未来重新把 `references[]` 引入 v1。

---

# 7. Source Snapshot 单调用一致性

```text
resolve dev -> commit A
调用过程中 dev -> commit B
继续读取 registry / SKILL.md
```

预期：本次 call 全部 A；下一次新 unpinned call 可 B。

禁止：

```text
registry @ A
SKILL.md @ B
```

---

# 8. Search -> Load Snapshot Pin

```text
search_skills @ A
returns sourceCommitSha=A
branch moves -> B
load_skill(skillId, sourceCommitSha=A)
```

预期：仍加载 A。

另测：

```text
load_skill(skillId)
```

应读取最新 B。

还要验证：

- pin 只作用于配置好的 owner/repo。
- 调用方不能覆盖任意 repository。
- 不需要 server-side session。

---

# 9. 高频连续发布 Freshness

模拟：

```text
A: version 1.0.0
B: 1.0.1
C: 1.0.2
```

连续推进 branch，验证每个新 unpinned tool call 都可解析当时最新 HEAD；old pinned SHA 仍可复现对应 Git snapshot。

不依赖 Worker redeploy、KV purge、R2 upload。

---

# 10. GitHub Repository Adapter

覆盖：

- resolve ref -> SHA。
- registry @ SHA。
- selected SKILL.md @ SHA。
- related file @ SHA。
- exact pinned SHA。
- 404/rate limit/auth failure。
- Token 不进日志/返回值。

断言在 snapshot 建立后，读取参数使用 commit SHA 而不是 `GITHUB_REF`。

---

# 11. 深层文件按需读取

测试：

- `load_skill` 先读取 `SKILL.md`。
- 只有明确需要时才读取关联文件。
- 不默认递归加载整个 Skill 目录。
- 关联 path 限制在允许 Skill 范围。
- 关联读取全部使用相同 SHA。

---

# 12. Nitro v3 / Worker

本地：

```bash
wrangler dev
```

验证：

- vars/Secret。
- Nitro Cloudflare runtime。
- 无 KV/R2 binding 也能启动和完成 MCP 调用。

禁止依赖：

- `process.env` 作为 Cloudflare binding 方案。
- Node HTTP server。
- filesystem persistence。
- local/server session state。

---

# 13. ChatGPT Web 验收

顺序：

```text
MCP Inspector
  ↓
ChatGPT Web Developer Mode
```

真实测试：

```text
initialize
  ↓
tools/list
  ↓
search_skills
  ↓
load_skill with returned sourceCommitSha
```

同时再测试不 pin 的 latest load。

---

# 14. Performance Sanity

第一版测量而不预设存储方案：

- Skill count。
- registry byte size。
- GitHub requests/tool call。
- ref resolve latency。
- registry fetch latency。
- selected Skill fetch latency。
- P50/P95 tool latency。
- GitHub rate-limit/failure behavior。

目标：对中等 Skill 数量，单 registry 内存搜索应保持简单可接受。

只有真实数据证明成为瓶颈，才进入下一阶段优化。

---

# 15. 可选缓存未来测试

如果以后加 cache：

```text
registry:{sha}
skill:{sha}:{id}
```

验证新 commit 不错误命中旧 key。

这不是 MVP 验收项。

---

# 16. 轻量增长回归

必须定期防止架构膨胀：

- [ ] Registry 仍是单小文件 discovery index。
- [ ] 搜索仍可在内存完成。
- [ ] 无增量 Registry DB。
- [ ] 无 mandatory KV/R2/D1/DO。
- [ ] 无 vector DB/embedding pipeline。
- [ ] 无 snapshot session store。
- [ ] 深层文件未重新进入 Registry v1。

---

# 17. AI Agent 验收清单

- [ ] MCP SDK / Streamable HTTP 正常。
- [ ] minimal Registry deterministic。
- [ ] stale Check。
- [ ] exact-commit 单调用一致性。
- [ ] 高频连续更新 freshness。
- [ ] search->load snapshot pin。
- [ ] deep files 按需同 SHA。
- [ ] Worker 无 storage binding 也完整运行。
- [ ] ChatGPT Web 可连接。
- [ ] Secret 未泄露。
- [ ] 性能优化仍由真实指标触发。
