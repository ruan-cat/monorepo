# Skill Router MCP Server AI Agent 实施阅读计划

## 文档定位

本文用于指导后续负责实际编码的 AI Agent。

任何新的 Agent 在开始实现前必须先理解：

```text
GitHub Source of Truth
+
exact commit SourceSnapshot
+
Cloudflare Worker / Nitro v3
+
MCP TypeScript SDK
```

第一版不以 KV/R2 为前置依赖。

---

# 一、核心执行原则

必须按以下顺序建立上下文：

```text
理解目标
  ↓
理解 source freshness / consistency
  ↓
理解 runtime / MCP 边界
  ↓
实现
  ↓
测试
  ↓
部署验收
```

禁止：

- 跳过架构文档直接编码。
- 根据旧 Nitro/MCP 经验自行改架构。
- 把 Skill Router 做成执行型 Agent。
- 默认加入 KV/R2/D1。
- 手写 MCP JSON-RPC lifecycle。
- 用 mutable branch name 分别读取 registry 和 skill 文件。

---

# 二、强制阅读顺序

## 第 1 阶段：目标与架构

```text
README.md
architecture.md
implementation-spec.md
```

必须理解：

- ChatGPT Web Remote MCP 目标。
- GitHub 是 Skill Source of Truth。
- `GITHUB_REF` 只用于解析 exact commit SHA。
- 第一版不要求 Cloudflare storage。

## 第 2 阶段：Skill Registry 与发布集成

```text
skill-registry-schema.md
release-ai-plugins-registry-integration.md
```

必须理解：

- `ai-plugins/skill-registry.json` 是生成索引，不是数据库。
- registry 与 skills 一起进入 Git commit。
- registry 不包含自身 commit SHA。
- runtime 把 commit SHA 与 registry 组合为 SourceSnapshot。
- `release-ai-plugins` 应在 skill version 更新后调用独立 registry generator。
- CI 应使用 generator 的 check mode 检测 stale registry。
- 不存在 registry -> KV/R2 发布步骤。

## 第 3 阶段：Nitro / Cloudflare Runtime

```text
runtime-dependency-version-policy.md
nitro-v3-development-guide.md
nitro-v3-cloudflare-integration.md
runtime-binding-contract.md
cloudflare-worker-deployment.md
```

必须明确：

```text
Nitro v3 = application runtime
H3 = Nitro-managed HTTP runtime layer
Wrangler = Cloudflare platform/deploy
```

第一版 runtime bindings：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
```

## 第 4 阶段：MCP

```text
mcp-server-framework-selection.md
mcp-protocol-design.md
mcp-client-validation-guide.md
```

使用 MCP TypeScript SDK，不自己实现 initialize/tools/list/tools/call 协议路由。

核心 tools：

```text
list_skills
search_skills
load_skill
```

## 第 5 阶段：测试、安全、部署

```text
testing-plan.md
security-model.md
deployment-runbook.md
```

重点测试：

- registry 确定性。
- registry stale check。
- ref -> commit SHA。
- 同一 tool call 不跨 commit。
- push 新 commit 后下一次 snapshot 可看到新 HEAD。

---

# 三、推荐编码顺序

```text
1. 初始化 Nitro v3 Worker
2. 配置最小 Wrangler vars / Secret
3. 接入 MCP TypeScript SDK + Streamable HTTP
4. 创建 McpServer 与只读 tools
5. 实现 GitHub Repository Adapter
6. 实现 ref -> commit SourceSnapshot
7. 实现 registry loader / search
8. 实现 exact-SHA Skill loader
9. 完成 registry/freshness/protocol tests
10. MCP Inspector 验证
11. ChatGPT Web Developer Mode 验收
12. 最后根据实际指标决定是否需要缓存
```

禁止把“接入 KV Cache”放在 MVP 固定步骤中。

---

# 四、最终验收标准

```text
ChatGPT Web
  ↓
Remote MCP
  ↓
MCP SDK
  ↓
Skill Router
  ↓
SourceSnapshot(commit SHA)
  ↓
GitHub ai-plugins
```

必须：

- Worker 无 KV/R2 也能运行。
- `skill-registry.json` 可重复生成。
- registry 与 Skill exact-SHA 一致。
- source commit 可诊断。
- GitHub credential 只存在 repository adapter 边界。

---

# 五、最终执行优先级

```text
freshness / correctness
>
protocol compatibility
>
simple deployment/debugging
>
measured performance optimization
```

不要为了“看起来生产级”而提前增加 Cloudflare 存储组件。
