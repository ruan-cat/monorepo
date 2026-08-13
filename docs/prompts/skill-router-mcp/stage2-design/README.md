# Skill Router MCP Stage 2 Design

> 工作分支目标：`skill-router-mcp-stage2-design`  
> 目标基线：`dev`  
> 目标目录：`docs/prompts/skill-router-mcp/stage2-design`

## 1. 本目录的目的

本目录用于定义 Skill Router MCP 二期的需求边界、工具调用面、资源读取协议、版本一致性、安全约束、验收标准与 PR 文案。

二期的核心目标不是扩大 Skill Router MCP 的职责，而是补全 **Agent Skill 本身的“渐进式加载”能力**：

1. 继续用 `search_skills` / `list_skills` 做 Skill 发现；
2. 继续用 `load_skill` 加载 `SKILL.md` 主体；
3. 当 `SKILL.md` 引用了 `references/`、`scripts/`、`assets/` 或其他相对路径文件时，允许 Agent **按需发现并读取这些资源**；
4. 保持同一次 Skill 执行链上的 Git commit 快照一致；
5. 不把 Skill Router MCP 变成 GitHub 仓库浏览器、脚本执行器或通用文件系统。

## 2. 已验证的现状

当前部署面的工具调用面包含：

- `get_server_info`
- `list_skills`
- `search_skills`
- `load_skill`

其中 `load_skill` 的公开契约是加载一个 Skill 的 `SKILL.md`。

这已经能够完成：

```text
任务
  ↓
search_skills
  ↓
选择 skill
  ↓
load_skill
  ↓
获得 SKILL.md
```

但在下面这种真实 Skill 中会中断：

```text
git-commit/SKILL.md
  ↓
要求读取 references/commit-types.ts
  ↓
当前没有 Skill 资源读取工具
```

同样，`pr-ruancat-repo` 会要求继续读取：

- `references/target-repos.md`
- `references/workflow-and-template.md`
- `references/batch-pr-script.ts`

因此二期的第一验收目标不是“加载更多 Skill”，而是：

> **让已经选中的 Skill 能完整地按需获取自己的附属文件。**

### 2.1 源码核对后的补充结论

当前 `dev` 源码里已经存在内部方法：

```text
SkillRouter.readRelatedFile(skillId, relativePath, snapshot)
```

它已经能在选中 Skill root 内、使用同一个 `sourceCommitSha` 读取 related file。

因此当前真实状态应表述为：

- **底层 related-file 读取能力已存在；**
- **MCP / ChatGPT 对外 Tool Surface 没有暴露该能力；**
- 尚缺资源枚举、MIME/size、text/blob、大小限制、稳定错误码和完整 path canonicalization。

完整核对见 [`current-state-audit.md`](./current-state-audit.md)。

### 2.2 更新与部署边界

当前生产 deployment authority 是 **Cloudflare Workers Builds Git Integration**；仓库内 GitHub Actions 只做 typecheck/test/build。

Skill-only 更新则不触发 Worker 部署：Worker 在未 pin 调用时解析 `GITHUB_REF=dev` 到 exact SHA，并直接从 GitHub 读取该 snapshot。

因此需要区分：

```text
Skill 内容变化 → Git push → 下一次调用读取新 snapshot
Worker 代码变化 → Cloudflare Workers Build / deploy
Tool contract 变化 → Worker deploy + ChatGPT Refresh / Scan Tools
```

## 3. 二期设计结论

推荐采用两层接口，但共用一套底层读取服务。

### 3.1 ChatGPT / Agent 主调用面：Tools

保留一期工具，并新增：

- `list_skill_resources`
- `load_skill_resource`

推荐调用链：

```text
search_skills(query)
  ↓
load_skill(skillId, sourceCommitSha?)
  ↓
SKILL.md 发现 references/foo.md
  ↓
load_skill_resource(skillId, "references/foo.md", sourceCommitSha)
```

只有当 Agent 不知道资源准确路径、需要探索 Skill 目录时才调用：

```text
list_skill_resources(skillId, sourceCommitSha, prefix?)
```

### 3.2 MCP 标准兼容层：Resources

同一套底层资源可额外映射成：

```text
skill://<plugin>/<skillId>/SKILL.md
skill://<plugin>/<skillId>/references/commit-types.ts
skill://<plugin>/<skillId>/scripts/foo.ts
skill://<plugin>/<skillId>/assets/template.json
```

这层用于兼容 MCP Skills-over-MCP 方向以及未来能直接消费 MCP Resources 的 Host。

**二期不能只做 Resources 而删除 Tools。**

原因：当前 ChatGPT 自定义 MCP App 的产品入口仍以扫描并调用工具 / actions 为最确定的模型调用面；Tools 能保证 ChatGPT Web 在现阶段直接完成资源的按需读取。Resources 应作为标准兼容能力，而不是 ChatGPT Web 的唯一依赖。

## 4. 文件索引

- [`current-state-audit.md`](./current-state-audit.md) — 一期边界、当前源码与部署事实核对
- [`proposal.md`](./proposal.md) — 二期变更提案
- [`design.md`](./design.md) — 技术架构与工具设计
- [`specs/skill-resource-access.md`](./specs/skill-resource-access.md) — 可落地接口规范
- [`acceptance.md`](./acceptance.md) — 真实 Skill 验收场景
- [`tasks.md`](./tasks.md) — 实现任务拆分
- [`PR-DRAFT.md`](./PR-DRAFT.md) — Pull Request 草稿

## 5. 明确不属于二期核心范围的内容

本轮默认不做：

- 在 Skill Router MCP 服务端执行 Skill `scripts/`；
- 为任意 GitHub 仓库提供通用文件读取；
- 修改 / 提交 / 推送 Skill 文件；
- 将整个 Skill 目录一次性打包返回给模型；
- 用语义搜索替代 Skill 内相对路径引用；
- 将 `assets/` 自动解释成模型必须加载的上下文；
- 在 Router 内实现 GitHub PR、commit 等职责。

`Skill Router MCP` 继续只负责：

> **发现 Skill、提供 Skill、提供 Skill 自身受控的附属资源。**
