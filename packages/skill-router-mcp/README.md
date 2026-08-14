# skill-router-mcp

面向 ChatGPT Web Developer Mode 的只读 Skill Router MCP Worker。

## 本地运行

1. 复制 `.dev.vars.example` 为 `.dev.vars`，填写 GitHub fine-grained token（目标仓库 `Contents: read`）。
2. 执行 `pnpm install`，再运行 `pnpm dev` 或 `pnpm build`。
3. 运行 `pnpm test:unit`、`pnpm test:worker`、`pnpm test:integration`，或执行 `pnpm test:all`。

`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_REF` 是公开 source 配置；`GITHUB_TOKEN` 只能通过本地 `.dev.vars` 或 Cloudflare secret 注入。`.dev.vars` 不得提交。

## Tool Surface

当前只读工具：

- `get_server_info`
- `list_skills`
- `search_skills`
- `load_skill`
- `list_skill_resources`
- `load_skill_resource`

推荐的 progressive-disclosure 调用链：

```text
search_skills(query)
  ↓
记录 sourceCommitSha = A
  ↓
load_skill(skillId, A)
  ↓
SKILL.md 需要 references / scripts / assets
  ↓
load_skill_resource(skillId, relativePath, A)
```

不知道准确资源路径时：

```text
list_skill_resources(skillId, A, prefix?)
  ↓
选择资源
  ↓
load_skill_resource(skillId, path, A)
```

`list_skill_resources` 的分页 cursor 自带 pinned source commit；后续页面即使 `GITHUB_REF` 已前进，也继续读取第一次调用的同一 Git snapshot。

## Skill Resource 边界

- Registry v1 仍只负责 Skill discovery，不枚举 deep files。
- Resource inventory 通过 exact commit 下的选中 Skill Git subtree 获取，不扫描任意仓库路径。
- `load_skill_resource` 只读取该 Skill inventory 中存在的 regular blob。
- symlink / submodule 可以被枚举，但不会被 Router 跟随或读取。
- 文本默认 inline 上限 256 KiB，单资源 hard source limit 1 MiB。
- 二进制默认只返回 metadata；显式 `binaryMode=base64` 时 raw inline hard cap 为 64 KiB。
- Router 不执行 `scripts/`、不解压 asset、不做图片识别。

## 版本与部署边界

- MCP SemVer 来自 `package.json`；Worker 版本来自 `CF_VERSION_METADATA`；Skill 内容版本来自 GitHub exact commit SHA；build SHA 是构建期元数据，不能混用。
- Skill-only 内容更新不部署 Worker；下一次未 pin 调用重新解析 `GITHUB_REF`。
- tool name/schema/description/annotation 变更必须在 Worker 部署后重新进行 Inspector 与 ChatGPT Developer Mode Refresh / Scan Tools。
- 生产部署 authority 是 Cloudflare Workers Builds Git Integration；本仓库 workflow 只做静态检查、typecheck、测试和构建，不执行 Wrangler deploy 或 promotion。
