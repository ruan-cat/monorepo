# References 目录

本目录承载 `use-other-model` **随技能一起分发的当前渐进式记忆层**。正常调用先读根目录 `SKILL.md`；只有命中具体路径、失败层、验收需求或维护原因时，再加载对应 reference。

## 独立分发边界

对一个全新项目而言，本目录必须足以提供所有运行时必需的详细规则。

- 当前执行不得依赖源 monorepo 的 `.agents/`、`docs/reports/`、内部 CI 路径或 hardening archive。
- 历史 archive 可以存在于维护源码仓库，但不是独立安装后的运行时依赖。
- 外部报告只能作为可选背景，不能承载唯一的当前执行规则。
- 当前硬门的原因保存在 `design-memory.md`；它随技能分发，用于维护或审查时恢复设计意图。

维护时可以用一个简单验收判断是否破坏了自包含性：**假设只剩 `use-other-model/` 目录，正常任务是否仍能完成选路、preflight、执行、失败分流和验证？** 如果不能，就说明必要记忆放错了位置。

## 核心阅读路线

### 先理解委托合同

- `delegation-contract.md`
  - 最小任务合同
  - A-D 能力合同
  - execution / diagnostic / audit 角色边界
  - provider/model 身份规则
  - preflight
  - 轻量 harness prompt

- `context-packet-template.md`
  - Master Contract 模板
  - read/write allowlist
  - expected changed files
  - frozen verification
  - 状态所有权与预算

- `weak-executor-contract.md`
  - 低能力 execution 模式
  - `DECISION_BUDGET: 0`
  - `EXACT_ACTIONS`
  - `STOP_IF`
  - 固定 RETURN schema
  - reference 隔离与禁止自主失败恢复

弱模型不直接读取完整 Master Contract 后自行规划。强主代理先选路、preflight、冻结验收，再把任务压平成 Weak Executor Packet。

### 再理解验收

- `evidence-verification.md`
  - `agent_proposed_status → verifier_status → human_accepted`
  - 六层证据链
  - changed-file 精确集合
  - 路径/秘密值/危险动作扫描
  - 多证据一致性
  - weak-executor 专项验证
  - reviewer 与完成声明

- `failure-routing.md`
  - preflight、CLI、provider/auth、tool/permission、execution、artifact/verifier、browser、cleanup 分层
  - 最多一次且必须改变失败条件的重试规则
  - weak execution 的未预定义失败直接返回主代理

## A-D 路径

### A：MCP

- `method-a-mcp-tools.md`

适合简单任务和单次工具调用。

### B：独立 Claude Code 会话

推荐按需读取：

1. `method-b-independent-session.md`
2. `context-packet-template.md`
3. 如果 execution model 为 weak，再由主代理读取 `weak-executor-contract.md` 并编译执行包
4. `claude-code-launch-templates.md`
5. 前端任务再读 `frontend-browser-verification-template.md`
6. 失败时读 `failure-routing.md`
7. 最终验收读 `evidence-verification.md`

方案 B 是 unattended coding agent，不是普通问答会话。弱执行模型只接收压平后的动作包，不负责解释整套 skill。

### C：OpenCode provider 模式

- `opencode-provider-launch-templates.md`
- `environment-variables.md`
- `../scripts/smoke-opencode-provider.ps1`

显式记录 provider/model；provider 配置必须进入实际调用 shell。

### D：OpenCode 默认/headless 模式

- `opencode-headless-launch-templates.md`
- `../scripts/smoke-opencode.ps1`
- `../scripts/launch-opencode-headless.ps1`

默认省略 `--model` 时，不凭模型昵称猜 provider；以本次结构化事件为证据。

## 当前设计记忆

- `design-memory.md`
  - 独立分发自包含原则
  - 为什么 preflight 必须前置
  - 为什么模型可发现不等于已选中
  - 为什么 exit code 0 不等于成功
  - 为什么 executor 与 verifier 必须分离
  - 为什么原始 stdout/stderr/JSONL 必须保留
  - 为什么默认只允许一次有效 retry
  - 为什么弱模型必须 `DECISION_BUDGET: 0`
  - 为什么不能假设未来 CLI 参数

它保存的是**当前设计原因**，不是旧版全文；正常执行不必每次加载。

## 其他资料

- `frontend-browser-verification-template.md`
  - 前端 URL、视觉和交互验收模板。

- `environment-variables.md`
  - provider 环境变量识别与提取。

- `case-study-git-commits.md`
  - 批量 Git 提交委托案例。

- `faq.md`
  - 常见问题与回退建议。

- `code-templates.md`
  - 兼容保留的旧模板入口；优先级低于当前启动模板和任务合同。

- `technical-reports.md`
  - 外部历史技术方案与 token 节省分析；只在追溯背景时读取。
  - 网络不可用或链接失效时，不影响当前 skill 的正常执行。

## 渐进披露原则

1. `SKILL.md` 只保留：
   - 触发条件
   - 稳定路由
   - 强制边界
   - 快速执行卡
   - 弱模型硬门摘要
   - 最小验收
2. 任务 schema、状态机、详细失败分流、弱执行 packet、命令模板和长案例放在当前 reference。
3. 当前设计原因放在 `design-memory.md`；旧版全文不得拿来充当当前规范。
4. 同一规则只维护一个完整执行真值；`SKILL.md` 写摘要并链接到对应专题 reference。
5. 弱模型的 reference 选择由强主代理完成；弱执行者不通过多跳阅读自行拼装流程。
6. 对外分发 skill 的任何运行时必要记忆都必须位于本技能目录内。
7. reference 与入口冲突时，先修冲突，不长期保留双源状态。
