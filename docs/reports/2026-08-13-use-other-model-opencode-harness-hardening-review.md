<!-- TODO: 等待使用 -->

# 2026-08-13 use-other-model 技能升级改造与 OpenCode Harness 边界评估

> 报告工具：Codex 主代理、PowerShell、OpenCode 委托运行器
>
> AI 模型：GPT-5.6（主代理）与 OpenCode `opencode-go/gpt-5.6-luna`
>
> 报告性质：为后续独立 agent 升级 `use-other-model` 技能提供设计输入；本报告不直接修改该技能。

## 1. 结论先行

`use-other-model` 值得继续升级，但升级方向不是继续堆叠更多启动脚本、清理脚本和模型分支，而是收缩职责、强化证据闭环。它应该成为一个“委托路由器 + 轻量证据 harness”，不应该演变成万能进程管理器、自动验收器或替主代理拍板的自治系统。

建议后续改造聚焦四件事：

1. 把 Claude、OpenCode provider 模式、OpenCode 内置模型模式拆成清晰的能力合同，避免“能启动”被误认为“能完成”。
2. 在模型消耗 token 之前完成工作区、路径、模型、权限和工具范围预检。
3. 把执行者自报状态、独立验证状态和人类最终接受状态彻底分离。
4. 让 harness 在进程外做确定性校验，把提示词限制在角色、范围、禁区和验收输出，不把所有治理逻辑塞进 prompt。

这次实践已经证明：Luna 能显著降低主代理的探索成本，但它的结果只能作为候选交付。没有主代理的差异检查和独立验证，委托结果不具备发布资格。

## 2. 本次实践的事实证据

本次委托目标是更新 WorkBuddy 仓库中 `init-prettier-git-hooks` 的过时指导文档。执行过程有一个失败的只读调研回合和一个成功的编辑回合，形成了很适合加固技能的对照样本。

### 2.1 退出码为 0，不等于任务完成

第一次 Luna 运行返回退出码 0，但 OpenCode 对上下文中跨工作区的 `D:\code\ruan-cat\monorepo` 路径执行了权限拒绝，调研没有完整闭环。若只读取进程退出码，会把“部分启动成功、任务实际受阻”误报为成功。

因此，结果判断至少要同时检查：进程退出码、结构化事件中的工具错误、权限决策、是否生成预期产物，以及产物是否满足验收命令。

### 2.2 跨工作区路径必须在启动前失败快返

目标目录位于 `D:\store\WorkBuddy\2026-6-30-common\2026-8-10-do-init-prettier-git-hooks`，而初始上下文包引用了另一个工作区的文件。OpenCode 将其识别为外部目录并自动拒绝。修正上下文包、去掉不可达路径后，第二次调研才得到有效结果。

这不是模型能力问题，而是 harness 没有在启动前验证“工作目录、允许读取路径、实际可达路径”三者一致。路径范围应成为任务合同的一等字段，而不是写在自然语言里的软约定。

### 2.3 模型可发现，不等于模型已选定且按预期工作

通过 `opencode models` 发现了两个 Luna 条目：`opencode-go/gpt-5.6-luna` 与 `github-copilot/gpt-5.6-luna`。真正运行时明确指定了 provider/model，才知道使用的是哪条认证和路由链路。

后续技能不能只写“使用 Luna”或“使用 OpenCode”，而应记录完整的 provider、model、variant、session、工作目录和命令行。默认模型、provider 模型和裸内部模型是三种不同的证据等级。

### 2.4 委托编辑仍然需要主代理复核

Luna 的编辑回合声称已通过 `git diff --check`，且只修改了目标五份 Markdown 文档。但主代理复核时仍发现：动态 lint-staged 文档继续推荐对象形式插件并强制 `@commitlint/cli`，三个 prompts/index 文件仍有 v2 表述，模板中还残留硬编码本机路径。

这些遗漏不是偶发拼写问题，而是“执行者同时担任验收者”的结构性缺陷。后续 harness 至少应自动执行变更文件白名单、禁用词扫描、路径污染扫描和版本一致性扫描；复杂文档修改还应增加独立只读 reviewer。

### 2.5 过度封装会吞掉真实证据

历史上的 launcher RCA 已经暴露过类似风险：为了统一 provider、超时、进程树和清理逻辑，包装器很容易吞掉真实 stdout，或者用包装器生成的 `result.json` 掩盖子进程没有实际执行。更稳妥的顺序是先调用官方、最小、可观察的命令，再在外层补充元数据和校验；不要让 launcher 重新发明一套执行协议。

## 3. `use-other-model` 应负责什么

建议保留以下边界内能力：

- 创建任务目录和最小上下文包，记录任务意图、允许范围、禁区、验收命令。
- 在启动前检查工作目录、路径可达性、模型标识、认证存在性和工具权限模式。
- 选择委托路径，并执行一次低成本 smoke check。
- 捕获原始 stdout、stderr、结构化事件、session 标识、模型信息和产物清单。
- 输出分层状态：启动、认证、权限、任务执行、产物验证、清理。
- 对主代理提供候选结果、变更清单和剩余风险，不替主代理作最终接受决定。

## 4. `use-other-model` 不应越界做什么

以下能力应明确排除，或拆到独立技能：

- 不做通用进程编排器，不负责复杂的 ProcessStartInfo、进程树清理和后台服务托管。
- 不做 secrets manager，不在上下文包、日志或结果文件中复制 token；只允许引用已存在的环境变量名。
- 不做测试、评测、评分和 verifier 的修改者。执行 agent 不能改验收规则来让自己通过。
- 不自动 commit、push、发版、部署、写长期记忆或修改任务状态；这些动作必须由主代理或独立授权流程完成。
- 不默认读取兄弟工作区、全盘文件或用户未列入范围的报告；跨目录访问必须显式列入允许清单。
- 不把浏览器控制、数据库迁移、生产运维等高风险动作伪装成普通“委托任务”。这些场景应有专门的审批和技能边界。
- 不把 `--auto` 当成默认开关。它只适合用户明确授权、范围可枚举、可回滚的写入任务；只读调研优先使用无需自动批准的模式。

一句话边界：`use-other-model` 可以把任务可靠地交出去，但不能把责任也交出去。

## 5. 希望 OpenCode 补齐的工具调用

### 5.1 机器可读的模型与 provider 预检

需要 `opencode models --json` 一类稳定输出，明确列出 provider、model、variant、认证状态和可用性。当前依赖文本筛选容易把“同名不同 provider”混在一起。

### 5.2 任务启动前的 dry-run 与范围审计

建议支持 `--dry-run`、`--scope`、`--read-only`，在模型调用前返回：工作目录、允许读取路径、允许写入路径、禁止路径、工具 allowlist、权限决策模式和预计会被拒绝的路径。路径不一致时应 fail-fast，而不是消耗一轮模型 token 后才报错。

### 5.3 完整的结构化事件

`--format json` 应稳定提供 session、provider、model、variant、工作目录、每次工具调用、权限请求、工具错误、`step_finish.reason`、退出原因和最终 stdout/stderr 引用。不能只给一条“完成”文本。

### 5.4 工具和技能的显式 allowlist

需要允许调用方指定工具白名单、禁用自动加载技能，或至少列出本次运行自动加载了哪些 skill。此次 Luna 曾自行加载 `using-superpowers`，说明“委托一个文档任务”可能意外扩展为更重的工作流，带来额外 token 和行为漂移。

### 5.5 结构化任务合同与独立验证模式

建议支持任务合同输入和结果 schema 输出，例如只允许 agent 写入 `agent_proposed_status`、`changed_files`、`evidence`、`remaining_risks`；`verifier_status` 必须由另一个只读进程或主代理生成。OpenCode 还应提供独立 reviewer 模式，默认禁止写文件。

### 5.6 可恢复 session 与原始证据保真

需要可复用的 `--session` 和上下文包 hash，避免重试时重复拼接上下文。launcher 只能旁路记录，不得重写或“美化”子进程 stdout/stderr；原始证据和派生摘要必须分开保存。

## 6. 轻量 Harness 提示词约束

提示词只保留固定的六块，不要把整本技能文档复制进去：

```text
ROLE: 你是只对本次委托负责的执行者/审阅者。
SCOPE: 工作目录为 <root>；仅允许读取/写入 <allowlist>。
READ: 先读取 context-packet，再读取清单内文件；禁止猜测未提供的上下文。
FORBIDDEN: 禁止访问范围外路径、安装依赖、修改测试/评测/评分/verifier/CI、git commit/push、写长期记忆和伪造完成状态。
ACCEPTANCE: 仅执行 <verify_commands>，把命令与原始输出摘要写入 evidence。
STATUS: 只能写 agent_proposed_status；不得写 verifier_status 或 human_accepted。
OUTPUT: 返回 changed_files、commands_run、evidence、remaining_risks；没有证据就标记 partial 或 blocked。
```

这段提示词只能约束模型行为，不能替代进程外的硬校验。Harness 还必须执行：

- 允许路径与实际 changed files 的集合比较；
- 禁用路径、硬编码本机路径、秘密值和危险命令扫描；
- 退出码、结构化事件和预期产物三路一致性检查；
- `agent_proposed_status` 与 verifier 结果分离；
- 失败重试最多一次，且必须改变失败层（例如先修正权限范围，再重试模型调用），禁止同参数原地轮询。

对于涉及凭据、生产环境、CI、测试规则、长期记忆的任务，提示词只能提出申请，不能自行批准。审批应在 harness 或主代理侧完成并留下证据。

## 7. 建议的状态机与验收链

推荐状态流转：

`PENDING → PREFLIGHT_BLOCKED | RUNNING → AGENT_PROPOSED_SUCCESS / AGENT_PROPOSED_PARTIAL / AGENT_FAILED → VERIFIER_PASS / VERIFIER_FAIL → HUMAN_ACCEPTED`

每次运行同时记录六个层级：

1. `CLI_START`：命令是否真实启动。
2. `PROVIDER_AUTH`：provider、认证和模型是否可用。
3. `TOOL_PERMISSION`：工具调用和目录权限是否通过。
4. `TASK_EXECUTION`：模型是否完成约定动作。
5. `ARTIFACT_VERIFY`：变更、扫描、测试或文档检查是否通过。
6. `CLEANUP`：临时证据是否按保留策略处理，是否泄露秘密。

只有第 5 层由独立验证通过，才可以向用户报告“候选完成”；第 6 层未完成时，应明确报告清理风险，而不是吞掉问题。

## 8. 给后续独立 agent 的升级顺序

1. **M1：收缩技能合同。** 删除重复 launcher 方案，统一任务包 schema，明确 B/C/D 三条路径和能力差异。
2. **M2：补齐 OpenCode 预检。** 固化 model/provider、路径、权限、工具范围和 session 元数据。
3. **M3：外置确定性验收。** 增加 changed-file 白名单、禁用词扫描、路径污染扫描、stdout 保真和 JSON schema 校验。
4. **M4：补失败夹具。** 至少覆盖“退出码 0 但权限拒绝”“模型同名不同 provider”“上下文跨工作区”“执行者漏改文件”“结果文件丢 stdout”。
5. **M5：控制成本与行为漂移。** 支持 token/time budget、禁止自动加载无关 skill、限制重试次数，并记录实际消耗。

不建议第一阶段就做完整 agent team、自动发布或复杂守护进程。先把失败分层、证据保真和独立验收做实，收益最大、回滚最容易。

## 9. 最小验收清单

- 跨工作区路径不可达时，在模型调用前返回 `PREFLIGHT_BLOCKED`。
- 显式 Luna 运行结果包含 provider、model、variant、session、工作目录和退出原因。
- 退出码为 0 但出现权限拒绝时，不能被标为成功。
- changed files 必须严格等于 allowlist，额外文件立即 verifier fail。
- context、日志和结果中不能出现 token 实值或用户目录隐私。
- 执行者无法写入 `verifier_status`、评分和完成结论。
- 重试必须更换失败层，不得相同命令连续空转。
- 原始 stdout/stderr 可独立复核，派生摘要不能覆盖原始证据。

## 10. 最终判断

这项技能的下一版应该更小、更硬、更可审计：把“帮我调用另一个模型”收敛成可验证的委托协议，而不是继续扩张成第二套 agent 平台。OpenCode 需要补的是可观察性、预检和结构化事件；harness 需要守的是范围、状态和证据；主代理需要保留的是最终责任。

> [PUA 生效 🔥] 这次真正拿到的不是“Luna 改了五个文件”，而是“Luna 的候选结果经过路径审计、差异复核和禁用项扫描后才具备交付资格”。没有这条证据链，所谓多模型协作只是把风险换了个名字。
