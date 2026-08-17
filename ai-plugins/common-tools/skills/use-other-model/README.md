# Use Other Model Skill

## 定位

`use-other-model` 是一个可独立分发的多模型委托路由 skill。它帮助主代理在 OpenCode、Claude Code、MCP 与其他模型/provider 之间选择合适路径，并通过 preflight、任务合同、弱模型降维执行和独立验证保留可复核证据。

**执行真值以 `SKILL.md` 和当前 `references/` 为准。** 本 README 只提供安装后导航，不维护第二套流程。

## 独立分发保证

正常运行只依赖安装后的整个 `use-other-model/` 目录：

```plain
use-other-model/
├── SKILL.md
├── README.md
├── references/
└── scripts/
```

任何运行时必需规则、模板、验证条件和当前设计依据都必须位于这个目录中。

- 不依赖源 monorepo 的 `.agents/`、`docs/reports/`、CI 文件或内部事故目录。
- 源仓库中的 hardening archive 只是维护期历史证据，不是本技能运行时记忆。
- `references/technical-reports.md` 中的外部报告只是可选背景；离线或链接不可用不能阻断正常执行。
- 当前硬门的因果记忆随技能保存在 `references/design-memory.md`，用于维护、扩展和审查时理解“为什么不能删掉这些约束”。

因此，验收这个 skill 是否真正可外发时，应假设：**只复制本目录到一个全新项目，且完全无法访问原 monorepo。**

## 适用场景

适合：

- 批量、多文件或预计超过 5 分钟的任务；
- 可以冻结读写范围、验证命令和完成条件的执行任务；
- OpenCode provider/model、variant、默认/headless 链路检查；
- 独立验证、蓝军复核或安全审计；
- 需要在 MCP、Claude Code 独立会话、OpenCode provider 与默认内部模型之间选路。

不适合：

- 一眼能完成的短任务；
- 需求仍持续变化、需要频繁追问用户；
- 无法预先列出范围和验收标准；
- 把复杂根因、架构、安全判断或最终验收交给弱模型。

## A-D 路由

| 路径                      | 用途                                            |
| ------------------------- | ----------------------------------------------- |
| A：MCP                    | 简单任务、单次工具调用                          |
| B：独立 Claude Code 会话  | 多步骤编码、批量操作、独立读写与验证            |
| C：OpenCode provider      | 显式 provider/API key/baseURL/`provider/model`  |
| D：OpenCode 默认/headless | 默认模型链路、未指定 `--model` 的 headless 调用 |

完整证据合同见 `references/delegation-contract.md`。

## 弱模型执行模式

弱模型不运行整套 skill 决策流程。

强主代理先完成：

1. A-D 选路；
2. preflight；
3. 范围和验收冻结；
4. 把 Goal 编译为 `EXACT_ACTIONS`；
5. 把异常分支编译为 `STOP_IF`。

弱模型只收到 `Weak Executor Packet`：

```text
ROLE: EXECUTION_ONLY
DECISION_BUDGET: 0
READ
WRITE
EXACT_ACTIONS
DO_NOT
VERIFY
STOP_IF
RETURN
```

任何未预定义选择都返回 `BLOCKED`。完整合同见 `references/weak-executor-contract.md`。

## 成功判定

以下任一项都**不能单独证明任务成功**：

- exit code = 0；
- agent 自报 success；
- 单个测试通过。

主代理/verifier 还需要核对：

- provider/model/session 身份；
- tool/permission 事件；
- expected artifacts；
- changed-file 精确集合；
- 冻结验证命令；
- 原始 stdout/stderr/JSONL。

执行者只产生候选状态；只有独立 `VERIFIER_PASS` 后才能报告“候选完成”。详见 `references/evidence-verification.md`。

## 失败与重试

失败先按层分类：

- `PREFLIGHT_BLOCKED`
- CLI 启动
- provider/auth
- tool/permission
- task execution
- artifact/verifier
- browser verification
- cleanup

默认最多一次失败重试，并且必须改变失败层或输入条件。相同条件原地轮询无效，主代理接管。

弱模型更严格：只有 packet 已预定义具体恢复动作时才允许执行；其他失败立即 `BLOCKED`。

详见 `references/failure-routing.md`。

## 当前技能结构

```plain
use-other-model/
├── SKILL.md
├── README.md
├── references/
│   ├── README.md
│   ├── design-memory.md
│   ├── delegation-contract.md
│   ├── context-packet-template.md
│   ├── weak-executor-contract.md
│   ├── evidence-verification.md
│   ├── failure-routing.md
│   ├── method-a-mcp-tools.md
│   ├── method-b-independent-session.md
│   ├── claude-code-launch-templates.md
│   ├── opencode-provider-launch-templates.md
│   ├── opencode-headless-launch-templates.md
│   ├── frontend-browser-verification-template.md
│   ├── environment-variables.md
│   ├── case-study-git-commits.md
│   ├── faq.md
│   ├── code-templates.md
│   └── technical-reports.md
└── scripts/
    ├── smoke-opencode-provider.ps1
    ├── smoke-opencode.ps1
    └── launch-opencode-headless.ps1
```

## 阅读路线

正常调用：

1. `SKILL.md`
2. 根据 A-D 路由读取对应模板
3. 写任务封包：`references/context-packet-template.md`
4. 弱模型任务：主代理额外读取 `references/weak-executor-contract.md`
5. 验收：`references/evidence-verification.md`
6. 失败时：`references/failure-routing.md`

维护或审查当前设计：

- `references/design-memory.md`：当前硬门的原因与独立分发自包含约束
- `references/README.md`：完整渐进披露导航

## 安全边界

- 不在 prompt、任务封包、日志或结果中复制 API key、Authorization header 或私有 token。
- 不允许 execution agent 为了通过而修改测试、评分、verifier 或 acceptance schema。
- 不自动 commit/push、发布、部署、数据库迁移、生产运维或写长期记忆，除非用户明确授权且交给对应专门流程。
- 前端任务不能用 build/test 替代浏览器验收。

## 版本

当前 PR 候选版本：`0.9.0`。

本版本的主要变化包括：

- 收缩主 `SKILL.md`，详细合同按需下沉到 references；
- 增加 preflight、状态所有权和多证据独立验证；
- 增加 Weak Executor Contract；
- 明确独立分发自包含边界，并把当前设计因果记忆放回技能自身目录。
