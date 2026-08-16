# References 目录

本目录承载 `use-other-model` 的渐进式加载文档。正常调用先读根目录 `SKILL.md`；只有命中具体路径、失败层或验收需求时，再加载对应 reference。

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
  - 可直接填写的任务封包
  - read/write allowlist
  - expected changed files
  - frozen verification
  - 状态所有权与预算

### 再理解验收

- `evidence-verification.md`
  - `agent_proposed_status → verifier_status → human_accepted`
  - 六层证据链
  - changed-file 精确集合
  - 路径/秘密值/危险动作扫描
  - 多证据一致性
  - reviewer 与完成声明

- `failure-routing.md`
  - preflight、CLI、provider/auth、tool/permission、execution、artifact/verifier、browser、cleanup 分层
  - 最多一次且必须改变失败条件的重试规则

## A-D 路径

### A：MCP

- `method-a-mcp-tools.md`

适合简单任务和单次工具调用。

### B：独立 Claude Code 会话

推荐按需读取：

1. `method-b-independent-session.md`
2. `context-packet-template.md`
3. `claude-code-launch-templates.md`
4. 前端任务再读 `frontend-browser-verification-template.md`
5. 失败时读 `failure-routing.md`
6. 最终验收读 `evidence-verification.md`

方案 B 是 unattended coding agent，不是普通问答会话。

### C：OpenCode provider 模式

- `opencode-provider-launch-templates.md`
- `environment-variables.md`
- `scripts/smoke-opencode-provider.ps1`

显式记录 provider/model；provider 配置必须进入实际调用 shell。

### D：OpenCode 默认/headless 模式

- `opencode-headless-launch-templates.md`
- `scripts/smoke-opencode.ps1`
- `scripts/launch-opencode-headless.ps1`

默认省略 `--model` 时，不凭模型昵称猜 provider；以本次结构化事件为证据。

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
  - 历史技术方案与 token 节省分析；只在追溯背景时读取。

## 渐进披露原则

1. `SKILL.md` 只保留：
   - 触发条件
   - 稳定路由
   - 强制边界
   - 快速执行卡
   - 最小验收
2. 任务 schema、状态机、详细失败分流、命令模板和长案例放在 reference。
3. 同一规则只维护一个完整真值；`SKILL.md` 写摘要并链接到 reference。
4. reference 与入口冲突时，先修冲突，不长期保留“以主文件为准”的双源状态。
