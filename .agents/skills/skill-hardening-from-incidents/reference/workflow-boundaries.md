# 写入边界与证据清单

## 写入目标

- **项目局部 skill**：写入 `.agents/skills/<skill-name>/SKILL.md` 和其 `reference/`；适合仓库特有流程、路径约束和 agent team 规则。新增或改名时同步根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 技能表。
- **对外分发 skill**：写入 `ai-plugins/*/skills/<skill-name>/`，内容站在安装后目录视角；不要写本机绝对路径、开发期报告、monorepo 内部测试路径、CI 路径或临时材料。命令示例使用安装目录内相对路径，例如 `scripts/sync.ts`。
- **全局 skill**：写入用户全局技能目录，适合跨项目通用规则；不能假设当前 monorepo 的目录、包名、脚本或私有约束存在。
- **根级 AI 记忆**：只记录会影响整个仓库未来 agent 行为的规则；三份文档必须保持等价更新。
- **Memorix**：用于跨会话收口，记录决策链和完成状态；有可用 MCP 时使用项目作用域和稳定 `topicKey`。

## 证据读取清单

至少核对与本次目标相关的部分：

- 用户给出的报告、事故复盘、历史经验、review 评论或 handoff。
- 当前要加固的 `SKILL.md`，包括 frontmatter、触发条件、常见错误和完成条件。
- 相关 diff，确认实际改动而不是只相信代理报告。
- 根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 的技能表和已有规则。
- 相关 Memorix 记忆，查找同一事故、同类 skill、路径污染、发布或同步问题。
- 涉及对外分发 skill 时，额外检查 README、CHANGELOG、plugin/marketplace 元数据和安装后路径假设。

证据不足时，只能记录待确认问题，不能把猜测写成规则。

## 编辑准则

- `description` 只写触发条件，必须以 `Use when...` 开头，不概括 workflow。
- 正文写可复用流程、判断标准和验证清单，不写本次会话流水账。
- 使用小补丁修改；避免重写大文件或格式化无关文件。
- 保持项目局部、对外分发、全局 skill 的边界清楚；局部经验不得误塞进对外 skill。
- 对外 skill 的示例、脚本、引用文件均以安装目录为基准。
- 同步根级 AI 记忆时，三份文档使用同一条目、同一措辞、同一插入位置。
