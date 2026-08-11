# Skill Router MCP Server 架构设计

## 文档定位

本文档定义生产级 Remote MCP Server 的最终主架构。

目标：构建可被 ChatGPT Web Developer Mode 直接连接的 Cloudflare Remote MCP Server，并在用户高频更新 skills 的情况下优先保证 **freshness、版本一致性、部署简单性和可调试性**。

核心原则：

- GitHub `ai-plugins` 是唯一 Skill Source of Truth。
- 每次 MCP 业务调用先把可变 `GITHUB_REF` 解析成不可变 Git commit SHA。
- 同一次调用中的 registry、`SKILL.md`、references 等读取必须固定在同一个 commit SHA。
- Cloudflare KV 和 R2 **不属于第一版必需架构**。
- 如未来需要缓存，只缓存以 commit SHA 为版本边界的不可变结果。
- MCP SDK 提供协议能力；Nitro v3 提供应用 Runtime；H3 是 Nitro 管理的 HTTP Runtime Layer。

---

# 1. 总体架构

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
H3 Runtime Layer
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
GitHub Skill Repository Adapter
          |
          +---- resolve GITHUB_REF -> commit SHA
          |
          +---- read ai-plugins/skill-registry.json @ commit SHA
          |
          +---- read SKILL.md / references @ same commit SHA
          v
ruan-cat/monorepo ai-plugins
```

第一版没有下列强制依赖：

```text
Cloudflare KV
Cloudflare R2
Durable Objects
D1
```

它们只能在真实指标证明有必要后作为后续优化评估。

---

# 2. Source Snapshot 一致性模型

`GITHUB_REF=dev` 是可变引用，不能直接作为一次复杂 MCP 调用中所有文件读取的最终版本依据。

每次需要访问 Skill 数据时建立 request-scoped `SourceSnapshot`：

```text
GITHUB_REF = dev
      |
      v
resolve ref
      |
      v
commit SHA = abc123...
      |
      +--------------------+
      |                    |
      v                    v
registry @ abc123     skill files @ abc123
```

规则：

1. 一次 tool call 只解析一次目标 ref。
2. 得到 commit SHA 后，本次调用所有 GitHub Contents/Raw 读取均使用该 SHA。
3. MCP 返回的 metadata 应带上 `sourceCommitSha`，用于调试、审计和复现。
4. 不允许 registry 从 commit A 读取而 `SKILL.md` 从 branch 最新 commit B 读取。

这比依赖最终一致缓存来判断“最新”更符合高频更新 skills 的工作流。

---

# 3. Skill Registry 的定位

推荐在仓库维护：

```text
ai-plugins/skill-registry.json
```

它是 **机器可发现索引**，不是独立数据库，也不是新的事实来源。

Source of Truth 仍然是同一 Git commit 中的：

```text
ai-plugins/**/skills/**
```

Registry 用于降低 `list_skills` / `search_skills` 的目录遍历成本，并提供稳定的：

- skill id
- plugin/collection
- name
- description
- metadata.version
- entry path
- 可选 references/files 索引

重要：提交到 Git 的 registry **不要把其所在的当前 commit SHA 写入自身内容**。文件内容会参与 commit hash，写入自身 commit 会形成自引用问题。

正确做法是：运行时解析 commit SHA，并把它与从该 SHA 读取的 registry 组合成 `SourceSnapshot`。

---

# 4. 缓存策略

## 第一版

不要求 Cloudflare KV、R2 或其他持久缓存。

优先实现：

```text
GitHub Source of Truth
+
commit-SHA snapshot reads
```

先验证：

- ChatGPT Web MCP 链路
- GitHub API 实际请求量
- P50/P95 latency
- rate limit 使用情况

## 后续可选优化

如指标显示重复读取成为瓶颈，可以优先尝试不可变缓存：

```text
registry:{commitSha}
skill:{commitSha}:{skillId}
```

缓存 key 必须包含 commit SHA。新 push 产生新 SHA，自然形成新缓存空间，不通过“覆盖同一个 mutable key”来传播最新内容。

Cloudflare Cache API、KV、R2 的选择必须另行基于数据量、一致性要求和运维成本评估，不能成为第一版默认依赖。

---

# 5. 依赖边界

## Nitro v3

负责：

- Runtime abstraction
- build
- routes
- Cloudflare adapter

## H3 Runtime Layer

由 Nitro 管理，不作为独立 Web Framework 管理。

## MCP TypeScript SDK

负责：

- initialize
- capability negotiation
- tools/list
- tools/call
- Streamable HTTP MCP protocol lifecycle

## GitHub Repository Adapter

负责：

- 使用只读 GitHub credential
- 解析 ref 到 commit SHA
- 读取 registry
- 按精确 SHA 加载 skill 文件
- 暴露 source/version metadata

业务 Service 不直接处理 GitHub Token。

---

# 6. Skill Router 职责

负责：

- Skill Discovery
- Skill Search
- Skill Loading
- Metadata
- Version / source commit reporting

不负责：

- GitHub 修改
- Shell
- Docker
- CI
- Cloudflare 存储同步任务

---

# 7. 最终形态

```text
ChatGPT Web
 |
Remote MCP
 |
Streamable HTTP
 |
Cloudflare Worker
 |
Nitro v3 Runtime
 |
MCP SDK
 |
Skill Router
 |
SourceSnapshot(commit SHA)
 |
GitHub ai-plugins
```

架构优先级固定为：

```text
freshness / consistency
>
simple deployment and debugging
>
measured caching optimization
```
