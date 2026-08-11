# ChatGPT Web Skill Router MCP Server 实施文档

## 文档定位

本文档集合不是普通架构说明，而是一套提供给独立 AI Agent 执行的生产级 MCP Server 实施规格。

目标：

> 让一个没有历史上下文的 AI Agent，仅依靠本目录中的文档，即可完成 Cloudflare Worker + Nitro v3 + MCP Skill Router Server 的设计、开发、测试和部署。

---

# 项目目标

构建一个可直接被 ChatGPT Web Developer Mode 使用的 Remote MCP Server。

核心目标：

- 将 `https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins` 中维护的 skills 暴露为 MCP Skill Provider。
- 使用 Cloudflare Worker 提供全球 HTTPS Serverless MCP 服务。
- 使用 Nitro v3 + H3 编写接口层。
- 使用 GitHub 作为 Skill Source of Truth。
- 使用 Cloudflare KV / Cache API 支撑高性能读取。
- 让 ChatGPT Web 可以动态发现、搜索、加载 skills 上下文。

---

# AI Agent 实施入口

如果由新的 AI Agent 接手实现，必须先阅读：

1. `README.md`
2. `architecture.md`
3. `implementation-spec.md`
4. `agent-execution-guide.md`
5. `nitro-v3-cloudflare-integration.md`

禁止跳过实施规格直接编码。

---

# 文档索引

## 架构设计

- `architecture.md`：整体系统架构、模块边界、数据流
- `implementation-spec.md`：工程实施规格

## MCP 协议

- `mcp-protocol-design.md`：MCP JSON-RPC、tools、resources 设计

## Runtime 实现

- `nitro-v3-development-guide.md`：Nitro v3 + H3 开发规范
- `nitro-v3-cloudflare-integration.md`：Nitro 与 Cloudflare Worker 边界规范
- `cloudflare-worker-deployment.md`：Cloudflare Worker 部署规范

## Skill 系统

- `skill-registry-schema.md`：Skill Registry 数据模型

## 质量保障

- `testing-plan.md`：测试策略
- `security-model.md`：安全模型

## Agent 执行与部署

- `agent-execution-guide.md`：AI Agent 实施流程
- `agent-handoff-checklist.md`：Agent 交接检查清单
- `deployment-runbook.md`：上线部署手册

---

# 核心架构

```text
ChatGPT Web Developer Mode
          |
          v
Remote MCP Client
          |
          v
Cloudflare Worker
          |
          v
Nitro v3 MCP Server
          |
   ---------------------
   |                   |
   v                   v
Skill Registry      Cache Layer
   |                   |
   v                   v
GitHub ai-plugins   Cloudflare KV
```

---

# 服务职责

Skill Router MCP Server 只负责技能能力管理。

负责：

1. 技能发现
2. 技能搜索
3. 技能加载
4. 技能版本管理
5. 技能元数据管理

不负责：

- 执行 Shell
- 修改 GitHub
- 创建 PR
- 运行 Docker
- 执行 CI

这些能力由其他 MCP Server 提供。

---

# Definition of Done

## MCP

- [ ] ChatGPT Web Developer Mode 可以添加 MCP
- [ ] initialize 成功
- [ ] tools/list 成功
- [ ] tools/call 成功

## Skill

- [ ] 可以发现 skills
- [ ] 可以搜索 skills
- [ ] 可以加载完整 skill 上下文
- [ ] 支持版本管理

## Runtime

- [ ] Cloudflare Worker 部署成功
- [ ] 无 Node 专属 API
- [ ] 无本地状态依赖

## Security

- [ ] GitHub token 不泄露
- [ ] Skill 内容经过验证
- [ ] MCP 工具权限最小化
