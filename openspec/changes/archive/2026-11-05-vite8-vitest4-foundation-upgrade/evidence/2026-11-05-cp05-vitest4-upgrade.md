# CP-05 Vitest 4 升级证据（2026-11-05）

## 1. 版本变更

| 位置                              | 前                 | 后                                              |
| --------------------------------- | ------------------ | ----------------------------------------------- |
| 根 vitest                         | ^3.2.4（锁 3.2.7） | ^4.1.12（锁 4.1.12）                            |
| 根 @vitest/ui                     | ^3.2.4（锁 3.2.7） | ^4.1.12（锁 4.1.12）                            |
| packages/domains vitest           | ^3.2.4             | ^4.1.12                                         |
| packages/cf-build-notifier vitest | ^3.2.4             | ^4.1.12                                         |
| packages/skill-router-mcp vitest  | 4.1.0 精确         | **未动**（cloudflare pool 独立轨道，peer 自治） |

```log
$ pnpm install
- vitest 3.2.7
+ vitest 4.1.12
- @vitest/ui 3.2.7
+ @vitest/ui 4.1.12
Done in 27.4s using pnpm v12.4.1
$ pnpm install --frozen-lockfile
（通过，lockfile 一致）
$ pnpm exec vitest --version
vitest/4.1.12 win32-x64 node-v22.23.1
```

## 2. 项目边界不变性验证（升级前后对比）

| 指标       | vitest 3.2.7（CP-04）                 | vitest 4.1.12（CP-05）        |
| ---------- | ------------------------------------- | ----------------------------- |
| Test Files | 4 failed \| 31 passed (35)            | 4 failed \| 31 passed (35)    |
| Tests      | 18 failed \| 326 passed (344)         | 18 failed \| 326 passed (344) |
| 失败构成   | 17 tests-node 基线 + 1 utils 外部 404 | 完全相同                      |
| Duration   | 39.09s                                | 39.42s                        |

- **零升级回归**：344 测试结果逐项一致；project 边界（10 显式 projects）在 Vitest 4 下解析不变。

## 3. 受影响选项扫描（只列仓库实际使用项）

仓库实际使用：`projects`（10 文件引用）、`environment`（node/jsdom）、`setupFiles`（useIconEffect 1 处）、`reporters`（html/default）、`outputFile`、`testTimeout`（cleanup 15s）、`include`、`name`。

仓库未使用（静态扫描确认，未做推测性改写）：poolOptions、maxThreads/maxForks、coverage、browser provider、自定义 reporter、Module Runner API、globalSetup。

- Vitest 4 已移除 workspace 文件——CP-04 已删除，`vitest list/run` 无 deprecated 输出。
- `--project` 过滤、HTML reporter、`test:entrypoints` 均正常。

## 4. 抽查与版本树

```log
$ vitest run --project taze-config --project cleanup-agent-team-node-processes
Test Files 3 passed (3)   Tests 27 passed (27)
$ pnpm --dir packages/utils run test:entrypoints
Tests 4 passed (4)
$ pnpm why vitest
vitest@4.1.12 ← root / domains / cf-build-notifier / @vitest/ui@4.1.12
vitest@4.1.0 ← skill-router-mcp → @cloudflare/vitest-pool-workers@0.21.2（独立轨道）
```

- 保留的 vitest@4.1.0 来源已定位（skill-router-mcp 精确声明），属同主版本轨道差异，不是升级遗漏。

## 5. workspace 术语清理

- 脚本：无残留（`vitest.workspace.ts` 已删，package.json scripts 无 workspace 引用）。
- 根 vitest.config.ts 注释中的"等价迁移自 vitest.workspace.ts"为迁移说明，保留。
- CHANGELOG / docs/ 历史报告中的 workspace 字样属历史记录，不改写。

## 6. 回滚边界

- 本 CP 提交单独成边界：`git revert` 本提交即可回到 vitest 3.2.7 + projects 配置（CP-04 状态）。
