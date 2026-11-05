# CP-04 Vitest 3.2 等价 projects 迁移证据（2026-11-05）

> 迁移前提：Vite 6.4.3 / vitest 3.2.7 未动版本。迁移对象：`vitest.workspace.ts`（packages/* 宽 glob）→ 根 `vitest.config.ts` 的显式 `test.projects`。

## 1. 配置变更清单

| 文件                                                                        | 变更                                                                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest.workspace.ts`                                                       | **删除**（git rm）——workspace 不再是发现入口，DEPRECATED 警告随之消除                                                                       |
| `vitest.config.ts`（根）                                                    | 新增 `test.projects`：10 个显式文件引用（8 既有配置 + 2 个 CP-03 新建配置）；reporters HTML/default 降级逻辑保留                            |
| `tests/vitest.config.ts`                                                    | name=tests-node；include 从 `**/*.test.ts` 收窄为 5 个无独立配置子目录的显式列表（useIconEffect/cleanup 拥有独立 project，避免重复发现）    |
| 5 个包配置（utils/domains/cf-build-notifier/commitlint-config/taze-config） | 补显式 `name`                                                                                                                               |
| `tests/useIconEffect/vitest.config.ts`                                      | 补显式 `name`（jsdom + setupFiles 保留）                                                                                                    |
| `configs-package/taze-config/src/tests/cli.test.ts`                         | 修复 cwd 隐式依赖：CLI 路径改为基于 `import.meta.url` 的包根绝对定位（原 `join(originalCwd, "dist/cli.js")` 从根运行时指向不存在的根 dist） |
| `configs-package/taze-config/vitest.config.ts`                              | 新增 dist/cli.js 构建前置检查（与 vitepress-preset-config 同模式）                                                                          |
| `configs-package/commitlint-config/package.json`                            | 修复 exports 条件顺序：`types` 移到 `require`/`default` 之前（消除 "types will never be used" WARNING，运行时行为不变）                     |

## 2. 逐 project 发现（vitest list，DEPRECATED/错误全部消失）

```log
33 [cf-build-notifier]   20 [cleanup-agent-team-node-processes]   73 [commitlint-config]
17 [domains]              7 [taze-config]                         76 [tests-node]
20 [utils]               33 [vercel-deploy-tool]                   6 [vitepress-preset-config]
+[useIconEffect]（jsdom，含大写未被首个统计正则捕获，尾部输出确认存在）
```

- **隐式发现消除实证**：skill-router-mcp（16 测试）与 release-toolkit（2 测试）零出现——前者走 vitest4+cloudflare pool 独立轨道，后者自研 runner。
- 迁移前 `vitest list` 收集期全局失败（0 可运行）→ 迁移后全 project 正常解析。

## 3. 全量根命令运行

```log
$ pnpm exec vitest run --reporter=default
Test Files  4 failed | 31 passed (35)
     Tests      18 failed | 326 passed (344)
Duration     ~39s
```

### 失败归属（18 = 纯既有基线，零迁移回归）

| 归属                                                                              | 数量 | 说明                                                         |
| --------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------ |
| tests-node：init-simple-memorix / init-prettier-git-hooks / init-shadcn-docs-nuxt | 17   | skill 行为测试，单独跑同样失败（CP-03 已记录），与本迁移无关 |
| utils：useAxiosWrapper                                                            | 1    | 外部黑马接口 404（CP-02 已记录）                             |

### 迁移过程中诊断并修复的上下文差异

- taze-config：单独跑 7/7 ✅，根 CLI 全量跑 7/7 ❌ → 测试用 `process.cwd()` 定位 CLI；根运行 cwd=monorepo 根 → MODULE_NOT_FOUND。修复为 import.meta.url 绝对定位后根 CLI 7/7 ✅。
- cleanup：tests/ 旧根配置下 1 失败（root/cwd 语义）→ 作为独立 project（root=配置文件目录）后 20/20 ✅。

## 4. reporter 与入口行为

- 根 `vitest run`（默认 HTML reporter）→ "HTML Report is generated"（`.vitest-reporter-html/index.html`）
- `vitest run --project cleanup-agent-team-node-processes` → default reporter 降级生效（无 HTML 产出），2 文件 20 测试全过
- `pnpm --dir packages/utils run test:entrypoints` → 4/4 ✅（CI 等价命令，ci.yaml 唯一测试步）

## 5. 语义结论（解除 CP-05 升级前置）

- 文件引用的 project **不继承**根配置 test 选项（各 project 自包含 environment/include/name，实测一致）。
- project root = 配置文件所在目录；`process.cwd()` 不随 project 变化（taze 修复即为此语义）。
- 项目发现与配置继承语义全部可解释 → 满足 tasks.md 停止条件的解除要求，允许进入 CP-05。

## 6. 保留边界

- 根 `test` script（`vitest --ui --watch --api.port=4000`）未动，UI 开发形态待 CP-05 升级后验证。
- tests-node 内 17 个既有基线失败保持原状（等价迁移定义），修复不属于本 change 范围，CP-08 验收时按"既有基线失败清单"归属。
