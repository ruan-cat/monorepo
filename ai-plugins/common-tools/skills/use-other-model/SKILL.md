---
name: use-other-model
description: >-
  Use when the user or agent asks to delegate work to another model/provider
  such as OpenCode, Claude Code, MiniMax, Gemini, or an independent reviewer;
  when the goal is token savings, batch or multi-file work, a task expected to
  run longer than 5 minutes, independent verification or security audit,
  model-tier routing, provider/model identity checks, OpenCode default/headless
  model checks, or choosing between MCP tools, an independent Claude Code
  session, OpenCode provider mode, and OpenCode default/internal-model mode.
  当用户或代理要求“使用其他模型/Provider”、节省 token、批量或多文件处理、预计超过 5 分钟的长任务、
  独立验证/安全审计、模型分层、provider/model 身份检查、OpenCode 默认/无头模型检查，
  或需要在 MCP、独立 Claude Code、OpenCode provider 模式与默认内部模型之间选择时使用。
user-invocable: true
metadata:
  version: "0.9.0"
---

# Use Other Model

## 目标

把合适的任务可靠地委托给其他模型或独立 reviewer，同时保留主代理的最终责任、失败分层和可复核证据。

这是一项**委托路由技能**，不是第二套 agent 平台。主文件只保留稳定入口、硬边界和快速检查；任务合同、状态机、验证细节、失败分流和启动模板按需读取 `references/`。

## 核心原则

1. **质量与确定性优先于 token 节省**
   - 边界清楚、可独立验收时才委托。
   - 协调成本高于收益时，主代理直接完成。

2. **能启动不等于能完成**
   - 退出码 0、agent 自报 success、单个测试通过都不能单独证明任务完成。
   - provider/model、权限、工具错误、预期产物和独立验证必须按层核对。

3. **执行者不能兼任最终验收者**
   - 执行 agent 只能提出候选状态。
   - verifier 状态由独立只读 reviewer、确定性校验或主代理生成。
   - 人工接受状态只能由用户/人类决定。

4. **优先最小官方命令，不扩张 launcher**
   - 先运行 CLI 官方、最小、可观察的命令或 smoke check。
   - 没有原始失败证据，不新增复杂进程树、状态机、脱敏、cleanup 或自定义执行协议。

5. **对外分发 skill 站在安装后目录视角**
   - 示例只使用技能目录内相对路径。
   - 不写本机绝对路径、开发期报告、monorepo 内部测试/CI 路径或用户私有目录。

## 什么时候委托

### 适合

- 批量或多文件操作、格式转换、重复性编辑。
- 预计超过 5 分钟且任务边界可封包的工作。
- 可并行的独立子任务。
- 独立验证、蓝军复核或安全审计。
- OpenCode provider/model、默认模型、variant、headless 链路检查。
- 需要在 MCP、Claude Code 独立会话与 OpenCode 路径之间做选择。

### 不适合

- 一眼能完成的单文件短改或查询。
- 需求仍在变化、必须频繁向用户追问的任务。
- 无法列出读写范围、验收命令或完成条件的任务。
- 把复杂根因、安全判断、架构取舍或最终合并决定下放给弱执行模型。

用户已经给出完整 `opencode run` / `claude -p` / `skills add` 命令时，默认尊重原命令，不为了“更稳”自动扩张成 wrapper、agent team、发布流程或同步 fallback。

## A-D 路由

| 路径                          | 适用场景                                         | 最低证据                                                       |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| **A：MCP 工具**               | 简单任务、单次调用                               | connector/tool、实际参数、真实结果                             |
| **B：独立 Claude Code 会话**  | 多步骤编码、批量操作、需要独立读写与验证         | 实际命令、工作目录、permission/tools、原始输出、退出码         |
| **C：OpenCode provider 模式** | 显式 provider、API key/baseURL、`provider/model` | provider/model/variant/session、认证链路、结构化事件、退出原因 |
| **D：OpenCode 默认内部模型**  | 默认模型 smoke check、headless、未指定 `--model` | 默认选择链、variant/session、可观察到的实际模型身份、原始事件  |

硬规则：

- C 与 D 不互相替代；显式 provider/model 走 C，默认内部模型走 D。
- OpenCode 直启与原生临时子代理默认互斥；只有用户明确要求嵌套时才组合。
- “模型可发现”不等于“本次 session 已选中”。同名模型需要区分 `provider/model`。
- A-D 是调用路径，不代表模型强度。复杂诊断、安全审计和最终判断仍交给强模型/主代理。

详细能力合同、角色边界和身份等级见 [`references/delegation-contract.md`](references/delegation-contract.md)。

## 弱执行模型硬门

弱模型只能承担**已经被强主代理压平的 execution 任务**，不能运行整套 skill 决策流程。

只有同时满足以下条件才允许使用弱执行模型：

- 目标文件集合可以在启动前精确列出。
- 修改能写成确定性的逐步动作，不需要架构、根因、安全或产品判断。
- 验证命令已经冻结。
- 不需要执行过程中询问用户。
- 任意意外情况都可以安全停止并交回主代理。

强主代理必须先完成 A-D 选路、preflight、范围冻结和失败策略，再生成 `Weak Executor Packet`。弱执行模型收到的包必须包含 `DECISION_BUDGET: 0`、`EXACT_ACTIONS`、`STOP_IF` 和固定 `RETURN` schema。

弱执行模型禁止：

- 自己选择 A-D、模型层级或实现方案。
- 自己读取本 skill 的 references 来补全流程。
- 自己扩大读写范围、换工具、换 provider/model 或安装依赖。
- 自己恢复未预定义的失败。
- 自己修改验收规则或写 `verifier_status` / `human_accepted`。

任何未在 packet 中明确给出答案的选择，都返回 `BLOCKED`，不继续推理解决。

完整弱模型合同与固定 packet 见 [`references/weak-executor-contract.md`](references/weak-executor-contract.md)。

## 启动前固定执行卡

按顺序执行，不得跳过：

1. **建立证据目录**
   - 当前项目根目录使用 `.use-other-model/task-YYYYMMDD-<slug>/`。
   - `.use-other-model/.gitignore` 内容必须为单独一行 `*`。
   - context、prompt、原始输出、stderr、execution log 和派生摘要都放在该任务目录。

2. **冻结角色与范围**
   - 明确 `execution` / `diagnostic` / `audit`。
   - 冻结 `working_directory`、读写 allowlist、`expected_changed_files`、forbidden paths/actions、验收命令和预期产物。
   - 完整 schema 见 [`references/context-packet-template.md`](references/context-packet-template.md)。

3. **完成 preflight**
   - 工作目录与允许路径必须真实可达；跨工作区路径必须显式列入读白名单。
   - 显式 provider 路径记录完整 `provider/model`；默认模型身份拿不到时保持 unknown，不猜测。
   - 只检查凭据/认证配置是否存在，不读取或记录秘密值。
   - 记录实际 permission mode、工具范围和可观察到的自动加载 skill。
   - `verify_commands`、测试、评分、verifier、CI 和 acceptance schema 在执行前冻结。
   - CLI 不支持 allowlist/dry-run/read-only 等能力时，记录能力缺口并用外部校验补齐，不伪造参数。

4. **按模型能力编译执行包**
   - 中/强 execution agent 可以使用完整 Task Packet。
   - 弱 execution agent 必须由主代理把完整合同压平成 `Weak Executor Packet`；弱模型不得自己读取 references、选路或补计划。

5. **运行最小 smoke check**
   - B/C/D 的命令模板分别按需读取对应 reference。
   - `--auto` 不是默认开关；只读任务不开启，写任务只有在用户明确授权、范围可枚举且可回滚时使用。

6. **执行任务并保留原始证据**
   - stdout、stderr、JSON/JSONL 原样保存。
   - 派生摘要单独保存，不覆盖或“美化”原始输出。
   - 重试不得覆盖上一轮证据。

7. **独立验证**
   - 精确比较 changed files 与 `expected_changed_files`。
   - 检查越界路径、秘密值、危险动作和验收规则篡改。
   - 同时核对退出码、结构化工具/权限事件、预期产物和冻结验证命令。
   - 只有 `VERIFIER_PASS` 才能向用户报告“候选完成”。

8. **清理与收口**
   - 只清理秘密值和明确应删除的临时凭据；证据按任务策略保留。
   - cleanup 风险独立报告，不能被前面步骤的成功掩盖。

完整 preflight、prompt 合同、状态机和 verifier 规则见：

- [`references/delegation-contract.md`](references/delegation-contract.md)
- [`references/evidence-verification.md`](references/evidence-verification.md)
- [`references/failure-routing.md`](references/failure-routing.md)

## 角色边界

| 角色         | 默认模型层级 | 负责                            | 不负责                             |
| ------------ | ------------ | ------------------------------- | ---------------------------------- |
| 主代理       | 强           | 规划、复杂根因、整合、最终验收  | 不外包完成声明与合并决定           |
| 执行型子代理 | 弱/中        | 明确 diff、批量操作、按清单执行 | 不扩需求、不做架构/根因/安全签字   |
| 诊断协作者   | 强           | 独立采证、候选假设、复现        | 不替主代理定案                     |
| 审计型子代理 | 强且独立     | 冻结工作树后的只读复核          | 不修改实现、不沿用执行者结论当证据 |

补充：弱 execution agent 只能使用 `Weak Executor Packet`，`decision_budget = 0`；诊断、审计、路由、preflight 与最终验收不得下放给弱模型。

推荐顺序：

`主代理冻结范围 → 编译执行包 → 执行/诊断取证 → 主代理整合 → 工作树冻结 → 独立审计 → 主代理最终验收`

## 方案 B 的额外硬边界

方案 B 是 unattended coding agent，不是普通问答会话：

- 先写 context packet，再启动子会话。
- 子会话要能读文件、改文件、运行冻结的验证命令、写 execution log，然后退出。
- 弱模型使用方案 B 时，仍然只拿主代理生成的 Weak Executor Packet，不把完整 SKILL / references 交给它自行解释。
- 默认启动模板、浏览器验收模板和详细执行契约按需读取：
  - [`references/method-b-independent-session.md`](references/method-b-independent-session.md)
  - [`references/claude-code-launch-templates.md`](references/claude-code-launch-templates.md)
  - [`references/frontend-browser-verification-template.md`](references/frontend-browser-verification-template.md)

### Launcher 复杂度红线

一次性 launcher 只负责准备路径、调用 CLI、保存真实输出、返回退出码。出现以下任一迹象先停下：

- 为一次 CLI 调用新增大量函数或复杂进程树治理。
- 无直接命令失败证据就引入 `ProcessStartInfo`、异步管道、手工引号协议或自定义状态机。
- launcher 自己伪造 `result.json` 的 success/blocked/partial 状态。
- 把脱敏、批量 kill、cleanup、长期状态写入 launcher。
- 把 `ANTHROPIC_MODEL` 当成所有 Claude Code 任务的通用硬门禁。

只有“标准模板已真实失败 + 原始 stdout/stderr/退出码可复现 + 新代码与失败证据一一对应”时，才允许突破红线。

## 失败与重试

失败必须先分层，再处理：

- `PREFLIGHT_BLOCKED`
- CLI 启动失败
- provider/auth 失败
- tool/permission 失败
- task execution 失败
- artifact/verifier 失败
- browser verification 失败
- cleanup 风险

同一任务**最多一次失败重试**，且必须改变失败层或输入条件，例如先修正路径/权限后再重试。相同命令、上下文和权限条件下原地轮询属于无效重试，主代理接管。

**弱模型例外更严格**：只有 packet 已经预定义具体失败信号与下一动作时，弱模型才可执行一次固定恢复；任何未预定义失败立即 `BLOCKED`，不得自行换方案。

详细信号、第一动作和回退规则见 [`references/failure-routing.md`](references/failure-routing.md)。

## 预算

任务封包记录时间预算；能获取真实 token 消耗时同时记录 token budget/usage，获取不到写 `unavailable`。

- 简单：5 分钟以内
- 中等：10–20 分钟
- 复杂：20–45 分钟
- 预计超过 45 分钟：先拆任务

预算不足不能成为放宽 write allowlist、关闭 verifier 或重复同参数重试的理由。

## 安全边界

- 不在 prompt、context、日志或结果中复制 API key、认证 header、私有 token；只引用环境变量名。
- 执行 agent 不修改测试、评测、评分、verifier、CI 或 acceptance schema 来让自己通过，除非这些文件本身就是用户明确目标且另有独立验收。
- 不自动 commit、push、发版、部署、数据库迁移、生产运维、长期记忆写入或外部任务状态修改，除非用户明确授权并由对应专门流程处理。
- 不默认访问兄弟工作区、用户目录或全盘文件。
- 前端任务不能用 build/test 替代浏览器验收；浏览器不可用时明确标记 blocked。

## 最小验收清单

- [ ] 工作目录、路径、模型身份、权限和验收规则在调用前已冻结。
- [ ] 跨工作区不可达时在模型调用前得到 `PREFLIGHT_BLOCKED`。
- [ ] 弱模型任务满足 weak-executor 适用门槛，且实际收到 `DECISION_BUDGET: 0`、`EXACT_ACTIONS`、`STOP_IF` 和固定 `RETURN` schema。
- [ ] 弱模型没有自行读取 references、选 A-D、扩 scope、换 provider/model 或恢复未预定义失败。
- [ ] 退出码 0 但存在权限拒绝、工具错误、缺失产物或 verifier 失败时，没有标成功。
- [ ] changed files 精确匹配预期集合且全部位于 write allowlist。
- [ ] 原始 stdout/stderr/JSONL 独立可复核，派生摘要未覆盖原始证据。
- [ ] 执行者没有写 `verifier_status` / `human_accepted`，也没有改冻结验收规则。
- [ ] 重试最多一次且改变失败条件；弱模型只执行预定义恢复。
- [ ] 主代理亲自查看最终 diff，并完成与任务风险匹配的独立验证。

完整状态机和确定性检查见 [`references/evidence-verification.md`](references/evidence-verification.md)。

## 按需读取

- **弱执行模型编译** → `references/weak-executor-contract.md`
- **A：MCP** → `references/method-a-mcp-tools.md`
- **B：Claude Code 独立会话** → `references/method-b-independent-session.md` + `references/claude-code-launch-templates.md`
- **C：OpenCode provider** → `references/opencode-provider-launch-templates.md`
- **D：OpenCode 默认/headless** → `references/opencode-headless-launch-templates.md`
- **任务封包** → `references/context-packet-template.md`
- **失败分流** → `references/failure-routing.md`
- **独立验证** → `references/evidence-verification.md`
- **前端浏览器验收** → `references/frontend-browser-verification-template.md`
- **环境变量识别** → `references/environment-variables.md`
- **案例与背景** → `references/case-study-git-commits.md`、`references/technical-reports.md`
- **完整 reference 导航** → `references/README.md`
