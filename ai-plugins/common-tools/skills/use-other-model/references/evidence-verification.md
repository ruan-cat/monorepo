# 状态机与独立验证

本文件承载 `use-other-model` 的状态所有权、六层证据链和进程外确定性验证规则。执行者的自报结果只能作为候选输入，不能替代 verifier。

## 1. 状态机

推荐状态流转：

`PENDING → PREFLIGHT_BLOCKED | RUNNING → AGENT_PROPOSED_SUCCESS / AGENT_PROPOSED_PARTIAL / AGENT_FAILED → VERIFIER_PASS / VERIFIER_FAIL → HUMAN_ACCEPTED`

### 状态所有权

- 执行 agent 只能写：
  - `agent_proposed_status`
  - `changed_files`
  - `commands_run`
  - `evidence`
  - `remaining_risks`
- `verifier_status` 只能由独立只读 reviewer、确定性校验进程或主代理生成。
- `human_accepted` 只表示用户/人工最终接受；模型不得自行写入或推断。

执行者同时修改实现和给自己写 `VERIFIER_PASS` 属于结构性无效验收。

弱执行模型返回的 `STATUS: SUCCESS` 只映射为 `AGENT_PROPOSED_SUCCESS`；返回 `STATUS: BLOCKED` 映射为阻断候选状态。弱模型没有任何 verifier 状态写权限。

## 2. 六层证据链

### CLI_START

记录：

- 实际 CLI
- 完整命令
- 工作目录
- 是否真实启动
- 退出码/退出原因

只能证明 CLI 启动层，不证明 provider、任务或产物成功。

### PROVIDER_AUTH

记录：

- provider
- model
- variant
- session
- 认证链路是否存在
- provider 返回的认证/模型错误

显式 provider 模式必须区分配置未注入、认证拒绝、模型名不可用和宿主安全策略阻断。

### TOOL_PERMISSION

记录：

- 工具调用
- 权限请求/拒绝
- 外部路径访问
- 自动加载 skill 的可观察结果
- 越界访问

即使退出码 0，只要出现权限拒绝或关键工具错误，也不能标成功。

### TASK_EXECUTION

核对：

- 模型是否真正执行约定动作
- 是否只生成“完成”文本
- 是否运行冻结命令
- 是否生成预期中间产物

弱模型任务额外核对：是否只执行 Weak Executor Packet 的 `EXACT_ACTIONS`，是否在命中 `STOP_IF` 后立即停止。

### ARTIFACT_VERIFY

由独立 verifier 执行：

- changed-file 精确集合
- write allowlist
- forbidden paths
- secret/dangerous action 扫描
- expected artifacts
- 冻结验证命令
- 版本/术语/多文件一致性等任务特定检查

只有这里 `VERIFIER_PASS`，主代理才可以报告“候选完成”。

### CLEANUP

检查：

- 秘密值和临时凭据是否清理
- 原始证据是否按策略保留
- 临时文件是否越界或泄漏
- cleanup 是否误删审计证据

CLEANUP 风险必须独立披露，不能被前五层 success 掩盖。

## 3. 进程外确定性验证

### 3.1 Changed-file 精确集合

比较：

`actual_changed_files == expected_changed_files`

并确保所有实际文件都位于 `write_allowlist`。

额外文件默认立即 `VERIFIER_FAIL`；不要因为它位于一个宽泛可写目录就忽略。

### 3.2 禁区与路径污染

按任务收窄扫描：

- forbidden paths
- 本机绝对路径
- 用户目录
- 兄弟工作区越界引用
- 任务声明的禁用词
- 开发期临时路径

命中后逐项判断，不可静默忽略。

### 3.3 秘密值与危险动作

检查 context、prompt、日志、result、diff：

- API key/token 实值
- Authorization header
- 私有凭据
- 未授权安装依赖
- commit/push
- 发布/部署
- 数据库迁移
- 生产运维
- 长期记忆写入

只记录环境变量名，不复制秘密值。

### 3.4 验收规则完整性

默认禁止执行者修改：

- test
- evaluation
- score
- verifier
- CI
- acceptance schema

若这些文件是任务目标，主代理必须在启动前显式授权，并使用独立于该修改的验证路径。

### 3.5 多证据一致性

至少同时核对：

1. 进程退出码/退出原因
2. 结构化事件中的工具错误和权限决策
3. 预期产物
4. 冻结验证命令

任一关键证据冲突都不能标成功。

典型反例：

- exit code = 0，但有 permission denied → fail/blocked
- agent 说 success，但 expected artifact 缺失 → fail
- tests passed，但 changed files 多出范围外文件 → fail
- result.json 说 complete，但原始 stdout 表明子进程没启动 → fail

### 3.6 原始证据保真

- stdout/stderr/JSONL 原样保存。
- 摘要单独生成。
- wrapper 不得重写或“美化”原始输出。
- wrapper 不得用自己生成的 `result.json` 伪造子进程状态。
- 重试不得覆盖上一轮证据。

### 3.7 声明一致性

任务若涉及以下内容，增加对应扫描：

- 版本升级 → 版本一致性
- 文档术语替换 → 禁用旧术语
- 多文件同步 → 遗漏文件扫描
- 路径迁移 → 旧路径残留扫描
- 安全整改 → 敏感模式扫描

不能只根据执行者“已经全部修改”的文本判断。

## 4. Reviewer 规则

复杂文档、多文件或高风险任务应增加独立只读 reviewer。

Reviewer：

- 在工作树冻结后启动。
- 读取最终 diff、必要配置、原始证据。
- 只报告 findings 和验证状态。
- 不修改实现。
- 不把执行者结论当作证据。

主代理保留最终复核责任。

### 4.1 弱执行模型专项验证

当 execution model tier 为 weak 时，verifier 还必须检查：

1. **编译门成立**：任务满足 `weak-executor-contract.md` 的适用门槛；如果实际上需要架构/根因/安全/产品判断，直接判定路由错误。
2. **Packet 形态**：执行者实际收到 `ROLE: EXECUTION_ONLY`、`DECISION_BUDGET: 0`、`READ`、`WRITE`、`EXACT_ACTIONS`、`DO_NOT`、`VERIFY`、`STOP_IF`、`RETURN`。
3. **Reference 隔离**：除非某个 reference 是任务目标或被主代理明确列入 READ，否则弱模型没有自行加载 `SKILL.md` / references 来补流程。
4. **无自主选路**：执行者没有自行选择 A-D、provider/model、工具、依赖、实现方案或失败恢复。
5. **STOP 行为**：如果原始证据命中 STOP_IF，执行者没有继续扩大操作；应返回 `BLOCKED`。
6. **动作闭包**：commands/actions 都可以映射到 `EXACT_ACTIONS` 或 `VERIFY`；出现未授权动作即 `VERIFIER_FAIL`。
7. **返回格式**：弱模型只返回固定 schema；不能把“解释性成功声明”代替 changed files、commands 和 evidence。

弱模型的价值来自减少自由度。如果 verifier 发现主代理实际上把开放式目标直接交给了弱模型，应判定为**任务编译失败**，而不是把责任归到执行者“理解能力不足”。

## 5. 完成声明

向用户报告时区分：

- `agent_proposed_status`
- `verifier_status`
- cleanup 风险
- human acceptance 是否已发生

推荐措辞：

- verifier 通过但用户尚未接受：`候选完成，已通过独立验证`
- verifier 失败：明确失败层和证据
- cleanup 有风险：即使 artifact pass 也单独列出

不要把 `AGENT_PROPOSED_SUCCESS` 直接翻译成“任务完成”。

## 6. 最小验收

- [ ] preflight 已完成；不可达路径没有消耗真实任务 token。
- [ ] provider/model/variant/session 能获取的字段已记录；未知字段没有猜测。
- [ ] exit code 0 与权限/工具/产物/验证证据不存在冲突。
- [ ] changed files 精确匹配 expected set。
- [ ] 没有 token、认证 header 或私有路径泄漏。
- [ ] 执行者没有写 verifier/human 状态，也没有篡改验收规则。
- [ ] 原始输出与派生摘要分离。
- [ ] 重试最多一次且改变失败条件。
- [ ] weak execution 已验证 decision_budget、EXACT_ACTIONS、STOP_IF、reference 隔离和无自主恢复。
- [ ] 主代理亲自检查最终 diff 和关键验证结果。
