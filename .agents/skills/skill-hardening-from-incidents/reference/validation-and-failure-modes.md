# 验证清单与失败分流

## 完成前验证

- 新增或修改的 skill 有 YAML frontmatter，至少包含 `name`、`description`；按项目要求补齐 `metadata.version` 和 `user-invocable`。
- `description` 以 `Use when...` 开头，只描述触发条件，不写 workflow 摘要。
- 正文覆盖写入目标、证据读取、规则提炼、角色闭环、编辑准则、验证清单、常见错误和完成条件，或明确链接到对应参考文件。
- 根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 的技能表同步一致。
- 主代理查看实际 diff；不能只信子代理总结。
- 对目标 skill 运行路径污染、失效链接、孤立参考文件和内容迁移台账扫描。
- 从正文移除的**当前仍有效规则**能在当前 `reference/*.md` 找到，并保留原规则、反例和验证方式。
- 只用于保留旧版本原貌的全文/旧模板/旧规则进入 `reference/archive/<skill>/`，并在 archive 索引登记 NON-NORMATIVE、归档日期、替代规则和原因。
- 正常执行阅读路线没有加载 `reference/archive/**`；活跃导航不把具体历史快照与当前规范并列。
- 对外分发 skill 已通过“离开 monorepo 后仍可运行”的自包含检查：运行时必要规则、模板、验证边界和当前设计依据都在该 skill 自己的分发目录中。
- 有 Memorix MCP 时，存储本次决策链或完成状态，并 resolve 过期任务记忆。

## 路径污染扫描

按目标文件收窄执行，并把占位项替换为当前任务的风险模式：

```powershell
rg -n "<本机绝对路径>|<用户目录>|<开发期报告目录>|<CI 工作流目录>|<内部测试目录>" <target-files>
```

扫描命中不一定都是错误，要按 skill 类型判断。对外分发 skill 的命中通常需要删除或改成安装目录相对描述。

## 对外 skill 自包含扫描

涉及 `ai-plugins/*/skills/<skill-name>/` 时，额外执行“仅分发目录”审计：

1. 把 `<skill-dir>` 当成唯一可用的技能文件系统；假设源 monorepo 的 `.agents/`、`docs/reports/`、CI、根级记忆和 hardening archive 全部不存在。
2. 从 `<skill-dir>/SKILL.md` 出发，逐项核对正常执行链接和命令模板是否位于 `<skill-dir>` 内。
3. 外部 URL 只能是可选背景；删除网络访问后，A-D 路由、preflight、任务合同、失败分流、验证和安全边界仍能恢复。
4. 如果某个当前硬门只能通过读取源仓库事故报告或 archive 才能理解并正确维护，把当前仍有效的因果记忆提炼进 `<skill-dir>/references/`。
5. README、SKILL 和 current references 不得出现相互冲突的重试次数、状态所有权、路径语义或模型路由规则。

对外 skill 一旦需要“回原 monorepo 找记忆”才能正确执行，就判定为**分发自包含失败**。

## Archive 隔离扫描

对于 `skill-hardening-from-incidents` 自身或使用其迁移协议的任务，额外检查：

```powershell
rg -n "pre-split|Deprecated historical|NON-NORMATIVE" .agents/skills/skill-hardening-from-incidents/reference
```

逐项确认：

1. 历史全文和旧模板位于 `reference/archive/<skill>/`，不在 `reference/` 顶层。
2. `reference/README.md` 只把 `archive/README.md` 作为审计入口，不逐个把旧快照列入正常阅读导航。
3. `reference/archive/README.md` 给出状态、日期、替代规则和归档原因。
4. 当前目标 skill 的 `SKILL.md` / `references/` 不依赖 archive 才能正确执行。
5. archive 与当前规则冲突时，没有代码或文档把 archive 解释成当前真值。

## 常见错误

| 错误                                 | 修正                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| 直接贴事故流水                       | 改写成现象、根因、未来规则、验证方式                                                      |
| 只改 `SKILL.md` 不同步 AI 记忆       | 新增或改名项目局部 skill 时，同步根级三份 AI 记忆文档                                     |
| 只信子代理报告不看 diff              | 主代理亲自查看 diff、目标文件和关键命令输出                                               |
| 没清理旧 agent team                  | 开始前确认旧任务、旧 handoff、旧计划不会污染本轮目标                                      |
| `description` 写 workflow 摘要       | `description` 只写 `Use when...` 触发条件                                                 |
| 把局部经验塞进对外 skill             | 局部规则写项目 skill 或根级 AI 记忆；对外 skill 只保留安装后可复用规则                    |
| 对外 skill 把必要记忆只留在 monorepo | 把当前执行/维护所需规则与因果记忆迁入该 skill 自己的 `references/`；源码 archive 只做审计 |
| 当前规则删掉但没有迁移               | 先写入当前 `reference/*.md` 并登记台账，再压缩入口                                        |
| 历史快照与当前规则并列               | 历史原貌移到 `reference/archive/<skill>/`；正常执行不加载 archive                         |
| archive 没有替代关系                 | 在 `reference/archive/README.md` 标注 NON-NORMATIVE、日期、替代规则和原因                 |
| README 与当前 SKILL 漂移             | README 只做导航；发现重试、路由、状态等冲突时立即同步当前规则                             |
| 对外分发 skill 暴露开发路径          | 改成安装目录相对路径，移除本机绝对路径、开发期报告和内部测试/CI 路径                      |
| 完成后不收口 Memorix                 | 有 MCP 时存储决策链、文件变化和下一步，并 resolve 已完成任务                              |

## 完成条件

- 目标写集与实际 diff 完全一致，没有无关文件修改。
- skill 内容是 future-agent 可执行流程，不是事故叙事。
- 三类 skill 边界清楚，尤其没有把本仓库路径假设泄露到对外分发 skill。
- 对外分发 skill 在只保留自身目录的全新项目中仍具备完整运行时规则和必要当前设计记忆。
- 当前规范与历史 archive 物理隔离，archive 不参与正常执行。
- 被压缩的当前规则与历史原貌都能按各自层级恢复，没有知识丢失。
- 根级 AI 记忆和 Memorix 已按需同步。
- 主代理完成独立验证，并明确剩余风险或待人工确认项。
