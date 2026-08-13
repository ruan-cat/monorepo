# Skill Router MCP Stage 2 Current State Audit

## 1. 目的

本文记录二期设计开始时对一期文档、当前 `dev` 源码和部署契约的重新核对结果，作为后续实现与 PR review 的事实基线。

核对对象：

- 一期设计：`docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/**`
- 当前实现：`packages/skill-router-mcp/**`
- 当前 CI：`.github/workflows/skill-router-mcp.yml`
- 当前 Worker 配置：`packages/skill-router-mcp/wrangler.toml`

## 2. 一期已经冻结并实现的边界

### 2.1 对外 Tool Surface

当前 canonical `toolDefinitions` 只暴露：

```text
get_server_info
list_skills
search_skills
load_skill
```

其中 `load_skill` 的公开语义仍是读取选中 Skill 的 `SKILL.md`。

因此从 ChatGPT / MCP Tool 调用面看，一期只完成：

```text
发现 Skill
  ↓
选择 Skill
  ↓
读取 SKILL.md
```

### 2.2 Registry v1

Registry v1 只保存：

```text
id
plugin
name
description
version
entry
```

一期明确不把 references/templates/examples 等 deep files 放进 registry，以避免高频 Skill 内容变化制造第二套 high-churn index。

### 2.3 Snapshot

一期已经实现 `SourceSnapshot`：

- 未 pin：`GITHUB_REF` 在一次调用开始时解析成 exact commit SHA；
- pinned：使用调用方传入的 `sourceCommitSha`；
- 下游读取只使用 immutable SHA。

这个机制可以直接复用到二期 resource access，不需要新增 KV / Durable Object 会话状态。

## 3. 一期已经预留、但没有形成公开 Tool 的能力

一期 `implementation-spec.md` 已明确写过：

```text
related file @ SHA
```

以及：

- related files 按需读取；
- 与 `SKILL.md` 使用同一个 `sourceCommitSha`；
- path 不得逃逸选中的 Skill；
- 不默认递归加载全部内容。

当前源码甚至已经存在：

```text
SkillRouter.readRelatedFile(skillId, relativePath, snapshot)
```

该内部方法会：

1. 从 registry entry 得到 Skill root；
2. 将相对路径限制在选中的 Skill 目录；
3. 使用同一个 `snapshot.sourceCommitSha`；
4. 最终调用 `GitHubSkillSource.readFile(...)`。

因此二期不是从零增加“related file”概念，而是把一期已经预留的内部能力补成稳定的公开协议。

## 4. 当前为什么仍然算“Skill 获取不完整”

虽然内部已有 `readRelatedFile`，当前公开工具没有任何入口可以调用它。

真实链路仍会在这里断开：

```text
load_skill("git-commit")
  ↓
SKILL.md 要求 references/commit-types.ts
  ↓
没有 model-callable resource tool
```

此外当前底层能力还缺：

- resource enumeration；
- MIME / size；
- text/blob 区分；
- 二进制安全返回策略；
- `maxBytes` / 范围读取；
- resource-specific 稳定错误码；
- URL 编码、双重编码等完整 path canonicalization 规则；
- ChatGPT Web 端到端 resource tool 验收。

所以“源码能读 related file”和“Skill Router 已经完整支持 Agent Skill 目录”不能混为一谈。

## 5. 二期应冻结的核心范围

二期 MUST：

1. 新增 `load_skill_resource`，把现有 related-file 能力升级成稳定公开 Tool；
2. 新增 `list_skill_resources`，支持不知道准确路径时的 Skill-root scoped discovery；
3. 所有读取沿用 `SourceSnapshot`；
4. 保持 `load_skill` 只返回 `SKILL.md`，不默认 bundle；
5. 支持 references/scripts/assets/other；
6. scripts 只分发、不执行；
7. 实现明确的 path isolation、大小限制、MIME、text/blob 和错误模型；
8. 完成 `git-commit`、`pr-ruancat-repo` 真实验收；
9. Tool contract 改动部署后执行 ChatGPT refresh/rescan。

MCP `skill://` Resources 映射作为兼容层 SHOULD 与同一 Resource Resolver 共用底层实现，但不能替代 ChatGPT Web 的 model-callable Tools 验收。

## 6. Registry / Enumeration 设计结论

一期刻意保持 Registry v1 low-churn；当前源码也已经能从 `entry` 推导 Skill root。

因此二期默认推荐：

> **不要仅为了 resource inventory 就把所有 deep files 写进 Registry v2。**

优先方案：

```text
registry entry
  ↓
resolve Skill root
  ↓
GitHub source 在 pinned SHA 下仅枚举该 Skill root
  ↓
ResourceResolver 过滤 / 分类 / 分页
```

也就是在 `GitHubSkillSource` 增加 Skill-root scoped directory/tree enumeration，并对 `(repo, commit, skillId)` 结果做短期缓存。

只有在真实 benchmark 证明 GitHub API 请求量或延迟不可接受时，再考虑 registry inventory / schema bump。

## 7. 当前更新与部署机制

这里必须区分三个 freshness domain。

### 7.1 Skill 内容更新

当前 `wrangler.toml` 配置：

```text
GITHUB_OWNER=ruan-cat
GITHUB_REPO=monorepo
GITHUB_REF=dev
```

未 pin 的 Skill 调用会：

```text
Worker 收到请求
  ↓
resolve dev -> exact Git commit SHA
  ↓
读取 registry @ SHA
  ↓
读取 SKILL.md / 未来 resource @ SHA
```

因此 Skill-only 更新是：

```text
ai-plugins change
  ↓
Git commit / push
  ↓
下一次未 pin Skill 调用读取新的 Git snapshot
```

它不是“Cloudflare 把 Skill 文件同步到 Worker”，也不需要 Worker redeploy。

### 7.2 Worker Runtime 更新

当前 `packages/skill-router-mcp/README.md` 明确把生产 deployment authority 定义为：

```text
Cloudflare Workers Builds Git Integration
```

当前 `.github/workflows/skill-router-mcp.yml` 只负责：

```text
typecheck
test:all
build
```

不执行 Wrangler deploy / promotion。

因此 Worker runtime/code/config 的发布当前由 Cloudflare 的 Git Integration 负责，而不是 GitHub Actions deploy。

### 7.3 Tool Contract 更新

二期新增：

```text
list_skill_resources
load_skill_resource
```

属于 MCP Tool contract 变化。

因此完整上线链路不是只有 Cloudflare Build：

```text
Git push
  ↓
Cloudflare Workers Build / deploy 新 runtime
  ↓
MCP Inspector / Developer Mode 验证
  ↓
ChatGPT Refresh / Scan Tools
  ↓
端到端验收
```

Cloudflare 部署不能自动刷新 ChatGPT 已批准的 tool snapshot。

## 8. 尚未从仓库内证实的部署细节

仓库能确认“Cloudflare Workers Builds Git Integration 是 production authority”，但 Cloudflare Dashboard 中具体的：

- production branch；
- include/exclude path；
- build command；
- deploy command；
- root directory；
- environment variable / secret 配置；

不全部存在于 Git 仓库。

因此不能仅根据当前仓库断言 Cloudflare Builds 的精确 path watch 配置。实现二期前应把该 Dashboard / Builds 配置作为一次独立部署核对项。
