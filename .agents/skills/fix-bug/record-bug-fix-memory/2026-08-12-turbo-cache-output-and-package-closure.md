# 2026-08-12 Turbo 缓存输出与发布包依赖闭包故障

## 现象

GitHub Actions 的整仓构建先后出现 VitePress 入口找不到、`tsup: not found` 与 `@ruan-cat/utils` 运行时找不到 `yaml`。这些错误看似都指向 pnpm 链接、Node.js 24 或已移除的 `consola` shim，导致排查容易不断改变全局安装布局。

## 根因

`turbo.json` 将 `build` 缓存输出定义为 `**/dist/**` 与 `**/.output/**`。该宽 glob 不只描述任务自己的产物，也可能匹配包目录下依赖树中的构建目录，破坏远程缓存的任务输出边界。

在缓存边界收紧后，CI 才稳定暴露两个独立的包清单缺口：`@ruan-cat/vercel-deploy-tool` 的 `build: tsup` 没有本地声明 `tsup` 与 `typescript`；`@ruan-cat/utils` 将保留 `yaml` 外部导入的 `pnpm-workspace-yaml` 打入发布入口，却没有把 `yaml` 声明为直接运行时依赖。

## 关键误导点

- 移除外部 `consola` 导入不会破坏 `utils`：最新发布入口测试显式禁止解析 `consola`，仍通过默认 ESM、`node-esm` 与 `node-cjs` 入口。
- 旧的 `consola` shim 已不在共享 CI action 中执行；在其移除后仍失败，不能把本次故障归因为 shim。
- 修改 pnpm linker、强制重装或回退 Node 版本都没有提供因果证据，且会扩大修复范围。

## 修复

1. 把 Turbo `build.outputs` 收紧为任务自身的 `dist/**` 与 `.output/**`。
2. 为 `@ruan-cat/vercel-deploy-tool` 显式声明构建脚本实际使用的本地开发依赖。
3. 为 `@ruan-cat/utils` 显式声明外部保留的 `yaml` 运行时依赖；不重新引入 `consola` shim，也不改变全局 pnpm 链接策略。

## 验证

- 本地：`pnpm install --filter @ruan-cat/utils --frozen-lockfile`、`pnpm --filter @ruan-cat/utils run build`、`pnpm --filter @ruan-cat/utils run test:entrypoints` 全部通过，入口测试为 4/4。
- 云端：[CI run 31512258550](https://github.com/ruan-cat/monorepo/actions/runs/31512258550) 在新提交 `010845a7` 上完成 11/11 Turbo 任务；VitePress `v1.6.4` 文档构建完成，随后 `@ruan-cat/utils` 发布入口测试 4/4 通过。

## 教训

- Turbo `outputs` 只能包含当前任务直接拥有的相对产物目录；禁止用 `**/dist/**` 一类可能把 `node_modules` 子树纳入缓存的模式。
- 已发布包必须自己声明构建命令所需的二进制开发依赖，以及构建产物保留的每个运行时导入；本地 hoist 不能视为依赖声明。
- 当 CI 出现模块找不到，先在最新 SHA 的完整构建后运行发布入口测试；不要把历史绿灯、全局 shim 或链接策略当成根因证据。
