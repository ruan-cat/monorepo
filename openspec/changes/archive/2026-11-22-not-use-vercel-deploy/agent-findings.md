# Workers Builds 创建结果

2026-11-23 用 `cf builds workers create` 创建。仓库 `ruan-cat/monorepo`，repo id `776830137`，生产分支 `dev`，`root_directory` 为 `/`，`previews_enabled` 为 false，`auto_build_enabled` 为 true。五个 Worker 的 API 返回都是这个形状。

## vitepress-preset-config

- build: `pnpm i && pnpm --dir packages/vitepress-preset-config run build:docs`
- deploy: `pnpm --dir packages/vitepress-preset-config exec wrangler deploy`
- path_includes: `packages/vitepress-preset-config/**`、`packages/utils/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`

## utils

- build: `pnpm i && pnpm --dir packages/utils run build:docs-main`
- deploy: `pnpm --dir packages/utils exec wrangler deploy`
- path_includes: `packages/utils/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`

## claude-notifier

- build: `pnpm i && pnpm --dir packages/claude-notifier run build:docs`
- deploy: `pnpm --dir packages/claude-notifier exec wrangler deploy`
- path_includes: `packages/claude-notifier/**`、`packages/vitepress-preset-config/**`、`packages/utils/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`

## domains

- build: `pnpm i && pnpm --dir packages/domains run build:docs`
- deploy: `pnpm --dir packages/domains exec wrangler deploy`
- path_includes: `packages/domains/**`、`packages/vitepress-preset-config/**`、`packages/vuepress-preset-config/**`、`packages/utils/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`

## vercel-deploy-tool

- build: `pnpm i && pnpm --dir packages/vercel-deploy-tool run build:docs`
- deploy: `pnpm --dir packages/vercel-deploy-tool exec wrangler deploy`
- path_includes: `packages/vercel-deploy-tool/**`、`packages/utils/**`、`packages/vitepress-preset-config/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`

自定义域名绑定时，`utils.ruan-cat.com`、`ccntf.ruan-cat.com`、`claude-notifier.ruan-cat.com`、`dm.ruan-cat.com`、`vc.ruan-cat.com` 原有指向 `cname.vercel-dns.com` 的 CNAME 已删除，再由 Wrangler 写成 Worker custom domain。`vitepress-preset.ruan-cat.com` 之前没有这条记录。
