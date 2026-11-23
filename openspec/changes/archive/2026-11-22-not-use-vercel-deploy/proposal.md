## Why

本仓文档站由 Vercel 在 `main` 上推送 dist，合并主分支就会消耗部署额度。skills.sh 只镜像默认分支 `main`，额度把主分支更新频率卡住之后，技能站点就会停在旧内容。文档站改由 Cloudflare Workers 按 `dev` 的目录变更部署，主分支合并不再承担这次文档发布。

## What Changes

- **BREAKING** 停止用 Vercel API / CLI 推送本仓 5 个文档站的 dist。删除根目录 `vercel-deploy-tool.config.ts`，以及 `.github/workflows/` 里专门做 Vercel 部署的工作流。这些工作流在 GitHub 上的历史运行记录用 `gh` 删掉。
- **BREAKING** 这 5 个站的公开地址只使用 `ruan-cat.com`。`workers.dev` 可以留作调试，不写入 `homepage`，也不写入 `packages/domains/src/domains.ts`。
- **BREAKING** 根 `package.json` 版本从 `1.0.0` 升到 `2.0.0`。根包是 `"private": true`，不为此另开 changesets 去升子包。
- 5 个文档站各自增加 Workers 静态资源部署：`utils`、`vitepress-preset-config`、`claude-notifier`、`domains`、`vercel-deploy-tool`。生产构建只跟 `dev`，并且只在该包目录（加上它的工作区文档依赖、锁文件和工作区清单）变化时触发。
- `packages/domains/src/domains.ts` 只改这 5 个键：删掉它们的 `ruancat6312.top`，规范名改到已确定的 `ruan-cat.com`，部署平台改为 Cloudflare Worker。其余 13 个键不动。
- 仍指向旧文档域名的 `homepage` 改到新主机名。`@ruan-cat/claude-notifier` 的 homepage 已经是 `https://ccntf.ruan-cat.com`，不改。`@ruan-cat/skill-router-mcp` 继续使用自己的 `workers.dev`，不在本次范围。
- 根 `README.md` 写明这次部署渠道切换。
- `ci.yaml` 和 `release.yml` 里的 Turbo 远程缓存继续使用 `secrets.vercel_token`。`release.yml` 里只删除已经没有监听者的 `deploy-after-release` 派发。`@ruan-cat/vercel-deploy-tool` 包源码保留。

公开主机名：

- `utils.ruan-cat.com`
- `vitepress-preset.ruan-cat.com`
- `ccntf.ruan-cat.com`，`claude-notifier.ruan-cat.com` 作为同站别名
- `dm.ruan-cat.com`
- `vc.ruan-cat.com`

## Capabilities

### New Capabilities

- `monorepo-docs-worker-deploy`: 本仓 5 个 VitePress 文档站脱离 Vercel，改为 Cloudflare Workers 静态资源；公开地址、触发分支、域名表边界和主分支不再部署这些文档的行为。

### Modified Capabilities

- 无。现有 `automd-install-generator` 与 `changelog-parsing-verification` 的需求不变。

## Impact

- 删除：根目录 `vercel-deploy-tool.config.ts`；`.github/workflows/vercel-deploy-tool.yaml`；`vercel-build.yaml`；`use-vercel-cli-build-try-1.yaml`；`use-vercel-cli-build-try-2.yaml`；`use-vercel-cli-build-try-3.yaml`；`use-vercel-cli-build-try-4.yaml`；`use-vercel-cli-and-turbo-build-1.yaml`。
- 新增：上述 5 个包各自的 `wrangler.toml`，用 Workers 静态资源指向现有 VitePress dist，并声明 `ruan-cat.com` 自定义域名。
- 修改：这 5 个包里仍使用旧文档域名的 `package.json` `homepage`；`packages/domains/src/domains.ts` 的 5 个键；根 `package.json` 的版本号，以及 `deploy` / `deploy-vercel` 脚本；`turbo.json` 的 `//#deploy-vercel` 任务；`release.yml` 的派发步骤；根 `README.md`。
- 保留：`ci.yaml`、`release.yml` 的 `TURBO_TOKEN` 与 `with-vercel`；`@ruan-cat/vercel-deploy-tool` 源码；`domains.ts` 里其余项目的 `ruancat6312.top`。
- 账号侧：Cloudflare Workers Builds、自定义域名和首次 `wrangler deploy` 需要已登录的 Cloudflare 账号。写本变更的规划工件时不创建这些线上资源。
