# Skill Router MCP 发版、版本查询与生产维护规范

## 1. 文档目的

本文定义 `Skill-Router-MCP` 完成实现并部署到 Cloudflare Workers 后，如何长期进行：

- MCP Server 代码发版。
- Skill 内容高频更新。
- Cloudflare Worker 版本上传、预览、上线和回滚。
- MCP 应用版本号管理。
- MCP 协议版本说明。
- 生产 Worker 版本查询。
- Skill source commit / Skill version 查询。
- 完整工具列表查询。

核心原则：

> **Skill 内容发布**与**MCP Server 代码发布**是两条不同发布链，不能因为都经过同一个 Git 仓库就绑定为一次 Worker 部署。

---

# 2. 两条独立发布链

## 2.1 Skill Content Lane

适用：

```text
ai-plugins/common-tools/skills/**
ai-plugins/dev-skills/skills/**
ai-plugins/skill-registry.json
```

发布链：

```text
修改一个或多个 Skill
        |
release-ai-plugins
        |
Skill metadata.version / manifest / CHANGELOG
        |
一次 deterministic registry generation
        |
Git commit / push
        |
新的 Git HEAD
        |
下一次 unpinned MCP tool call 自动读取新 snapshot
```

**不需要：**

- 重新构建 MCP Worker。
- `wrangler deploy`。
- KV purge。
- R2 upload。
- Worker restart。

这是因为 Skill 内容的事实来源是 GitHub，而不是 Worker bundle。

## 2.2 MCP Runtime Lane

适用：

- MCP tool schema / behavior。
- Nitro / MCP SDK / Wrangler 依赖。
- GitHub Repository Adapter。
- SourceSnapshot 逻辑。
- Worker route / binding / security config。
- Health / server info / observability 行为。

这类变化必须发布新的 Worker 版本：

```text
MCP code/config change
        |
bump MCP application SemVer
        |
typecheck + tests
        |
Nitro Cloudflare production build
        |
production-build integration
        |
wrangler versions upload
        |
Cloudflare preview/staging smoke
        |
promote version to production
        |
production read-only smoke
```

---

# 3. 版本概念必须分离

本项目至少存在六种不同“版本”，不得混为一个字段。

| 概念 | 示例 | 含义 |
| --- | --- | --- |
| MCP 应用版本 | `1.4.0` | Skill Router MCP Server 自身 SemVer |
| MCP 协议版本 | `2026-07-28` | 当前 MCP wire protocol revision |
| Worker Version ID | Cloudflare UUID | Cloudflare 某次不可变 Worker version |
| Worker Version Tag | `skill-router-mcp-v1.4.0` | 给人看的 Cloudflare version tag |
| Worker Build Git SHA | `abcd123...` | 生成该 Worker bundle 的仓库 commit |
| Skill Source Commit | `ef5678...` | 本次 Skill 查询读取的 Git exact snapshot |
| Skill Version | `0.13.7` | 单个 `SKILL.md` 的 `metadata.version` |
| Registry Schema Version | `1` | `skill-registry.json` 文件格式版本 |

其中 Worker Build Git SHA 与 Skill Source Commit **可以不同**：

```text
Worker build from commit A
production Worker stays unchanged
Skill tree keeps moving B -> C -> D
latest Skill call may read D
```

这是正常且有意的设计。

---

# 4. MCP 应用 SemVer

MCP package 必须拥有自己的 `package.json` version，作为：

```text
mcpServerVersion
```

建议语义：

## PATCH

```text
1.4.0 -> 1.4.1
```

用于：

- bug fix。
- 性能优化。
- 日志/诊断改进。
- 不改变 tool contract 的内部修复。

## MINOR

```text
1.4.1 -> 1.5.0
```

用于向后兼容增加：

- 新 tool。
- 新 optional input。
- 新 optional output metadata。
- 新只读诊断能力。

## MAJOR

```text
1.x -> 2.0.0
```

用于破坏性 MCP contract 变化，例如：

- 删除/重命名 tool。
- 改变 required input。
- 不兼容 response semantics。
- 删除客户端已依赖的字段。

不要因为某个 Skill version 更新就 bump MCP Server version。

---

# 5. MCP 2026-07-28 现代协议基线

本项目新实现以 MCP `2026-07-28` revision 为目标，不再把旧的 `initialize` / `initialized` 握手作为现代协议验收条件。

现代协议核心：

- 每个请求是独立、无 session 的协议请求。
- 请求通过协议 version / client metadata 表达调用上下文。
- `server/discover` 可用于预先发现 server capability，但普通 tool 调用不依赖先建立 session。
- Server identity 由响应 `_meta['io.modelcontextprotocol/serverInfo']` 暴露。
- `tools/list` 是完整工具目录的标准协议入口。

实现应使用支持 `2026-07-28` 的 MCP TypeScript SDK v2 稳定包线，而不是把 v1 `@modelcontextprotocol/sdk` 的 2025-era initialize lifecycle 当成新项目架构。

推荐服务端依赖方向：

```text
@modelcontextprotocol/server v2
```

测试客户端使用对应 v2 client package。

具体 SDK minor/patch 由实施时 lockfile 固化。

---

# 6. Server Identity

MCP Server 身份至少包含：

```json
{
  "name": "skill-router-mcp",
  "version": "1.4.0"
}
```

其中 version 来自 MCP package 的 SemVer，不手工复制第二份常量。

对于 MCP 2026-era response，SDK 应把 server identity 放入标准：

```text
_meta["io.modelcontextprotocol/serverInfo"]
```

该信息用于：

- UI 展示。
- 日志。
- 调试。
- MCP Client 读取服务器版本。

它不是安全授权依据。

---

# 7. 标准 `tools/list` 是工具目录真源

当前所有 MCP tools 必须从一个统一 tool definition registry 注册。

例如概念上：

```text
toolDefinitions
  ├─ get_server_info
  ├─ list_skills
  ├─ search_skills
  └─ load_skill
```

MCP SDK 的标准：

```text
tools/list
```

必须返回当前部署版本实际提供的完整 tool catalog。

禁止：

- `tools/list` 使用一套定义。
- README / `get_server_info` 再硬编码另一套 tool name 数组。

否则新增 tool 后极易出现列表漂移。

---

# 8. 新增 `get_server_info` 只读工具

虽然 MCP 协议已有 server identity 与 `tools/list`，但 ChatGPT 用户经常会直接问：

```text
你这个 MCP 是什么版本？
当前部署的是哪一版？
你有哪些工具？
```

因此第一版推荐正式增加：

```text
get_server_info
```

这是面向模型/人的诊断 facade，不替代标准协议能力。

输入：

```json
{}
```

建议输出：

```json
{
  "server": {
    "name": "skill-router-mcp",
    "version": "1.4.0",
    "protocolRevision": "2026-07-28",
    "buildGitSha": "abc123"
  },
  "deployment": {
    "workerVersionId": "...",
    "workerVersionTag": "skill-router-mcp-v1.4.0",
    "workerVersionTimestamp": "..."
  },
  "skillSource": {
    "repository": "ruan-cat/monorepo",
    "ref": "dev"
  },
  "registrySchemaVersion": "1",
  "tools": [
    {
      "name": "get_server_info",
      "description": "..."
    },
    {
      "name": "list_skills",
      "description": "..."
    },
    {
      "name": "search_skills",
      "description": "..."
    },
    {
      "name": "load_skill",
      "description": "..."
    }
  ]
}
```

`tools` 必须动态来自与 `tools/list` 相同的 tool definitions。

`get_server_info` **默认不要为了展示信息再访问 GitHub HEAD**，避免一个纯诊断查询产生额外上游请求。准确 Skill snapshot 仍由 `list_skills` / `search_skills` / `load_skill` 返回 `sourceCommitSha`。

Tool annotation：只读、非破坏性。

---

# 9. Cloudflare Version Metadata Binding

Wrangler 应启用 Worker version metadata binding：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

运行时可以得到：

```text
id
tag
timestamp
```

建议 RuntimeBindings 增加：

```ts
CF_VERSION_METADATA: WorkerVersionMetadata
```

它用于：

- `get_server_info`。
- `/health`。
- production smoke。
- structured logs。
- 回滚诊断。

不要把 Worker version ID 当作 MCP SemVer；两者分别保留。

---

# 10. Worker Build Git SHA

Worker bundle 还应带上：

```text
buildGitSha
```

推荐在构建阶段生成一个 build-info module，例如概念上：

```ts
export const BUILD_GIT_SHA = "<CI commit sha>"
```

来源优先：

- GitHub Actions `GITHUB_SHA`；或
- 构建阶段 `git rev-parse HEAD`。

不要在 Cloudflare runtime 里执行 Git 命令，也不要依赖 filesystem 获取仓库信息。

---

# 11. Cloudflare 发布策略

## 11.1 不建议生产直接裸用 `wrangler deploy`

`wrangler deploy` 会创建新 Worker version 并立即让其承担 100% production traffic。

对生产 MCP 更推荐把：

```text
upload version
```

和：

```text
promote deployment
```

拆开。

## 11.2 推荐流水线

```text
merge/push MCP runtime change
        |
CI gates
        |
Nitro production build
        |
wrangler versions upload
        |  tag = skill-router-mcp-vX.Y.Z
        |  message = git sha + release summary
        v
immutable Worker version
        |
versioned preview URL / staging smoke
        |
promote exact version to 100%
        |
production smoke
```

概念命令：

```bash
wrangler versions upload --tag skill-router-mcp-v1.4.0 --message "git abc123: ..."
wrangler versions deploy skill-router-mcp-v1.4.0@100% -y
```

实际参数以实施时 Wrangler 当前 CLI 为准。

---

# 12. 为什么 MCP Tool Contract 默认使用原子 100% 发布

Cloudflare 支持 gradual deployment，但本 MCP 的 tool catalog/schema 属于客户端可见 contract。

如果同时让两个不兼容版本各承担流量：

```text
old Worker -> tools A/B/C
new Worker -> tools A/B/C/D or changed schema
```

客户端可能在不同请求遇到不同 tool catalog。

因此默认规则：

> Tool schema / protocol-visible behavior 改动先在 Preview/Staging 验证，通过后原子 promote 到 100%。

Gradual rollout 只建议用于明确保持完全向后兼容的内部实现改动，并且已经设计版本亲和/兼容策略时使用。

第一版不要为了“高级发布”强行做流量切分。

---

# 13. 自动部署触发范围

如果使用 Cloudflare Git integration，需要配置 Build Watch Paths；如果使用 GitHub Actions，则使用 workflow `paths` / `paths-ignore`。

核心目标：

## 应触发 Worker 发布

```text
<skill-router-mcp-package>/**
wrangler.toml / wrangler.jsonc
相关 Nitro config
共享 runtime dependency
pnpm-lock.yaml（实际影响 MCP package 时）
MCP deploy workflow
```

## 不应仅因为这些变化重新部署 Worker

```text
ai-plugins/**
docs/**
```

Skill-only commit 已由 Git source snapshot 模型处理。

这样高频维护 Skill 不会产生无意义 Cloudflare builds/deployments。

---

# 14. 选择一个 Production Deployment Authority

两种方案都可行：

## A. Cloudflare Git Integration

优点：Cloudflare 自动监听 Git、构建、preview/deploy。

## B. GitHub Actions + Wrangler

优点：可以把现有多层 test gates、registry/release checks、version tag、preview smoke、production promotion 放进一条显式流水线。

本项目更推荐 **GitHub Actions + Wrangler 作为唯一 production deployment authority**，因为我们的 gate 已经明显超过普通 build/deploy。

如果最终选择 Cloudflare Git Integration，就不要同时再让 GitHub Actions 对同一 production Worker 自动 deploy，避免双重部署和竞态。

---

# 15. 生产及时更新的真实保障

“有流水线”不等于可以完全不管。

正确心智模型：

```text
自动化负责：
检测 -> 测试 -> build -> upload -> smoke -> promote -> smoke

人仍然负责：
SemVer / breaking-change 判断
失败诊断
Secret /权限
重大升级审核
```

只要部署流水线成为唯一生产入口并配置 required checks，日常 patch/minor 维护的人工负担会很低。

生产是否已经更新，不靠“我 push 了”判断，而靠：

```text
get_server_info
+ Cloudflare active deployment
+ production smoke
```

共同确认。

---

# 16. 回滚

Worker 代码出现故障：

```text
wrangler rollback <stable-version-id>
```

或从 Cloudflare Dashboard 回滚到最近稳定 Worker version。

因为 MVP 没有 KV/R2/D1/DO 持久 schema migration，Worker rollback 的状态耦合较少。

Skill 内容问题则是另一条链：

```text
Git revert/fix Skill commit
        |
new Git HEAD
        |
new unpinned Skill call sees fixed snapshot
```

不要用 Worker rollback 处理 Skill 内容错误。

---

# 17. `/health` 与 `get_server_info` 分工

`GET /health`：

- 给 CI / uptime / load balancer。
- 轻量。
- 不访问 GitHub。
- 返回 server version、Worker version ID/tag、build SHA 等安全字段。

`get_server_info`：

- 给 ChatGPT / MCP Client / 人类调试。
- 返回 MCP app/protocol/deployment/tool catalog。
- 不返回 Secret。

`tools/list`：

- MCP 标准工具目录真源。

不要让 `/health` 变成巨大管理接口。

---

# 18. CI 必须增加的版本/发布测试

至少覆盖：

- `serverInfo.version == package.json version`。
- `get_server_info.server.version == package.json version`。
- `get_server_info.tools == toolDefinitions`。
- 标准 `tools/list` 与 `toolDefinitions` 同源。
- Worker version metadata binding 能在 workerd/production harness 读取。
- build SHA 非空且符合预期格式。
- production build 的 server identity 与本次 release version 一致。
- Preview/Staging smoke 能读取新 version。
- Production smoke 在 promote 后读取到同一 MCP app version / Worker version。

---

# 19. Release Definition of Done

MCP Runtime 发版完成必须有证据：

```text
1. MCP SemVer 已按变更类型更新
2. tests 全绿
3. Nitro production build 成功
4. immutable Worker version 已 upload
5. Worker version tag 与 MCP SemVer 一致
6. Preview/Staging smoke 通过
7. exact Worker version 已 promote 到 production
8. Production smoke 通过
9. get_server_info 返回新 MCP version
10. Cloudflare version metadata 与 active deployment 一致
11. tools/list 返回预期完整工具列表
12. rollback target 明确可用
```

不要只以：

```text
git push 成功
```

或：

```text
wrangler 命令 exit 0
```

声称生产已经完成升级。

---

# 20. 最终维护模型

```text
               Skill 内容更新

ai-plugins change
      |
release-ai-plugins
      |
Git commit
      |
下一次 MCP Skill call 自动读取新 HEAD
      |
NO Worker deployment


               MCP Server 更新

MCP runtime/config change
      |
MCP SemVer bump
      |
CI / workerd / production harness
      |
Worker version upload
      |
Preview/Staging
      |
100% promote
      |
Production smoke
      |
get_server_info / tools/list 可验证线上版本
```

该模式应长期保持：**Skill 发布轻、MCP 代码发布可审计、生产版本可查询、工具目录可自描述、回滚边界清楚。**
