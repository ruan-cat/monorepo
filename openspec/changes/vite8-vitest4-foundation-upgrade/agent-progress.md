# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 执行分支：`exp/vite8-vitest4-upgrade`（CP-01: 4027a2ae、CP-02: 修复边界）
- 当前阶段：CP-04 Vitest 3.2 等价 projects 迁移
- 当前状态：CP-03 已完成（2026-11-05），11/26 任务勾选
- CP-03 产出：del/cpy/mkdirp 实证零缺口（零依赖变更）、vitepress-preset-config dist 前置检查（双路径验证）、vercel-deploy-tool/vitepress-preset-config 独立 vitest 配置、8 包两轮定向测试全稳
- CP-03 移交发现：tests/ 根配置 include 过宽致 77 失败（window is not defined，jsdom 测试被 node 误捕）；vitest 3 workspace 目录 glob 怪癖
- 下一步：CP-04——根 vitest.config.ts 声明显式 projects（10 个文件引用）、删除 workspace、tests/ include 收窄、逐 project list/run 验证
- 提交策略：每 CP 完成并验证后单独提交

## 预期接力方式

- CP-04：主代理收敛配置改写；extends 默认值与 project 发现语义以实测为准（文档基于 5.1，3.2 可能不同）。
- CP-05/CP-06：版本兼容性与构建证据用独立子代理复核，不并行改根配置。
- CP-07/CP-08：主代理依据真实文档构建与 CI 等价输出作最终决策。

## 证据索引

- CP-01：`evidence/2026-11-05-cp01-dynamic-verification.md` + `cp01-static-inventory.md`
- CP-02：`evidence/2026-11-05-cp02-utils-contract-repair.md`
- CP-03：`evidence/2026-11-05-cp03-build-order-deps.md`
- 唯一任务源：`tasks.md`（26 任务，11 已勾）；发现记录：`agent-findings.md`
