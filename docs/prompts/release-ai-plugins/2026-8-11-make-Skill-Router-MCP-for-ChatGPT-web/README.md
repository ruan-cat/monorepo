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

# 核心架构

```text
ChatGPT Web Developer Mode
          |
          |
          v
Remote MCP Client
          |
          |
          v
Skill Router MCP Server
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

1. 技能发现（Discovery）
2. 技能搜索（Search）
3. 技能加载（Loading）
4. 技能版本管理（Versioning）
5. 技能元数据管理（Metadata）

不负责：

- 执行 Shell 命令
- 修改 GitHub 仓库
- 创建 Pull Request
- 运行 Docker
- 执行 CI

这些能力由其他 MCP Server 提供。

---

# AI Agent 实施阅读顺序

实现 Agent 必须按照以下顺序阅读：

## 第一阶段：理解系统

1. architecture.md
2. implementation-spec.md

目标：理解整体系统边界。

---

## 第二阶段：实现协议层

3. mcp-protocol-design.md

实现：

- initialize
- tools/list
- tools/call
- JSON-RPC response

---

## 第三阶段：实现 Skill 数据层

4. skill-registry-schema.md

实现：

- metadata
- registry
- version
- KV schema

---

## 第四阶段：实现 Web Runtime

5. nitro-v3-development-guide.md
6. cloudflare-worker-deployment.md

实现：

- Nitro handler
- H3 API
- Worker adapter
- KV binding

---

## 第五阶段：验证生产质量

7. testing-plan.md
8. security-model.md

完成：

- 协议测试
- 部署测试
- 安全测试

---

# 推荐实施阶段

## Phase 1：基础工程

完成：

- Nitro v3 初始化
- Cloudflare Worker preset
- MCP endpoint

验收：

```text
GET /health
```
正常返回。

---

## Phase 2：MCP 协议

完成：

- initialize
- tools/list
- tools/call

验收：

MCP Client 可以连接。

---

## Phase 3：Skill Registry

完成：

- registry.json
- metadata parser
- skill loader

验收：

可以加载 `ai-plugins/dev-skills`。

---

## Phase 4：Cloudflare 部署

完成：

- KV
- Secret
- Custom Domain
- CI/CD

验收：

公网 HTTPS MCP Endpoint 可访问。

---

# Definition of Done

项目完成必须满足：

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
- [ ] 支持高并发读取

## Security

- [ ] GitHub token 不泄露
- [ ] Skill 内容经过验证
- [ ] MCP 工具权限最小化

---

# 最终目标

完成后架构：

```text
ChatGPT Web
     |
Developer Mode MCP
     |
Cloudflare Worker
     |
Nitro v3 MCP Server
     |
Skill Router
     |
GitHub ai-plugins
```

该系统成为个人 AI Agent Skill Platform 的基础设施。