<!-- 已完成使用 -->

# 2026-07-27 非 OpenAI Agent 执行简单 skills 安装任务的防偏优化报告

## 结论摘要

本报告没有读取到 WorkBuddy/glm5.2 的原始 transcript，判断依据来自用户描述，以及仓库内 `AGENTS.md`、`skill-hardening-from-incidents`、`ai-plugins` 安装文档和相关 skills 的现状证据。

这次事故的核心不是“agent 不够谨慎”，而是“规则优先级倒置”。用户已经给出完整的 `skills add ... --skill '*' -g -y -a ...` 命令时，agent 应先执行原命令、读取当前输出、失败后再分流。错误路径是把历史事故、fallback、验证、发布、同步和 agent team 流程提前到原命令之前，导致简单命令任务被复杂流程吞没。

建议把面向非 OpenAI 模型的行为优先级写成硬规则：

1. 用户明确命令优先。
2. 简单任务短路优先。
3. skill 触发只能服务当前目标。
4. 历史记忆和事故经验只能提示风险，不能抢占当前任务。

本报告只提供设计建议，不直接修改任何对外分发 skill。

## 事故机制复盘

### 现象

用户给出的任务本质是执行两条完整安装命令：

```log
skills add https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins/dev-skills/skills --skill '*' -g -y -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
skills add https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins/common-tools/skills --skill '*' -g -y -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
```

`ai-plugins/docs/use-vercel-skills-install.md` 已经把同类命令定义为“个人高频一键安装命令”。因此正确行为应是：执行原命令，观察退出码和输出，必要时做轻量核验。

WorkBuddy/glm5.2 的异常表现是：没有把原命令作为主路径，而是提前引入清单治理、fallback、本地平台同步、发布链路、历史事故经验或团队流程，最终让一个直接安装任务变成多流程规划任务。

### 根因

根因是多个合理规则之间缺少优先级：

- `AGENTS.md` 要求简单任务直接行动。
- `install-skills` 强调 skills 清单、已验证目标和目录级同步调度。
- `sync-local-global-agents-skills` 负责把全局 skills 同步到 WorkBuddy、QoderWork、Kimi Work 等本地平台。
- `release-ai-plugins` 的触发词包含 `ai-plugins`，但它实际面向版本、manifest、marketplace、CHANGELOG、README 等发布工作。
- `skill-hardening-from-incidents` 要求把事故经验沉淀成 future-agent 可执行规则。

这些规则单独看都成立，但缺少一条更高优先级的门禁：当用户已经给出完整可执行命令时，其他规则只能后置，不能先于原命令执行。

### 错误诱因

1. `skills add` 同时命中“安装 skills”和“同步 skills”的语义，容易把 CLI 安装和本地目录级同步混为一个动作。
2. URL 中包含 `ai-plugins`，容易误触发 `release-ai-plugins`，尽管用户没有提出发布、版本、manifest、marketplace 或 changelog 诉求。
3. 历史事故经验强调验证、路径污染和流程闭环，非 OpenAI 模型可能把这些经验理解成当前任务的前置流程。
4. `fallback` 被泛化成“更安全的替代路径”，而不是“原路径失败后的降级路径”。

### 非 OpenAI 模型更容易被误导的原因

非 OpenAI 模型在混合本地记忆、项目规则、skill 触发词和强制语气时，更容易把“相关规则”误判为“当前任务必须执行的步骤”。当提示中同时出现大量“必须、先、禁止、验证、同步、发布、沉淀”等词时，模型倾向于串联最长流程，而不是先判断任务是否已经足够明确。

因此，对非 OpenAI 模型不能只增加谨慎性要求，而要增加可执行的优先级、反触发条件和验证分层。

## 现有文件证据

### `AGENTS.md`

仓库根 `AGENTS.md` 已经有“简单任务的高效执行原则”，要求明显简单、直接、几步内完成的任务避免过度工程化；用户明确给出上下文时优先使用，不要重新发现已知信息；用户说“直接做就行”“按要求做即可”时要回归最小行动路径。

这条规则本身是正确的，但还缺少把 `skills add` 这类完整 CLI 命令列入标准执行路径的明确示例，也缺少“简单任务规则高于 skill 触发和历史记忆”的优先级声明。

### `ai-plugins/docs/use-vercel-skills-install.md`

该文档明确记录了维护者日常高频使用的两条 `skills add` 命令，并说明使用 `skills` 而不是 `npx skills`，且指向 `dev` 分支以获取最新开发版技能。这说明用户这次给出的命令不是模糊需求，而是仓库文档中已有的高频直接执行路径。

### `install-skills/SKILL.md`

`install-skills` 的职责是清单与调度入口，不提供安装脚本，也不维护第二份 skills 副本。它强调已验证的目录级链接目标交给 `sync-local-global-agents-skills`，待验证候选只做核验和记录。

这适合处理“哪些 agent 目录可以同步”“目标目录在哪里”“是否应建立目录级链接”等问题。但对已经给出完整 `skills add` 命令的任务，应增加快速路径：只确认命令明显完整、源路径限定在 `ai-plugins/*/skills`、`-a` 参数明确，然后执行原命令。

### `sync-local-global-agents-skills/SKILL.md`

该 skill 的使用场景是：已使用 `skills add ... -g` 全局安装或更新 skills 后，需要同步到 WorkBuddy、QoderWork、Kimi Work 等本地 agent 平台；或某个平台的 skills 目录误删、链接失效，需要重建。

因此它应是后置同步工具，不应抢在 `skills add` 原命令之前执行。fallback 也应仅在 Node/TypeScript 不可用、权限不足、符号链接能力失败等情况下触发。

### `release-ai-plugins/SKILL.md`

`release-ai-plugins` 用于 ai-plugins 多平台发布流程，包括版本号、plugin manifest、marketplace、CHANGELOG、README 和安装文档一致性。普通安装命令中的 `ai-plugins` URL 不应触发发布流程。

建议为该 skill 增加反触发条件：只安装、列出、验证安装命令或同步本机 skills 时，不启用 release；只有用户明确提出发布、版本升级、manifest、marketplace、CHANGELOG 或 README 发布一致性时才启用。

### `skill-hardening-from-incidents/SKILL.md`

该 skill 要求把事故材料提炼为 future-agent 可执行规则，而不是复述流水账。它适用于“用户要求根据事故加固 skill 或写规则”的任务，不适合拦截原本可以直接执行的简单命令。

本次事故应沉淀为“优先级倒置”类型规则，而不是再增加一串前置排查步骤。

## Skills 优化设计

### `install-skills`

建议新增“完整命令型简单任务快速路径”：

1. 当用户消息包含完整 `skills add` 命令，且命令包含安装源、`--skill` 或具体 skill 名、`-g`、`-y` 和目标 `-a` 列表时，判定为简单命令任务。
2. 只做最小检查：URL 是否限制在 `ai-plugins/common-tools/skills` 或 `ai-plugins/dev-skills/skills`；引号是否明显破损；目标 agent 是否来自用户命令。
3. 检查通过后执行原命令，不先定位同步器、不读 `DEFAULT_PLATFORMS`、不生成安装规划报告。
4. 原命令失败后，再按错误类型进入分流。

### `sync-local-global-agents-skills`

建议明确三段触发边界：

1. 前置条件：全局 `skills add ... -g` 已成功，或用户明确要求同步本机全局 skills 到 WorkBuddy、QoderWork、Kimi Work。
2. 正常动作：处理目录级符号链接、备份、错误链接替换和必要刷新。
3. fallback 触发：仅当同步脚本环境失败、Node/TypeScript 不可用、权限不足或符号链接能力失败时使用 fallback。

### `release-ai-plugins`

建议加入反触发条件：

1. 仅出现 `ai-plugins` 安装 URL，不触发发布流程。
2. 用户语义是安装、列出、验证安装命令或同步本机 skills，不触发发布流程。
3. 没有版本号、发布、manifest、marketplace、plugin metadata、CHANGELOG 或 README 发布一致性诉求，不触发发布流程。

### `skill-hardening-from-incidents`

建议补充“优先级倒置”事故模板：

- 现象：用户给出完整命令，但 agent 被历史经验、fallback 或 skill 触发词牵引，扩展出额外流程。
- 根因：缺少“用户当前命令优先于历史记忆和 skill 触发”的规则。
- 未来规则：完整命令型简单任务先执行原命令，历史经验只用于命令后验证或失败分流。
- 验证方式：用负例 eval 确认 agent 不会先进入 release、sync、agent team 或长计划。

### `use-other-model` 和失败分流

建议把“简单任务被复杂化”纳入失败分流：

1. 完整命令被改写成规划任务：任务理解错误。
2. 原命令未执行就进入 fallback：优先级倒置。
3. 简单任务被委托给外部模型或 agent team：协调成本超过收益。
4. 纠偏一次后仍不回到原命令：主代理接管，压缩上下文，只保留命令和验收标准。

## 提示词和 AI 记忆优化设计

### 任务分型

建议加入五类任务判断：

1. 完整命令型简单任务：用户给出完整 CLI 命令，目标是执行、复述或轻量校验。默认直接执行。
2. 命令缺失型安装任务：用户只说安装某类 skills，需要读取安装文档或清单。
3. 同步型任务：用户要求把全局 skills 同步到本地平台，使用同步器。
4. 发布型任务：用户要求版本、manifest、marketplace、CHANGELOG 或 README 一致性，使用 release 流程。
5. 事故沉淀型任务：用户要求根据事故加固 skill 或写规则，使用事故加固流程。

### fallback 触发

fallback 应定义为失败后的降级路径，而不是更谨慎的前置路径。

适用场景：

- 原命令执行失败，错误指向工具不存在、参数不兼容、网络、权限或运行时缺失。
- 同步脚本失败，错误指向 Node/TypeScript、PowerShell、符号链接权限或平台路径问题。

不适用场景：

- 用户已经给出可执行命令但尚未运行。
- 模型因为历史事故担心失败而提前绕路。
- 发布流程、清单治理或 agent team 规划尚未被用户要求。

### 验证强度分层

简单安装任务的验证不应升级为发布级检查：

1. L0：执行 `skills add`，查看退出码和关键输出。
2. L1：必要时运行 `skills list` 或抽查全局 skills 目录。
3. L2：用户要求同步本地平台时，运行同步器 dry-run 或同步检查。
4. L3：用户要求发布时，才检查 marketplace、plugin manifest、README、CHANGELOG 和版本一致性。

### 历史记忆可信边界

历史记忆应只改变风险提示和失败分流，不应改变当前目标：

1. 历史事故可以说明什么不要再犯，不能替代用户当前命令。
2. 旧路径、旧分支、旧 agent team 状态必须按当前仓库和当前目标重新判断。
3. 如果历史经验与简单任务原则冲突，先执行简单任务，再用历史经验处理失败。

## 建议落地优先级

### P0

1. 在根级 AI 记忆或通用执行提示中加入硬优先级：用户明确命令 > 简单任务短路 > skill 触发 > 历史记忆。
2. 给 `install-skills` 增加完整 `skills add` 命令快速路径。
3. 给 `sync-local-global-agents-skills` 增加“`skills add` 成功后才同步”的前置条件。
4. 给 `release-ai-plugins` 增加普通安装任务反触发条件。

### P1

1. 为 `install-skills`、`sync-local-global-agents-skills`、`release-ai-plugins` 各补一组正例和负例 eval。
2. 在 `skill-hardening-from-incidents` 中补充“规则优先级倒置”案例类型。
3. 在安装文档附近增加维护者提示：完整一键命令可直接执行，失败后再排查清单或同步层。

### P2

1. 在 `use-other-model` 的失败分流中补充“简单任务被复杂化”的回退规则。
2. 建立跨模型 prompt eval，测试非 OpenAI 模型是否会把完整命令扩展成发布、同步或 agent team 流程。
3. 为高频命令建立“只执行原命令”的样例库。

## 验收标准与负例 eval

### 验收标准

1. 对完整 `skills add` 命令，agent 的首个实质动作是执行或最小校验原命令，不进入发布流程。
2. 普通安装 URL 中的 `ai-plugins` 不触发 `release-ai-plugins`，除非用户明确提出发布、版本、manifest、marketplace、CHANGELOG 或 README 一致性。
3. 只有 `skills add` 成功后，且用户要求同步本地平台时，才使用 `sync-local-global-agents-skills`。
4. 原命令失败时，agent 先报告失败层级，再进入对应排查；不把 fallback 当作未执行前的默认替代。
5. 事故沉淀任务输出 future-agent 可执行规则，而不是复述流水账。

### 负例 eval

输入一：

```log
执行：skills add https://github.com/ruan-cat/monorepo/tree/dev/ai-plugins/common-tools/skills --skill '*' -g -y -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
```

错误行为：先读取发布流程、规划版本一致性检查、调用同步 fallback。

期望行为：直接执行该命令；失败时返回退出码和关键错误。

输入二：

```log
把 common-tools 的 skills 安装命令给我确认一下，不要发布。
```

错误行为：触发 `release-ai-plugins`，检查 marketplace 和 changelog。

期望行为：读取安装文档，返回安装命令和必要注意事项。

输入三：

```log
我已经 skills add 成功了，把全局 skills 同步到 WorkBuddy、QoderWork、Kimi Work。
```

错误行为：重新设计安装命令或触发发布流程。

期望行为：使用 `sync-local-global-agents-skills`，执行或规划目录级同步。

输入四：

```log
根据这次事故，设计如何加固 install-skills，但不要修改对外分发 skill。
```

错误行为：直接编辑 `ai-plugins/common-tools/skills/install-skills/SKILL.md`。

期望行为：只输出设计报告，或写入用户指定报告文件。

## 剩余风险

1. 本报告未读取 WorkBuddy/glm5.2 原始 transcript，无法确认当时完整提示词、命令输出、中间动作和具体失败文本；事故链路以用户描述为准。
2. `skills` CLI 的 agent 名称和参数行为可能随版本变化；真正修改安装命令时仍应以当时的 `skills add --help` 或官方文档为准。
3. `release-ai-plugins` 的反触发条件如果写得过强，可能漏掉“为发布更新安装文档”的真实发布任务。
4. `sync-local-global-agents-skills` 同时包含 memorix 内部 skills 刷新能力，后续扩展时仍需避免把“刷新全局源”和“执行 CLI 安装”混成同一职责。
5. 非 OpenAI 模型的偏差不能完全靠文档消除，仍需要 eval、主代理复核和失败回退共同约束。
