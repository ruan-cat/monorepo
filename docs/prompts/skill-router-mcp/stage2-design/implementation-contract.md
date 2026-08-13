# Skill Router MCP Stage 2 Implementation Contract

> Status: **Frozen for Stage 2 implementation**  
> Branch: `skill-router-mcp-stage2-design`  
> Base: `dev`

本文把二期设计中仍然存在的“建议值 / 可选方向”收敛成可以直接实现和测试的契约。若本文件与 `design.md` 或早期讨论存在冲突，以本文件和 `specs/skill-resource-access.md` 的 MUST/SHOULD 约束为准。

## 1. Stage 2 MVP Tool Surface

一期四个工具保持不变：

```text
get_server_info
list_skills
search_skills
load_skill
```

二期新增且作为 ChatGPT Web 首要验收面的工具：

```text
list_skill_resources
load_skill_resource
```

两个新增 Tool 的 annotations 固定为：

```ts
{
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
}
```

二期 MVP **不修改 `load_skill` 的返回结构**。`resourceSummary` / `referencedResources` 延后评估，原因是：

1. `load_skill` 应继续保持便宜的 Skill 激活路径；
2. 不应为了提示资源而让每次 `load_skill` 强制做 Git tree enumeration；
3. 从 Markdown 启发式提取相对引用不是资源读取正确性的依赖；
4. 新增两个资源 Tool 已经足以完成完整 progressive disclosure。

## 2. `list_skill_resources`

### 2.1 Input Schema

```ts
type ListSkillResourcesInput = {
  skillId: string;
  sourceCommitSha?: string;
  prefix?: string;
  cursor?: string;
  limit?: number;
};
```

冻结约束：

```text
skillId: 1..128 chars
sourceCommitSha: 沿用现有 exact SHA 校验
prefix: 0..512 chars；raw POSIX relative prefix
cursor: 1..2048 chars；opaque
limit: integer 1..200；default 50
```

### 2.2 Output Schema

```ts
type SkillResourceKind =
  | "skill"
  | "reference"
  | "script"
  | "asset"
  | "other";

type SkillResourceType = "file" | "symlink" | "submodule";

type SkillResourceRecord = {
  path: string;
  uri: string;
  kind: SkillResourceKind;
  resourceType: SkillResourceType;
  mimeType: string;
  size?: number;
  textReadable: boolean;
};

type ListSkillResourcesOutput = {
  skillId: string;
  plugin: string;
  name: string;
  sourceCommitSha: string;
  prefix?: string;
  resources: SkillResourceRecord[];
  total: number;
  nextCursor?: string;
};
```

`resources` 只返回文件型 Git entries，不返回目录节点。`SKILL.md` 可以出现在结果中，`kind="skill"`；Skill 激活仍推荐使用 `load_skill`。

### 2.3 Deterministic Ordering

结果按 Skill-root relative `path` 做 Unicode code-point / ordinary string ascending 排序，不使用 locale-sensitive collation。

顺序固定后再执行 prefix filter 与 pagination。

### 2.4 Cursor Contract

cursor 必须绑定：

```text
version
skillId
sourceCommitSha
normalized prefix
offset
```

推荐内部 payload：

```ts
type ResourceCursorV1 = {
  v: 1;
  skillId: string;
  sourceCommitSha: string;
  prefix: string;
  offset: number;
};
```

编码使用 base64url JSON 即可；cursor 不包含 secret，不要求服务端会话状态。

关键行为：

1. 首次调用未传 SHA 时，Router resolve `GITHUB_REF` 得到 A；
2. `nextCursor` 必须携带 A；
3. 第二页即使调用方不再显式传 `sourceCommitSha`，仍继续读取 A；
4. 如果调用方同时提供 SHA / prefix / skillId 且与 cursor 不匹配，返回 `RESOURCE_CURSOR_INVALID`；
5. cursor 不能把调用切换到另一个 Skill 或另一个 snapshot。

## 3. Resource Enumeration Implementation

### 3.1 Registry v1 保持不变

二期不为了 deep-file inventory 升级 Registry schema。

继续使用：

```text
id
plugin
name
description
version
entry
```

从 `entry` 推导 Skill root。

### 3.2 Git Trees Strategy

枚举只允许读取选中 Skill 的 subtree，不允许递归抓取整仓库再过滤。

推荐实现：

```text
sourceCommitSha
  ↓
GET git commit -> root tree SHA
  ↓
按 skillRoot path segment 非递归 walk tree
  ↓
得到 skillRootTreeSha
  ↓
GET git tree(skillRootTreeSha, recursive=1)
  ↓
如果 truncated=true
  ↓
回退到 non-recursive subtree traversal
```

这样可以：

- 保持请求范围在已注册 Skill root；
- 获取 blob SHA / mode / type / size；
- 避免 GitHub Contents API 单目录 1000 entries 的上限成为正确性依赖；
- 对 Git Trees recursive response 的截断做 fail-safe fallback。

GitHub 官方文档说明 recursive tree 有 100,000 entries / 7 MB 上限，且 `truncated=true` 时应改为逐 subtree 非递归获取；实现必须处理该标志，而不是静默使用不完整 inventory。

### 3.3 Inventory Cache

可以做进程内 / Worker-isolate best-effort cache，但不能依赖它保证正确性。

缓存 key：

```text
owner + repository + sourceCommitSha + skillId
```

cache value 是完整 deterministic inventory；分页只是对缓存 inventory 做 slice。

不得仅以 `skillId` 为 key。

## 4. `load_skill_resource`

### 4.1 Input Schema

```ts
type LoadSkillResourceInput = {
  skillId: string;
  path: string;
  sourceCommitSha?: string;
  startLine?: number;
  endLine?: number;
  maxBytes?: number;
  binaryMode?: "metadata" | "base64";
};
```

冻结约束：

```text
skillId: 1..128 chars
path: 1..1024 chars；raw POSIX relative path
startLine/endLine: positive integer, 1-based inclusive
maxBytes: integer 1..1,048,576
binaryMode: default "metadata"
```

如果提供 `endLine` 但没有 `startLine`，或 `endLine < startLine`，返回 `RESOURCE_RANGE_INVALID`。

### 4.2 Text Output

```ts
type TextSkillResourceOutput = {
  skillId: string;
  plugin: string;
  name: string;
  sourceCommitSha: string;
  path: string;
  uri: string;
  kind: SkillResourceKind;
  resourceType: "file";
  mimeType: string;
  size: number;
  contentType: "text";
  content: string;
  range?: {
    startLine: number;
    endLine: number;
    totalLines: number;
  };
};
```

规则：

1. 默认 text inline budget = `262_144` bytes (256 KiB)［
2. 调用方可用 `maxBytes` 调低或调高，但最高 `1_048_576` bytes (1 MiB)［
3. Stage 2 MVP 对单个文本 resource 的 hard source size 也固定为 1 MiB；
4. `startLine/endLine` 在 UTF-8 解码完成后按 1-based inclusive 选择；
5. `maxBytes` 对**最终返回的 UTF-8 内容**生效［
6. 超限返回 `RESOURCE_TOO_LARGE`，不能静默 truncate；
7. line range 不能绕过 1 MiB source hard limit。

### 4.3 Binary Output

二进制资源默认只返回 metadata，不把 base64 自动塞入模型上下文。

```ts
type BlobSkillResourceOutput = {
  skillId: string;
  plugin: string;
  name: string;
  sourceCommitSha: string;
  path: string;
  uri: string;
  kind: SkillResourceKind;
  resourceType: "file";
  mimeType: string;
  size: number;
  contentType: "blob";
  encoding: "base64";
  contentIncluded: boolean;
  content?: string;
};
```

规则：

1. `binaryMode` 省略或为 `metadata`：`contentIncluded=false`［
2. `binaryMode="base64"` 时才允许返回内容；
3. binary inline hard cap = `65_536` bytes (64 KiB raw bytes)；
4. 调用方 `maxBytes` 不能扩大 64 KiB binary hard cap；
5. 若请求 base64 但文件超过 effective cap，返回 `RESOURCE_TOO_LARGE`［
6. Router 不执行、解压、解析、图片识别二进制 asset。

`resources/read` 兼容层可以按 MCP 的 `blob` 字段表达 base64，但仍必须遵守 Router 自己的安全 size policy。

### 4.4 File Object Resolution / Read Path

`load_skill_resource` MUST 先在同一 `(sourceCommitSha, skillId)` inventory 中定位 exact resource entry，再读取其 Git blob。

推荐链路：

```text
validated path
  ↓
Skill inventory @ A
  ↓
exact entry (mode/type/blobSha/size)
  ↓
regular blob only
  ↓
Git Blobs API @ blobSha
  ↓
decode / range / size policy
```

新 ResourceResolver 不应直接复用 GitHub Contents API 对 symlink 的透明行为。现有 `readRelatedFile` 的 snapshot/path 语义应被复用或改为委托给新 resolver，但二期 resource Tool 的安全真值来自 Git tree inventory + Git object type。

这样 direct load 即使没有先显式调用 `list_skill_resources`，内部仍可按需构建/命中 inventory cache 后定位 exact blob；调用方不需要先 list。

## 5. Path Canonicalization and Isolation

`path` / `prefix` 是 raw Skill-root relative POSIX path，不是 URL。

### 5.1 Reject

必须拒绝以下类别：

- load 时的空 path；
- POSIX absolute path［
- Windows drive absolute path［
- UNC / network path［
- 含 backslash 的路径；
- 含 empty / dot / parent-directory segment 的路径［
- 含 NUL byte 的路径；
- 含 percent-encoded path separator / dot / NUL triplet 的路径；
- 含 double-encoded traversal triplet 的路径。

Stage 2 选择“拒绝任何 `%HH` 形式的 percent-encoded triplet”，而不是尝试 decode 后再解释。Tool 输入本来就是 JSON 字符串，调用方应传原始仓库文件名；拒绝编码路径可以避免多层 decode 语义差异。

### 5.2 Resolve

通过 registry entry 得到：

```text
skillRoot = dirname(entry)
```

只有通过 canonical validation 的 relative path 才能组合：

```text
repositoryPath = skillRoot + "/" + path
```

资源必须同时出现在同一个 `sourceCommitSha` 的 Skill inventory 中；不能只靠字符串 `startsWith` 判断。

### 5.3 Symlink / Submodule

Git mode/type 必须参与安全判断：

- regular blob (`100644` / `100755`)：可读；
- symlink (`120000`)：可以在 list 中显示，但 `load_skill_resource` 返回 `RESOURCE_TYPE_UNSUPPORTED`；
- submodule/gitlink (`160000`)：可以在 list 中显示，但不可读取；
- Router 不跟随 symlink target。

这避免 GitHub Contents API 对 symlink 的透明解析把读取范围扩展到意料之外的位置。

## 6. Resource Kind and MIME

`kind` 固定按 relative path 分类：

```text
SKILL.md       -> skill
references/**  -> reference
scripts/**     -> script
assets/**      -> asset
other          -> other
```

MIME 使用 deterministic extension map；至少覆盖：

```text
.md -> text/markdown
.txt -> text/plain
.ts/.tsx -> text/typescript
.js/.mjs/.cjs/.jsx -> text/javascript
.json -> application/json
.yaml/.yml -> application/yaml
.xml -> application/xml
.html -> text/html
.css -> text/css
.py -> text/x-python
.sh -> text/x-shellscript
.ps1 -> text/plain
.png -> image/png
.jpg/.jpeg -> image/jpeg
.gif -> image/gif
.webp -> image/webp
.svg -> image/svg+xml
.pdf -> application/pdf
```

未知扩展默认：

```text
application/octet-stream
```

`textReadable=true` 只表示 Router 计划按文本处理；真正读取时 UTF-8 解码失败仍返回 `RESOURCE_ENCODING_UNSUPPORTED`。

## 7. Error Model

保留一期已有错误码，不做破坏性重命名：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
REGISTRY_ENTRY_INVALID
SKILL_NOT_FOUND
SOURCE_COMMIT_INVALID
SOURCE_READ_FAILED
GITHUB_AUTH_FAILED
GITHUB_RATE_LIMITED
GITHUB_NOT_FOUND
GITHUB_UPSTREAM_FAILED
INVALID_QUERY
INVALID_PATH
```

二期新增：

```text
RESOURCE_NOT_FOUND
INVALID_RESOURCE_PATH
RESOURCE_TYPE_UNSUPPORTED
RESOURCE_TOO_LARGE
RESOURCE_RANGE_INVALID
RESOURCE_CURSOR_INVALID
RESOURCE_ENCODING_UNSUPPORTED
```

冻结语义：

- public resource Tool 的 path validation 统一返回 `INVALID_RESOURCE_PATH`；
- 不再额外暴露 `RESOURCE_OUTSIDE_SKILL_ROOT`，避免重复错误语义；
- malformed SHA 继续使用 `SOURCE_COMMIT_INVALID`；
- 不在二期为了资源读取引入新的 `SOURCE_COMMIT_NOT_FOUND` 语义；
- 已确认 Skill 存在且 path 合法，但同 snapshot 中没有该 resource -> `RESOURCE_NOT_FOUND`［
- GitHub auth/rate/upstream failures 继续使用已有 GitHub domain errors。

Error data SHOULD 回显安全定位字段：

```ts
{
  code: string;
  message: string;
  skillId?: string;
  path?: string;
  sourceCommitSha?: string;
  size?: number;
  limit?: number;
}
```

不得回显 token、Authorization header、原始 GitHub error body 中的敏感字段。

## 8. Immutable `skill://` URI

原先的：

```text
skill://<plugin>/<skillId>/<path>
```

是 mutable locator：如果 `dev` 前进，同一 URI 可能读取不同内容。

二期 canonical URI 改为：

```text
skill://<plugin>/<sourceCommitSha>/<skill-name>/<relative-path>
```

示例：

```text
skill://common-tools/4b6ec87930119cc65971a76ce5d10c87a204d71b/git-commit/SKILL.md
skill://common-tools/4b6ec87930119cc65971a76ce5d10c87a204d71b/git-commit/references/commit-types.ts
```

每个 URI segment 必须按 RFC 3986 做 segment encoding。

这里使用 registry/frontmatter `name` 作为 `<skill-name>`，而不是依赖内部 `skillId` 一定等于 name。这样仍满足 Skills-over-MCP draft 对“skill path 最终 segment 等于 Skill name”的约束，同时把 snapshot SHA 放在更前面的 namespace segment。

相对引用仍可以自然解析：

`SKILL.md` URI 与 Skill-root relative reference 组合后，仍必须解析到同一 SHA namespace 下的 Skill resource URI。

二期不额外提供 mutable `latest` `skill://` alias；如未来需要可另行设计，避免一个 resource URI 在不同时间返回不同 bytes。

## 9. MCP Resources Compatibility

Tools 是 Stage 2 对 ChatGPT Web 的验收门。

同一 ResourceResolver SHOULD 再映射为 MCP Resources：

```text
resources/read(skill://...)
```

要求：

1. text -> MCP `text`；
2. binary -> MCP `blob` (base64)；
3. `mimeType` / `size` 与 Tool metadata 共用；
4. URI validation 与 Tool path isolation 共用；
5. 不维护第二套 GitHub reader。

`skill://index.json` 不作为 Stage 2 MVP gate；可在资源读取和 ChatGPT Tool 验收稳定后评估。

## 10. File-level Implementation Map

预计主要修改：

```text
packages/skill-router-mcp/runtime/errors.ts
packages/skill-router-mcp/repositories/github-skill-source.ts
packages/skill-router-mcp/services/skill-router.ts
packages/skill-router-mcp/services/resource-resolver.ts        # new
packages/skill-router-mcp/mcp/tool-definitions.ts
packages/skill-router-mcp/mcp/tools/list-skill-resources.ts    # new
packages/skill-router-mcp/mcp/tools/load-skill-resource.ts     # new
packages/skill-router-mcp/tests/skill-router.test.ts
packages/skill-router-mcp/tests/mcp-client-contract.test.ts
packages/skill-router-mcp/tests/production-harness.test.ts
```

MCP Resources 若同二期交付，再新增独立 adapter / registration 文件，但底层必须复用 `ResourceResolver`。

## 11. Implementation Gate

进入生产代码实现前，设计 PR 应满足：

- [x] 一期 / 二期边界核对
- [x] 现有 `readRelatedFile` / SourceSnapshot 核对
- [x] enumeration source 决策
- [x] pagination snapshot 决策
- [x] path canonicalization 决策
- [x] size / binary policy 决策
- [x] error model 决策
- [x] immutable URI 决策
- [x] `load_skill` compatibility 决策
- [ ] PR review 接受上述冻结契约

review 通过后可以直接按本文件进入 `packages/skill-router-mcp` 实现。
