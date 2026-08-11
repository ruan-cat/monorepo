# ChatGPT Web Skill Router MCP Server 实施文档

## 文档定位

本文档集合是一套提供给独立 AI Agent 执行的生产级 Remote MCP Server 实施规格。

目标：

> 让一个没有历史上下文的 AI Agent，仅依靠本目录文档，即可完成 Cloudflare Worker + Nitro v3 + MCP TypeScript SDK + GitHub commit-snapshot Skill Router MCP Server 的设计、开发、测试和部署。

---

# 项目目标

构建一个可直接被 ChatGPT Web Developer Mode 使用的 Remote MCP Server。

核心目标：

- 将 `ruan-cat/monorepo` 的 `ai-plugins` skills 暴露为 MCP Skill Provider。
- 使用 Cloudflare Worker 提供全球 HTTPS Serverless MCP 服务。
- 使用 Nitro v3 作为应用 Runtime；H3 由 Nitro 依赖树管理。
- 使用 MCP TypeScript SDK 实现协议层。
- 使用 Streamable HTTP 作为 Remote MCP Transport。
- 使用 GitHub 作为唯一 Skill Source of Truth。
- 每次 tool call 将 `GITHUB_REF` 解析成 exact commit SHA，再从同一 SHA 读取 registry/skill。
- 第一版不要求 Cloudflare KV、R2、D1、Durable Objects。
- 推荐维护确定性生成的 `ai-plugins/skill-registry.json` 作为机器发现索引。

---

# AI Agent 首要阅读入口

```text
ai-agent-implementation-plan.md
        ↓
README.md
        ↓
architecture.md
        ↓
implementation-spec.md
        ↓
skill-registry-schema.md
        ↓
release-ai-plugins-registry-integration.md
        ↓
nitro-v3-cloudflare-integration.md
        ↓
runtime-binding-contract.md
        ↓
mcp-server-framework-selection.md
        ↓
mcp-protocol-design.md
        ↓
testing-plan.md
```

禁止跳过阅读阶段直接编码。

---

# 核心技术决策

## MCP Framework

固定使用：

```text
@modelcontextprotocol/sdk
```

禁止手写 JSON-RPC lifecycle、自定义 MCP transport 或把普通 REST API 伪装成 MCP。

## Remote Transport

固定使用：

```text
Streamable HTTP
```

## Skill Source

固定：

```text
GitHub ai-plugins
+
request-scoped exact commit SHA
```

不要把 Cloudflare KV/R2 当成 Skill 真源。

## Freshness

```text
GITHUB_REF=dev
      |
      v
resolve HEAD -> commit SHA
      |
      +-- registry @ SHA
      +-- SKILL.md @ SHA
      +-- references @ SHA
```

一次 tool call 内不跨 commit 混读；下一次新的 tool call 可以解析新的 branch HEAD。

---

# 文档索引

## 架构设计

- `architecture.md`：整体架构、SourceSnapshot、一致性和缓存边界
- `implementation-spec.md`：工程实施规格
- `runtime-dependency-version-policy.md`：Nitro/H3/MCP SDK 依赖层与版本策略

## Skill 系统

- `skill-registry-schema.md`：`ai-plugins/skill-registry.json` 的确定性 schema 与生成规范
- `release-ai-plugins-registry-integration.md`：本 MCP 规格包与 release 专项改造包之间的桥接契约

### `release-ai-plugins` 专项改造提示词包

真正实现 `release-ai-plugins` 的 registry generator、写入白名单、DryRun/Apply、CI stale gate 和测试时，必须继续阅读：

```text
docs/prompts/release-ai-plugins/
└── 2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/
```

该目录是 `release-ai-plugins` 支持 `Skill-Router-MCP` 的专项权威实施提示词，不要在本目录重复维护两套实现细节。

## MCP 协议

- `mcp-server-framework-selection.md`：MCP 框架选型
- `mcp-protocol-design.md`：MCP SDK、transport、tools 设计
- `mcp-client-validation-guide.md`：客户端连接验收

## Runtime / Cloudflare

- `nitro-v3-development-guide.md`：Nitro v3 Runtime 开发规范
- `nitro-v3-cloudflare-integration.md`：Nitro 与 Cloudflare Worker 边界规范
- `runtime-binding-contract.md`：vars / secret 与 request runtime 契约
- `cloudflare-worker-deployment.md`：无存储 binding 的第一版部署规范
- `cloudflare-ai-gateway-strategy.md`：未来模型调用扩展策略

## 质量与交接

- `testing-plan.md`：协议、registry、freshness、一致性测试
- `security-model.md`：安全模型
- `ai-agent-implementation-plan.md`：AI Agent 阅读与实施计划
- `agent-execution-guide.md`：Agent 执行流程
- `agent-handoff-checklist.md`：交接检查
- `deployment-runbook.md`：生产部署和回滚

---

# 最终架构

```text
ChatGPT Web Developer Mode
          |
          v
Remote MCP Client
          |
          v
Streamable HTTP
          |
          v
Cloudflare Worker
          |
          v
Nitro v3 Runtime
          |
          v
MCP TypeScript SDK / McpServer
          |
          v
Skill Router Tools
          |
          v
Skill Services
          |
          v
GitHub Repository Adapter
          |
          v
SourceSnapshot(commit SHA)
          |
          +-- ai-plugins/skill-registry.json @ SHA
          +-- Skill files @ SHA
```

---

# 为什么第一版不使用 KV / R2

该项目的真实工作流是 skills 高频更新，因此第一优先级是最新 commit 可见和版本可复现，而不是复制到第二套存储。

第一版采用 GitHub exact-commit reads 可以避免：

- KV eventual-consistency freshness 问题成为主链路依赖。
- R2/KV binding 增加本地与生产配置面。
- GitHub -> Cloudflare storage 同步 pipeline 的额外失败点。
- Skill 内容更新要求 Worker/storage 同步后才可见。

只有真实性能数据证明需要时，再设计 commit-addressed cache。

---

# 服务职责

Skill Router 负责：

1. 技能发现。
2. 技能搜索。
3. 技能加载。
4. 技能版本与 source commit 报告。
5. Registry 读取和一致性校验。

不负责：

- 执行 Shell。
- 修改 GitHub。
- 创建 PR。
- 运行 Docker / CI。
- 同步 KV/R2。

---

# Definition of Done

## MCP

- [ ] ChatGPT Web Developer Mode 可以添加 MCP。
- [ ] MCP SDK / Streamable HTTP 正常。
- [ ] initialize / tools/list / tools/call 成功。

## Skill

- [ ] `ai-plugins/skill-registry.json` 可确定性生成和校验。
- [ ] `release-ai-plugins` 已有明确 registry generator 集成契约。
- [ ] 2026-8-12 `release-ai-plugins` 专项改造提示词包完整。
- [ ] 可以发现、搜索、加载 skills。
- [ ] 同一 tool call 的 registry / skill 来自同一 commit SHA。
- [ ] 新 push 后下一次新 snapshot 能看到新 HEAD。

## Runtime

- [ ] Cloudflare Worker 部署成功。
- [ ] 无 KV/R2 binding 也可完整工作。
- [ ] 无 Node Server 专属 API。

## Security

- [ ] GitHub Token 不泄露。
- [ ] GitHub 权限只读、最小化。
- [ ] MCP 工具默认只读、非破坏性。
