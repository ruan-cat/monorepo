# 委托合同与 Preflight

本文件承载 `use-other-model` 的详细任务合同、A-D 能力合同、模型身份规则、preflight 和轻量 prompt 约束。正常调用先读 `SKILL.md`；只有准备真实委托时再加载本文件。

## 1. 最小任务合同

委托前由主代理冻结至少以下字段：

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
```

仅 Git 提交类委托按需追加：

```yaml
git_commit_plan:
  exclude:
    - <explicitly-excluded-worktree-change>
  groups:
    - type: <type>
      scope: <scope>
      emoji: <emoji>
      files:
        - <path>
      summary: <summary>
  identity_check: <client-model-trailer-result>
```

### 范围语义

- `read_allowlist`：执行者能读取的边界。
- `write_allowlist`：绝对不能越过的写边界。
- `expected_changed_files`：本次真正预期变化的精确集合。
- `forbidden_paths`：即使位于更宽工作区内也禁止访问的路径。
- 实际 changed files 默认必须与 `expected_changed_files` 一致；不能用宽泛 `write_allowlist` 掩盖额外改动。

## 2. A-D 能力合同

| 路径 | 必须记录 | 能证明 | 不能证明 |
| --- | --- | --- | --- |
| A：MCP | connector/tool、实际参数、结果 | 指定 MCP 工具真实返回结果 | 外部 CLI/provider/model 可用 |
| B：Claude Code | 实际 `claude` 命令、工作目录、permission/tools、显式模型（若有）、原始输出、退出码 | 会话真实启动并执行了记录中的动作 | 子会话自报成功等于任务通过 |
| C：OpenCode provider | provider/model、variant、session、工作目录、认证链路存在性、实际命令、原始事件、退出原因 | 指定 provider/model 链路按记录身份运行 | 同名模型的其他 provider 也可用；退出码 0 等于任务成功 |
| D：OpenCode 默认模型 | 默认模型选择链、variant/session、工作目录、结构化事件暴露出的实际 provider/model（若有） | 默认链路真实启动；事件明确时可记录实际身份 | 省略 `--model` 时凭昵称猜 provider；模型可发现等于已选中 |

### 模型身份规则

1. 同名模型可以来自不同 provider；只写 “Luna”“Claude”“GPT” 不构成需要区分 provider 时的完整身份。
2. 显式 provider 路径记录完整 `provider/model`。
3. 默认模型路径记录 `default`，并补充本次结构化事件实际暴露的 provider/model；事件没给就保持 unknown。
4. `opencode models` 只证明模型可发现，不证明本次 session 已选中。
5. 如果 CLI 只能给文本模型列表，保留原始文本并降低证据等级，不自行伪造机器可读结论。

## 3. 角色合同

### execution

负责：

- 明确 diff、批量操作、格式转换。
- 运行冻结的命令。
- 返回 changed files、commands、evidence、remaining risks。

禁止：

- 自行扩需求。
- 做最终架构/根因判断。
- 修改验收规则来让自己通过。
- 写 `verifier_status` 或 `human_accepted`。

### diagnostic

负责：

- 原始日志、配置、复现步骤、候选假设和排除链。

禁止：

- 未经主代理复核直接定案。
- 把候选假设写成最终根因。

### audit

负责：

- 在工作树冻结后只读复核最终 diff、配置、日志和必要历史。
- 提交 findings 和证据。

禁止：

- 修改实现。
- 把执行者的自报结论当作独立证据。

## 4. Preflight 门

任何外部模型开始消耗真实任务 token 前，逐项检查。

### 4.1 工作目录与路径

- `working_directory` 必须是本次任务真实根目录。
- 逐项解析 read/write allowlist、expected changed files、forbidden paths。
- 跨工作区路径必须显式进入读白名单并确认可达。
- 引用了不可达路径、错误工作区或范围冲突时，直接 `PREFLIGHT_BLOCKED`。

### 4.2 provider/model/variant/session

- 显式 provider 模式记录完整身份。
- 默认模式不能根据昵称猜 provider。
- variant 不存在或不受当前模型支持时，不靠重试碰运气。
- session 可恢复时记录 session/context hash；不可获得时写 unavailable。

### 4.3 认证、权限、工具与技能

- 只检查认证配置是否存在，不读取、打印或复制秘密值。
- 记录实际 permission mode。
- 记录可观察到的工具范围与自动加载 skill。
- CLI 支持 allowlist 时按最小权限设置。
- CLI 不支持时，明确能力缺口并缩小任务，用进程外 changed-file/路径校验补齐。

### 4.4 验收规则冻结

执行前冻结：

- `verify_commands`
- 测试/评测/评分规则
- verifier
- CI/acceptance schema
- expected artifacts

执行 agent 若修改这些内容，默认 `VERIFIER_FAIL`；只有用户明确把它们列入任务目标时例外，并需要另一套独立验收。

### 4.5 预算与重试

- 记录 time budget。
- 能获取真实 token budget/usage 时记录；拿不到写 `unavailable`。
- 默认 `retry_limit: 1`。
- 重试必须改变失败层或输入条件；禁止同参数原地轮询。

### 4.6 不假设未来 CLI 已存在

报告、设计稿或用户愿望中出现的参数，例如：

- `--dry-run`
- `--scope`
- `--read-only`
- `models --json`

只有当前 CLI `--help` 明确存在时才可使用。否则使用当前 CLI 的最小可观察命令 + 外部校验，不把期望功能写成现有事实。

### 4.7 `--auto`

- 只读调研默认不开启。
- 写任务只有在用户明确授权、写范围可枚举且可回滚时才允许开启。
- 开启 `--auto` 不取消 changed-file 白名单、验收冻结和独立 verifier。

## 5. 最小 Smoke Check

原则：先运行官方、最小、可观察的命令，再谈包装。

- 方案 B：按 `claude-code-launch-templates.md` 的最小 `claude -p` smoke check。
- 方案 C：按 `opencode-provider-launch-templates.md` 显式指定 `provider/model`。
- 方案 D：按 `opencode-headless-launch-templates.md` 使用默认模型链路。

没有直接命令的原始 stdout/stderr/退出码，不得先新增复杂 wrapper、进程树、脱敏管道、元数据生成器或 cleanup 状态机。

## 6. 轻量 Harness Prompt

Prompt 只约束模型行为，不承担硬校验：

```text
ROLE: 你只负责本次委托中的 execution / diagnostic / audit 角色。
SCOPE: 工作目录为 <root>；只允许读取 <read_allowlist>，只允许写入 <write_allowlist>。
READ: 先读 context-packet，再读清单内文件；禁止猜测未提供的上下文。
FORBIDDEN: 禁止范围外访问、安装依赖、修改测试/评测/评分/verifier/CI、git commit/push、写长期记忆或伪造完成状态，除非任务合同明确授权。
ACCEPTANCE: 只执行冻结的 <verify_commands>，把命令与原始输出摘要登记到 evidence，不修改验收规则。
STATUS: 只能写 agent_proposed_status；不得写 verifier_status 或 human_accepted。
OUTPUT: 返回 changed_files、commands_run、evidence、remaining_risks；证据不足时标记 partial 或 blocked。
```

不要把整本 skill、完整聊天历史或治理逻辑复制进 prompt。

## 7. 原始证据

任务目录内应把以下内容分开：

- context packet
- system prompt
- stdout
- stderr
- JSON/JSONL
- execution log
- verifier/summary

原始输出不可被 wrapper 生成的摘要或 `result.json` 覆盖。重试使用新文件或新 task 目录，不覆盖上一轮证据。
