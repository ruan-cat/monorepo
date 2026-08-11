# Skill Router MCP Server 部署运行手册

## 目标

本文描述生产环境部署流程。

目标部署环境：

- Cloudflare Workers
- Nitro v3
- 自定义 HTTPS 域名
- ChatGPT Web Developer Mode Remote MCP

核心原则：

> Cloudflare Worker bindings 是运行时配置来源；公开配置使用 vars，敏感凭证使用 Secrets。

---

# 1. 部署架构

```text
ChatGPT Web Developer Mode
        |
        v
https://mcp.ai.ruan-cat.com/mcp
        |
        v
Cloudflare Worker
        |
        v
Nitro v3 MCP Server
        |
 ----------------------
 |                    |
 v                    v
Skill Router       KV Registry
 |                    |
 v                    v
GitHub Source     Cloudflare Binding
```

---

# 2. 配置分类

不要把所有配置都作为 Secret。

## 公开配置 vars

这些信息不是秘密：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

推荐写入：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

---

## 敏感配置 Secrets

只有：

```text
GITHUB_TOKEN
```

必须使用：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止：

```toml
GITHUB_TOKEN="xxx"
```

禁止提交到 Git。

---

# 3. Wrangler CLI 管理流程

## 本地开发

运行：

```bash
wrangler dev
```

本地敏感变量：

```text
.dev.vars
```

例如：

```text
GITHUB_TOKEN=xxx
```

必须加入：

```text
.gitignore
```

---

## 生产 Secret 上传

```bash
wrangler secret put GITHUB_TOKEN
```

查看 Worker 配置时，不应输出 Secret 内容。

---

# 4. Nitro v3 Runtime Binding

实现时不要使用：

```ts
process.env.GITHUB_TOKEN
```

也不要根据旧版本经验固定假设环境读取方式。

Nitro v3 Cloudflare Module 下，应使用当前 adapter 提供的 Cloudflare runtime binding。

典型访问流程：

```text
Cloudflare Worker env binding
        |
        v
Nitro request runtime
        |
        v
Service Dependency Injection
        |
        v
Repository Adapter
```

业务代码不直接依赖 Worker 全局环境。

---

# 5. 服务读取原则

错误：

```text
mcp.post.ts
    |
读取 GITHUB_TOKEN
    |
调用 GitHub API
```

正确：

```text
mcp.post.ts
    |
MCP Router
    |
Skill Service
    |
GitHub Repository Adapter
    |
Runtime Binding
```

只有 GitHub adapter 需要 Token。

---

# 6. 构建流程

```text
GitHub Repository
        |
        v
CI Build
        |
        v
Nitro Build
        |
        v
wrangler deploy
        |
        v
Cloudflare Worker
```

---

# 7. MCP 地址

生产地址：

```text
https://mcp.ai.ruan-cat.com/mcp
```

健康检查：

```text
GET /health
```

---

# 8. 发布检查

上线前确认：

- Worker 状态正常
- HTTPS 正常
- KV 可读取
- vars 配置正确
- Secret 注入成功
- MCP initialize 成功
- tools/list 成功
- load_skill 成功

---

# 9. Secret 泄露检查

确认：

- 日志没有 token
- MCP response 没有 token
- KV 内容没有 token
- Git 仓库没有 secret 文件

---

# 10. 回滚策略

发生问题：

1. 回滚 Worker deployment。
2. 保留 KV registry 历史版本。
3. 检查 registry 构建记录。
4. 必要时轮换 GitHub Token。

---

# 11. ChatGPT Web 接入

最终操作：

1. 打开 ChatGPT Developer Mode。
2. 添加 Remote MCP Server。
3. 填入 MCP URL。
4. 验证 tools 列表。
5. 调用 search_skills。
6. 调用 load_skill。

完成后，ChatGPT Web 即可动态获取 ai-plugins skills。
