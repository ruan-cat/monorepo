# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 执行分支：`exp/vite8-vitest4-upgrade`（CP-01 边界提交 4027a2ae）
- 当前阶段：CP-03 构建顺序与包级依赖完整性
- 当前状态：CP-02 已完成（2026-11-05），8/26 任务勾选
- CP-02 产出：rmmv 陈旧测试删除（API 有意删除 d96dd29f）、require 断链修复（→dist/node-cjs/index.cjs）、pathChange/getRuanCatPkgInfo 测试迁移到 node-cjs/node-esm 现有入口、09oa 死文件删除
- CP-02 验证：utils 定向 vitest 8/9 文件过（唯一失败=外部 API 404）、build 四块成功、test:entrypoints 4/4、dist 三产物齐全
- 下一步：CP-03——dist 前置声明、del/cpy/mkdirp 等依赖按实际使用补齐、vitepress-preset-config 文档测试构建前置单独处理
- 提交策略：每 CP 完成并验证后单独提交

## 预期接力方式

- CP-03：依赖缺口由静态盘点清单定位（evidence/cp01-static-inventory.md），编辑子代理可批量执行 package.json 依赖补齐。
- CP-04：主代理收敛 projects 配置改写；extends 默认值需实测。
- CP-05/CP-06：版本兼容性与构建证据用独立子代理复核，不并行改根配置。
- CP-07/CP-08：主代理依据真实文档构建与 CI 等价输出作最终决策。

## 证据索引

- CP-01：`evidence/2026-11-05-cp01-dynamic-verification.md` + `cp01-static-inventory.md`
- CP-02：`evidence/2026-11-05-cp02-utils-contract-repair.md`
- 唯一任务源：`tasks.md`（26 任务，8 已勾）；发现记录：`agent-findings.md`
