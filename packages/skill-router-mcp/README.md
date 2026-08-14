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

## MCP Resources Compatibility

Tools 仍是 ChatGPT Web 的主调用面；同时服务端注册一个标准 MCP ResourceTemplate：

```text
skill://{plugin}/{sourceCommitSha}/{skillId}/{+path}
```

兼容层复用同一个 `SkillRouter` / `ResourceResolver`，不会建立第二套 GitHub 读取路径。

- `resources/templates/list` 用于发现上述 immutable URI template。
- `resources/read` 可以读取具体的 text resource 或小型 binary blob。
- `resources/list` 不会为了兼容层去枚举所有 Skill 的所有资源；动态实例保持按需读取。
- binary `resources/read` 继续遵守 Router 的 64 KiB raw inline hard cap。
- URI 必须绑定 exact `sourceCommitSha`，并与 Router 返回的 canonical URI 一致。

示例：

```text
skill://common-tools/<exact-sha>/git-commit/references/commit-types.ts
```

## Skill Resource 边界

- Registry v1 仍只负责 Skill discovery，不枚举 deep files。
- Resource inventory 通过 exact commit 下的选中 Skill Git subtree 获取，不扫描任意仓库路径。
- `load_skill_resource` 只读取该 Skill inventory 中存在的 regular blob。
- symlink / submodule 可以被枚举，但不会被 Router 跟随或读取。
- 文本默认 inline 上限 256 KiB，单资源 hard source limit 1 MiB。
- 二进制默认只返回 metadata；显式 `binaryMode=base64` 时 raw inline hard cap 为 64 KiB。
- Router 不执行 `scripts/`、不解压 asset、不做图片识别。

## 远端 Preview / Staging 验收

拿到 Cloudflare Preview 或 Staging 的 HTTPS 根地址后，可直接执行：

```bash
pnpm --dir packages/skill-router-mcp verify:remote -- https://<worker-host>
```

该脚本会做真实远端端到端检查：

- `/health` 的 SemVer 与 build SHA；
- `tools/list` 精确暴露 6 个 Stage 2 Tools；
- `git-commit` 的 pinned `references/commit-types.ts` 枚举与读取；
- `pr-ruancat-repo` 三个 references 的枚举与逐文件读取；
- `resources/templates/list` 的 immutable Skill ResourceTemplate；
- 标准 `resources/read` 对真实 `git-commit` reference 的读取。

远端延迟基准：

```bash
pnpm --dir packages/skill-router-mcp benchmark:remote -- https://<worker-host> 30
```

输出包括：

- 首次观测的 pinned `list_skill_resources` 延迟；
- warm `list_skill_resources` p50 / p95；
- warm `load_skill_resource` p50 / p95；
- 所有采样都固定同一个 `sourceCommitSha`。

`firstObservedListMs` 只是观测值，并不能证明 Cloudflare 使用了全新 isolate。真正的 cold-start 数据应配合 Preview/Staging 的 isolate/部署控制测量，不把普通重复请求误报为 cold benchmark。

## 版本与部署边界

- MCP SemVer 来自 `package.json`；Worker 版本来自 `CF_VERSION_METADATA`；Skill 内容版本来自 GitHub exact commit SHA；build SHA 是构建期元数据，不能混用。
- Skill-only 内容更新不部署 Worker；下一次未 pin 调用重新解析 `GITHUB_REF`。
- tool name/schema/description/annotation 变更必须在 Worker 部署后重新进行 Inspector 与 ChatGPT Developer Mode Refresh / Scan Tools。
- 生产部署 authority 是 Cloudflare Workers Builds Git Integration；本仓库 workflow 只做静态检查、typecheck、测试和构建，不执行 Wrangler deploy 或 promotion。
