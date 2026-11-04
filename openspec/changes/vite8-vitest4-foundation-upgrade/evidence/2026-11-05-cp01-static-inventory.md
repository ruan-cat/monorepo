# CP-01 静态盘点证据（2026-11-05）

> 由只读探索子代理收集，主代理整理。所有结论附文件路径；与 `2026-11-05-cp01-dynamic-verification.md` 互补。

## 1. 版本声明与锁定对照

### 根 package.json 声明（D:\code\ruan-cat\monorepo\package.json）

| 字段                              | 声明值                        | 锁定值                         |
| --------------------------------- | ----------------------------- | ------------------------------ |
| packageManager                    | pnpm@12.4.1 (L14)             | 12.4.1                         |
| engines.node                      | >=22.14.0 (L15-17)            | 实跑 v22.23.1；CI 默认 24.18.0 |
| vite                              | ^6.3.5 (L108)                 | 6.4.3                          |
| vitest                            | ^3.2.4 (L110)                 | 3.2.7                          |
| @vitest/ui                        | ^3.2.4 (L74)                  | 3.2.7                          |
| vuepress / @vuepress/bundler-vite | 2.0.0-rc.20 精确 （L113/L75） | 同版本                         |
| vuepress-theme-hope               | 2.0.0-rc.73 精确 （L114）     | 同版本                         |
| vitepress-demo-plugin             | ^1.5.1 (L109)                 | 1.8.0                          |

### 包级声明要点

- `packages/skill-router-mcp`：vitest `4.1.0` 精确 （L34） + `@cloudflare/vitest-pool-workers@0.21.2` 精确 （L31） —— 全仓唯一 vitest 4 实例来源
- `packages/domains`、`packages/cf-build-notifier`：vitest `^3.2.4`
- vitepress `^1.6.4`：utils / domains / claude-notifier / vercel-deploy-tool / vitepress-preset-config / monorepo-1
- `packages/vuepress-preset-config` + 根：vuepress 全家 rc 精确锁定
- vite 直接声明 5 处 `^6.3.5`：根、dobang demo、fork/vitepress-demo-plugin、test-app、vite-plugin-ts-alias（peer `>=6`）
- `@vitejs/plugin-vue@^5.2.4` / `vite-plugin-dts@^4.5.4`：fork、components、test-app 三处

### pnpm-lock.yaml 解析实例

| 包                 | 实例                                     | 引入来源                                                                             |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| vite               | 5.4.21 / 6.1.6 / 6.4.3（3 版本 5 实例）  | 5.4.21←vitepress@1.6.4；6.1.6←@vuepress/bundler-vite@rc.20；6.4.3←5 个 importer 直装 |
| vitest             | 3.2.7 / 4.1.0                            | 3.2.7←根+domains+cf-build-notifier；4.1.0←skill-router-mcp                           |
| @vitest/ui         | 仅 3.2.7（配 vitest 4.1.0 属跨版本组合） | 根                                                                                   |
| @vitejs/plugin-vue | 仅 5.2.4（peer 变体对应 3 个 vite 实例） | fork/test-app/components                                                             |
| vite-plugin-dts    | 仅 4.5.4                                 | fork/test-app/components                                                             |
| vitepress          | 1.6.4（唯一）+ vitepress-carbon 1.6.0    | 6 个 importer                                                                        |

## 2. 测试发现范围现状

### vitest.workspace.ts（根，6 行）

```ts
export default [
	"packages/*",
	"tests/vitest.config.ts",
	"tests/useIconEffect/vitest.config.ts",
	"tests/cleanup-agent-team-node-processes/vitest.config.ts",
];
```

### 根 vitest.config.ts 要点

- reporters 默认 `["html"]` → `./.vitest-reporter-html/index.html`；仅 argv 含 `--project=cleanup-agent-team-node-processes` 时降级 `["default"]`
- tsconfigPaths / tsAlias / alias 全部注释禁用（明言"放弃在 vitest 内使用路径别名"）
- 无 test.include

### 全仓 vitest 配置文件（13 个）

```plain
vitest.config.ts / vitest.workspace.ts                     （根）
packages/utils/vitest.config.ts                             node  src/tests/**/*.test.ts
packages/domains/vitest.config.ts                           node  src/tests/**/*.test.ts
packages/cf-build-notifier/vitest.config.ts                 node  tests/**/*.test.ts
packages/skill-router-mcp/vitest.unit.config.ts             vitest4 name=skill-router-unit
packages/skill-router-mcp/vitest.worker.config.ts           vitest4 仅 stage2-worker-runtime（需先 build）
packages/skill-router-mcp/vitest.integration.config.ts      vitest4 仅 production-harness（需先 build）
configs-package/commitlint-config/vitest.config.ts          node  src/tests/**/*.test.ts
configs-package/taze-config/vitest.config.ts                node  src/tests/**/*.test.ts
tests/vitest.config.ts                                      node  **/*.test.ts（子目录向上继承公共配置）
tests/useIconEffect/vitest.config.ts                        jsdom **/*.test.ts
tests/cleanup-agent-team-node-processes/vitest.config.ts    node  两个具名文件
```

### 测试文件分布（71 个 .test.ts/.spec.ts）

| 工作区                                          | 数量 | 备注                                            |
| ----------------------------------------------- | ---- | ----------------------------------------------- |
| packages/skill-router-mcp/tests                 | 16   | 走包内 vitest4 三配置                           |
| packages/utils（各处合计）                      | 21   | 仅 src/tests/ 11 个在 include 内，其余游离      |
| packages/vercel-deploy-tool/tests               | 3    | 无 vitest 配置，src 源码引用                    |
| packages/cf-build-notifier/tests                | 3    | 有配置                                          |
| packages/domains/src/tests                      | 2    | 有配置                                          |
| packages/release-toolkit/src/tests              | 2    | 自研 runner（tsx run-tests.ts），无 vitest 配置 |
| packages/vitepress-preset-config/src/docs/tests | 2    | 引用 dist/config.mjs（dist 前置）               |
| configs-package 两包                            | 6    | 有配置                                          |
| tests/ 七个子目录                               | 10   | 有三份配置                                      |
| vite-plugins / learn-* / demos / fork / docs    | 0    | —                                               |

## 3. 包入口契约清单（packages/ 10 包）

| 包                      | exports                                                  | dist                         | 关键事实                                                   |
| ----------------------- | -------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| utils                   | 11 条子路径                                              | 16 项，**缺 dist/index.cjs** | `.` require 声明 ./dist/index.cjs 断链；`./src/*` 通配存在 |
| domains                 | `.`→src/index.ts + `./dist/*`                            | 8 项                         | —                                                          |
| claude-notifier         | `.`(require dist/index.cjs) + `./src/*`                  | 7 项                         | —                                                          |
| release-toolkit         | `.` + plugins/changelog-with-changelogen + src/dist 通配 | 8 项                         | 自研测试 runner                                            |
| vercel-deploy-tool      | `.`(dist) + `./src/*`                                    | 4 项                         | 测试引用 src/core/*.ts                                     |
| vitepress-preset-config | `./config`(dist/config.mjs) + `./theme`(src) + `./src/*` | 4 项                         | 文档测试依赖 dist 前置                                     |
| vuepress-preset-config  | `.`(dist/index.js) + `./src/*`                           | 仅 2 项（无 d.ts）           | types 指 src                                               |
| generate-code-workspace | `.`→src + `./src/*`                                      | 不存在                       | scripts 空，无 build                                       |
| cf-build-notifier       | 无 exports/main                                          | 不存在                       | Nitro 应用                                                 |
| skill-router-mcp        | 无 exports/main                                          | 不存在                       | Nitro 应用 + vitest4 独立轨道                              |

### 测试中的 @ruan-cat/ 引用清单

| 测试文件                                                      | 引用                                             | 状态                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| utils/src/tests/rmmv-class-expand-tools/index.test.ts:5       | `@ruan-cat/utils/src/rmmv-class-expand-tools.ts` | **必炸**：src 下无 rmmv 相关文件，grep 全 src 无 rmmvClassExpandTools 定义；git 历史 e607d433 曾做位置迁移 |
| vercel-deploy-tool/tests/vercel-cli-version.test.ts:3         | `.../src/core/vercel.ts`                         | 存在                                                                                                       |
| vercel-deploy-tool/tests/cleanup-plan.test.ts:8               | `.../src/core/cleanup-plan.ts`                   | 存在                                                                                                       |
| vitepress-preset-config/src/docs/tests/merge-config.test.ts:3 | `.../config`（dist/config.mjs）                  | 存在（依赖构建前置）                                                                                       |
| utils 其余测试                                                | `@ruan-cat/utils`、`@ruan-cat/utils/vueuse`      | 存在                                                                                                       |

## 4. CI 与构建脚本现状（CP-08 铺垫）

- **ci.yaml**（push dev）：setup-monorepo → `pnpm run ci`（=build+build:docs）→ 仅跑 `@ruan-cat/utils test:entrypoints`；**无全量 vitest**
- **setup-monorepo action**：node-version 默认 **24.18.0**；pnpm 12 起 corepack 已从 CI 移除（注释：corepack 无法安装 pnpm 12，属必炸死代码）
- **workflow-guard.yml**：强制全部工作流走 setup-monorepo，拦截工作流内 `corepack enable|install`
- **release.yml**（push main）：build → changesets action（publish=`pnpm release`）→ repository-dispatch 触发部署
- **skill-router-mcp.yml**：全仓唯一跑完整测试套件的 CI（`--dir packages/skill-router-mcp run test:all`，frozen-lockfile）
- **turbo.json**：无 test 任务；build outputs dist/** + .output/**
- **根 test script**：`vitest --ui --watch --api.port=4000`（开发形态，不可用于 CI）
- **Node 口径不一**：engines >=22.14.0 / CI 默认 24.18.0 / skill-router 22 / ai-plugins 22.14.0
- **preinstall 仍跑 corepack**（package.json:37），与 workflow-guard 的"corepack 必炸"结论矛盾（guard 只扫 workflows 管不到本地）

## 5. 显式 project 清单改造方案（CP-01 第三项任务产出）

> 目标：消除 `packages/*` 宽 glob 的隐式发现，落地为根 `vitest.config.ts` 的 `test.projects` 显式清单（CP-04 执行迁移，本节只落方案）。

### A. 进根 projects（8 个既有独立配置，文件引用形式）

1. `packages/utils/vitest.config.ts`（node）
2. `packages/domains/vitest.config.ts`（node）
3. `packages/cf-build-notifier/vitest.config.ts`（node）
4. `configs-package/commitlint-config/vitest.config.ts`（node）
5. `configs-package/taze-config/vitest.config.ts`（node）
6. `tests/vitest.config.ts`（node）
7. `tests/useIconEffect/vitest.config.ts`（jsdom）
8. `tests/cleanup-agent-team-node-processes/vitest.config.ts`（node）

### B. 需新增独立配置后加入（CP-03/CP-04 落地时建配置文件）

9. `packages/vercel-deploy-tool/vitest.config.ts`（新增；node；include `tests/**/*.test.ts`；测试引用 src 源码，无 dist 前置）
10. `packages/vitepress-preset-config/vitest.config.ts`（新增；node；include `src/docs/tests/**/*.test.ts`；**dist/config.mjs 构建前置在 CP-03 声明**）

### C. 不进根 projects（独立轨道，消除错配）

- `packages/skill-router-mcp`：vitest 4.1.0 + @cloudflare/vitest-pool-workers 专属 pool + 三个具名配置；由包内 `test:all` 负责。**根发现必须排除**——这是当前 `vitest list` cloudflare:test 解析失败的根因
- `packages/release-toolkit`：自研 runner（tsx src/tests/run-tests.ts），不纳入 vitest 发现，消除双轨执行语义
- 无测试文件包：claude-notifier、generate-code-workspace、vuepress-preset-config、cf-build-notifier 应用主体（其 tests 有配置除外）

### D. 游离测试文件处置原则（CP-02 梳理）

- utils 游离测试 5 组（node-esm/scripts、unplugin-vue-router/disposal-auto-router、vite-plugin-autogeneration-import-file/tests、vueuse/*/tests、tests/fix-consola-esm.test.ts）：逐组判断扩 include 或维持游离并记录，不静默吞掉
- rmmv-class-expand-tools 必炸测试：CP-02 逐项确认后处置（恢复 API / 迁移测试 / 清理陈旧引用三选一，禁止凭测试凭空恢复已删除 API）

### E. 环境与继承边界

- node 项目与 jsdom 项目（useIconEffect）各自持有配置；文件引用形式下项目不继承根配置（与现 workspace 语义等价），根级 reporters HTML 行为不受 jsdom 项目影响
- CP-04 迁移时须实测 vitest 3.2.7 的 `extends` 默认值（文档基于 5.1，3.2 行为待验证），以逐 project list/run 输出为准
