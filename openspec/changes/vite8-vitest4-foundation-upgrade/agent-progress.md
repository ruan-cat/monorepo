# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 执行分支：`exp/vite8-vitest4-upgrade`（从 dev e640662e 切出）
- 当前阶段：CP-02 修复基础包与陈旧测试契约
- 当前状态：CP-01 已完成（2026-11-05），5/26 任务勾选
- CP-01 产出：版本树（vite 3 版本 5 实例 / vitest 双版本 / vitepress 1.6.4 / vuepress rc.20）、包入口契约清单（10 包）、显式 project 清单方案（10 进 2 独立轨道）
- CP-01 验证：`pnpm install --frozen-lockfile` ✅ 4.4s；版本树检查 ✅；`vitest list` 基线失败分类 3 类已归档 ✅
- 下一步：CP-02——utils rmmv 测试处置（恢复/迁移/清理三选一）、dist/index.cjs 断链修复、exports 同步；验证含 utils 定向 Vitest + build + test:entrypoints
- 提交策略：每 CP 完成并验证后单独提交

## 预期接力方式

- CP-02：主代理负责契约判断（历史 git 挖掘 + 测试意图确认），编辑子代理执行文件修改。
- CP-03/CP-04：分析可并行，落地修改由主代理收敛。
- CP-05/CP-06：版本兼容性与构建证据用独立子代理复核，不并行改根配置。
- CP-07/CP-08：主代理依据真实文档构建与 CI 等价输出作最终决策。

## 证据索引

- 动态验证：`evidence/2026-11-05-cp01-dynamic-verification.md`
- 静态盘点+project 方案：`evidence/2026-11-05-cp01-static-inventory.md`
- 唯一任务源：`tasks.md`（26 任务，5 已勾）；发现记录：`agent-findings.md`
- 工件校验：`openspec validate --strict` 通过（2026-11-04）
