# Skill Router MCP Server 生产实现规格

## 文档定位

本文档不是概念设计，而是提供给独立 AI Agent 或开发团队执行的生产实现规格。

目标：实现一个部署在 Cloudflare Workers 的 Remote MCP Server，使 ChatGPT Web Developer Mode 可以连接，并动态获取 `ai-plugins` 内维护的 skills 上下文。

实现时必须严格遵守：

- Nitro v3 负责应用层和 HTTP 服务抽象。
- Wrangler 负责 Cloudflare 平台资源和部署。
- MCP Handler 负责协议转换。
- Skill Service 负责技能业务逻辑。
- Cloudflare KV 负责边缘缓存数据。

禁止混淆这些边界。

---

# 1. 技术边界

## 1.1 Nitro v3 职责

`nitro.config.ts` 负责：

- Nitro preset
- runtime config
- route rules
- 构建配置
- server runtime 行为

不负责：

- Worker KV 创建
- Secret 管理
- Cloudflare route
- DNS


## 1.2 Wrangler 职责

`wrangler.toml` 负责：

- Worker 名称
- compatibility_date
- KV binding
- Secret 注入
- 自定义域名
- 部署入口

不要将 wrangler 配置复制进 nitro.config.ts。

---

# 2. 推荐目录结构

```text
skill-router-mcp/

├── nitro.config.ts
├── wrangler.toml
├── package.json
│
├── server/
│   ├── api/
│   │   ├── mcp.post.ts
│   │   └── health.get.ts
│   │
│   ├── services/
│   │   ├── skill-router.ts
│   │   ├── skill-registry.ts
│   │   ├── skill-loader.ts
│   │   └── github-source.ts
│   │
│   ├── repositories/
│   │   └── skill-kv.ts
│   │
│   ├── schemas/
│   │   └── mcp.ts
│   │
│   ├── types/
│   │   └── skill.ts
│   │
│   └── utils/
│       └── cache.ts
```

---

# 3. Handler 实施规则

文件：

```text
server/api/mcp.post.ts
```

只负责：

1. 接收 JSON-RPC
2. 校验输入
3. 调用 service
4. 返回 MCP response

禁止：

- 调 GitHub
- 访问 KV
- 解析 SKILL.md
- 编写搜索逻辑

---

# 4. Service 分层

调用链：

```text
MCP Handler
    |
    v
Skill Router Service
    |
    +-- Registry Service
    |
    +-- Loader Service
    |
    +-- Repository
```

业务逻辑必须位于 service 层。

---

# 5. Nitro Handler 编写规范

必须使用 Nitro/H3 风格：

```ts
export default defineEventHandler(async (event) => {
  try {
    // business call
  } catch (error) {
    // normalized error
  }
})
```

禁止创建传统 Node HTTP server。

---

# 6. Cloudflare Runtime 约束

禁止：

- fs
- child_process
- process 常驻状态
- listen()
- 本地文件缓存

允许：

- fetch
- KV
- Cache API
- Web Crypto

---

# 7. MCP Tools

必须实现：

## list_skills

返回技能摘要。

## search_skills

输入 query，返回匹配技能。

## load_skill

返回：

- metadata
- SKILL.md
- references 信息

---

# 8. Skill Registry 数据流

```text
GitHub ai-plugins
        |
        v
Registry Builder
        |
        v
Cloudflare KV
        |
        v
Nitro Service
        |
        v
ChatGPT MCP
```

Worker 请求阶段不扫描 GitHub。

---

# 9. 文件生成顺序

AI Agent 必须按顺序：

1. package.json
2. nitro.config.ts
3. wrangler.toml
4. server/types
5. server/schemas
6. server/services
7. server/api
8. tests

---

# 10. Definition of Done

必须满足：

- ChatGPT Web Developer Mode 可连接
- MCP initialize 成功
- tools/list 成功
- tools/call 成功
- Skill 可发现
- Skill 可加载
- Worker 可部署
- 无 Node 专属 API
- KV 正常工作
