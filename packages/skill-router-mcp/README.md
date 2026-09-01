# skill-router-mcp

面向 ChatGPT Web Developer Mode 的只读 Skill Router MCP Worker。

## 云 MCP 访问地址

本包已作为只读 Remote MCP Worker 部署到 Cloudflare Workers，任何支持远程 MCP 的客户端（如 ChatGPT Web）都可以通过 HTTPS URL 直接接入，无需本地安装、无需令牌。

| 用途                     | URL                                                      |
| ------------------------ | -------------------------------------------------------- |
| 核心访问地址（homepage） | `https://skill-router-mcp.1219043956.workers.dev`        |
| MCP 端点                 | `https://skill-router-mcp.1219043956.workers.dev/mcp`    |
| 健康检查                 | `https://skill-router-mcp.1219043956.workers.dev/health` |

URL 链接原理：

- Nitro 采用 file-based routing：`server/api/mcp.post.ts` 把 `POST /mcp` 映射为 MCP 入口，`server/api/health.get.ts` 把 `GET /health` 映射为健康检查；`nitro.config.ts` 中 `apiBaseURL: "/"` 让这些路由直接挂在 Workers 域名根路径之下。
- 传输层使用 `WebStandardStreamableHTTPServerTransport`（`enableJsonResponse: true`、不生成 sessionId），即 Streamable HTTP + stateless JSON response：客户端无需维持会话、无需先握手，一次 `POST /mcp` 即可拿到 JSON 结果。
- 内容仓库走 GitHub public source（`GITHUB_OWNER=ruan-cat`、`GITHUB_REPO=monorepo`、`GITHUB_REF=dev`）；`GITHUB_TOKEN` 只由 Worker 侧 secret 注入，客户端零凭据、匿名调用。

## ChatGPT Web 接入

前置条件：

- ChatGPT 付费计划：Plus / Pro / Team / Business / Enterprise / Edu（Free 计划不支持自定义 connector）。
- 账号开启 Developer Mode；Business / Enterprise 工作区需由管理员在 Workspace Settings 中允许自定义 MCP connector。

配置步骤：

1. 打开 ChatGPT Web（chatgpt.com），进入 `Settings → Apps`（旧版界面显示为 `Connectors`，部分账号显示 `Apps & Connectors`），再进入 `Advanced settings`。
2. 开启 `Developer mode`。
3. 返回 Apps / Connectors 列表，点击 `Create`（或 `Create app` / `Add custom connector`）。
4. 填写表单：
   - Name：例如 `skill-router-mcp`
   - Description（可选）：例如 `Read-only Skill Router for ruan-cat/monorepo`
   - MCP Server URL：`https://skill-router-mcp.1219043956.workers.dev/mcp`
   - Authentication：选择 `No authentication`（本端点为匿名公开服务，无需 OAuth 或 API Key）
   - 勾选信任声明后创建
5. 保存成功后，ChatGPT 会立即拉取 `tools/list`，显示本 Worker 暴露的 6 个只读工具（见上方 Tool Surface）。

使用方式：

- 新开一个对话，点击输入框旁的 `+`（工具菜单）→ `More` → 选择 `skill-router-mcp`，启用后即可让模型调用。
- Developer Mode 是「账户级开关 + 对话级启用」两层：两处都要打开，工具才会出现在对话中。

注意事项：

- ChatGPT 只支持远程 HTTPS MCP server，不支持本地 stdio 命令，因此本包以 Worker 形态部署。
- ChatGPT 会缓存连接时的工具列表；Worker 工具变更后，需要删除并重建 connector（或等待其重新扫描）才能看到新工具。
- Advanced Voice 模式不支持 MCP，工具调用仅限文本对话。

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

### Cloudflare Workers Builds 配置

Workers Builds 的 Root directory 为仓库根目录 `/`，实际命令配置如下：

```text
Build：pnpm --dir packages/skill-router-mcp run build
Deploy：pnpm --dir packages/skill-router-mcp exec wrangler deploy
Version（非生产分支）：pnpm --dir packages/skill-router-mcp exec wrangler versions upload
```

构建时 Nitro 从 `packages/skill-router-mcp/wrangler.toml` 读取并合并 Wrangler 配置，生成 `.output/server/wrangler.json`，同时生成 `.wrangler/deploy/config.json` 重定向文件。Deploy 和 Version 命令不要再传入 `--config wrangler.toml`，让 Wrangler 自动跟随该重定向，使用包含 Nitro 生成入口与 Assets 配置的最终文件。
