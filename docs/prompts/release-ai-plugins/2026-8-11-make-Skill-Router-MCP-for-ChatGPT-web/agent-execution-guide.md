# AI Agent 执行指南

## 文档定位

本文用于指导其他 AI Agent 实施 Skill Router MCP Server。

目标：Agent 仅依赖本目录文档，即可完成从设计、开发、测试到部署的完整流程。

## 执行原则

1. 不重新设计已有架构。
2. 优先遵循 nitro-v3-development-guide.md。
3. Skill Router 只负责技能发现和上下文加载。
4. 不实现代码执行能力。
5. 所有运行环境必须兼容 Cloudflare Worker。

## 推荐执行顺序

### Phase 1：理解约束

阅读：

1. README.md
2. architecture.md
3. implementation-spec.md

确认：

- MCP Server 边界
- 技术栈
- 部署目标

### Phase 2：初始化工程

创建 Nitro v3 项目。

要求：

- 使用 H3 handler
- 使用 Cloudflare Worker preset
- 保持无状态

### Phase 3：实现 MCP 层

实现：

- initialize
- tools/list
- tools/call

禁止：

- 自定义替代 MCP 协议
- 添加无必要状态

### Phase 4：实现 Skill Registry

实现：

- registry loader
- skill metadata parser
- skill content loader

数据来源：

GitHub ai-plugins/dev-skills。

### Phase 5：部署

完成：

- Cloudflare Worker 部署
- KV 配置
- 自定义域名绑定
- HTTPS MCP Endpoint

### Phase 6：验收

执行 testing-plan.md。

必须验证：

- ChatGPT Web Developer Mode 可连接
- skills 可搜索
- skills 可加载

## 禁止行为

禁止：

- 将 GitHub token 暴露给客户端
- 使用 Node 专属 API
- 把 skill 内容当系统权限指令
- 将 GitHub 写权限加入 MCP

## 完成标准

项目完成后应满足：

ChatGPT Web
→ Remote MCP
→ Skill Router
→ Skill Registry
→ ai-plugins skills

完整链路可用。
