## Context

见 `proposal.md` 的 Why。当前仍在推 dist 的入口是根目录 `vercel-deploy-tool.config.ts` 里 5 个未注释目标，工作流 `.github/workflows/vercel-deploy-tool.yaml` 只在 `main` 上运行。同目录还有 6 个更早的 Vercel 试验工作流。

`packages/cf-build-notifier` 和 `packages/skill-router-mcp` 的生产部署不在 GitHub Actions 里。它们用 Cloudflare Workers Builds：仓库根目录安装依赖，在包目录构建，再 `wrangler deploy`；include paths 限制在包目录、`pnpm-lock.yaml` 和 `pnpm-workspace.yaml`。这两个包的 `wrangler.toml` 是 Nitro 服务端入口，公开地址也不在 `ruan-cat.com` 上。五个文档站的产物是 VitePress 静态目录，只能借用它们的触发和部署通道，不能借用服务端入口。

`packages/utils` 的 `build:docs` 是 `turbo do-build-docs`。它自己的 VitePress 命令是 `build:docs-main`（`vitepress build src`）。其余四个包的 `build:docs` 已经是直接的 `vitepress build`。

## Goals / Non-Goals

**Goals:**

- 每个文档站一个 Worker，静态资源指向该包现有的 VitePress dist。
- Workers Builds 的生产分支是 `dev`，include paths 按包切开。
- 自定义域名写在该包的 `wrangler.toml`，主机名以 proposal 为准。
- 删掉本仓的 Vercel 文档部署入口，留下 Turbo 远程缓存。

**Non-Goals:**

- 不把文档站改成 Nitro 服务。
- 不新增 GitHub Actions 去执行 `wrangler deploy`。
- 不删除 Cloudflare 或 Vercel 上已经存在的项目，不改 `ruancat6312.top` 的 DNS 区。
- 不改 `skill-router-mcp` 的 `workers.dev` homepage。
- 不在规划工件阶段创建 Worker、Builds 或自定义域名。

## Decisions

### 1. 静态资源 Worker，而不是复制 Nitro 入口

五个目标的现有产物分别是：

- `packages/utils`：`src/.vitepress/dist`，构建命令 `pnpm --dir packages/utils run build:docs-main`
- `packages/vitepress-preset-config`：`src/docs/.vitepress/dist`，构建命令 `pnpm --dir packages/vitepress-preset-config run build:docs`
- `packages/claude-notifier`：`src/docs/.vitepress/dist`，构建命令 `pnpm --dir packages/claude-notifier run build:docs`
- `packages/domains`：`docs/.vitepress/dist`，构建命令 `pnpm --dir packages/domains run build:docs`
- `packages/vercel-deploy-tool`：`src/docs/.vitepress/dist`，构建命令 `pnpm --dir packages/vercel-deploy-tool run build:docs`

`wrangler.toml` 使用 `[assets]`，`html_handling = "auto-trailing-slash"`，`not_found_handling = "404-page"`。VitePress 会生成自己的 `404.html`，不用单页应用回退。Worker 名称与包目录同名。`workers_dev` 保持开启，只给调试；不写入 homepage 和域名表。`preview_urls = false`，与 `cf-build-notifier` 对齐。

备选是把 VitePress 再包进 Nitro。那样会多一层运行时，而这两个先例的服务端配置（队列、邮件、MCP）文档站用不上。

### 2. 部署通道用 Workers Builds，触发条件写进包 README

Builds 配置沿用先例，不写进 GitHub Actions：

- Root directory：`/`
- 生产分支：`dev`
- Previews：关闭
- Build：`pnpm i && <上表的包构建命令>`
- Deploy：`pnpm --dir <包目录> exec wrangler deploy`
- Include paths：该包目录、`pnpm-lock.yaml`、`pnpm-workspace.yaml`，再加上该包文档构建会用到的工作区包

已从 `package.json` 看到的工作区文档依赖：

- `vitepress-preset-config` 依赖 `@ruan-cat/utils`
- `claude-notifier` 依赖 `@ruan-cat/vitepress-preset-config`，因此 include 还要带上 `packages/utils/**`
- `domains` 依赖 `@ruan-cat/vitepress-preset-config` 和 `@ruan-cat/vuepress-preset-config`
- `vercel-deploy-tool` 依赖 `@ruan-cat/utils` 和 `@ruan-cat/vitepress-preset-config`
- `utils` 的文档构建命令不再走根上的 `turbo build:docs`

执行时先读该包的 VitePress 配置 import。发现上表没有的工作区包，就把那个目录补进 include paths，并回写该包 README。不要把 include 放宽到整个仓库。

备选是新建一个 GitHub Actions 工作流调用 `wrangler deploy`。这样触发条件进了 Git，但和两个已经在跑的 Worker 不是同一条通道，也会把部署逻辑又放回 `.github/workflows`。

### 3. 自定义域名写在 wrangler routes

每个 `[[routes]]` 使用 `custom_domain = true`。`claude-notifier` 写两条：`ccntf.ruan-cat.com` 和 `claude-notifier.ruan-cat.com`。其余四个包各一条规范主机名。

`wrangler` 加到该包的 `devDependencies`，版本与 `packages/cf-build-notifier` 已使用的 4.x 对齐，并增加 `"deploy": "wrangler deploy"`。Deploy 命令不传 `--config`，让 Wrangler 读取包目录里的 `wrangler.toml`。

### 4. 先试点一个包，再复制

试点包是 `packages/vitepress-preset-config`。它有独立的 `vitepress build`，不碰 `domains.ts`，也不碰工作流删除。试点的仓库验收是 `build:docs` 退出码为 0，且 `src/docs/.vitepress/dist/index.html` 存在，`wrangler.toml` 含指定字段。`wrangler deploy --dry-run` 和线上 HTTP 属于 Cloudflare 已登录之后的账号验收，不作为未登录时的通过条件。通过仓库验收后，再按同一份 `wrangler.toml` 形状做另外四个包。

`domains.ts`、根 `package.json`、`turbo.json` 和工作流删除放在试点之后。这些文件是全局入口，不拿来试模式。

### 5. Vercel 文档入口删除，缓存保留

删除根脚本 `deploy`、`deploy-vercel`，以及 `turbo.json` 的 `//#deploy-vercel`。`@ruan-cat/vercel-deploy-tool` 仍留在依赖里，包源码不删。

`release.yml` 只删除名为「触发部署工作流」的 `repository-dispatch` 步骤。`TURBO_TOKEN`、`with-vercel` 和 `ci.yaml` 不动。

`workflow-guard.yml` 里提到 `vercel-deploy-tool.yaml` 的注释改成过去发生过的事故说明，避免读起来像该文件还在。`delete-workflow-runs.yaml` 的试验清理列表补上 `vercel-deploy-tool.yaml`。立刻清历史仍用 `gh run list` 和 `gh run delete`，在对应工作流文件还存在于 GitHub 时按工作流删除运行记录，然后再从仓库删除文件。

根 `package.json` 只把 `version` 改为 `2.0.0`。根包是 private，不新增 changeset。

`packages/domains/package.json` 的 description 继续说明这个包同时登记两个顶级域名，因为其余 13 个键还保留 `ruancat6312.top`。只改它的 `homepage`。

## Risks / Trade-offs

- [自定义域名今天可能仍 CNAME 到 Vercel] → 绑定 Worker custom domain 会改掉该主机名的指向。旧的 `ruancat6312.top` 不再更新，也不做跳转。回退要手动把 CNAME 指回仍保留的 Vercel 项目。
- [Workers Builds 配置不在 Git 里] → 每个包的 README 写下分支、命令和 include paths，作为仓库内的事实来源。线上创建失败时，README 与 `wrangler deploy --dry-run` 的输出一起留下。
- [`gh` 没有删除运行记录的权限] → 工作流文件仍然从仓库删除。历史记录未删除要写进该 change 的发现，不能把运行列表为空写成已经完成。
- [文档构建还 import 了未列入的工作区包] → 试点和每个包的 Builds include 在执行时按 VitePress 配置核对，缺的目录补进 README，不提前把整个 `packages/**` 写进去。
- [utils 的 `build:docs` 仍会跑 turbo] → Workers Builds 明确调用 `build:docs-main`。不改这个包给本地使用的 `build:docs` 脚本。

## 验收分层

仓库验收不访问 Cloudflare。每条只看退出码、文件是否存在，或一段必须出现的原文。否定句不够：删掉旧地址之后，还要看到新地址的完整字符串。

账号验收从 `wrangler whoami` 成功才开始。`wrangler deploy --dry-run` 退出码为 0 放在这一层。线上页面用 `curl.exe -fsS` 取正文，正文里要有该站源码首页里的固定句子。Builds 的分支和 include paths 把创建时的参数原文记进 `agent-findings.md`；没有这段原文，不能把线上配置算作已核对。

`openspec validate --strict` 只检查本变更的工件格式。它通过，不能用来勾实现任务。

## Migration Plan

1. 给 `vitepress-preset-config` 加上 `wrangler.toml`、`wrangler` 依赖和 deploy 脚本，改 homepage，跑构建和 `wrangler deploy --dry-run`。
2. 用同一形状完成另外四个包。
3. 修改 `domains.ts` 的五个键、根脚本、`turbo.json`、`release.yml`、根 `README.md` 和版本号。
4. 用 `gh` 删除 7 个 Vercel 部署工作流的运行记录，再删除这些工作流文件。
5. 确认 Cloudflare 账号已登录后，再创建 5 个 Workers Builds 并绑定自定义域名。未登录就停在这一步，不改写成 GitHub Actions。
6. 回退时恢复被删的工作流文件和根配置。已经改掉的自定义域名需要在 DNS 上单独指回原 Vercel 项目；本设计不删除那些 Vercel 项目。

## Open Questions

无。主机名、触发分支、域名表范围、缓存去留和完成线已经确定。VitePress 配置里若还有额外的工作区 import，按决策 2 在执行时补 include path，不改变规格。
