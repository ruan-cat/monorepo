# Skill Router MCP Server 测试方案

## 1. 测试目标

验证生产级：

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

是否可以被 ChatGPT Web Developer Mode 正常使用，并在 skills 高频更新时保证 freshness 与单请求版本一致性。

---

# 2. 测试分层

```text
Unit Test
MCP SDK Integration Test
Protocol Test
Registry Determinism Test
Source Snapshot Consistency Test
Runtime Test
Deployment Test
Security Test
Performance Test
```

---

# 3. MCP SDK 集成测试

验证：

- `McpServer` 创建成功。
- tools 注册成功。
- Streamable HTTP transport 正常。
- tool schema 和只读 annotations 正确。

核心 tools：

```text
list_skills
search_skills
load_skill
```

---

# 4. MCP 协议测试

## initialize

验证 protocol version、capabilities、server metadata。

## tools/list

必须可发现核心 tools。

## tools/call

`search_skills`：验证合法/非法输入、匹配结果和错误。

`load_skill`：验证返回 skill context、version、`sourceCommitSha`，并确认不泄露 Secret。

---

# 5. Registry Determinism 测试

对相同 working tree 连续生成两次：

```text
bytes(output1) == bytes(output2)
```

必须验证：

- skills 排序稳定。
- references 排序稳定。
- 无 timestamp / random / absolute path。
- 无 registry 自身 commit SHA。
- 新增/删除/重命名 skill 会改变 registry。
- description/version 变化会改变对应 entry。
- stale registry 的 check mode 非零退出。

---

# 6. Source Snapshot 一致性测试

这是第一版最重要的数据一致性测试。

场景：

```text
1. resolve dev -> commit A
2. 调用过程中 dev 推进到 commit B
3. 继续读取 registry / SKILL.md
```

预期：

```text
本次 tool call 全部仍读取 commit A
下一次新的 tool call 可解析到 commit B
```

禁止出现：

```text
registry @ A
SKILL.md @ B
```

测试 repository adapter 是否在获得 `SourceSnapshot.commitSha` 后只使用 exact SHA。

---

# 7. Freshness 回归测试

模拟：

```text
commit A: skill version 1.0.0
        |
push commit B: skill version 1.0.1
```

验证：

- commit A 请求可被复现。
- branch `dev` 的新 snapshot 能解析到 commit B。
- 新请求返回 B 的 registry/skill。
- 不依赖 KV purge、R2 upload 或 Worker redeploy。

---

# 8. Nitro v3 / Worker 测试

本地：

```bash
wrangler dev
```

验证：

- vars 正常。
- Secret 正常。
- Nitro Cloudflare runtime 正常。
- 无 KV/R2 binding 也能启动和完成 MCP 调用。

禁止依赖：

- `process.env`
- Node HTTP server
- filesystem
- 本地持久状态

---

# 9. GitHub Repository Adapter 测试

mock / integration 覆盖：

- resolve ref -> commit SHA。
- registry @ SHA。
- SKILL.md @ SHA。
- reference @ SHA。
- 404 / rate limit / auth failure 的领域错误转换。
- token 不进入日志或返回值。

测试应能断言读取 skill 时传入的是 `SourceSnapshot.commitSha`，而不是 `GITHUB_REF`。

---

# 10. ChatGPT Web 验收

真实流程：

```text
ChatGPT Web
  ↓
添加 Remote MCP
  ↓
initialize
  ↓
tools/list
  ↓
search_skills
  ↓
load_skill
```

技术验收优先使用 MCP Inspector，随后才做 ChatGPT Web Developer Mode 实测。

---

# 11. 性能测试

第一版需要测量而不是预设存储方案：

- GitHub 请求次数 / tool call。
- P50 / P95 tool latency。
- branch ref resolve latency。
- registry download size。
- `load_skill` 内容大小。
- GitHub rate-limit header / failure behavior。

只有指标明确说明重复 GitHub 读取是瓶颈，才进入 commit-addressed cache 设计。

---

# 12. 可选缓存未来测试

如果未来增加缓存，必须额外验证：

```text
cache key includes commit SHA
```

例如：

```text
registry:{sha}
skill:{sha}:{id}
```

新 commit 不允许错误命中旧 commit key。

这不是 MVP 验收项。

---

# 13. AI Agent 验收清单

- [ ] MCP SDK 集成完成。
- [ ] Streamable HTTP 正常。
- [ ] Registry 确定性生成通过。
- [ ] Registry stale check 通过。
- [ ] exact-commit SourceSnapshot 一致性通过。
- [ ] 高频更新 freshness 回归通过。
- [ ] Worker 无 KV/R2 也可完整运行。
- [ ] ChatGPT Web 可连接。
- [ ] Secret 未泄露。
