# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 执行分支：`exp/vite8-vitest4-upgrade`（CP-01: 4027a2ae、CP-05: b72acbc3）
- 当前阶段：CP-07 文档框架兼容性决策
- 当前状态：CP-06 已完成（2026-11-05），20/26 任务勾选
- CP-06 产出：vite 8.3.5（核心轨）+ plugin-vue 6.0.10 + dts 5.1.2；components preserveModules+dts 构建过、dobang/ts-alias/fork 构建过；vitest4+vite8 全量 344 测试零回归；版本树三轨（8.3.5 核心 + 5.4.21 vitepress + 6.1.6 vuepress）
- CP-07 任务：独立评估 VitePress 2 与 VuePress bundler 新版稳定性 → 收敛或保留双轨（有说明即可结束）
- 下一步：查 VitePress 2 / VuePress 新版上游证据 → 文档构建验证（turbo build:docs）→ 决策
- 提交策略：每 CP 完成并验证后单独提交

## 预期接力方式

- CP-07：主代理做上游版本调查（npm view peer）+ 真实文档构建验证；预发布风险不可接受时按 tasks.md 停止条件保留双轨并记录。
- CP-08：主代理跑全链路验收（frozen install、turbo build、全量 projects、entrypoints、版本树、CI 等价）。

## 证据索引

- CP-01~CP-06：`evidence/2026-11-05-cp0{1,2,3,4,5,6}-*.md`
- 唯一任务源：`tasks.md`（26 任务，20 已勾）；发现记录：`agent-findings.md`
