# Skill Router MCP 二期变更提案

## 1. Why

Agent Skills 的基本单位不是单个 `SKILL.md` 文件，而是一个 Skill 目录。

典型结构：

```text
skill-name/
├── SKILL.md
├── references/
├── scripts/
├── assets/
└── ...
```

其设计依赖渐进式披露：

1. 先根据 `name` / `description` 判断是否需要 Skill；
2. 激活 Skill 后读取 `SKILL.md`；
3. 仅在执行任务需要时再读取 references、scripts、assets 等附属资源。

当前 Skill Router MCP 已完成前两步，但缺少第三步。

### 1.1 真实阻塞案例：git-commit

`git-commit/SKILL.md` 明确要求读取：

```text
references/commit-types.ts
references/commit-message-template.md
references/commit-splitting-example.md
references/staging-priority.md
...
```

其中 `references/commit-types.ts` 甚至承担 type/emoji 的权威或 fallback 数据职责。

如果 Router 只能返回 `SKILL.md`，Agent 能看到：

> “必须读取 `references/commit-types.ts`”

却无法通过同一个 Skill Router MCP 获取该文件。

这意味着 Skill 的执行契约是不完整的。

### 1.2 第二个真实案例：pr-ruancat-repo

该 Skill 又要求读取：

```text
references/target-repos.md
references/workflow-and-template.md
references/batch-pr-script.ts
```

因此问题不是单一 Skill 的特殊情况，而是当前 Tool Surface 无法覆盖 Agent Skills 的标准目录模型。

### 1.3 与一期边界的关系

一期并没有完全忽略 related files。

一期 `implementation-spec.md` 已预留：

- GitHub Repository Adapter 负责 `related file @ SHA`；
- deep files 按需读取；
- 与选中 `SKILL.md` 固定在同一 `sourceCommitSha`；
- path 不能逃出 Skill 范围。

当前 `dev` 源码也已经存在 `SkillRouter.readRelatedFile(...)`。

因此二期的准确定位不是“第一次增加深层文件读取”，而是：

> **把一期已经预留、且底层已有雏形的 related-file 能力，提升为 ChatGPT/MCP 可直接调用、可枚举、可测试、可处理文本与二进制资源的完整公开契约。**

### 1.4 Registry v1 是否必须升级

一期刻意让 Registry v1 只保存 Skill metadata + `entry`，不枚举 deep files。

二期默认不因为 resource access 就立即升级 registry schema。优先从 `entry` 推导 Skill root，并在 pinned SHA 下由 GitHub Source 仅枚举该 Skill root。

只有 benchmark 证明运行时枚举不可接受时，再引入 resource inventory / registry schema bump。

## 2. What

二期新增“Skill Resource Access”能力。

### 2.1 新增工具

```text
list_skill_resources
load_skill_resource
```

### 2.2 保持 load_skill MVP 兼容

Stage 2 MVP 不强制增加 `resourceSummary` / `referencedResources`。

这些字段原本用于降低下一次工具调用成本，但会带来额外 tree enumeration 或 Markdown 引用提取逻辑。二期先用两个独立资源 Tool 完成正确性与 progressive disclosure，resource hints 作为后续兼容优化评估。

### 2.3 可选 MCP Resources 映射

为同一资源提供：

```text
skill://common-tools/<sourceCommitSha>/git-commit/references/commit-types.ts
```

使未来 Host 可以使用标准 `resources/read` 读取。

## 3. Scope

### 3.1 二期必须完成

- Skill 目录资源枚举；
- 相对路径资源读取；
- `references/`；
- `scripts/`；
- `assets/`；
- 其他位于 Skill 根目录内的合法文件；
- 文本和二进制 MIME 元数据；
- Git source commit 快照固定；
- 路径穿越防护；
- 文件大小限制；
- 稳定错误码；
- ChatGPT Web 工具调用验证；
- `git-commit` 和 `pr-ruancat-repo` 端到端验收。

### 3.2 二期不做

- 远程执行 scripts；
- shell / code execution；
- 任意 repo path fetch；
- Skill 文件写入；
- 全 Skill bundle 默认返回；
- 任意绝对路径读取；
- 跨 Skill 路径读取；
- 自动递归跟随 references 中的 references。

## 4. Impact

### 4.1 Tool Schema

新增两个工具意味着 ChatGPT 侧需要重新扫描 / 刷新 MCP App 的 action/tool snapshot。

### 4.2 Registry Schema

如果当前 registry 仅索引 Skill 元数据和 `entry`，二期需要增加 Skill 文件清单或能够在运行时安全枚举 Skill 根目录。

推荐将 `registrySchemaVersion` 从 `1` 升级到下一版本，并明确旧版本兼容策略。

### 4.3 缓存

资源缓存必须至少以以下键区分：

```text
repository + sourceCommitSha + skillId + resourcePath
```

不能仅用：

```text
skillId + resourcePath
```

否则 `dev` 更新后可能把不同 commit 的内容混在一次 Agent 执行链中。

## 5. Success Criteria

下面的流程必须无人工复制文件完成：

```text
search_skills("git-commit")
  ↓
sourceCommitSha = A
  ↓
load_skill("git-commit", A)
  ↓
发现 references/commit-types.ts
  ↓
load_skill_resource(
  skillId = "git-commit",
  path = "references/commit-types.ts",
  sourceCommitSha = A
)
  ↓
返回 commit-types.ts 内容，resolved commit 仍为 A
```

同理：

```text
load_skill("pr-ruancat-repo")
  ↓
load_skill_resource(
  "pr-ruancat-repo",
  "references/workflow-and-template.md"
)
```

必须成功。
