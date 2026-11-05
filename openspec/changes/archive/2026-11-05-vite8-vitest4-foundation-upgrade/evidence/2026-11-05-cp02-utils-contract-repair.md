# CP-02 utils 契约修复证据（2026-11-05）

> 分支 `exp/vite8-vitest4-upgrade`。修复前证据见 `2026-11-05-cp01-dynamic-verification.md` 第 5 节。

## 契约判定与处置清单

| #   | 项目                                           | git 证据                                                                                                                          | 判定                                 | 处置                                                                   |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| 1   | rmmv-class-expand-tools 测试（2 文件）         | `d96dd29f` 🗑 del（utils） 删除 src/rmmv-class-expand-tools.ts（220 行）+ index.ts 导出移除，理由 typedoc 生成失败                 | API 已有意删除，测试陈旧             | 删除测试目录；**未凭测试恢复已删除 API**                               |
| 2   | utils exports `.` require → ./dist/index.cjs   | tsup.config.ts 四构建块（根 ESM/node-cjs/node-esm/cli）均无 dist/index.cjs 产物                                                   | 声明与产物断链                       | require 改指 `./dist/node-cjs/index.cjs`（实际存在，CJS 场景专用入口） |
| 3   | pathChange.test.ts import 根入口               | `531efcc2` 原放 src/node.ts + 根 re-export；`755e294b` 有意拆分 node-esm/node-cjs 场景后根导出移除；函数现居 node-cjs/tools.ts:15 | import 错位（API 活着）              | 迁移 import → `@ruan-cat/utils/node-cjs`                               |
| 4   | get-all-ruancat-pkg-info.test.ts import 根入口 | getRuanCatPkgInfo 定义于 node-esm/ruan-cat-pkg-info.ts:23，经 node-esm/index.ts re-export；根 index.ts 从未有（git -S 无记录）    | import 错位（API 活着）              | 迁移 import → `@ruan-cat/utils/node-esm`                               |
| 5   | 09oa.test.ts                                   | 44 行无任何 test（） 调用；全仓 grep 无人引用                                                                                     | 死文件（有 .test.ts 之名无测试之实） | 删除                                                                   |
| 6   | useAxiosWrapper/index.test.ts                  | 请求 `https://pcapi-xiaotuxian-front-devtest.itheima.net`（黑马练习接口）404                                                      | 外部依赖失效，非仓库契约             | 保留；记录为既有基线外部依赖失败                                       |

## 验证证据（变更后）

```log
$ pnpm --dir packages/utils exec vitest run
Test Files  1 failed | 8 passed (9)      # 修复前: 4 failed (+rmmv 收集期全局失败)
     Tests  1 failed | 19 passed (20)    # 唯一失败=useAxiosWrapper 外部 404

$ pnpm --dir packages/utils run build
DTS Build success ×4（dist/index.d.ts、node-cjs/index.d.cts、node-esm/index.d.ts、cli）

$ pnpm --dir packages/utils run test:entrypoints
Test Files  1 passed (1)
     Tests  4 passed (4)   # 含 node-cjs 入口加载与 consola 禁解析场景

$ ls dist/index.js dist/node-cjs/index.cjs dist/node-esm/index.js   # 三产物齐全，require 断链闭合
```

## 遗留

- useAxiosWrapper 外部 404：黑马练习接口已变更/下线；该测试打真实外网，属测试设计问题而非升级回归。CP-04 迁移后仍会以该状态存在，届时在 project 边界内保持可解释。
