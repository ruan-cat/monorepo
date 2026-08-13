# Spec: Skill Resource Access

## 1. ADDED — Skill Resource Enumeration

### Requirement

系统 MUST 允许调用方列出一个已注册 Skill 根目录内的资源。

### Interface

```text
list_skill_resources
```

### Required Inputs

- `skillId`

### Optional Inputs

- `sourceCommitSha`
- `prefix`
- `cursor`
- `limit`

### Behavior

1. 系统 MUST 先解析 `skillId` 对应的 Skill root；
2. 系统 MUST 将所有结果限制在 Skill root 内；
3. 系统 MUST 返回相对 Skill root 的 `/` 分隔路径；
4. 系统 MUST 返回 resolved `sourceCommitSha`；
5. 系统 SHOULD 返回 `mimeType`、`size`、`kind`；
6. 系统 SHOULD 支持 prefix 过滤；
7. 结果顺序 MUST deterministic；
8. 大量结果 MUST 支持分页或明确的上限。

### Scenario: 列出 git-commit references

**Given**

```text
skillId = git-commit
prefix = references/
```

**When**

调用 `list_skill_resources`

**Then**

返回中包含：

```text
references/commit-types.ts
```

且所有记录均位于 `git-commit` Skill root 内。

---

## 1.1 Existing Implementation Compatibility

当前实现已有内部 `SkillRouter.readRelatedFile(skillId, relativePath, snapshot)`。

二期实现 SHOULD 复用或抽取该路径约束与 pinned snapshot 语义，而不是维护第二套相互独立的 related-file reader。

公开 `load_skill_resource` 的错误码与 metadata 契约可以升级，但旧 `load_skill` 行为 MUST 保持兼容。

---

## 2. ADDED — Skill Resource Reading

### Requirement

系统 MUST 允许调用方通过 Skill 相对路径读取单个资源。

### Interface

```text
load_skill_resource
```

### Required Inputs

- `skillId`
- `path`

### Optional Inputs

- `sourceCommitSha`
- `startLine`
- `endLine`
- `maxBytes`

### Behavior

1. `path` MUST 是 Skill root 相对路径；
2. `path` MUST 经过 canonical normalization；
3. 最终资源 MUST 位于 Skill root 内；
4. 系统 MUST 拒绝 path traversal；
5. 系统 MUST 返回 resolved commit SHA；
6. 文本文件 MUST 能返回文本；
7. 二进制文件 MUST 返回正确 MIME 和 blob 元数据；
8. 超大资源 MUST fail closed 或明确截断，不能静默截断；
9. 读取失败 MUST 返回稳定错误码。

### Scenario: 读取 commit-types.ts

**Given**

```text
skillId = git-commit
path = references/commit-types.ts
sourceCommitSha = A
```

**When**

调用 `load_skill_resource`

**Then**

- 返回文件内容；
- `sourceCommitSha` 等于 A；
- `kind` 等于 `reference`；
- 不读取 `dev` 最新 commit B。

---

## 3. ADDED — Snapshot Consistency

### Requirement

同一个 Agent Skill 执行链 MUST 能固定在同一个 Git source commit。

### Behavior

1. `search_skills` / `list_skills` MUST 回显 source commit；
2. `load_skill` MUST 接受该 commit；
3. `list_skill_resources` MUST 接受该 commit；
4. `load_skill_resource` MUST 接受该 commit；
5. 所有响应 MUST 回显实际 resolved commit；
6. commit 不存在时 MUST 返回 `SOURCE_COMMIT_NOT_FOUND`。

### Scenario: dev 在执行期间发生更新

**Given**

```text
search_skills → A
dev → B
```

**When**

继续使用：

```text
load_skill(..., A)
load_skill_resource(..., A)
```

**Then**

两次均必须读取 A。

---

## 4. ADDED — Resource Path Isolation

### Requirement

一个 Skill 的资源读取 MUST 无法越过 Skill root。

### Invalid Inputs

```text
../foo
../../secret
/absolute/path
C:\secret
..\another-skill\SKILL.md
```

### Scenario: 跨 Skill 读取

**Given**

```text
skillId = git-commit
path = ../pr-ruancat-repo/SKILL.md
```

**Then**

返回：

```text
INVALID_RESOURCE_PATH
```

或更具体的：

```text
RESOURCE_OUTSIDE_SKILL_ROOT
```

不得返回目标文件内容。

---

## 5. ADDED — Progressive Disclosure

### Requirement

系统 MUST 保持 Skill 资源按需读取，不得强制在 `load_skill` 时加载全部目录。

### Behavior

`load_skill`：

- MUST 返回 `SKILL.md`；
- MAY 返回资源统计；
- MAY 返回直接引用路径；
- MUST NOT 默认返回所有 references/scripts/assets 内容。

### Scenario: 大型 Skill

**Given**

Skill 包含：

```text
SKILL.md 20 KB
references/ 300 KB
scripts/ 150 KB
assets/ 2 MB
```

**When**

调用 `load_skill`

**Then**

响应主要包含 `SKILL.md` 与轻量资源提示，不包含 2.45 MB 全量附属资源。

---

## 6. ADDED — Resource Kinds

系统 SHOULD 将资源分类为：

```text
skill
reference
script
asset
other
```

规则：

```text
SKILL.md      -> skill
references/** -> reference
scripts/**    -> script
assets/**     -> asset
*             -> other
```

该标签只用于 Agent 决策，MIME 类型仍应独立返回。

---

## 7. ADDED — MCP Resource URI

系统 SHOULD 为 Skill 资源生成 canonical URI：

```text
skill://<plugin>/<skillId>/<path>
```

示例：

```text
skill://common-tools/git-commit/SKILL.md
skill://common-tools/git-commit/references/commit-types.ts
```

底层资源读取 SHOULD 可复用相同 resolver 服务 MCP `resources/read`。

---

## 8. MODIFIED — load_skill

`load_skill` 保持向后兼容。

新增可选字段：

```text
resourceSummary
referencedResources
```

不能改变 `content` 表示 `SKILL.md` 主体的语义。

---

## 9. Non-Requirements

以下能力明确不属于本 Spec：

- 执行 `scripts/*`；
- 解压归档；
- 通用 GitHub 文件浏览；
- Skill 内容写入；
- 跨 Skill 文件读取；
- 自动把所有 assets 注入模型；
- 自动递归加载所有引用。
