# Skill Router MCP Server AI Agent 实施阅读计划

## 文档定位

本文约束后续实际编码 Agent 的阅读、实现和发版顺序。

任何 Agent 开始前必须理解：

```text
ChatGPT compatibility first
+
GitHub Skill Source of Truth
+
exact commit SourceSnapshot
+
Cloudflare versioned Worker release
+
Skill data / Worker runtime / ChatGPT tool metadata 三类 freshness
```

---

# 一、执行优先级

```text
ChatGPT real compatibility
>
freshness / correctness
>
protocol/tool backward compatibility
>
production version visibility / rollback
>
低维护成本
>
measured optimization
```

禁止：

- 抢跑 OpenAI 尚未确认支持的 MCP major/protocol。
- 默认 KV/R2/D1/DO/vector DB。
- 手写 MCP lifecycle。
- mutable ref 跨多个 Skill file 独立读取。
- 为高频更新建立 server-side snapshot session。

---

# 二、强制阅读顺序

## 阶段 1：项目目标 / Compatibility

```text
README.md
architecture.md
implementation-spec.md
chatgpt-web-mcp-compatibility-profile.md
```

必须理解：生产 SDK/协议基线以 OpenAI 当前 ChatGPT 官方文档和真实 Developer Mode 验收为准。

## 阶段 2：Skill / 高频维护

```text
high-frequency-skill-churn-strategy.md
skill-registry-schema.md
release-ai-plugins-registry-integration.md
```

真正修改 release generator/registry 时进入：

```text
../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

## 阶段 3：Runtime / Dependencies

```text
runtime-dependency-version-policy.md
nitro-v3-development-guide.md
nitro-v3-cloudflare-integration.md
runtime-binding-contract.md
cloudflare-worker-deployment.md
```

## 阶段 4：MCP

```text
mcp-server-framework-selection.md
mcp-protocol-design.md
mcp-client-validation-guide.md
```

Core tools：

```text
get_server_info
list_skills
search_skills
load_skill
```

## 阶段 5：Release / Testing

```text
mcp-release-versioning-and-production-maintenance.md
vitest-development-testing-strategy.md
cloudflare-worker-production-testing-strategy.md
testing-plan.md
deployment-runbook.md
security-model.md
```

---

# 三、推荐编码顺序

```text
1. MCP package + SemVer + lockfile
2. Nitro v3 Worker + minimal Wrangler
3. OpenAI-current @modelcontextprotocol/sdk / McpServer
4. unified toolDefinitions
5. get_server_info
6. CF_VERSION_METADATA + buildGitSha
7. GitHub Repository Adapter
8. latest/pinned SourceSnapshot
9. registry loader + in-memory search
10. exact-SHA load_skill + related-file on-demand
11. Node/workerd/MCP SDK contract tests
12. Nitro production build + createTestHarness
13. Worker versions upload + Preview/Staging
14. exact production promote + smoke
15. ChatGPT Developer Mode acceptance
16. 如果 tool contract 变化，refresh/rescan + eval + workspace review/publish
```

---

# 四、三种发布不要混

## Skill-only

```text
ai-plugins change
 -> release-ai-plugins
 -> Git push
 -> next Skill call sees new snapshot
```

无 Worker deploy、无 ChatGPT tool refresh。

## Runtime Internal

```text
SemVer + versioned Worker release + smoke
```

如果 tool schema/metadata 不变，发布到此完成。

## Tool Contract

```text
Worker release
+
ChatGPT refresh/rescan
+
evaluation
+
workspace review/publish when applicable
```

---

# 五、版本查询能力

Agent 必须实现：

```text
McpServer.version = package.json.version
```

标准：

```text
tools/list
```

额外诊断：

```text
get_server_info
```

返回 MCP app version、Worker version metadata、buildGitSha、registry schema、tool catalog。

---

# 六、生产发版 Gate

```text
all tests
  ↓
versions upload
  ↓
Preview/Staging smoke
  ↓
exact version 100% promote
  ↓
Production smoke
```

不能只凭 git push / CI green / Wrangler exit 0 声称线上已升级。

生产 smoke 必须能通过 `get_server_info` 确认 exact MCP/Worker/build version。

---

# 七、OpenAI Compatibility Upgrade Gate

未来 MCP SDK/protocol major 迁移只有在：

```text
OpenAI current docs support
Inspector pass
ChatGPT Web Developer Mode pass
```

才进入 production baseline。

---

# 八、最终验收

- [ ] OpenAI-current MCP initialization/Streamable HTTP 正常。
- [ ] server version 来自 package.json。
- [ ] get_server_info 可查生产版本。
- [ ] tools/list 完整且与 toolDefinitions 同源。
- [ ] latest/pin 正常。
- [ ] Skill-only release 轻量。
- [ ] Worker runtime versioned release 可回滚。
- [ ] Tool contract update 有 ChatGPT refresh/review gate。
- [ ] Future MCP major 不抢跑 ChatGPT compatibility。
