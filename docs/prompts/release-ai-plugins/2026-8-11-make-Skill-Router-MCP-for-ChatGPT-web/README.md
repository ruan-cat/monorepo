# ChatGPT Web Skill Router MCP Server 实施文档

## 项目目标

构建一个可直接被 ChatGPT Web Developer Mode 使用的 Remote MCP Server。

核心目标：

- 将 `ai-plugins/dev-skills` 中维护的技能体系暴露为 MCP Skill Provider。
- 使用 Cloudflare Worker 提供稳定 HTTPS MCP 服务。
- 使用 Nitro v3 + H3 编写 HTTP 接口。
- 让其他 AI Agent 可以依据本文档独立完成生产级实现。

## 文档索引

- architecture.md：整体架构设计
- implementation-spec.md：实施规格
- mcp-protocol-design.md：MCP 协议设计
- cloudflare-worker-deployment.md：Cloudflare 部署
- nitro-v3-development-guide.md：Nitro v3 开发规范
- skill-registry-schema.md：Skill Registry 数据模型
- testing-plan.md：测试方案
- security-model.md：安全模型

## 非目标

本服务不负责代码执行，不替代 GitHub MCP、Shell MCP、Docker MCP 等执行型工具。

Skill Router 负责：

1. 技能发现
2. 技能匹配
3. 技能上下文加载
4. 技能版本管理

执行能力由其他 MCP Server 提供。
