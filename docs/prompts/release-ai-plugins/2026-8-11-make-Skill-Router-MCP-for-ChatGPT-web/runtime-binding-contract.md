# Cloudflare Runtime Binding Contract

## 文档目的

本文定义 Skill Router MCP Server 在 Cloudflare Worker + Nitro v3 环境中的运行时绑定契约。

目标：

防止 AI Agent 在实现过程中自行猜测环境变量读取方式、混淆 Wrangler 配置与 Nitro 应用配置、错误处理 Secret。

---

# 1. Runtime Binding 总体模型

系统运行时链路：

```text
Cloudflare Worker Runtime
        |
        | bindings
        v
Nitro v3 request runtime
        |
        v
Dependency Injection Layer
        |
        v
Application Services
        |
        v
Repository Adapter
```

Cloudflare Worker 的环境变量、Secret、KV 等能力通过 bindings 提供给 Worker runtime。实现时必须按照 Nitro v3 Cloudflare adapter 的方式获取 runtime binding，而不是使用传统 Node 服务模式。 

---

# 2. Binding 分类

## 2.1 Public Vars

以下配置不是秘密：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
```

用途：

- 定位 GitHub repository
- 指定 branch/ref
- 生成 Skill Registry source 地址

推荐通过 Wrangler vars 管理：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

---

## 2.2 Secret Binding

唯一敏感配置：

```text
GITHUB_TOKEN
```

必须：

```bash
wrangler secret put GITHUB_TOKEN
```

禁止：

- 写入 wrangler.toml
- 提交 Git
- 输出日志
- 写入 KV
- 返回 MCP response

---

## 2.3 Cloudflare Resource Binding

例如：

```text
SKILL_REGISTRY
```

类型：

```ts
KVNamespace
```

用于：

- skill metadata
- skill content cache
- registry index

---

# 3. TypeScript Runtime Contract

实现时建议定义：

```ts
export interface RuntimeBindings {
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_REF: string

  GITHUB_TOKEN: string

  SKILL_REGISTRY: KVNamespace
}
```

该类型用于：

- service 注入
- repository mock
- 测试隔离

---

# 4. Nitro v3 获取原则

禁止：

```ts
process.env.GITHUB_TOKEN
```

禁止假设旧版本 Cloudflare context API。

实现 Agent 必须依据当前 Nitro v3 Cloudflare adapter 提供的 request runtime 获取 binding。

推荐架构：

```text
HTTP Handler

    |

Runtime Binding Extractor

    |

RuntimeBindings

    |

Services
```

---

# 5. Dependency Injection 规则

禁止：

```ts
// module scope singleton
const githubClient = new GithubClient(env.GITHUB_TOKEN)
```

原因：

Cloudflare Worker isolate 生命周期可能导致旧 binding 派生对象继续存在。

正确：

```text
Request
 |
读取 runtime binding
 |
创建 request scoped adapter
 |
执行请求
```

---

# 6. Service 层规则

Service 不应该知道 Cloudflare env：

错误：

```ts
skillService.load(env.GITHUB_TOKEN)
```

正确：

```text
Handler
 |
RuntimeBindings
 |
Repository Adapter
 |
Skill Service
```

---

# 7. Repository Adapter 示例

职责：

- 调用 GitHub API
- 使用 GitHub Token
- 加载 Skill 内容

例如：

```ts
class GithubSkillRepository {
  constructor(private bindings: RuntimeBindings) {}
}
```

只有这一层接触：

```text
GITHUB_TOKEN
```

---

# 8. 本地开发流程

本地：

```bash
wrangler dev
```

敏感值：

```text
.dev.vars
```

示例：

```text
GITHUB_TOKEN=xxxx
```

必须加入：

```text
.gitignore
```

---

# 9. 生产部署流程

公开配置：

```text
wrangler.toml vars
```

敏感配置：

```bash
wrangler secret put
```

部署：

```bash
wrangler deploy
```

---

# 10. AI Agent 验收清单

实现完成前确认：

- [ ] vars 与 secrets 已区分
- [ ] GITHUB_TOKEN 未进入仓库
- [ ] MCP handler 不读取 Secret
- [ ] Repository Adapter 使用 binding
- [ ] 没有 process.env 依赖
- [ ] 没有 module scope 保存 Secret 派生对象
- [ ] 本地 wrangler dev 可运行
- [ ] 生产 wrangler deploy 可运行
