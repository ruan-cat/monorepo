# Pull Request Draft

## Working Branch

```text
skill-router-mcp-stage2-design
```

Base:

```text
dev
```

## Proposed Title

```text
docs(skill-router-mcp): 设计二期 Skill 附属资源按需加载能力
```

> 最终 PR title 应在正式提交前再次按 `git-commit` Skill、仓库当时的 `commit-types.ts` 和实际 diff 校验后冻结。

## PR Body

### 背景

Skill Router MCP 一期已经能够完成 Skill 的发现、搜索与 `SKILL.md` 按需加载，但 Agent Skill 本身是一个目录，而不是单文件。

真实 Skill 已经依赖附属资源：

- `git-commit` 需要 `references/commit-types.ts` 等规则文件；
- `pr-ruancat-repo` 需要 `references/target-repos.md`、`references/workflow-and-template.md`、`references/batch-pr-script.ts`；
- 其他 Skill 还可能包含 `scripts/`、`assets/` 以及自定义资源。

当前公开 Tool Surface 只能返回 `SKILL.md`，Agent 会得到“继续读取某个相对路径文件”的指令，却没有通过同一 Router 获取该文件的标准能力。

源码核对发现 `SkillRouter.readRelatedFile(...)` 已经存在，并能在同一 pinned snapshot 下读取 Skill root 内的相对路径。这说明二期应复用现有底层能力，重点补齐公开 Tool、资源枚举、metadata/blob、安全与验收契约，而不是另建一套读取体系。

### 本 PR 做什么

本 PR 先完成 Skill Router MCP 二期的架构与 Spec 设计，冻结以下方向：

1. 保持一期 `search_skills` / `list_skills` / `load_skill` 的职责；
2. 新增 `list_skill_resources`，用于按 Skill root 发现附属资源；
3. 新增 `load_skill_resource`，用于读取指定相对路径资源；
4. `load_skill` 保持只加载 `SKILL.md`，仅增加轻量 resource hints，不默认打包整个 Skill；
5. 所有调用支持 `sourceCommitSha`，确保 `SKILL.md` 与 references/scripts/assets 来自同一 Git snapshot；
6. 对相对路径做严格 Skill-root 隔离，拒绝 path traversal；
7. 将同一底层 Resource Resolver 映射为可选 `skill://` MCP Resources，以兼容 Skills-over-MCP 的演进方向；
8. ChatGPT Web 仍以 model-callable tools 作为二期首要验收入口，不依赖 Host 必须暴露 Resources。

### 为什么这样设计

核心目标是保留 Agent Skills 的 progressive disclosure：

```text
metadata
  ↓
SKILL.md
  ↓
需要时再加载 references / scripts / assets
```

而不是：

```text
load_skill
  ↓
把整个 Skill 目录一次性塞进上下文
```

这样能同时保证：

- Skill 执行契约完整；
- token/context 可控；
- source snapshot 可复现；
- Skill Router 职责不膨胀成通用 GitHub 文件浏览器；
- scripts 可以被分发，但不会被 Router 远程执行。

### 真实验收案例

#### git-commit

```text
search_skills("git-commit")
→ load_skill("git-commit", commit A)
→ load_skill_resource(
    "git-commit",
    "references/commit-types.ts",
    commit A
  )
```

#### pr-ruancat-repo

```text
load_skill("pr-ruancat-repo")
→ load_skill_resource(
    "pr-ruancat-repo",
    "references/workflow-and-template.md"
  )
```

两条链路都不应要求用户手工复制 reference 文件。

### 本 PR 当前阶段

本 PR 首先提交二期设计与可落地 Spec。

后续实现将继续依据：

- 一期设计文档；
- `packages/skill-router-mcp` 当前实现；
- Cloudflare Worker 部署方式；
- ChatGPT Web 实际 tool scan / invocation 行为；

逐项回填实现任务和验收结果。

### 验证计划

- [x] 对照一期设计确认二期边界
- [x] 对照当前源码确认 Registry / GitHub fetch / snapshot 架构
- [ ] `git-commit` reference 读取 PoC
- [ ] `pr-ruancat-repo` reference 读取 PoC
- [ ] path traversal tests
- [ ] source commit snapshot consistency tests
- [ ] scripts/assets resource tests
- [ ] ChatGPT Web Scan Tools
- [ ] Cloudflare Workers Builds 配置核对
- [ ] ChatGPT Web 端到端调用
