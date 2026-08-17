# 当前设计记忆

本文件随 `use-other-model` 一起分发，用于保存当前设计中**必须跨项目保留的因果记忆**：为什么某些硬门存在、未来维护时哪些约束不能被“简化掉”。

它不是历史 archive，也不是第二份执行规范。正常任务仍以根目录 `SKILL.md` 和对应当前 `references/*.md` 为执行真值；本文件只在维护、扩展、解释或审查这些规则时按需读取。

## 1. 独立分发自包含原则

`use-other-model` 必须能够在一个全新项目中，仅凭安装后的 `use-other-model/` 目录完成正常执行。

因此：

- 任何**运行时必需**的规则、模板、失败边界、验证条件和设计依据，都必须存在于本技能目录的 `SKILL.md`、`references/` 或 `scripts/` 中。
- 不得要求目标项目存在本 monorepo 的 `.agents/`、`docs/reports/`、CI 文件、事故复盘目录或维护者私有路径。
- monorepo 内的 hardening archive 只保存开发期历史原貌；它不是本技能的运行时依赖，也不能作为缺失当前规则的补丁来源。
- 外部技术报告只允许作为可选背景资料；网络不可用、报告移动或目标项目离线时，不得阻断正常执行。
- 如果某条规则从 `SKILL.md` 压缩出去，但未来执行或维护仍需要它，就必须先迁入本技能自己的当前 `references/`，不能只留在 monorepo 项目级记忆中。

### 独立安装验收

维护本技能时，至少用以下思想实验验收：

1. 只复制整个 `use-other-model/` 目录到一个空白项目的 skills 根目录。
2. 假设完全看不到原 monorepo 的 `.agents/` 和 `docs/reports/`。
3. 根 `SKILL.md` 中每个正常执行链接都能在本技能目录内解析，或被明确标记为可选外部背景。
4. A-D 路由、任务合同、弱模型执行、失败分流、验证、安全边界和启动模板都能从本目录恢复。
5. 维护者需要理解关键硬门的原因时，可以读取本文件，不需要查 monorepo 私有 archive。

任一项不满足，就不能称为可独立分发的 skill。

## 2. 为什么它是委托路由器，而不是进程平台

历史上最容易出现的错误，是为了让一次外部 CLI 调用“更稳”，逐步叠加 wrapper、进程树、状态机、cleanup、脱敏、超时和结果生成逻辑，最后重新实现一套不透明的执行平台。

当前边界是：

- 优先官方最小命令和可观察原始输出；
- launcher 只做必要路径准备、CLI 调用、原始输出保存和退出码传播；
- 只有真实、可复现的直接命令失败证据，才允许增加与该失败一一对应的复杂度。

对应执行真值：`SKILL.md` 的 launcher 红线，以及 `references/delegation-contract.md`。

## 3. 为什么 preflight 必须发生在模型调用之前

跨工作区路径错误、不可达文件、provider/model 选择错误、权限不匹配和冻结验收缺失，本质上是调用模型前就可以发现的问题。

让模型先消耗 token 再发现这些静态问题，会同时造成成本浪费和错误归因。因此：

- 工作目录、路径、模型身份、权限、工具范围、验收规则和预算先冻结；
- 硬门失败直接 `PREFLIGHT_BLOCKED`；
- 不使用模型 token 去发现主代理本来就能静态发现的问题。

对应执行真值：`references/delegation-contract.md`、`references/context-packet-template.md`。

## 4. 为什么“模型可发现”不等于“本次模型已选中”

模型列表或昵称只能证明某个名字在当前工具环境中可见，不能证明本次 session 实际运行了指定 provider/model。

同名模型可能来自不同 provider，因此当前证据要求区分：

- provider
- model
- variant
- session
- working directory
- 实际命令与结构化事件

拿不到某字段时保持 unknown/unavailable，不猜测。

对应执行真值：`references/delegation-contract.md`。

## 5. 为什么 exit code 0 不能直接判成功

外部 CLI 可以在以下情况下仍以 0 退出：

- 工具调用发生错误；
- 权限请求被拒绝；
- 任务只输出了“完成”文本却没有生成产物；
- 实际 changed files 越界；
- 验证命令或浏览器验收失败。

所以完成声明必须同时检查退出原因、结构化工具/权限事件、预期产物、changed-file 集合和冻结验证命令。

对应执行真值：`references/evidence-verification.md`。

## 6. 为什么 executor 不能给自己 `VERIFIER_PASS`

执行者天然知道自己的意图，也容易把“我已经做了”当成“已经正确完成”。这种自审无法独立发现范围扩张、遗漏文件、验收规则被改写或原始输出与总结不一致。

因此状态所有权分开：

- execution agent 只提交候选状态与证据；
- verifier 由独立 reviewer、确定性检查或主代理承担；
- human acceptance 只能由用户/人工产生。

对应执行真值：`references/evidence-verification.md`。

## 7. 为什么必须保留原始 stdout / stderr / JSONL

摘要是解释层，不是事实源。如果 wrapper 覆盖、重写或“美化”原始输出，就无法再判断真正失败发生在哪一层。

所以：

- 原始输出与派生摘要分文件保存；
- retry 不覆盖上一轮证据；
- verifier 能直接回到原始 evidence，而不是只能相信 `result.json` 或 execution log。

对应执行真值：`references/evidence-verification.md`、`references/delegation-contract.md`。

## 8. 为什么默认最多一次失败重试

相同参数、相同上下文和相同权限条件下反复调用模型，只是在重复同一实验，不会增加有效信息。

当前规则要求：

- 默认最多一次失败重试；
- retry 必须改变失败层或输入条件；
- 没有可解释的新条件就由主代理接管。

弱模型更严格：未在 packet 中预定义的失败不允许自行恢复。

对应执行真值：`references/failure-routing.md`、`references/weak-executor-contract.md`。

## 9. 为什么弱模型必须 `DECISION_BUDGET: 0`

弱模型的主要风险不是“不会执行替换”，而是在遇到歧义时仍会尝试完成任务，并自行选择实现、扩大范围或修复意外问题。

因此不是要求弱模型理解更多治理文本，而是减少它需要理解和决定的东西：

- 强主代理接收 Goal；
- 强主代理完成选路、preflight 和任务编译；
- 弱模型只接收 Procedure；
- 未预定义情况立即 `BLOCKED`。

对应执行真值：`references/weak-executor-contract.md`。

## 10. 为什么 `--auto` 和未来 CLI 参数不能被默认假设

自动写入会扩大故障半径，而报告或设计稿中的期望参数不一定已经存在于用户当前 CLI 版本。

因此：

- `--auto` 只在用户明确授权、写范围可枚举且可回滚时启用；
- `--dry-run`、`--scope`、`--read-only`、`models --json` 等能力必须由当前 `--help` 证明存在；
- 不存在时使用当前 CLI 的可观察能力 + 进程外验证，不伪造功能。

对应执行真值：`references/delegation-contract.md`。

## 11. 维护规则

本文件只保存**当前仍然成立的设计原因**，不保存旧版全文。

维护时：

- 行为规则改变：先修改对应规范 reference，再同步本文件的因果说明。
- 某个原因已经过时：明确写替代原因或删除本文件中的旧解释，同时确保当前执行规则没有依赖它。
- 需要逐字追溯旧版本：那属于源仓库维护期 archive 的职责，不属于独立分发 skill 的运行时需求。
- 本文件与当前 `SKILL.md` / 专题 reference 冲突时，应立即修复漂移；不能长期保留双真值。
