# 长任务进度

- Change：`vite8-vitest4-foundation-upgrade`
- 当前阶段：CP-00 工件审核门
- 当前状态：等待用户审核，未开始第一个 checkpoint
- 规划总量级：约 35–75 小时有效工作量，预计拆成 8 个实现 checkpoint 分次接力；这是估算，不是完成承诺。
- 接力规则：下一位 agent 必须先读取 `tasks.md` 的工期与风险总览、`agent-findings.md` 的已确认问题，再从第一个未勾选任务继续；不得依据聊天记忆猜测状态。
- 文档收敛：已将原 `docs/superpowers/specs/2026-08-13-vite8-vitest4-monorepo-upgrade-design.md` 的清单、Rolldown/Oxc 检查、阶段出口、验证矩阵和最终判定吸收到本 change；原草案已删除，避免形成第二事实来源。
- 已执行：保守初始化 OpenSpec change、读取 change 状态、读取 proposal 工件指引、检查既有规格和错误位置工件。
- 未执行：源码修改、依赖升级、锁文件修改、Vitest/Vite 运行验证、CP-01 及后续 checkpoint。
- 下一步：仅在用户审核并明确允许后进入 CP-01；若审核提出范围变化，先更新 OpenSpec 工件。

## 预期接力方式

- CP-01/CP-02：由主 agent 负责契约判断，必要时请独立 agent 做只读包审计。
- CP-03/CP-04：可并行准备构建顺序和 projects 配置分析，但落地修改必须由同一 owner 收敛。
- CP-05/CP-06：建议使用独立 verifier 或其他模型复核版本兼容性和构建证据，不允许多个 agent 同时改根配置。
- CP-07/CP-08：需要主 agent 依据真实文档构建和 CI 等价输出作最终决策。

## 证据索引

- 规格设计：`proposal.md`、`design.md`、`specs/*/spec.md`
- 唯一任务源：`tasks.md`
- 当前发现：`agent-findings.md`
- 初始化状态：`openspec status --change vite8-vitest4-foundation-upgrade --json`
