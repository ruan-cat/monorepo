# CP-01 动态验证证据（2026-11-05）

> 主代理在分支 `exp/vite8-vitest4-upgrade` 上执行的动态验证命令与真实输出摘要。静态盘点见 `2026-11-05-cp01-static-inventory.md`。

## 1. 环境与冻结安装

```log
$ node --version
v22.23.1
$ pnpm --version
12.4.1
$ pnpm install --frozen-lockfile
Already up to date
. preinstall$ node scripts/check-pnpm.mjs && corepack enable && corepack install
. preinstall: Adding pnpm@12.4.1 to the cache...
Done in 4.4s using pnpm v12.4.1
```

- 结论：冻结安装通过。corepack 实际固定 `pnpm@12.4.1`（根 package.json `packageManager` 以 preinstall 输出为准；AGENTS.md 所写 10.21.0 为过时描述，已记录到 agent-findings）。

## 2. 版本树`pnpm why vite`

```log
Found 3 versions, 5 instances of vite
- vite@5.4.21 ← vitepress@1.6.4 的 peer 解析（claude-notifier / vitepress-demo-plugin / utils / monorepo-1 /
  vitepress-preset-config / domains / vercel-deploy-tool 等大量 devDeps/deps）
- vite@6.1.6 ← gobang demo devDeps、unplugin 生态等
- vite@6.4.3 ← 根实际执行版本；@ruan-cat/vitepress-demo-plugin devDeps 牵引的 peer 实例
```

- `$ pnpm exec vite --version` → `vite/6.4.3 win32-x64 node-v22.23.1`

## 3. 版本树`pnpm why vitest`

```log
Found 2 versions of vitest
- vitest@3.2.7 ← 根 devDependencies；@ruan-cat/cf-build-notifier、@ruan-cat/domains devDeps；
  @vitest/ui@3.2.7 同根
- vitest@4.1.0 ← @ruan-cat/skill-router-mcp devDependencies → @cloudflare/vitest-pool-workers@0.21.2
  （该 pool 自身要求 vitest 4）
```

- `$ pnpm exec vitest --version` → `vitest/3.2.7 win32-x64 node-v22.23.1`

## 4. 文档框架版本树

```log
$ pnpm why vitepress
vitepress@1.6.4 ← claude-notifier / utils / @test/monorepo-1 (devDeps)；
  vitepress-demo-plugin (deps)；vitepress-preset-config 系（@leelaa/vitepress-plugin-extended、
  @nolebase/vitepress-plugin-git-changelog、vitepress-theme-teek、vitepress-plugin-* 等）(deps)；
  domains / vercel-deploy-tool (devDeps)；根 devDeps（vitepress-demo-plugin@1.8.0）

$ pnpm why @vuepress/bundler-vite
@vuepress/bundler-vite@2.0.0-rc.20 ← 根 devDeps；@ruan-cat/vuepress-preset-config (deps)；
  vuepress-theme-hope@2.0.0-rc.73 → @vuepress/helper@2.0.0-rc.134 等_rc 生态
```

## 5. 根 Vitest 列表命令（基线失败分类）

```log
$ pnpm exec vitest list
DEPRECATED The workspace file is deprecated and will be removed in the next major.
  Please, use the `test.projects` field in D:/code/ruan-cat/monorepo/vitest.config.ts instead.
Error: Cannot find package 'cloudflare:test' imported from
  'packages/skill-router-mcp/tests/stage2-worker-runtime.test.ts'  (ERR_MODULE_NOT_FOUND)
Error: Cannot find package 'cloudflare:test' imported from
  'packages/skill-router-mcp/tests/worker-runtime.test.ts'  (ERR_MODULE_NOT_FOUND)
Error: Cannot find package '@ruan-cat/utils/src/rmmv-class-expand-tools.ts' imported from
  'packages/utils/src/tests/rmmv-class-expand-tools/index.test.ts'  (ERR_MODULE_NOT_FOUND)
```

### 失败分类（既有基线，非迁移回归）

| #   | 失败                                                        | 归属                                                                                                                                | 计划处置 checkpoint                                                                                  |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | workspace DEPRECATED 警告                                   | 迁移目标本身                                                                                                                        | CP-04 迁移为 `test.projects`                                                                         |
| 2   | `cloudflare:test` 无法解析（skill-router-mcp 2 个测试文件） | 宽泛 glob `packages/*` 把需要 @cloudflare/vitest-pool-workers 专属 pool 的测试纳入根发现，根 Vite 无法解析 cloudflare:test 虚拟模块 | CP-01 方案 + CP-04 显式 project 边界（cloudflare 测试由包内独立 vitest 4 pool 配置负责，不进根发现） |
| 3   | `@ruan-cat/utils/src/rmmv-class-expand-tools.ts` 无法解析   | utils 测试引用 `@ruan-cat/*/src/...` 源码子路径，但该路径在 exports 未暴露/文件不存在                                               | CP-02 逐项确认（恢复文件、改测试引用或清理陈旧测试）                                                 |

- `vitest list` 因收集阶段模块解析错误**完全失败**，当前无任何可运行的测试清单产出——这就是升级前基线。
