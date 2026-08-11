# Skill Router MCP Server 部署运行手册

## 目标

本文描述第一版生产环境部署流程。

目标环境：

- Cloudflare Workers
- Nitro v3
- MCP TypeScript SDK
- 自定义 HTTPS 域名
- ChatGPT Web Developer Mode Remote MCP
- GitHub 作为唯一 Skill Source of Truth

核心原则：

> Cloudflare Worker 负责 Remote MCP 计算与网络入口；skills 的最新版本由 GitHub ref -> exact commit snapshot 决定。第一版不依赖 KV/R2。

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
Nitro v3 + MCP SDK
        |
        v
Skill Router
        |
        v
GitHub Repository Adapter
        |
        v
GITHUB_REF -> exact commit SHA
        |
        v
ai-plugins registry / skill files @ SHA
```

---

# 2. 配置分类

## 公开 vars

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

示意：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

## 敏感 Secret

```text
GITHUB_TOKEN
```

上传：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止将 token 写入 `wrangler.toml`、日志、MCP 结果或生成的 registry。

---

# 3. 第一版不创建的 Cloudflare 资源

不要为了初始化项目创建：

```text
KV namespace
R2 bucket
D1 database
Durable Object namespace
```

因此本地和生产环境都不需要同步这些 resource id。

这显著降低：

- Wrangler 环境差异
- 本地调试前置步骤
- 权限面
- rollback 复杂度

---

# 4. 本地开发

运行：

```bash
wrangler dev
```

敏感值：

```text
.dev.vars
```

例如：

```text
GITHUB_TOKEN=xxx
```

`.dev.vars` 必须 gitignore。

本地 smoke test：

```text
GET /health
POST /mcp
```

---

# 5. Runtime Binding

禁止：

```ts
process.env.GITHUB_TOKEN
```

使用当前 Nitro v3 Cloudflare adapter 暴露的 request runtime bindings。

数据流：

```text
Worker vars / secret
        |
Nitro request runtime
        |
GitHub Repository Adapter
        |
SourceSnapshot(commit SHA)
        |
Skill Services
```

---

# 6. Skill 读取原则

错误：

```text
registry read @ dev
skill read @ dev
```

因为两次读取之间 branch 可能推进。

正确：

```text
resolve dev -> abc123
        |
        +-- registry @ abc123
        +-- SKILL.md @ abc123
        +-- references @ abc123
```

MCP 结果应暴露可诊断的 `sourceCommitSha`。

---

# 7. 构建与 Worker 部署

```text
Repository
    |
CI install/test
    |
Nitro build
    |
wrangler deploy
    |
Cloudflare Worker
```

Worker 发布与 skill 内容发布解耦：只修改 `ai-plugins` skills 时，不需要重新部署 Worker。

---

# 8. Skill Registry 发布

推荐仓库维护：

```text
ai-plugins/skill-registry.json
```

它与 skills 一起进入 Git commit，由 `release-ai-plugins` 的 generator 生成/校验。

Cloud MCP 不需要额外“把 registry 发布到 Cloudflare”。

---

# 9. 上线检查

上线前确认：

- Worker 状态正常。
- HTTPS 正常。
- vars 配置正确。
- Secret 注入成功。
- MCP initialize 成功。
- tools/list 成功。
- `search_skills` 成功。
- `load_skill` 成功。
- 返回的 source commit 可追踪。
- 无 KV/R2 binding 仍完整可用。

---

# 10. Freshness 验收

1. 记录当前 `dev` HEAD = A。
2. 使用 MCP load 一个 skill，确认 `sourceCommitSha=A`。
3. push 新 skill commit B。
4. 发起新的 tool call。
5. 确认新 snapshot 解析到 B，并加载 B 的内容。

不执行 KV purge，不上传 R2，不重新部署 Worker。

---

# 11. Secret 泄露检查

确认：

- 日志没有 token。
- MCP response 没有 token。
- `skill-registry.json` 没有 token。
- Git 仓库没有 secret 文件。

---

# 12. 回滚策略

## Worker 代码问题

回滚 Cloudflare Worker deployment。

## Skill 内容问题

回滚或修复 GitHub target ref；新的 tool call 会解析新的 HEAD。

调试时记录：

```text
Worker deployment version
GITHUB_REF
sourceCommitSha
MCP tool name
```

不需要维护 KV registry 历史版本或 R2 object 回滚。

---

# 13. ChatGPT Web 接入

1. 打开 ChatGPT Developer Mode。
2. 添加 Remote MCP Server。
3. 填入 MCP URL。
4. 验证 tools。
5. 调用 `search_skills`。
6. 调用 `load_skill`。
7. 检查返回的 skill version/source commit。
