# vercel-deploy-tool 架构与运行流程说明

## 目标

- 面向 monorepo 的 Vercel 部署工具，提供 CLI 与可编程 API。
- 支持多目标（静态 / userCommands）并行部署，封装 link/build/deploy/alias 流程。
- 通过配置文件 `vercel-deploy-tool.config.ts` 统一管理部署参数。

## 主要模块

- CLI 入口：`src/cli.ts`，注册 `deploy`、`init` 两个子命令。
- 配置体系：
  - `src/config/schema.ts`：配置类型定义。
  - `src/config/define-config.ts`：`defineConfig` 帮助函数，提供类型提示。
  - `src/config/loader.ts`：基于 `c12` 加载配置，合并 `.env*` 与进程环境变量；支持 `VERCEL_DEPLOY_TOOL_ENV_PATH` / `--env-path` 指定自定义 dotenv。
- 任务调度：`src/core/tasks/*` 基于 `tasuku` 组装流水线，包含 link、build、after-build、user-commands、copy-dist、deploy、alias。
- Vercel 适配：`src/core/vercel.ts` 封装 CLI 参数；`utils/vercel-null-config.ts` 生成空配置文件以驱动 Vercel Build Output API。
- CLI 工厂：`src/commands/deploy.ts`、`src/commands/init.ts`。
- 模板：`src/templates/vercel-deploy-tool.config.ts` 提供默认配置模板。

## 流程总览（deploy）

1. 生成 `vercel.null.def.json`（空配置）
2. Link 阶段：对每个目标执行 `vercel link`（并行）
3. Build 阶段：对需要构建的目标执行 `vercel build`（并行，`isNeedVercelBuild` 控制）
4. AfterBuild 阶段：串行执行 `afterBuildTasks`（全局）
5. UserCommands + CopyDist：对 userCommands 目标串行执行自定义命令并复制产物到 `.vercel/output/static`（目标级并行）
6. Deploy + Alias：对每个目标执行 `vercel deploy --prebuilt` 并设置自定义域名别名（目标级并行，别名内部并行）

## 配置文件要点

- 位置：仓库根目录 `vercel-deploy-tool.config.ts`（通过 `defineConfig` 返回）。
- 核心字段：`vercelProjectName` / `vercelToken` / `vercelOrgId` / `vercelProjectId` / `deployTargets`。
- 目标类型：
  - `static`：只复制已有构建产物。
  - `userCommands`：先执行 `userCommands`，然后按 `outputDirectory` 复制到 `.vercel/output/static`，可用 `isCopyDist` 关闭复制，`isNeedVercelBuild` 控制是否跑 `vercel build`。
- 模板参考：`src/templates/vercel-deploy-tool.config.ts`。示例配置在根级 `vercel-deploy-tool.config.ts`（当前仓库）。

## 环境变量与 dotenv 策略

- 默认：`c12` 自动读取工作目录下的 `.env*`，再与进程 `process.env` 合并，最后落到配置对象。
- 新增（已恢复）：`deploy` 命令支持 `--env-path <path>`，等价设置环境变量 `VERCEL_DEPLOY_TOOL_ENV_PATH`，在加载配置前用 `@dotenvx/dotenvx` 显式读取指定 dotenv 文件。
- 优先级：`--env-path`（或 `VERCEL_DEPLOY_TOOL_ENV_PATH`） > 现有 `process.env` > `c12` 自动读取的 `.env*` > 配置文件默认值。
- 推荐用法：
  - 单文件：`vdt deploy --env-path .env.production`
  - 多文件（依赖 dotenvx）：`dotenvx run -f .env.test -f .env.test-2 -- vdt deploy`

## 命令

- `vdt init` / `vercel-deploy-tool init`：生成模板配置并在 package.json 写入 `deploy-vercel` 脚本。
- `vdt deploy [--env-path <path>]`：执行完整部署流水线，支持自定义 dotenv。

## 关于 @dotenvx/dotenvx 依赖

- 现状：作为 direct dependency，CLI 的 `--env-path` 功能依赖它加载指定文件；tests 也使用 `dotenvx run ...`。
- 评估：`c12` 覆盖常规 `.env*` 场景，`@dotenvx/dotenvx` 主要用于「多文件 / 自定义路径」的部署场景，保留该依赖能满足多环境切换需求。
- 结论：保留依赖；文档提示 `--env-path` 与 `dotenvx run` 的组合用法。

## 流程校验要点

- 目标路径一律相对仓库根目录（形如 `./packages/...`）。
- userCommands 需要确保构建产物路径与 `outputDirectory` 一致，否则 copy 阶段会失败。
- Alias 阶段依赖 `url` 列表，为空将跳过别名绑定。
- 需要 `vercel` CLI 已安装且可用。

## 后续可选优化

- 支持 `--env-path` 多值（数组）并记录在配置中，便于 CI 场景。
- 在 `docs/migration-guide` 补充 `--env-path` 恢复说明（如需同步文档）。
- 增加针对 `deployTargets` 的 schema 校验与提示，减少运行时报错。
