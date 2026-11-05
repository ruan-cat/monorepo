# 长任务发现记录

## 当前已确认

- 原设计草案已吸收进本 change 工件；后续只以本 change 工件为准。
- 版本树（动态+静态双证）：vite 3 主版本 5 实例（5.4.21←vitepress@1.6.4、6.1.6←vuepress bundler rc.20、6.4.3←根直装）；vitest 2 版本（3.2.7←根/domains/cf-build-notifier、**4.1.0←skill-router-mcp 精确声明**）；@vitest/ui 仅 3.2.7（与 vitest 4 跨版本组合）；vitepress@1.6.4 唯一；@vuepress/bundler-vite@2.0.0-rc.20 + theme-hope rc.73。
- `vitest list` 基线全局失败 3 类：workspace DEPRECATED、cloudflare:test×2（skill-router-mcp 误入根发现）、`@ruan-cat/utils/src/rmmv-class-expand-tools.ts` 解析失败（已于 CP-02 处置：rmmv API 于 d96dd29f 有意删除，测试已删）。证据：`evidence/2026-11-05-cp01-dynamic-verification.md`。
- utils exports `.` require 指向 `./dist/index.cjs` 断链已修复（→ dist/node-cjs/index.cjs，CJS 场景专用入口，tsup 从不产出根 index.cjs）。
- pathChange（node-cjs/tools.ts）与 getRuanCatPkgInfo（node-esm/ruan-cat-pkg-info.ts）的测试 import 已迁移到现有入口；根入口导出随 755e294b node 场景拆分有意移除，未恢复。
- 09oa.test.ts 为无 test 调用、无人引用的死文件，已删除。
- **遗留**：useAxiosWrapper/index.test.ts 打外部黑马接口 404（外部依赖失效，非仓库契约）；该测试将继续存在于 utils project 内，验收时按既有基线外部依赖解释。
- **CP-04 实施输入**：tests/vitest.config.ts（node，include `**/*.test.ts`）单独跑产生 77 失败（window is not defined，jsdom 需求测试被 node 误捕）；useIconEffect(59)/cleanup（20） 单独跑全绿。CP-04 必须收窄其 include 并逐 project 验证。
- **CP-04 实施输入**：vitest 3 workspace 目录 glob 有探测怪癖（从包目录跑 vitest 向上命中根 workspace 时报 references non-existing file）；迁移为显式文件引用后自然消除。
- vitest 3.2 的 projects `extends` 默认值未实测（官方文档基于 5.1）；CP-04 以逐 project list/run 实测为准。
- skill-router-mcp 双轨错配：根 packages/* glob 用 vitest 3.2.7 扫其 16 个测试，包内实际用 vitest 4.1.0 + cloudflare pool 三具名配置——版本与配置双重错配，根发现必须排除。
- release-toolkit 双轨：src/tests/*.test.ts 会被 vitest 默认 include 发现，包内又有自研 runner（tsx run-tests.ts）——同一批文件两套执行语义。
- utils 游离测试 5 组在所有 include 之外（node-esm/scripts、disposal-auto-router、autogeneration-import-file/tests、vueuse/*/tests、tests/fix-consola-esm.test.ts）。
- vercel-deploy-tool 3 个测试无 vitest 配置（引用 src 源码，可直接 node 跑）；vitepress-preset-config 文档测试依赖 dist/config.mjs 构建前置。
- CI 无全量 vitest：ci.yaml 仅 build+docs+utils test:entrypoints；根 test script 是 ui/watch 开发形态；turbo 无 test 任务；Node 口径 4 处不一（>=22.14.0 / 24.18.0 / 22 / 22.14.0）。
- corepack 矛盾：workflow-guard 与 setup-monorepo 注释声明 pnpm 12 下 corepack 必炸并在 CI 移除，但根 preinstall 仍跑 `corepack enable && corepack install`（本地实测能跑通，因 corepack 缓存已存在）。
- 显式 project 清单方案已落定（10 进 2 独立轨道），证据：`evidence/2026-11-05-cp01-static-inventory.md` 第 5 节。

## 约束与风险

- 本 change 在 `exp/vite8-vitest4-upgrade` 分支执行，每 CP 单独提交保留回滚边界。
- "修复基线问题"与"升级 Vite/Vitest"保持 checkpoint 分离，否则无法判断回归来源。
- 不通过根目录依赖提升、宽泛 alias、无说明 override 或自动全仓构建掩盖包契约问题。
- CP-02 处置 rmmv 测试时禁止凭测试凭空恢复已删除 API；公开 API 变化必须暂停审核。

## 工期与接力提示

- CP-02 最易踩坑：把缺失的 src 子路径一律恢复或把陈旧测试一律删除；必须先确认 exports、历史 API 和测试意图。
- CP-03 假修复陷阱：del 等依赖提到根目录、先全仓 build 再跑测试。
- CP-04/CP-05：先保留 CP-04 等价迁移证据再升级 Vitest 4；vitest 3.2 的 extends 默认值需实测（文档基于 5.1）。
- CP-06/CP-07：Vite 8 只覆盖核心轨道；文档框架可能长期保持 Vite 5/6 双轨。
- 接手 agent 从 `tasks.md` 第一个未勾选任务开始，命令/失败/停止原因回写本目录；禁止只在聊天报告进度。

## 待后续验证

（以下两条已在 CP-04/CP-06 完成验证：projects 语义结论见 cp04 evidence 第 5 节；Rolldown 构建结果见 cp06 evidence 第 2 节。）

## 最终验收遗留归属（2026-11-05，全部为既有基线/设计内状态，非升级回归）

1. tests-node 内 17 个 skill 行为测试失败（init-simple-memorix 14 / init-prettier-git-hooks 2 / init-shadcn-docs-nuxt 1）——skill 测试套件自身问题，另行处理。
2. useAxiosWrapper 外部接口 404——已 test.skip，待接口恢复或补 mock。
3. 文档轨双版本（vite 5.4.21/6.1.6）——设计内双轨，收敛条件见 design.md CP-07 决策记录。
4. skill-router-mcp 独立轨道（vitest 4.1.0 + cloudflare pool）——包内自治 CI。
5. 游离测试组（utils 5 组 + autogeneration-import-file 示例配置）——不在 project 发现范围，与迁移前等价。
6. turbo 警告 @test/monorepo-1#build:docs 的 outputs glob 未覆盖产物——turbo 缓存配置问题，与本升级无关。
