# 2026-11-15 — use-other-model 与 git-commit 技能组合的指令集冲突

## 现象

用户用固定提示词模板驱动「主代理 + 低级模型临时子代理」完成分门别类 git commit。执行模型的思考链出现大量犹豫与自相矛盾：路由选择（读 Task 工具 schema、评估 composer-2.5-fast vs grok-4.7-medium）、等待语义（use-other-model 要求主代理最终验收 vs 模板要求主代理不等待）、提交拆分判断反复（feat vs breaking change、范围外文件排除与否）。子代理后台运行时若主代理继续改文件，工作树漂移会让 git-commit 快速路径硬门槛 1 与弱模型 STOP_IF 必然触发。

## 根因

两技能的组合本来是被设计过的（git-commit「快速路径任务包」+ use-other-model `delegation-contract.md` 的 `git_commit_plan` 扩展 + `references/case-study-git-commits.md` 委托案例），但提示词模板没有走这座既有的桥，叠加四处条款真空与两处技能缺陷：

- C1（高危）：模板「不等待 + 继续干活」× 共享工作树一致性门（快速路径硬门槛 1 / weak-executor STOP_IF「Repository/workspace/branch state differs」）→ 工作树竞态。
- C2（中危）：模板「不占注意力」× 不可豁免的主代理验收义务（weak-executor §9、VERIFIER_PASS 状态机）→ 验收悬空。
- C3（中危）：模板「传大部分会话信息」× 弱模型 DECISION_BUDGET: 0 与 reference 隔离 → 上下文倾倒诱发执行者自主判断。
- C4（低危）：A-D 路由表没有宿主原生子代理条目，且 ZCode Agent 工具不可选模型 → 路由纠结烧 token。
- D1：git-commit 步骤 10「直到工作树干净」与步骤 2「范围外文件不暂存」自相矛盾；委托场景下诱导子代理卷入范围外文件。
- D2：git-commit 快速路径封包与 delegation-contract `git_commit_plan` 字段漂移（缺 scope/verification，`identity_check` 命名不一致）。

## 修复

提示词模板重写为「少标题 + 编号加粗段」版（落 `D:\store\WorkBuddy\2026-6-30-common\通用提示词.md`）：主代理先出快速路径封包（type/emoji 预解析），后台委托 + 完成通知 + 最小验收 + 严格工作树冻结；封包附加 DECISION_BUDGET: 0 / EXACT_ACTIONS / STOP_IF / RETURN；子代理 READ 白名单仅限封包与快速路径章节。

技能源码（`ai-plugins/common-tools/skills/`）：

- git-commit 1.0.0 → 1.1.0：步骤 10 终止条件改为「封包/计划内的 groups 全部提交完成」；快速路径新增「委托执行（配合 use-other-model）」小节（READ 白名单、工作树冻结、主代理验收、固定汇报 schema、封包 schema 单一事实源声明）。
- use-other-model 0.9.0 → 0.10.0：A-D 路由扩为 A-E（新增「宿主原生子代理」路由 + 硬规则：不可选模型时改走 B/C/D；异步委托不减少验收义务）；`git_commit_plan` 补 scope/verification/identityCheck 对齐并声明单一事实源；最小验收清单补异步验收条款；description 补「宿主原生子代理」触发词；全部 references 与 README 的 A-D 表述同步改名。

## 验证

- `generate-skill-registry.ps1 -Apply` 重新生成后 `-Check` 通过（CI 同款校验，skill-registry.json 两个版本号与 description 同步更新）。
- 全仓 grep 无残留 `A-D` / `A/B/C/D` 引用。
- `diff -rq` 确认 `~/.agents/skills` 两份安装副本与 monorepo 源码完全一致；`~/.workbuddy/skills` 是指向 `~/.agents/skills` 的符号链接，WorkBuddy 侧自动生效。
- `tests/` 无覆盖这两份技能的用例，无回归风险。

## 教训

- 排查「技能冲突」先确认组合是否被设计过：找对方技能里的配套扩展字段与案例文件，别急着判互斥。
- 「不等待」类异步指令必须显式定义三件事：等待期工作树冻结范围、完成通知后的验收动作、失败接管路径；否则与任何要求最终验收的合同冲突。
- 弱模型委托的上下文纪律：传结构化封包，不传会话历史；判断留在主代理，执行交给封包。
- 循环终止条件写「工作树干净」在存在范围外文件或并行改动时是错误目标，应写「计划内清单全部完成」。
- 同一封包 schema 出现在两份文档时必须声明单一事实源，否则必然漂移。
- `sync-local-global-agents-skills` 的数据源是 `~/.agents/skills` → 各平台目录，不承担 monorepo 源码 → 全局副本的同步；后者用 `cp -r` + `diff -rq` 直接收口。
