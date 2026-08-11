# Skill Router MCP Server AI Agent 实施阅读计划

## 文档定位

本文档用于指导后续负责实际编码的 AI Agent。

目标不是介绍项目，而是规定 AI Agent 在开始实现 Cloudflare Worker + Nitro v3 + Remote MCP Skill Router Server 时，必须采用的阅读顺序、实施顺序和验收顺序。

任何新的 AI Agent 在开始编码前，必须先阅读本文件。

---

# 一、核心执行原则

不要直接根据用户需求开始编码。

必须先建立完整上下文：

```text
理解目标
    ↓
理解架构
    ↓
理解实现边界
    ↓
实现代码
    ↓
测试验证
    ↓
部署验收
```

禁止：

- 跳过架构文档直接创建代码。
- 根据个人经验重新设计架构。
- 将 Skill Router 做成执行型 Agent。
- 混淆 Nitro、Wrangler、Cloudflare Worker 的职责。

---

# 二、强制阅读顺序

AI Agent 必须严格按照以下顺序阅读。

## 第 1 阶段：项目目标与整体架构

阅读：

```text
README.md
 ↓
architecture.md
```

目标：

理解：

- ChatGPT Web Developer Mode 使用方式。
- Remote MCP 定位。
- Skill Router 与其他 MCP 的边界。

完成后必须明确：

Skill Router 只负责：

- skill discovery
- skill search
- skill loading
- metadata/version

不负责：

- Git 操作。
- Shell 执行。
- Docker。
- CI。

---

## 第 2 阶段：工程实施规格

阅读：

```text
implementation-spec.md
```

目标：

确定：

- 文件结构。
- 模块职责。
- 服务分层。
- 实现顺序。

禁止自行改变：

- Nitro v3。
- Cloudflare Worker。
- MCP Remote Server 架构。

---

## 第 3 阶段：运行环境边界

阅读：

```text
nitro-v3-cloudflare-integration.md
nitro-v3-development-guide.md
```

重点确认：

```text
Nitro v3
负责应用层

Wrangler
负责 Cloudflare 平台层
```

禁止：

- 将 wrangler 配置塞入 nitro.config.ts。
- 使用 Node Server 模式。
- 使用 filesystem。

---

## 第 4 阶段：MCP 协议实现

阅读：

```text
mcp-protocol-design.md
mcp-client-validation-guide.md
```

实现：

```text
initialize

 tools/list

 tools/call
```

核心工具：

```text
list_skills
search_skills
load_skill
```

---

## 第 5 阶段：数据与 Skill 系统

阅读：

```text
skill-registry-schema.md
```

实现：

```text
GitHub ai-plugins
        ↓
Registry Builder
        ↓
Cloudflare KV
        ↓
Skill Router
```

运行时不要直接扫描 GitHub。

---

## 第 6 阶段：测试与安全

阅读：

```text
testing-plan.md
security-model.md
```

完成：

- 协议测试。
- Worker 测试。
- Skill 加载测试。
- 安全检查。

---

# 三、推荐编码顺序

```text
1. 初始化 Nitro v3 Worker 项目

2. 配置 Cloudflare Worker 部署

3. 创建 MCP endpoint

4. 实现 MCP JSON-RPC handler

5. 实现 Skill Registry Service

6. 实现 Skill Loader Service

7. 接入 KV Cache

8. 接入 GitHub 同步流程

9. 完成测试

10. 完成 ChatGPT Web MCP 验收
```

---

# 四、最终验收标准

必须满足：

```text
ChatGPT Web Developer Mode
        ↓
Remote MCP
        ↓
initialize 成功
        ↓
tools/list 成功
        ↓
search_skills 成功
        ↓
load_skill 成功
```

同时：

- Cloudflare Worker 正常运行。
- 无 Node 专属 API。
- Skill 内容来自 ai-plugins。
- KV Registry 正常工作。
- 测试全部通过。

---

# 五、给执行 Agent 的最终指令

这是一个基础设施项目。

优先级：

```text
正确架构
>
稳定部署
>
协议兼容
>
代码数量
```

不要追求快速写代码。

必须优先保证长期可维护性和 Serverless 兼容性。
