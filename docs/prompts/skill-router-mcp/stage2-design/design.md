# Skill Router MCP Stage 2 技术设计

## 1. 设计原则

### 1.1 保留 Progressive Disclosure

二期不能把：

```text
SKILL.md
references/**
scripts/**
assets/**
```

全部拼成一次 `load_skill` 返回。

正确模型是：

```text
发现
  ↓
激活
  ↓
按需读取
```

这既符合 Agent Skills 的目录模型，也能控制上下文和 token 成本。

### 1.2 Skill Router 只读取，不执行

`scripts/` 属于 Skill 的资源，不代表 Router 应执行它。

Router 只负责：

```text
列出 script
读取 script
返回 script 元数据 / 内容
```

是否执行由调用 Agent 自己的执行环境、权限和其他工具决定。

### 1.3 Tool-first，Resource-compatible

二期同时考虑：

- ChatGPT Web 当前可靠的模型工具调用；
- MCP 生态面向 Skills-over-MCP 的 Resources 设计。

但两者必须共享底层服务，避免双实现。

## 2. 总体架构

```text
                         ┌─────────────────────┐
                         │   Skill Registry    │
                         │ metadata + entries  │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
         ┌────────▼─────────┐               ┌─────────▼─────────┐
         │ Skill Resolver    │               │ Resource Resolver  │
         │ id → skill root   │               │ safe relative path │
         └────────┬─────────┘               └─────────┬─────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ GitHub Source Layer │
                         │ pinned commit SHA   │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
     ┌────────▼─────────┐                       ┌──────────▼─────────┐
     │ MCP Tools         │                       │ MCP Resources       │
     │ model-controlled  │                       │ host-compatible     │
     └──────────────────┘                       └─────────────────────┘
```

## 2.1 当前实现基线

当前 `dev` 并不是完全没有 resource 读取基础。

已存在：

```text
SkillRouter.snapshot(...)
SkillRouter.loadSkill(...)
SkillRouter.readRelatedFile(...)
GitHubSkillSource.resolveRef(...)
GitHubSkillSource.readFile(...)
SourceSnapshot
```

其中 `readRelatedFile` 已经：

- 从 registry `entry` 推导 Skill root；
- 将读取限制在该 Skill 目录；
- 使用传入 snapshot 的 exact `sourceCommitSha`；
- 复用现有 GitHub source layer。

但它当前只是内部 service 方法，没有进入 canonical `toolDefinitions`，也没有完整的 resource metadata / blob / enumeration 契约。

因此推荐实现演进为：

```text
现有 readRelatedFile
  ↓
抽取 / 扩展 ResourceResolver
  ↓
load_skill_resource Tool
  ↓
list_skill_resources Tool
  ↓
可选 skill:// MCP Resources adapter
```

而不是重新实现第二套 Skill 读取路径。

### 2.2 Registry / Resource Enumeration

默认保留 Registry v1 的 low-churn 原则，不把整个 Skill 文件清单写进 registry。

推荐：

```text
registry.entry
  ↓
SkillResolver -> skill root
  ↓
GitHubSkillSource.listDirectory/listSkillTree @ pinned SHA
  ↓
ResourceResolver
  ↓
deterministic list + prefix + pagination
```

枚举必须只发生在选中的 Skill root，而不是把 Router 扩成任意 repo tree browser。

对同一 `(repository, sourceCommitSha, skillId)` 的枚举结果可以缓存；是否需要 Registry v2 由 benchmark 决定。

### 2.3 当前部署与 freshness

当前生产部署 authority 是 Cloudflare Workers Builds Git Integration；仓库 GitHub Actions 只运行 typecheck/test/build。

同时：

```text
Skill-only change
  -> Git push
  -> next unpinned call resolves GITHUB_REF again
  -> no Worker redeploy

Runtime/code/config change
  -> Cloudflare Workers Build / deploy

Tool contract change
  -> Runtime deploy
  -> ChatGPT Refresh / Scan Tools
```

二期新增 Tool 属于第三类，不能只验证 Cloudflare 部署成功。

## 3. 推荐 Tool Surface

一期继续保留：

```text
get_server_info
list_skills
search_skills
load_skill
```

二期新增：

```text
list_skill_resources
load_skill_resource
```

不推荐一期二期直接增加：

```text
load_skill_bundle
```

因为 bundle 会弱化渐进式披露，并容易把大量无关资源塞进上下文。

## 4. Tool 1：list_skill_resources

### 4.1 用途

当 Agent：

- 不知道某 Skill 有哪些附属文件；
- 只知道 `references/` 目录但不知道文件名；
- 需要发现 scripts/assets；
- 要确认某个引用文件是否存在；

调用此工具。

### 4.2 输入

```ts
type ListSkillResourcesInput = {
  skillId: string;
  sourceCommitSha?: string;
  prefix?: string;
  cursor?: string;
  limit?: number;
};
```

### 4.3 输出

```ts
type SkillResourceRecord = {
  path: string;
  uri: string;
  kind: "skill" | "reference" | "script" | "asset" | "other";
  mimeType?: string;
  size?: number;
  textReadable: boolean;
};

type ListSkillResourcesOutput = {
  skillId: string;
  plugin: string;
  sourceCommitSha: string;
  resources: SkillResourceRecord[];
  nextCursor?: string;
};
```

### 4.4 示例

```json
{
  "skillId": "git-commit",
  "sourceCommitSha": "4b6ec879...",
  "prefix": "references/"
}
```

返回：

```json
{
  "skillId": "git-commit",
  "plugin": "common-tools",
  "sourceCommitSha": "4b6ec879...",
  "resources": [
    {
      "path": "references/commit-types.ts",
      "uri": "skill://common-tools/git-commit/references/commit-types.ts",
      "kind": "reference",
      "mimeType": "text/plain",
      "size": 12345,
      "textReadable": true
    }
  ]
}
```

## 5. Tool 2：load_skill_resource

### 5.1 用途

读取一个已经确定路径的 Skill 附属资源。

### 5.2 输入

```ts
type LoadSkillResourceInput = {
  skillId: string;
  path: string;
  sourceCommitSha?: string;

  // 可选：文本文件范围读取
  startLine?: number;
  endLine?: number;

  // 可选：防止模型误拉超大文件
  maxBytes?: number;
};
```

### 5.3 输出：文本资源

```ts
type TextSkillResourceOutput = {
  skillId: string;
  plugin: string;
  sourceCommitSha: string;
  path: string;
  uri: string;
  kind: "reference" | "script" | "asset" | "other";
  mimeType: string;
  size: number;
  contentType: "text";
  content: string;
  range?: {
    startLine: number;
    endLine: number;
    totalLines?: number;
  };
};
```

### 5.4 输出：二进制资源

工具层不应默认把大型二进制资源塞进模型上下文。

建议返回：

```ts
type BlobSkillResourceOutput = {
  skillId: string;
  plugin: string;
  sourceCommitSha: string;
  path: string;
  uri: string;
  kind: "asset" | "other";
  mimeType: string;
  size: number;
  contentType: "blob";
  encoding?: "base64";
  content?: string;
  truncated?: boolean;
};
```

策略：

1. 小型 blob 可以受 `maxBytes` 限制后返回 base64；
2. 大型 blob 返回元数据 + `uri`；
3. MCP Resources 层可用标准 blob 资源表达；
4. Router 不做图片识别、不解压、不执行。

## 6. load_skill 的二期增强

`load_skill` 仍只负责 `SKILL.md` 内容。

新增轻量提示：

```ts
type LoadSkillOutputV2 = {
  id: string;
  plugin: string;
  name: string;
  description: string;
  version: string;
  entry: string;
  content: string;
  sourceCommitSha: string;

  resourceSummary?: {
    count: number;
    references: number;
    scripts: number;
    assets: number;
    other: number;
  };

  referencedResources?: Array<{
    path: string;
    kind: "reference" | "script" | "asset" | "other";
  }>;
};
```

### 为什么需要 referencedResources

对于这种文本：

```markdown
读取 `references/commit-types.ts`
```

模型本身已经知道准确路径。

如果 Router 同时能从 SKILL.md 中提取直接相对引用并返回轻量索引，Agent 可以：

```text
load_skill
  ↓
直接 load_skill_resource
```

而无需多做一次 `list_skill_resources`。

这只是优化，不是正确性的依赖。

## 7. Canonical Skill URI

建议：

```text
skill://<plugin>/<skillId>/<relative-path>
```

示例：

```text
skill://common-tools/git-commit/SKILL.md
skill://common-tools/git-commit/references/commit-types.ts
skill://common-tools/pr-ruancat-repo/references/workflow-and-template.md
```

原因：

- `plugin` 提供命名空间；
- `skillId` 与当前 Registry 主键对齐；
- `<relative-path>` 与 Skill 根目录相对路径完全一致；
- 未来可以直接映射到 MCP `resources/read`。

## 8. sourceCommitSha 一致性

这是二期的关键正确性要求。

### 8.1 问题

假设：

```text
T0: search_skills → commit A
T1: dev 分支推进到 commit B
T2: load_skill 没有 pin → 读取 B
T3: load_skill_resource 又读取 C
```

Agent 最终会执行一个“拼接出来的 Skill”，不是仓库里真实存在过的任何版本。

### 8.2 规则

所有响应必须回显：

```text
sourceCommitSha
```

调用方推荐遵循：

```text
search/list 返回 A
  ↓
load_skill(..., A)
  ↓
list/load resource(..., A)
```

如果调用方省略 SHA：

- Router 可以 resolve 当前 `dev`；
- 但必须在响应里返回实际 resolved SHA；
- 后续调用应继续使用该 SHA。

### 8.3 缓存键

```text
repo + commitSha + skillId + path
```

## 9. 路径安全

`path` 是模型可控输入，必须视为不可信。

### 9.1 必须拒绝

```text
../
../../
/absolute/path
C:\...
\\server\share
%2e%2e/
双重 URL 编码路径穿越
NUL
```

### 9.2 根目录约束

解析后的资源必须满足：

```text
resolvedPath ∈ resolvedSkillRoot
```

并且不能通过：

- symlink；
- URL 编码；
- 路径分隔符混用；

逃出 Skill 根目录。

### 9.3 跨 Skill 读取禁止

下面的调用必须失败：

```text
skillId = git-commit
path = ../pr-ruancat-repo/SKILL.md
```

## 10. Resource 类型判断

推荐基于路径 + MIME 双重判断：

```text
SKILL.md      → skill
references/** → reference
scripts/**    → script
assets/**     → asset
其他          → other
```

`kind` 只是语义标签，不能取代 MIME。

## 11. 错误模型

建议稳定错误码：

```text
SKILL_NOT_FOUND
RESOURCE_NOT_FOUND
INVALID_RESOURCE_PATH
RESOURCE_OUTSIDE_SKILL_ROOT
RESOURCE_TOO_LARGE
UNSUPPORTED_RESOURCE_ENCODING
SOURCE_COMMIT_NOT_FOUND
SOURCE_COMMIT_MISMATCH
UPSTREAM_FETCH_FAILED
```

错误响应应包含：

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resource does not exist in this skill snapshot.",
  "skillId": "git-commit",
  "path": "references/foo.md",
  "sourceCommitSha": "..."
}
```

## 12. MCP Resources 兼容层

同一 Resource Resolver 可以注册：

```text
skill://<plugin>/<skillId>/{+path}
```

并支持标准：

```text
resources/read
```

可选提供：

```text
skill://index.json
```

但这层属于兼容 / 演进面。

### ChatGPT Web 设计要求

不能假设 ChatGPT 一定会把 MCP Resources 以模型可直接调用的方式暴露。

因此二期 ChatGPT 验收以：

```text
list_skill_resources
load_skill_resource
```

为准。

MCP Resources 验收作为额外协议互操作测试。

## 12.1 二期上线边界

新增 `list_skill_resources` / `load_skill_resource` 会改变 `tools/list`。

因此二期上线至少包含两个独立完成条件：

1. Cloudflare Workers Builds Git Integration 已部署包含新 Tool 的 runtime；
2. ChatGPT MCP App 已 Refresh / Scan Tools，并真实看到、调用新 Tool。

Skill 内容本身仍走 Git source freshness，不因 references/scripts/assets 内容变化重新部署 Worker。

Cloudflare Dashboard 中 Builds 的 production branch / path filters / build command 属于外部部署配置；仓库当前不能完整证明这些值，实施前必须单独核对。

## 13. 不采用的方案

### 13.1 `load_skill(includeResources=true)`

拒绝作为默认方案。

问题：

- 破坏 progressive disclosure；
- token 不可控；
- assets/scripts 很可能与当前任务无关；
- 大 Skill 会造成严重上下文污染。

### 13.2 任意 GitHub path reader

拒绝。

Skill Router MCP 应当验证：

```text
请求 path 必须属于已注册 Skill 的根目录
```

而不是提供：

```text
read_repo_file("any/path")
```

否则职责会膨胀成通用 GitHub MCP。

### 13.3 服务端执行 scripts

拒绝。

Router 只分发 Skill，不为 Skill 获得额外执行权限。
