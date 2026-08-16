---
name: use-other-model
description: >-
  Use when an agent needs to delegate work to OpenCode, Claude Code, MiniMax,
  Gemini, another model/provider, or an independent reviewer for token savings,
  batch or long-running work, provider/model verification, model-tier routing,
  or evidence-backed independent verification. 当代理需要驱动 OpenCode、Claude Code、MiniMax、
  Gemini 或其他模型/Provider，进行 token 节省、批量或长任务、provider/model 验证、模型分层、
  独立执行或基于证据的独立复核时使用。
user-invocable: true
metadata:
  version: "0.9.0"
---

# Use Other Model

## 目标

把合适的任务可靠地委托给成本更低或更适配的模型，同时保留主代理的最终责任与可复核证据。

这项技能的重点不是“多开一个聊天窗口”或追求最大 token 节省，而是建立一个**委托路由器 + 轻量证据 harness**：在模型消耗 token 前确认范围、身份和权限，在执行后保留原始证据，并由独立验证决定候选结果是否可交付。

## 核心立场

1. **Token 优化不是目的，质量和确定性才是目的**
   - 只有在收益明确、任务边界清楚时才委托
   - 如果协调成本高于收益，直接自己做

2. **OpenCode 提供两条新增路径，不替换 Claude Code 方案 B**
   - 方案 C 适合显式 provider/model 直连；方案 D 适合默认内部模型 smoke check、无头委托和省略 `--model` 的 `opencode run`
   - Claude Code 方案 B 仍用于需要独立编码代理读文件、改文件、跑验证、写 execution log 的复杂任务
   - 不要把 OpenCode 直连命令再包进 Claude Code 启动器，除非用户明确要求用 Claude Code 编排

3. **用户给出完整外部 CLI 命令时，先尊重命令本身**
   - 完整的 `opencode run` / `claude -p` / `skills add` 命令默认由主代理按原命令执行或做只读复核
   - 不要为了“更稳”把完整命令扩展成自定义 wrapper、agent team、发布流程、同步 fallback 或长计划
   - 聊天里的环境变量赋值不会自动进入当前 shell；需要在同一个 PowerShell/Bash 会话中注入后再运行

4. **方案 B 是无人值守编码代理，不是问答会话**
   - 子会话必须能读文件、改文件、跑命令、做验证、写日志、完成后退出
   - 子会话不应把任务理解成普通聊天

5. **主代理永远保留复核责任**
   - 即便子会话报告成功，主代理仍必须重新看 `git diff`
   - 仍必须重新跑关键验证命令
   - 前端任务仍必须重新做浏览器验收或确认子会话的浏览器证据

6. **复杂前端任务默认带浏览器验收**
   - 只要任务涉及页面、组件、样式、交互、可视化，就不能只看 `build/test`
   - 浏览器不可用时必须记录原因，不能静默跳过

## 职责合同：委托路由器 + 轻量证据 Harness

### 本技能负责

- 创建最小任务封包，明确工作目录、读写范围、禁区、模型身份、权限模式、验收命令和预期产物。
- 在模型调用前完成工作区、路径可达性、provider/model、认证存在性、工具/技能范围和预算预检。
- 在 A-D 路径之间做路由，并先执行低成本、可观察的官方最小命令或 smoke check。
- 捕获并保留原始 stdout、stderr、结构化事件、session、provider/model/variant、工作目录、退出原因和产物清单。
- 把执行者自报状态、独立验证状态和人类最终接受状态分开记录。
- 向主代理返回候选改动、证据、失败层和剩余风险；最终接受仍由主代理与用户决定。

### 本技能不负责

- 不做通用进程编排器，不为一次 CLI 调用重新实现复杂进程树、守护进程或后台服务治理。
- 不做 secrets manager；任务封包、日志和结果只能引用环境变量名，不复制 token、认证 header 或私有凭据值。
- 不允许执行 agent 修改测试、评测、评分、verifier 或验收规则来让自己通过。
- 不自动 commit、push、发版、部署、写长期记忆或修改外部任务状态；这些动作交给主代理或独立授权流程。
- 不默认读取兄弟工作区、全盘文件或未列入范围的材料；跨目录访问必须进入显式读白名单。
- 不把浏览器控制、数据库迁移、生产运维等高风险动作包装成普通委托任务；需要专门技能和授权。
- 不把 `--auto` 当成默认开关；只读调研优先只读模式，写入任务必须先枚举范围且可回滚。

一句话边界：**可以把任务交出去，不能把责任也交出去。**

## 委托路径互斥与 Git 提交路由

OpenCode 直启和原生临时子代理是两条互斥的执行路径，不能因为“都使用其他模型”而套娃：

1. 用户明确要求 **OpenCode 默认模型**、未指定 `--model`，或给出裸 `opencode run` 命令时，直接执行方案 D；不要创建原生临时子代理。
2. 用户明确要求 **临时子代理** 但没有指定 OpenCode 时，使用原生协作代理；不要再启动方案 D，也不要在子代理内嵌套 OpenCode。
3. 只有用户同时明确要求“通过 OpenCode 驱动独立执行器”时，才允许组合两层；必须分别记录 OpenCode 与执行器的启动命令、模型/Provider、退出码和原始输出。
4. 简单 Git 提交默认由主代理直接完成。只有批量逻辑提交、预计超过 5 分钟，或用户明确要求独立验证时才委托；委托时只保留一个执行代理，安全审计仅在 staged diff 含密钥、权限、外部发布或用户明确要求时后置启动。

委托前必须生成最小任务封包，而不是转发完整会话历史。封包至少包含：

```yaml
role: execution | diagnostic | audit
working_directory: <absolute-task-root>
read_allowlist:
  - <path-or-glob>
write_allowlist:
  - <path-or-glob>
expected_changed_files:
  - <exact-path>
forbidden_paths:
  - <path-or-glob>
goal:
  - <goal-item>
forbidden_actions:
  - <action>
provider: <explicit-provider-or-default>
model: <explicit-model-or-default>
variant: <variant-or-none>
session: <session-id-or-none>
permission_mode: <actual-permission-mode>
tool_allowlist:
  - <tool-or-recorded-limitation>
skill_allowlist:
  - <skill-or-recorded-limitation>
verify_commands:
  - <command>
expected_artifacts:
  - <path-or-output>
result_fields:
  - agent_proposed_status
  - changed_files
  - commands_run
  - evidence
  - remaining_risks
budgets:
  time: <limit>
  token: <limit-or-unavailable>
retry_limit: 1

# 仅 Git 提交委托时追加；普通委托可省略
git_commit_plan:
  exclude: [<explicitly-excluded-worktree-change>]
  groups:
    - type: <type>
      scope: <scope>
      emoji: <emoji>
      files: [<files>]
      summary: <summary>
  identity_check: <client-model-trailer-result>
```

`write_allowlist` 表示绝对不能越过的写边界；`expected_changed_files` 表示本次真正预期发生变化的精确文件集合。默认验收要求实际 changed files 与 `expected_changed_files` 一致，不能用更宽的 allowlist 掩盖额外改动。

执行器使用 `fork_turns: none` 或等价的最小上下文启动，不重复读取无关技能、历史对话和已完成的范围分析。主代理验收时必须能从日志确认实际 CLI、provider/model/variant、session、工作目录、退出原因、原始输出、变更清单、验证结果和临时文件清理状态。

## 模型分层策略

方案 A-D 是调用路径，不是模型强度。先分配角色和风险等级，再选择调用路径；不要因为已经启动了某个 CLI 就让它承担不匹配的职责。

| 角色         | 默认模型层级           | 允许承担的工作                                                  | 必须保留的边界                                                      |
| ------------ | ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| 主代理       | 强模型                 | 任务规划、用户沟通、纠偏、复杂根因诊断、跨代理整合、最终验收    | 不把最终判断、完成声明或合并决策外包                                |
| 执行型子代理 | 弱/中模型              | 有明确 diff 的代码/文档修改、批量操作、格式转换、按清单运行命令 | 只改允许范围；不得自行扩展需求、做架构决策、下根因结论或兼任审计    |
| 诊断协作者   | 强模型                 | 独立收集日志、配置、复现和候选假设，挑战主代理判断              | 主代理读取原始证据后作最终根因判断；未经证据不得定案                |
| 审计型子代理 | 强模型，且独立于执行者 | 蓝军复核、方案 pros/cons、安全审计、敏感信息和最终 diff 检查    | 在工作树冻结后启动；只读报告 findings，不修改实现，不沿用执行者结论 |

### 硬性路由规则

1. **先定角色，再选 A-D 路径**：复杂任务可以分别使用执行、诊断和审计角色，但简单 Git 提交不启动多余角色；不能让一个代理覆盖全部职责。
2. **风险决定最低模型层级**：复杂根因、安全判断和架构取舍不得下放给弱模型；不确定时升级到主代理或强模型。
3. **执行必须是封包化的**：给出工作目录、文件清单、明确 diff、禁止事项、验证命令和完成条件；执行者只回传改动与原始证据。
4. **审计必须后置且独立**：所有实现和诊断结果先冻结，再把最终工作树、`git diff`、必要历史/配置/日志交给独立审计者；审计者不得修改文件。
5. **主代理是唯一验收门**：核对文件范围、原始命令输出、测试/构建、浏览器证据和审计 findings 后，才向用户声明完成。

推荐顺序：

`主代理冻结范围 → 执行/诊断取证 → 主代理整合与复核 → 工作树冻结 → 独立审计 → 主代理最终验收`

## A-D 能力合同与身份等级

| 路径 | 必须记录的身份/环境 | 这条证据能证明什么 | 不能据此宣称什么 |
| ---- | ------------------- | ------------------ | ---------------- |
| A：MCP | connector/tool 名、实际参数、结果 | 指定 MCP 工具真实返回了结果 | 外部 CLI/provider/model 已可用 |
| B：Claude Code | 实际 `claude` 命令、工作目录、permission/tools、显式模型（若有）、原始输出、退出码 | Claude Code 会话真实启动并执行了记录中的动作 | 子会话自报成功等于任务验收通过 |
| C：OpenCode provider | provider、model、variant、工作目录、session、认证链路存在性、实际命令、原始事件、退出原因 | 指定 provider/model 链路按记录身份运行 | 同名模型的其他 provider 也可用，或退出码 0 就代表任务成功 |
| D：OpenCode 默认模型 | 默认模型选择链、variant、工作目录、session、结构化事件中可观察到的实际 provider/model（若有） | OpenCode 默认链路真实启动；若事件明确给出身份，可记录实际 provider/model | 省略 `--model` 时凭模型昵称猜 provider，或把“模型可发现”当成“已被选中” |

同名模型可能存在于不同 provider。只写“Luna”“Claude”“GPT”不构成完整模型身份；需要区分时必须记录 `provider/model`。如果当前 CLI 只能给文本模型列表，就保留原始文本并降低证据等级，不要自行伪造机器可读结论。

## 委托临时目录契约

每次执行本技能（方案 A-D，包括 smoke check、诊断取证和独立编码代理）都必须在对应项目的工作目录内建立临时证据闭包：

1. 在当前项目/工作区根目录创建 `.use-other-model` 目录；不得把任务封包、启动脚本、结果或日志写入用户目录、系统临时目录或仓库根目录的散落文件。
2. `.use-other-model/.gitignore` 必须存在且内容严格为单独一行 `*`，用于完全忽略该临时目录；若文件已存在但内容不同，先修正后再启动任务。
3. 每个新子任务使用唯一目录名 `task-YYYYMMDD-XXX`，例如 `task-20260806-opencode-headless`、`task-20260805-probe`；日期使用当前本地日期，`XXX` 使用简短的小写 ASCII 语义 slug，不使用空格。
4. `context-packet.md`、`unattended-system-prompt.txt`、`result*.json`/`result*.jsonl`、`execution-log*.md`、`stderr.log`、启动脚本、进程台账和其他临时文件，必须放在对应的 `task-YYYYMMDD-XXX` 目录中。重试或子任务产生的文件使用同一任务目录内的带后缀文件，或创建新的唯一 task 目录，禁止覆盖既有证据。
5. `.use-other-model` 根目录原则上只保留 `.gitignore` 和任务子目录；不要在根目录写入未归属任务的 `result.json`、`launch.ps1` 或报告。
6. 任务完成后保留该临时证据闭包供主代理复核，不得把“清理临时文件”理解为删除任务目录；仅清理包含密钥的临时环境或文件，并在执行日志中记录清理结果。

目录最小形态：

```text
.use-other-model/
├─ .gitignore        # 内容仅为：*
└─ task-YYYYMMDD-XXX/
   ├─ context-packet.md
   ├─ unattended-system-prompt.txt
   ├─ result.json
   └─ execution-log.md
```

原始 `stdout` / `stderr` / JSONL 与派生摘要必须分开保存。摘要可以引用原始证据，不能覆盖、重写或“美化”原始证据；重试不得覆盖上一轮文件。

## 能力保留清单

本轮 Harness 加固不删除原有能力。以下入口仍然有效：

- 方案 A：MCP 工具，处理简单任务和单次调用。
- 方案 B：独立 Claude Code 无人值守编码代理，负责读文件、改文件、运行验证并写 `execution log`。
- 方案 C：OpenCode 直连 provider，使用当前 shell 的 API key、baseURL 和显式 `--model provider/model`。
- 方案 D：OpenCode 裸启动内部默认模型，省略 `--model`，用于默认模型 smoke check 和无头委托。
- 方案 B 的任务封包、系统提示、启动模板、预算/超时、失败分流、浏览器验收和主代理复核。
- 成本收益分析、批量 Git 提交案例、FAQ、环境变量识别与兼容旧模板。
- 安全注意事项：敏感信息保护、结果不能只信子会话声明、前端不能静默跳过浏览器验收。

历史事故结论已经转化为本文件的启动前固定执行卡、方案 B 启动器复杂度红线和 `references/failure-routing.md` 分层规则；对外技能不保留本机报告链接或开发期路径。

## 启动前预检门

任何外部模型开始消耗任务 token 前，主代理必须完成以下预检。预检失败时直接返回 `PREFLIGHT_BLOCKED`，不要先调用模型再等待它发现环境问题。

1. **工作目录与路径范围**
   - 确认 `working_directory` 是本次任务真实根目录。
   - 逐项解析 `read_allowlist`、`write_allowlist`、`expected_changed_files` 和 `forbidden_paths`；跨工作区路径必须显式列入读白名单并确认可达。
   - 任务封包引用了不可达路径、错误工作区或范围冲突时，模型调用前阻断。

2. **provider/model/variant/session 身份**
   - 显式 provider 路径必须记录完整 `provider/model`，不能只记录模型昵称。
   - 默认模型路径必须记录“default”以及结构化事件最终暴露出的实际身份；事件未提供时保持未知，不猜测。
   - `opencode models` 只证明模型可发现，不证明该模型已在本次 session 中被选择。

3. **认证、权限与工具范围**
   - 只检查认证配置是否存在，不读取、打印或复制秘密值。
   - 记录实际 permission mode、工具范围和自动加载 skill 的可观察结果。
   - 如果 CLI 支持工具/skill allowlist，应按任务最小权限设置；如果不支持，明确记录能力缺口并收窄任务，而不是假装已经限制。

4. **验收规则不可由执行者改写**
   - `verify_commands`、测试、评测、评分、verifier、CI 和 acceptance schema 由主代理冻结。
   - 执行 agent 若修改这些文件或规则，独立验证直接失败，除非用户明确把它们列入任务目标。

5. **预算与重试**
   - 在封包中记录 time/token budget；CLI 无 token 统计时写 `unavailable`，不得编造。
   - 默认只允许一次失败重试，而且重试必须改变失败层或输入条件；禁止同参数原地轮询。

6. **不要假设报告中的期望 CLI 已存在**
   - `--dry-run`、`--scope`、`--read-only`、`models --json` 等能力只有在当前版本 `--help` 明确存在时才能使用。
   - 如果不存在，用当前 CLI 的最小可观察命令 + 外部范围校验实现同等约束，不得把期望功能写成已存在事实。

7. **`--auto` 必须显式授权**
   - 只读调研不启用 `--auto`。
   - 只有写范围可枚举、可回滚且用户明确授权的无头写任务才允许启用；启用后也不能取消 changed-file 白名单和独立验证。

## 启动前固定执行卡

以下顺序是硬约束，不得因“先做一个更完整的脚本”而跳过、合并或重排：

0. **先建立任务目录，再选模型角色**
   - 按「委托临时目录契约」创建 `.use-other-model/.gitignore` 和唯一的 `task-YYYYMMDD-XXX` 目录，并把后续所有临时产物写入该目录。
   - 目录未创建、`.gitignore` 内容不为单独一行 `*` 或任务目录命名不合规时，不得启动任何外部模型或子代理。

1. **选模型角色，不按 CLI 默认分配职责**
   - 明确 diff 的机械编辑、批量 env/文件操作和格式转换，优先分给弱/中执行型子代理。
   - 认证、代理、运行时等复杂根因由主代理诊断；可让强诊断协作者独立采证，但不把最终结论外包。
   - 敏感信息、方案 pros/cons 和最终 diff 复核由独立强审计型子代理承担，且必须在改动冻结后进行。

2. **再选路径，不混用职责**
   - 用户明确给出 API key、baseURL 和 `--model provider/model` 时，选方案 C，使用 OpenCode 直连 provider。
   - 用户要求 OpenCode 使用自身默认模型、未指定 `--model`，或要求裸启动无头委托时，选方案 D，直接使用 OpenCode 内部模型。
   - 只有确实需要独立编码代理读写文件、执行验证并写 `execution log` 时，才选方案 B。方案 C、D 都不替换方案 B，也不互相替换。

3. **完成预检，再让模型消耗任务 token**
   - 按「启动前预检门」核对工作目录、路径范围、provider/model、认证、permission、工具范围、验收规则和预算。
   - 任一硬门失败就写 `PREFLIGHT_BLOCKED` 和阻断证据，不运行真实任务 prompt。

4. **只信实际调用 shell，不从聊天文本推断配置已生效**
   - 聊天中的 `$env:` 赋值不会自动传入当前 PowerShell 或其子进程。必须在实际执行 `opencode run` 或 `claude -p` 的同一个 shell 会话中注入后再调用；裸启动默认不需要 provider 环境变量。
   - `ANTHROPIC_MODEL` 对 Claude Code 是可选值：仅当用户明确指定模型时设置；不得把它加入通用环境检查或启动门禁。

5. **先做最小 smoke check，再谈封装或任务执行**
   - 方案 C：在同一 shell 注入 provider 配置后，运行 `opencode run --model "provider/model" "reply with ok"`。
   - 方案 D：`opencode run --format json --variant max "只回答 OPENCODE_DEFAULT_MODEL_SMOKE_OK，不调用工具，完成后退出。"`。
   - 方案 B：`claude -p --output-format json "reply with ok"`。
   - 没有这条直接命令的原始 stdout/stderr 与退出码，就不得新增 wrapper、预检脚本、进程树、脱敏管道、元数据生成器或 cleanup 逻辑。

6. **按层报告结论，不能跨层代偿**
   - CLI 能启动，只证明 CLI 和当前认证路径可启动；它不证明用户指定的 provider、模型名、baseURL 或真实任务可用。
   - provider 失败先检查当前 shell 的配置传播、认证、endpoint 和模型名；不要改 Claude Code 启动器，也不要把失败归咎于模型能力。
   - 退出码为 0 只证明进程按该退出码结束；如果结构化事件有工具错误、权限拒绝、预期产物缺失或验收失败，任务仍不能标为成功。

7. **治理动作后置且独立**
   - 脱敏由调用方输出处理，cleanup 仅在任务结束后按独立流程进行，并应有归属证据和 dry-run。
   - 不把脱敏、进程树、批量终止、状态机写入和清理塞进 `launch-probe.ps1` 或任何启动器。启动器只调用 CLI、保存真实输出并返回退出码。

## 轻量 Harness 提示词约束

提示词只负责角色、范围、禁区和输出契约；范围校验、状态机和验收必须在模型进程外执行。推荐固定形态：

```text
ROLE: 你只负责本次委托中的 execution / diagnostic / audit 角色。
SCOPE: 工作目录为 <root>；只允许读取 <read_allowlist>，只允许写入 <write_allowlist>。
READ: 先读 context-packet，再读清单内文件；禁止猜测未提供的上下文。
FORBIDDEN: 禁止范围外访问、安装依赖、修改测试/评测/评分/verifier/CI、git commit/push、写长期记忆或伪造完成状态，除非任务合同明确授权。
ACCEPTANCE: 只执行冻结的 <verify_commands>，把命令与原始输出摘要登记到 evidence，不修改验收规则。
STATUS: 只能写 agent_proposed_status；不得写 verifier_status 或 human_accepted。
OUTPUT: 返回 changed_files、commands_run、evidence、remaining_risks；证据不足时标记 partial 或 blocked。
```

不要把整本技能、全部历史对话或治理逻辑复制进 prompt。Prompt 约束模型行为，harness 负责硬校验。

## 状态机与六层证据链

推荐状态流转：

`PENDING → PREFLIGHT_BLOCKED | RUNNING → AGENT_PROPOSED_SUCCESS / AGENT_PROPOSED_PARTIAL / AGENT_FAILED → VERIFIER_PASS / VERIFIER_FAIL → HUMAN_ACCEPTED`

状态所有权必须分离：

- 执行 agent 只能写 `agent_proposed_status`、`changed_files`、`commands_run`、`evidence` 和 `remaining_risks`。
- `verifier_status` 只能由独立只读 reviewer、确定性校验进程或主代理生成。
- `human_accepted` 只能表示用户/人工最终接受；模型不得自行写入或推断。

每次运行至少记录六层：

1. `CLI_START`：官方最小命令是否真实启动。
2. `PROVIDER_AUTH`：provider、认证链路和模型身份是否与任务合同一致。
3. `TOOL_PERMISSION`：工具调用、目录权限和外部路径访问是否通过。
4. `TASK_EXECUTION`：模型是否执行了约定动作，而不是只生成“完成”文本。
5. `ARTIFACT_VERIFY`：changed files、产物、扫描和冻结的验证命令是否由独立验证通过。
6. `CLEANUP`：秘密值是否清理、原始证据是否保留、临时产物是否符合保留策略。

只有第 5 层得到 `VERIFIER_PASS`，主代理才可以向用户报告“候选完成”。第 6 层有风险时必须单独披露，不能用前五层成功掩盖。

## 进程外确定性验证

主代理或独立 verifier 至少执行以下检查，不能只复述执行者的 execution log：

1. **changed-file 精确集合**：实际 changed files 必须与 `expected_changed_files` 一致，并全部位于 `write_allowlist` 内；出现额外文件立即 `VERIFIER_FAIL`。
2. **禁区与路径污染扫描**：检查 forbidden paths、硬编码本机路径、用户目录、越界工作区引用和任务声明的禁用词。
3. **秘密值与危险动作扫描**：结果、context、日志和 diff 不得包含 token 实值、认证 header、私有凭据；检查未授权的安装、commit/push、发布、部署、迁移或生产动作。
4. **验收规则完整性**：执行者不得修改测试、评测、评分、verifier、CI 或 acceptance schema；若任务确需修改，必须由主代理在启动前显式授权并使用独立验收。
5. **多证据一致性**：同时核对退出码、结构化事件中的工具错误/权限决策、预期产物、冻结验证命令；任一关键证据冲突都不能标成功。
6. **原始证据保真**：stdout/stderr/JSONL 原样保留，派生摘要使用单独文件；wrapper 不能用自己生成的 `result.json` 覆盖真实子进程输出。
7. **声明的一致性检查**：任务若要求版本、术语、文档或多文件同步，按任务封包增加版本一致性/禁用词/遗漏文件扫描；不能仅凭执行者声称“已全部更新”。

`git diff --check`、测试或构建只是验证链的一部分，不是替代品。复杂文档或多文件任务应增加独立只读 reviewer；reviewer 不得修改工作树。

## 何时使用其他模型

### ✅ 适合委托的场景

1. **复杂多文件操作**
   - 需要修改 10+ 个文件
   - 需要多个相互独立的提交
   - 预计执行时间超过 5 分钟

2. **批量重复任务**
   - 批量文本转换
   - 批量代码生成
   - 批量文档处理

3. **可并行的独立任务**
   - 多个相互独立的模块
   - 多个相互独立的测试或文档任务

4. **简单但耗时的执行型任务**
   - 大量格式化和 lint 修复
   - 按模板生成多份内容

5. **OpenCode 默认模型或显式 provider 链路验证**
   - 用户要求验证 OpenCode 默认内部模型、模型变体，或明确要求外部 provider、模型名、API key、baseURL 或代理链路
   - 用户已经给出完整 `opencode run` 命令
   - 需要验证 OpenCode 默认模型、无头执行或模型变体

### ❌ 不适合委托的场景

1. **简单快速任务**
   - 单文件编辑
   - 执行时间小于 1 分钟
   - 一眼能做完的查询
   - 完整 `skills add` / `npx skills add` / `opencode run` 等用户已给全参数命令，默认由主代理按原命令执行或确认；不得为了节省 token 启动外部模型、agent team、发布流程、同步 fallback 或长计划；用户明确要求复核时只做只读复核，不抢执行权

2. **高度依赖对话上下文的任务**
   - 需要频繁和用户来回确认
   - 任务边界还没澄清
   - 需求本身还在变化

3. **高风险高质量要求任务**
   - 核心业务逻辑
   - 安全相关代码
   - 需要深度架构判断的设计问题

## 决策流程

开始前按下面顺序判断：

1. **先判断任务复杂度**
   - 简单任务：5 分钟以内
   - 中等任务：10-20 分钟
   - 复杂任务：20-45 分钟

2. **再判断上下文压缩成本**
   - 能否用一份清晰的任务封包交给外部代理
   - 如果连主代理都说不清任务边界，不要委托

3. **再判断模型角色**
   - 执行型子代理只接收明确 diff 和可复现命令；复杂根因、安全审计和最终判断升级到强模型/主代理。
   - 审计型子代理必须与执行上下文隔离，并在最终工作树冻结后读取证据。

4. **最后判断验收方式**
   - 只靠命令行就能证明完成：可委托
   - 必须看页面、交互、布局：可委托，但必须附带浏览器验收模板

## 四种实现方案

| 方案                                | 适用场景                                                  | Token 节省 | 实现复杂度 |
| ----------------------------------- | --------------------------------------------------------- | ---------- | ---------- |
| **方案 A:MCP 工具**                 | 简单任务、单次调用                                        | 20-40%     | 低         |
| **方案 B：独立 Claude Code 会话**   | 多步骤、批量操作、执行时间 > 5 分钟                       | 50-80%     | 中         |
| **方案 C：OpenCode 直连 provider**  | 用户明确指定 API key、baseURL 和 `--model provider/model` | 20-60%     | 低         |
| **方案 D：OpenCode 裸启动内部模型** | OpenCode 默认模型、无头委托、未指定 `--model`             | 20-60%     | 低         |

### 方案 A：使用 MCP 工具

- 适合单次调用和轻量任务
- 参见 `references/method-a-mcp-tools.md`

### 方案 B：启动独立 Claude Code 会话

- 适合复杂任务和长任务
- 默认按 **unattended coding agent** 设计
- 参见 `references/method-b-independent-session.md`

### 方案 C：使用 OpenCode 直连 provider

- 适合用户明确指定 provider、API key、baseURL 和 `--model provider/model` 的场景
- 核心命令：

  ```powershell
  $env:ANTHROPIC_API_KEY = "<api-key>"
  $env:OPENCODE_CONFIG_CONTENT = '{"provider":{"anthropic":{"options":{"baseURL":"https://<anthropic-compatible-endpoint>/v1"}}}}'
  opencode run --model "anthropic/claude-fable-5" "reply with ok"
  ```

- 变量必须在实际执行 `opencode run` 的同一 PowerShell 会话中注入；公共 skill 只使用占位符。
- 参考 `references/opencode-provider-launch-templates.md`。

### 方案 D：使用 OpenCode 裸启动内部模型

- 适合让 OpenCode 使用自身配置和凭据选择默认内部模型
- 适合 OpenCode 无头委托、默认模型 smoke check 和用户已经给出完整 `opencode run` 命令的场景
- 这是 OpenCode 直启路径，不替代方案 B 的 Claude Code 独立编码代理路径

PowerShell 最小形态：

```powershell
opencode run --format json --variant max "只回答 OPENCODE_DEFAULT_MODEL_SMOKE_OK，不调用工具，完成后退出。"
```

执行要求：

1. 默认省略 `--model`，让 OpenCode 使用自身默认模型选择链；指定 provider/model 时回到方案 C。
2. `--format json` 只负责原始事件输出；`--variant max` 负责模型推理档位；`--auto` 只用于用户已明确授权且限定修改范围的无头任务，不用于提升模型能力。
3. 先运行 `opencode --help` 和最小 smoke check；只有出现具体原始失败，才根据错误调整模型、变体或配置。
4. 裸启动成功只证明 OpenCode 默认模型链路可用；真实任务仍需要主代理复核 JSONL、权限事件、输出文件、execution log 和验证命令。
5. 需要 provider/API key/baseURL 的场景属于方案 C，不要把 provider 配置写进本方案。
6. 如果需要机器可读模型列表、dry-run、scope 或 read-only 功能，必须先由当前 CLI `--help` 证明存在；不支持时使用外部预检和校验，不伪造参数。

完整 PowerShell 参考见 `references/opencode-headless-launch-templates.md`；可直接复用的脚本位于 `scripts/smoke-opencode.ps1` 和 `scripts/launch-opencode-headless.ps1`。

## 方案 B 的硬约束

只要选择方案 B，就必须同时满足以下要求：

0. **先确认是否其实是方案 C 或 D**
   - 用户给的是显式 provider 命令时，走方案 C；给的是裸 `opencode run`、默认模型 smoke check 或短任务时，走方案 D；这两类都不启动 Claude Code 子会话。
   - 只有任务需要独立编码代理读写文件、跑验证、写 execution log，才进入方案 B

1. **先写任务封包，再启动子会话**
   - 必须提供工作目录、分支、先读文件、读写 allowlist、预期 changed files、禁止事项、身份/权限、验证命令、产物和完成规则
   - 模板参见 `references/context-packet-template.md`；模板缺少本文件新增字段时，以本文件任务合同为更高优先级补齐

2. **默认使用标准启动参数**
   - `claude -p`
   - `--permission-mode bypassPermissions`
   - `--tools default`
   - `--output-format json`
   - `--append-system-prompt "<无人值守硬约束提示>"`
   - 模板参见 `references/claude-code-launch-templates.md`

3. **把系统提示当成硬模板，不是临场发挥**
   - 系统提示必须声明：这是独立编码代理、不要反问、先读文件再执行、必须验证、完成后退出
   - 系统提示同时声明执行者只能写 `agent_proposed_status`，不得写 `verifier_status` / `human_accepted`
   - 不要每次临时手写一段松散提示

4. **前端任务必须写浏览器验收要求**
   - 必须指定 URL、页面目标、关键交互、视觉对比点、日志格式
   - 模板参见 `references/frontend-browser-verification-template.md`

5. **必须给足执行预算和超时**
   - 不要用 2-5 分钟的短超时去跑一个本来就要 20 分钟的任务
   - 预算指引见下文，启动模板见 `references/claude-code-launch-templates.md`

6. **执行失败时必须走分流，不能盲补**
   - 预检失败
   - 启动失败
   - provider/auth 失败
   - 工具/权限失败
   - 执行失败
   - 产物验证失败
   - 浏览器验收失败
   - 同一任务最多重试一次，而且必须改变失败层或输入条件
   - 详见 `references/failure-routing.md`；本文件新增状态与重试规则优先

7. **子会话完成不等于任务完成**
   - 主代理还要重新读原始输出
   - 重新看改动和 changed-file 集合
   - 重新跑冻结的关键命令
   - 前端任务重新做验收或确认浏览器证据
   - 独立 verifier 通过后才可报告候选完成

## 方案 B 启动器复杂度红线

一次性 Claude Code 启动脚本只负责准备路径、调用命令、接收输出、返回退出码。出现以下任一迹象，必须暂停并回到 `references/claude-code-launch-templates.md`：

- 超过约 30 行可执行逻辑，或新增函数只是为了包装一次 `claude -p` 调用。
- 在 Claude 真正启动前扫描全机进程、解析父子进程、生成状态机或做复杂元数据审计。
- 用 `System.Diagnostics.ProcessStartInfo`、手工引号转义或异步管道替代 PowerShell/Bash 直接命令调用，且没有直接命令失败的原始证据。
- 把 `ANTHROPIC_MODEL` 当成通用必需变量；它只在用户明确指定模型时注入，不能成为普遍启动硬门禁。
- 启动器自己生成 `result.json` 表示 `BLOCKED`、`PARTIAL` 或 `DRY_RUN_PASS`；`result.json` 只接收子会话真实 stdout，派生状态写独立 verifier/summary 文件。
- 把 token 脱敏、cleanup、批量 kill、MCP 进程治理塞进 launcher；这些属于调用方环境、安全报告或专门的清理流程。
- 启动脚本、任务封包、系统提示、结果和日志没有放在同一个 `.use-other-model/task-YYYYMMDD-XXX` 目录闭包中。

只有同时满足以下三点，才允许突破这些红线：

1. 已经原样运行过标准模板。
2. 有可复现、带原始 stdout/stderr/退出码的具体失败。
3. 新增代码能写出“失败证据 -> 新增代码 -> 复测命令”的一一对应关系。

## 方案 B 标准流程

1. **向用户索要或确认模型配置**
   - 只索要必要的 provider 信息
   - 环境变量格式识别参见 `references/environment-variables.md`
   - 如果用户已经给出完整 OpenCode 命令，按是否包含 provider/model 分别回到方案 C 或 D，不要翻译成 Claude Code 子会话

2. **主代理先完成任务拆解**
   - 确认任务边界、可读/可写文件、预期 changed files、不可做事项、验收口径
   - 如果这些内容仍然模糊，不要启动外部代理

3. **写任务封包并完成预检**
   - 使用 `references/context-packet-template.md`，并按本文件任务合同补齐新增字段；将封包写入当前项目 `.use-other-model/task-YYYYMMDD-XXX/context-packet.md`。
   - 让子会话先读任务封包，而不是先读一大段 prompt；启动提示、结果和执行日志也必须写入同一任务目录。
   - 在模型调用前检查工作区、路径、身份、权限、工具范围、验收规则和预算；失败则 `PREFLIGHT_BLOCKED`。

4. **如果是前端任务，补浏览器验收模板**
   - 使用 `references/frontend-browser-verification-template.md`
   - 把 URL、视觉目标、交互步骤写清楚

5. **生成无人值守系统提示和标准启动命令**
   - 使用 `references/claude-code-launch-templates.md`
   - 默认使用 `--permission-mode bypassPermissions`
   - 默认使用 `--tools default`
   - 默认使用 `--output-format json`
   - 即使使用 `bypassPermissions`，write allowlist、预期 changed files 和独立 verifier 仍是硬边界

6. **启动独立 Claude Code 会话**
   - 子会话必须自己读文件、自己改代码、自己运行冻结的验证命令、自己写 `execution log`
   - 不要让子会话把结果写成模糊总结
   - 不要把启动层、provider 层、执行层、验证层、清理层塞进同一个 launcher

7. **主代理读取结果并做失败分流**
   - 先看原始 `stdout/stderr` 或 JSON 输出
   - 再看结构化工具错误、权限决策和 execution log
   - 再根据失败层决定是否允许唯一一次、且改变失败条件的重试；否则主代理接管

8. **主代理或独立 verifier 重新验证**
   - 比较实际 changed files 与 `expected_changed_files`
   - 检查禁区、秘密值、硬编码路径和危险动作
   - 重新运行冻结的关键命令
   - 前端任务重新确认浏览器结果
   - 只有 `VERIFIER_PASS` 才报告候选完成

## 默认预算与超时指引

### 任务级别

- **简单任务**:5 分钟以内
- **中等任务**:10-20 分钟
- **复杂任务**:20-45 分钟

### 方案 B 的默认时间预算

| 阶段       | 建议预算 |
| ---------- | -------- |
| 启动会话   | 2 分钟   |
| 编码执行   | 30 分钟  |
| 构建/测试  | 5 分钟   |
| 浏览器验收 | 5 分钟   |

### 预算与超时使用原则

1. **主代理的 shell/Bash 超时必须覆盖真实任务时长**
   - 复杂任务建议至少 15 分钟
   - 长任务建议按 30 分钟起配

2. **不要把 CLI 启动耗时和任务执行耗时混在一起**
   - 启动失败是启动问题
   - 执行超时是预算配置问题

3. **如果预计超过 45 分钟**
   - 说明任务已经过大
   - 先拆任务，再决定是否继续委托

4. **时间和 token 预算都属于任务合同**
   - 能获取真实 token 消耗时记录实际值；获取不到就记录 `unavailable`
   - 不因预算不足而放宽 write allowlist、关闭 verifier 或重复同参数重试

5. **同一失败最多重试一次**
   - 重试必须改变失败层或输入条件，例如先修正路径权限再重试模型调用
   - 相同命令、相同上下文、相同权限条件下连续轮询属于无效重试，主代理应接管

## 失败与回退规则

0. **预检失败**
   - 工作目录、路径可达性、身份、权限、验收规则或预算冲突时写 `PREFLIGHT_BLOCKED`
   - 不启动真实任务 prompt，不用模型 token 去发现可静态发现的问题

1. **启动失败**
   - 先跑 `claude --help`
   - 检查参数是否存在
   - 仅在方案 C 或其他显式 provider 路径中检查 provider 环境变量；方案 D 不以 provider 变量为启动门禁
   - 检查权限模式和工具模式
   - 如果是方案 C，先核对 provider 命令和当前 shell；如果是方案 D，先跑 `opencode --help` 和裸启动最小 smoke check；两者都不要改 Claude Code 启动器

2. **provider/auth 层失败**
   - 区分 `配置未注入`、`provider 拒绝认证`、`模型名不可用`、`宿主安全策略拒绝注入`
   - 聊天消息中的 `$env:` 赋值不等于当前 shell 已注入变量
   - 安全策略阻断写成 `BLOCKED_EXTERNAL_POLICY`，不要伪装成 CLI 或 provider 失败

3. **工具/权限层失败**
   - 即使进程退出码是 0，只要结构化事件出现权限拒绝、工具错误或范围外访问，任务就不是成功
   - 先修正工作目录、allowlist、permission/tool scope，再决定是否使用唯一一次重试

4. **执行失败**
   - 看原始 JSON/JSONL、stdout/stderr 和 execution log
   - 判断是编译、测试、运行、还是任务理解错误

5. **产物验证失败**
   - 预期文件缺失、changed files 超出集合、冻结验证命令失败或执行者修改验收规则时，写 `VERIFIER_FAIL`
   - 不允许执行者自行改 verifier 后重新宣布成功

6. **浏览器验收失败**
   - 记录具体视觉或交互问题
   - 再决定是否使用唯一一次、且改变失败条件的重试，或由主代理直接接管

7. **达到重试上限**
   - 停止继续使用外部模型
   - 主代理直接接管

详见 `references/failure-routing.md`；若参考文件仍使用旧的“两轮失败”表述，以本文件的“最多一次失败重试且必须改变失败层”规则为准。

## 成本收益分析

| 场景类型   | 直接执行 | 委托执行        | 节省比例 |
| ---------- | -------- | --------------- | -------- |
| 简单单文件 | 2,000    | 2,100           | -5% ❌   |
| 中等多文件 | 11,500   | 5,000 + 6,500   | ~51% ✅  |
| 复杂批量   | 40,000   | 10,000 + 30,000 | ~68% ✅  |

## 实际案例

批量 Git 提交案例参见 `references/case-study-git-commits.md`。

## 注意事项

### 安全性

1. **敏感信息保护**
   - 不要把 API 密钥直接写进用户可见 prompt
   - 用调用方 shell 环境变量承载敏感信息
   - 不把 API key、私有 provider URL 或认证 header 写入长期文件
   - 执行后及时清理含密钥的临时环境或文件

2. **输出验证**
   - 不要盲信子会话成功消息
   - 所有“完成”“通过”“已修复”都要有独立验证证据
   - 退出码 0、agent 自报 success、测试通过三者都不能单独替代完整证据链

3. **权限控制**
   - 方案 B 默认使用 `bypassPermissions`，因为目标就是无人值守执行
   - 即使使用 `bypassPermissions`，仍必须冻结读写范围、expected changed files 和验收规则
   - 涉及凭据、生产环境、CI、测试/评分规则、长期记忆的动作只能提出申请，不能由执行 agent 自行批准

### 用户体验

1. **透明说明**
   - 告诉用户为什么委托
   - 告诉用户预期收益和回退方式

2. **失败可解释**
   - 如果失败，明确说明失败层级
   - 不要用“模型不工作”这种笼统结论

3. **进度可追踪**
   - 子会话应写 execution log
   - 长任务要能看出进行到哪一步
   - 主代理报告时区分 `agent_proposed_status`、`verifier_status` 和人工接受状态

## 最小验收清单

- [ ] 工作区或跨目录路径不可达时，在模型调用前得到 `PREFLIGHT_BLOCKED`。
- [ ] 显式 provider/model 运行记录 provider、model、variant、session、工作目录和退出原因；拿不到某字段时明确记为 unavailable/unknown。
- [ ] 退出码 0 但出现权限拒绝、工具错误、预期产物缺失或验证失败时，不标成功。
- [ ] 实际 changed files 与 `expected_changed_files` 一致，且都在 `write_allowlist` 内。
- [ ] context、日志、结果和 diff 不出现 token 实值、认证 header 或用户目录隐私泄漏。
- [ ] 执行者没有写 `verifier_status`、评分或 `human_accepted`，也没有修改冻结验收规则。
- [ ] 重试最多一次且改变失败层；不存在相同命令连续空转。
- [ ] 原始 stdout/stderr/JSONL 可独立复核，派生摘要没有覆盖原始证据。
- [ ] 主代理亲自查看最终 diff，并完成与任务风险匹配的独立验证。

## 参考资料

### 技能内部参考文档

- **`references/method-a-mcp-tools.md`** - 方案 A 的详细实现
- **`references/method-b-independent-session.md`** - 方案 B 的执行契约和工作流
- **`references/claude-code-launch-templates.md`** - PowerShell / Bash 标准启动模板
- **`references/context-packet-template.md`** - 任务封包模板；若字段少于本文件任务合同，以本文件为准补齐
- **`references/frontend-browser-verification-template.md`** - 前端任务专用浏览器验收模板
- **`references/failure-routing.md`** - 启动失败/执行失败/浏览器失败/回退分流；状态与重试冲突时以本文件为准
- **`references/environment-variables.md`** - 环境变量识别与提取规则
- **`references/case-study-git-commits.md`** - 批量 Git 提交案例
- **`references/faq.md`** - 常见问题解答
- **`references/code-templates.md`** - 兼容保留的旧模板入口，优先级低于新模板
- **`references/opencode-provider-launch-templates.md`** - OpenCode 直连 provider 的占位符命令和 PowerShell 参考
- **`scripts/smoke-opencode-provider.ps1`** - 方案 C 的最小 provider smoke check 脚本
- **`references/technical-reports.md`** - 历史技术方案与 token 节省分析，按需渐进式加载

### 官方文档

- [Claude Code 官方文档](https://code.claude.com/docs)
- [MCP 服务器配置文档](https://modelcontextprotocol.io/)
- [MiniMax API 文档](https://www.minimaxi.com/document)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)

### 相关技能

- `git-commit`：高质量 git 提交技能
- `gemini`:Gemini 大上下文处理技能
