# 弱执行模型合同

本文件定义 `use-other-model` 的低能力执行模式。目标不是要求弱模型理解完整治理体系，而是由强主代理先完成路由、预检和任务压平，再把一个几乎不需要判断的机械执行包交给弱模型。

核心原则：**强模型接收 Goal；弱模型接收 Procedure。**

## 1. 适用门槛

只有同时满足以下条件，才允许把任务交给弱执行模型：

- 角色严格为 `execution`。
- 目标文件集合在启动前可以精确列出。
- 所需修改可以写成确定性的逐步动作，不需要架构、根因、安全或产品判断。
- 所有验证命令都能在启动前冻结。
- 不需要执行过程中向用户追问。
- 任意意外情况都可以安全地停止并返回 `BLOCKED`，而不是要求执行者自行恢复。

任一条件不满足：不要继续压给弱模型；升级到中等/强模型或由主代理执行。

## 2. 主代理编译职责

弱模型不得自己把完整 Task Contract 转换成执行计划。主代理必须先完成：

1. 选择 A-D 路径。
2. 确认执行角色确实可以使用弱模型。
3. 完成 working directory、权限、provider/model、工具范围与路径 preflight。
4. 冻结 read/write allowlist、expected changed files、verification commands 和 forbidden actions。
5. 把 Goal 改写成 `EXACT_ACTIONS`。
6. 把所有异常分支改写成 `STOP_IF`。
7. 只把压平后的 Weak Executor Packet 交给弱模型。

弱执行模型**不负责**：选 A-D、选模型层级、设计实现方案、选择 reference、补全缺失规则、修正 Task Contract 或决定失败恢复策略。

## 3. Decision budget = 0

Weak Executor Packet 必须包含：

```text
DECISION_BUDGET: 0
```

含义：

- 未在 packet 中明确授权的选择，不属于执行者决策权。
- 不知道选 A 还是 B → `BLOCKED`。
- 不知道两个实现哪个更好 → `BLOCKED`。
- 发现还要改另一个文件 → `BLOCKED`。
- 验证失败但 packet 没写修复步骤 → `BLOCKED`。
- 文件内容和预期不同 → `BLOCKED`。
- 命令或工具不可用 → `BLOCKED`。

禁止使用“为了完成任务，我认为应该……”作为扩展权限的理由。

## 4. Weak Executor Packet

强主代理生成并直接交给弱执行模型的包固定使用以下结构：

```text
ROLE: EXECUTION_ONLY
DECISION_BUDGET: 0

WORKING_DIRECTORY:
<absolute-task-root>

READ:
- <exact-path>

WRITE:
- <exact-path>

EXACT_ACTIONS:
1. <imperative action with exact path and exact operation>
2. <imperative action>
3. <imperative action>

DO_NOT:
- Do not read any skill or reference file unless it is explicitly listed in READ.
- Do not choose A/B/C/D.
- Do not change the task plan, acceptance rules, tests, verifier, CI, dependencies, branch, or model configuration.
- Do not edit files outside WRITE.
- Do not install dependencies.
- Do not git commit/push, publish, deploy, migrate data, or write long-term memory.
- Do not repair unexpected problems unless an EXACT_ACTION explicitly tells you how.

VERIFY:
1. <exact frozen command>
2. <exact frozen command>

STOP_IF:
- Any READ file is missing or inaccessible.
- Actual file content does not match the precondition stated by an EXACT_ACTION.
- Completing an action requires editing a file outside WRITE.
- Completing an action requires a command not listed in EXACT_ACTIONS or VERIFY.
- A command returns non-zero or the expected output is missing.
- A permission/tool error occurs.
- The task has more than one reasonable interpretation.
- A new dependency, library, API, architecture choice, or user decision is required.
- Repository/workspace/branch state differs from this packet.

RETURN:
STATUS: SUCCESS | BLOCKED
CHANGED_FILES:
- <exact-path>
COMMANDS_RUN:
- <exact-command>
EVIDENCE:
- <short factual evidence>
BLOCK_REASON: <empty on SUCCESS; exact stop condition on BLOCKED>
```

## 5. EXACT_ACTIONS 写法

弱模型的动作必须是“可执行步骤”，不是目标摘要。

### 好的动作

```text
1. 打开 packages/a/config.ts。
2. 确认其中存在精确文本 `mode: "old"`；不存在则 STOP。
3. 仅把该文本替换为 `mode: "new"`。
4. 不修改该文件其他内容。
```

### 不好的动作

```text
- 优化配置。
- 根据项目情况做必要调整。
- 修复相关问题。
- 确保整体正确。
```

编写规则：

- 每行一个动作。
- 使用命令式动词。
- 写精确文件路径。
- 能写 old/new 值时写 old/new 值。
- 能写前置条件时写前置条件。
- 禁止“必要时”“视情况”“适当”“相关”等需要自由解释的措辞。
- 批量重复任务应先由主代理列出确定文件集合或确定转换规则。

## 6. STOP_IF 优先级

`STOP_IF` 高于“尽量完成任务”。命中任一 STOP 条件后：

1. 立即停止新增修改。
2. 不自行回滚用户已有工作。
3. 不尝试替代方案。
4. 不读取更多 reference 寻找答案。
5. 返回 `STATUS: BLOCKED` 和精确 `BLOCK_REASON`。

如果已经产生允许范围内的部分修改，原样报告 `CHANGED_FILES`；由主代理决定保留、修正或回退。

## 7. Reference 隔离

弱执行模型默认**不加载本 skill 的任何 reference**。

原因：reference 用于强主代理做路由、任务编译、失败分流和 verifier 设计；把多跳 reference 继续交给弱模型，会重新引入需要判断“该读什么、如何合并规则”的认知负担。

例外：某个 reference 本身就是任务目标文件，或主代理明确把一个具体文件列入 `READ`。即使如此，弱模型也只按 EXACT_ACTIONS 处理，不从该文件自行推导额外流程。

## 8. 失败恢复

弱模型不做开放式恢复。

允许：

- packet 明确写出“如果命令 A 返回 X，则执行 B”。
- 固定的一次重试，且命令、输入和停止条件都已由主代理预定义。

不允许：

- 自己换工具。
- 自己扩大权限。
- 自己换 provider/model。
- 自己搜索仓库找替代实现。
- 自己修改 tests/verifier/CI。
- 自己把 BLOCKED 改写成 PARTIAL/SUCCESS。

未预定义的失败全部返回主代理。

## 9. 主代理验收

弱模型返回 SUCCESS 后仍必须独立验证：

- `actual_changed_files == expected_changed_files`
- 所有改动位于 write allowlist
- EXACT_ACTIONS 的前置条件和结果成立
- VERIFY 命令由可信执行环境重新核对或至少复核原始输出
- 没有越界读取/写入、权限错误、秘密泄漏或验收规则修改

弱模型的 `SUCCESS` 只等价于 `AGENT_PROPOSED_SUCCESS`，永远不等价于 `VERIFIER_PASS`。

## 10. 设计目标

不要训练弱模型成为小号主代理。把复杂判断留在强主代理，把执行任务压缩成：

`READ → EXACT_ACTIONS → VERIFY → STOP_IF → RETURN`

弱模型可靠性的主要来源应该是**减少自由度**，而不是增加说明文字。
