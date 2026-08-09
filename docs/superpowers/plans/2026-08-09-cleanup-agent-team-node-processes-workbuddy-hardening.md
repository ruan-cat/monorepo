# cleanup-agent-team-node-processes WorkBuddy 加固实施计划

> **执行方式：** 使用 `subagent-driven-development`，由探索、编辑和独立复核子代理分权完成。所有任务使用 `- [ ]` 跟踪，不在真实验收前标记完成。

**目标：** 让技能在 Windows 上审计 WorkBuddy 进程族，并能在证据充分时精确清理单个非会话 prewarm 池，同时保持默认 dry-run、不残留工作区台账和不依赖具体 AI 模型。

**架构：** 在现有 PowerShell 进程审计器中增加 WorkBuddy 命令行指纹和父子拓扑分组。命令行不可读时输出低置信度与阻断原因，不把创建时间冒充活跃度；清理仅接受单个明确池选择器，先停止池根、等待父服务回收，再按原快照清理遗留子孙并重新采样。

**技术栈：** Windows PowerShell 5.1、CIM `Win32_Process`、Vitest、TypeScript 子进程测试。

## 全局约束

- 保留现有 `description` 的中英文触发语义，只追加 WorkBuddy 触发词，不得过度删改。
- 对外分发 skill 只使用安装目录相对路径，不写本机绝对路径、WorkBuddy 报告路径、仓库测试路径或 CI 路径。
- dry-run 默认只写 stdout；Apply 台账继续要求系统临时路径，并由调用方 `try/finally` 删除。
- 不修改 `C:\Users\pc\.agents\skills\cleanup-agent-team-node-processes` 全局安装副本。
- 不修改或暂存用户已有的 `docs/prompts/release-ai-plugins/01.md` 变更；本轮不执行 git commit。
- 不根据“进程年龄较大”或“最近没有新子进程”自动断言池空闲；证据不足必须阻断清理。
- daemon、sidecar、当前 MCP server 和当前主代理父进程链永远不可成为 WorkBuddy 清理候选。

---

### Task 1：建立 WorkBuddy 行为回归测试

**文件：**

- 新建：`tests/cleanup-agent-team-node-processes/agent-team-node-cleanup.test.ts`
- 新建：`tests/cleanup-agent-team-node-processes/fixtures/workbuddy-process-snapshots.json`
- 新建：`tests/cleanup-agent-team-node-processes/vitest.config.ts`
- 修改：`vitest.workspace.ts`
- 修改：`vitest.config.ts`

**接口：**

- 调用安装源码中的 `scripts/agent-team-node-cleanup.ps1`。
- 断言默认进程名包含 `WorkBuddy.exe`、`agent-browser-win32-x64.exe`、`bash.exe`。
- 断言 dry-run JSON 包含 `WorkBuddyGrouping`，且默认不产生工作区台账。
- 断言 WorkBuddy Apply 在缺少精确池选择器、低置信度或目标池属于受保护会话链时失败，不执行停止动作。
- 使用合成进程快照覆盖 sidecar/MCP server 保护、unknown fail-closed、普通 Git Bash 只审计、监听端口阻断和 pool 子树边界；不得对真实 WorkBuddy 执行破坏性测试。
- 非 Windows 环境只跳过依赖真实 PowerShell/CIM 的行为用例，静态内容用例仍执行。
- 标准命令 `pnpm vitest run --project cleanup-agent-team-node-processes` 必须使用终端 reporter，不生成或更新 `.vitest-reporter-html`；Vitest 3.2.6 将 reporter 视为根级配置，因此根配置只对该精确项目选择器覆盖为 `default`。

- [ ] **Step 1：编写失败测试**
- [ ] **Step 2：运行 `pnpm vitest run --project cleanup-agent-team-node-processes`，确认因 WorkBuddy 能力缺失而失败**

### Task 2：实现 WorkBuddy 审计、分组与精确池清理

**文件：**

- 修改：`ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/scripts/agent-team-node-cleanup.ps1`

**接口：**

- WorkBuddy dry-run 始终输出分组；新增单池 ID/PID 选择器和必要的显式空闲确认门禁，选择器必须唯一命中。
- `Get-ProcessFamily` 覆盖 WorkBuddy、原生 agent-browser 和 shell snapshot。
- `WorkBuddyGrouping` 输出核心进程、prewarm 池、子孙 PID、识别证据、置信度、不可判定项和保护原因。
- 命令行可见时优先用 `daemon-app-server-entry.js`、`sidecar-entry.js`、`--serve --mcp-config`、`--prewarm-id` 指纹；不可见时只允许有完整拓扑证据的降级识别。
- WorkBuddy 清理先验证池根不是 daemon/sidecar/MCP server/保护链，再停止池根，等待 2 秒，按深度从叶到根处理仍存活的原快照子孙；禁止无池选择器批量 Apply。
- shell snapshot 只在命令行精确匹配、超龄、无活跃子进程且其他通用门禁通过时成为候选。
- 输出 JSON 必须脱敏 `--token` 等会话凭据；Apply 前按 PID、名称和 CreationDate 防止 PID 复用。
- `-OutputPath` 在 Apply 时必须位于系统临时目录；工作区或任意非临时路径直接拒绝。
- 不自动生成 `candidate-zombie-*`；合法但无法自行证明空闲的 pool 只输出 `needs-confirmation`，显式单池选择和确认后才生成执行候选。

- [ ] **Step 1：实现最小 WorkBuddy 识别与输出结构**
- [ ] **Step 2：实现单池 Apply 门禁和停止顺序**
- [ ] **Step 3：运行 Task 1 测试并修正到通过**

### Task 3：同步技能正文且保留既有知识

**文件：**

- 修改：`ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/SKILL.md`

**接口：**

- 保留 v1.4.0 已有的无残留台账、临时文件 `finally`、模型无关和一次性 CLI 恢复规则。
- 增加 WorkBuddy 触发条件、审计字段、置信度降级、单池清理命令、安全门禁、常见错误和完成条件。
- 示例命令只用 `scripts/agent-team-node-cleanup.ps1` 相对路径；Apply 示例用系统临时文件并在同一段 `finally` 删除。
- 不声称脚本能自动得知当前会话池；无法证明时明确要求阻断或显式确认。

- [ ] **Step 1：用最小补丁同步正文**
- [ ] **Step 2：对比编辑前标题、规则和示例，解释所有减少项**

### Task 4：独立复核与最终证据

**文件：**

- 复核以上 skill、脚本、测试、fixture 和 Vitest 配置，不新增报告。

- [ ] **Step 1：独立复核子代理逐条核对两份报告、保守修正和用户验收标准**
- [ ] **Step 2：主代理运行 PowerShell 语法解析、Vitest、真实 dry-run JSON 解析和 Apply 拒绝门禁测试**
- [ ] **Step 3：运行 description 长度/frontmatter、相对路径、绝对路径污染、`git diff --check` 和工作区台账残留扫描**
- [ ] **Step 4：关闭子代理，执行清理技能 dry-run；只有出现可证明归属本轮的候选时才 Apply**
