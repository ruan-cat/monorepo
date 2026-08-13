# Skill Router MCP Stage 2 技术设计

## 1. 目标

Stage 2 补全 Agent Skill 目录的渐进式资源访问能力，不扩大 Router 的职责边界。

```text
metadata
  -> SKILL.md
  -> references / scripts / assets / other resources on demand
```

Router 只负责发现、列出和读取 Skill 自身资源；不执行脚本，不提供通用仓库浏览，不写入 Skill。

## 2. 当前实现基线

当前 `dev` 已存在：

- `SkillRouter.snapshot`
- `SkillRouter.loadSkill`
- `SkillRouter.readRelatedFile`
- `GitHubSkillSource.resolveRef`
- `GitHubSkillSource.readFile`
- `SourceSnapshot`

因此 Stage 2 不重新实现第二套 Skill 读取路径，而是把现有 related-file 能力抽取并扩展为稳定的 `ResourceResolver`，再暴露两个 model-callable Tools。

## 3. Tool Surface

一期保持：

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

两个新 Tool 都是 read-only、non-destructive、open-world。

Stage 2 MVP 保持 `load_skill` 现有公开返回结构，不强制加入 resource hints，避免每次激活 Skill 都触发额外 tree enumeration。

## 4. ResourceResolver

推荐结构：

```text
Registry v1 entry
  -> SkillResolver
  -> selected Skill root
  -> ResourceResolver
  -> GitHub source at exact sourceCommitSha
  -> Tools / optional MCP Resources
```

ResourceResolver 负责：

- Skill root 解析
- deterministic inventory
- resource kind / object type / MIME / size
- snapshot consistency
- safe relative path validation
- range / size / binary policy
- immutable resource URI
- stable resource errors

## 5. Resource Enumeration

Registry v1 保持不变，不因为 deep-file inventory 强制升级 schema。

枚举只读取选中 Skill 的 Git subtree：

```text
sourceCommitSha
  -> commit root tree
  -> walk to selected Skill tree
  -> recursive Skill subtree read
  -> safe fallback when upstream reports truncation
```

禁止先递归读取整个 monorepo 再按 Skill path 过滤。

结果按 Skill-root relative path 做 deterministic ascending sort，再执行 prefix filter 和 pagination。

分页 cursor 必须绑定 `skillId`、`sourceCommitSha`、prefix 和 offset，因此分支在两页之间前进时，后续页面仍属于首次解析出的 snapshot。

## 6. `list_skill_resources`

冻结输入：

```ts
{
  skillId: string;
  sourceCommitSha?: string;
  prefix?: string;
  cursor?: string;
  limit?: number;
}
```

冻结范围：

- default limit: 50
- max limit: 200
- cursor: opaque, stateless, snapshot-bound

Resource record 至少包含：

```text
path
uri
kind
resourceType
mimeType
size
textReadable
```

其中：

```text
kind = skill | reference | script | asset | other
resourceType = file | symlink | submodule
```

目录节点不作为 resource record 返回。

## 7. `load_skill_resource`

冻结输入：

```ts
{
  skillId: string;
  path: string;
  sourceCommitSha?: string;
  startLine?: number;
  endLine?: number;
  maxBytes?: number;
  binaryMode?: "metadata" | "base64";
}
```

冻结大小策略：

```text
text inline default     256 KiB
text/source hard cap      1 MiB
binary default          metadata only
binary base64 hard cap   64 KiB raw
```

超限必须显式失败，不允许静默截断。

直接读取资源时，先在同一 pinned Skill inventory 中定位 exact Git object，再读取 regular blob。调用方不需要先显式执行 list。

## 8. Object Type Safety

Git object type 参与读取安全判断：

- regular blob: 可读取
- symlink: 可列出 metadata，但不跟随、不读取
- submodule: 可列出 metadata，但不进入子仓库读取

这避免底层 path API 的透明解析扩大 Router 的读取范围。

## 9. Path Safety

公开资源 Tool 只接受 raw Skill-root relative POSIX path。

实现必须拒绝所有会改变根目录语义、平台语义或编码语义的输入类别，包括：

- parent-directory traversal
- absolute path
- Windows drive 或 network path
- mixed separator
- empty、dot 或 parent directory segment
- NUL
- percent-encoded traversal 或 separator forms

最终 resource 还必须实际存在于同一 pinned Skill inventory；不能只依赖字符串前缀判断。

公开 path validation 统一使用 `INVALID_RESOURCE_PATH`。

## 10. MIME / Text / Binary

MIME 使用 deterministic extension map；未知类型 fallback `application/octet-stream`。

`textReadable` 是 inventory hint。真正读取文本时仍必须验证 UTF-8；不支持的编码返回稳定 resource error。

二进制默认 metadata-only；仅在调用方明确请求且资源不超过固定 cap 时返回 base64。

## 11. Error Model

一期错误码保持兼容。

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

不再增加语义重复的 root-escape error code，也不为了资源访问重命名一期 source errors。

## 12. Immutable Skill URI

Stage 2 canonical URI：

```text
skill://<plugin>/<sourceCommitSha>/<skill-name>/<relative-path>
```

URI 包含 source SHA，因此同一个 URI 对应不可变 Git snapshot。

`<skill-name>` 使用 Skill name，使 Skills-over-MCP 兼容层的最终 Skill segment 与 Agent Skill 名称保持一致。

Stage 2 不提供 mutable latest URI alias。

## 13. MCP Resources Compatibility

Tools 是 ChatGPT Web 的 Stage 2 验收门。

同一个 ResourceResolver SHOULD 再映射为标准 MCP Resources：

- text resource -> MCP text
- binary resource -> MCP blob
- 共用 URI、MIME、size、snapshot 和 path isolation

不维护第二套 GitHub reader。

`skill://index.json` 不阻塞 Stage 2 MVP。

## 14. Deployment Boundary

新增两个 Tool 会改变 `tools/list`，上线必须同时完成：

1. Cloudflare Workers Builds 部署新 runtime
2. MCP Inspector / Developer Mode 验证
3. ChatGPT Refresh / Scan Tools
4. `git-commit` 与 `pr-ruancat-repo` 真实端到端调用

Skill 内容本身的变化仍只依赖 Git source freshness，不需要因为 references、scripts 或 assets 更新重新部署 Worker。

## 15. 权威实现契约

具体 schema、limits、cursor、errors 和 URI 值以 [`implementation-contract.md`](./implementation-contract.md) 为准；可落地 MUST/SHOULD 场景以 [`specs/skill-resource-access.md`](./specs/skill-resource-access.md) 为准。
