# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 执行分支：`exp/vite8-vitest4-upgrade`（CP-01: 4027a2ae、CP-02/03 边界提交）
- 当前阶段：CP-05 Vitest 4 升级
- 当前状态：CP-04 已完成（2026-11-05），14/26 任务勾选
- CP-04 产出：workspace 删除、根 projects 10 项显式清单、tests-node include 收窄、taze cwd 依赖修复、commitlint exports 顺序修复
- CP-04 验证：逐 project list 9+1 全解析；全量 344 测试（18 失败=纯既有基线：17 skill 测试+1 外部 404）；utils entrypoints 4/4；HTML reporter 与 cleanup 降级分支双验证；skill-router-mcp/release-toolkit 零隐式发现
- 语义结论：文件引用 project 不继承根配置；project root=配置目录；cwd 不随 project 变化——CP-05 升级前置已解除
- 下一步：CP-05——升级根 vitest/@vitest/ui 到 4.x（skill-router-mcp 的 4.1.0 独立），逐 project run 等价验证
- 提交策略：每 CP 完成并验证后单独提交

## 预期接力方式

- CP-05：主代理改根 package.json 版本 → pnpm install → 全量 run 对比；@vitest/ui 需同步升级（当前 3.2.7 与 vitest4 跨版本组合在锁中）。
- CP-06：Vite 8 升级前先查插件 peer（@vitejs/plugin-vue、vite-plugin-dts、vite-plugin-ts-alias、unplugin 生态）；文档轨道保持 Vite 5/6 不动。
- CP-07/CP-08：主代理依据真实文档构建与 CI 等价输出作最终决策。

## 证据索引

- CP-01：`evidence/2026-11-05-cp01-dynamic-verification.md` + `cp01-static-inventory.md`
- CP-02：`evidence/2026-11-05-cp02-utils-contract-repair.md`
- CP-03：`evidence/2026-11-05-cp03-build-order-deps.md`
- CP-04：`evidence/2026-11-05-cp04-projects-migration.md`
- 唯一任务源：`tasks.md`（26 任务，14 已勾）；发现记录：`agent-findings.md`
