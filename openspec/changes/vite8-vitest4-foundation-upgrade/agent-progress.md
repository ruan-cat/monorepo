# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 执行分支：`exp/vite8-vitest4-upgrade`（提交链：4027a2ae→……→CP-08）
- 当前阶段：**全部 9 个 checkpoint（CP-00~CP-08）已完成，26/26 任务勾选**
- 最终状态（2026-11-05）：vitest 3.2.7→4.1.12、vite 6.4.3→8.3.5（核心轨）、文档轨保留双版本（vitepress 1.6.4+vite 5.4.21 / vuepress rc.20+vite 6.1.6）、workspace 已删并迁移显式 projects（10 项）、CI 补全量 projects 测试步骤
- 最终验收：冻结安装 ✅、版本树全解释 ✅、turbo build 17/17 ✅、build:docs 11/11 ✅、全量 344 测试（326 过+17 既有基线+1 skip，零迁移回归）✅、CI 等价 267 过 ✅、entrypoints 4/4 ✅、openspec validate --strict ✅
- 遗留归属（非升级回归，见 evidence/cp08 第 5 节）：tests-node 17 个 skill 测试基线失败、useAxiosWrapper 外部 404（已 skip）、文档轨双版本（设计内）、skill-router 独立轨道、游离测试组
- 归档提示：可用 `$openspec-archive-change` 归档本 change；发布需走 changeset 流程（vitest/vite 的依赖变更应记录 changeset）
