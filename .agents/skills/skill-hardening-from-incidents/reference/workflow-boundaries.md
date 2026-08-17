# 写入边界与证据清单

## 写入目标

- **项目局部 skill**：写入 `.agents/skills/<skill-name>/SKILL.md` 和其 `reference/`；适合仓库特有流程、路径约束和 agent team 规则。新增或改名时同步根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 技能表。
- **对外分发 skill**：写入 `ai-plugins/*/skills/<skill-name>/`，内容站在安装后目录视角；不要写本机绝对路径、开发期报告、monorepo 内部测试路径、CI 路径或临时材料。命令示例使用安装目录内相对路径，例如 `scripts/sync.ts`。
- **全局 skill**：写入用户全局技能目录，适合跨项目通用规则；不能假设当前 monorepo 的目录、包名、脚本或私有约束存在。
- **根级 AI 记忆**：只记录会影响整个仓库未来 agent 行为的规则；三份文档必须保持等价更新。
- **Memorix**：用于跨会话收口，记录决策链和完成状态；有可用 MCP 时使用项目作用域和稳定 `topicKey`。

## 对外分发 skill 的自包含门

对外 skill 的分发单位是它自己的完整技能目录。维护时必须假设用户把该目录安装到一个全新项目，且完全无法访问源 monorepo。

因此：

- 任何正常执行必需的规则、模板、验证条件、失败边界和当前设计依据，都必须存在于该 skill 自己的 `SKILL.md`、`references/`、`scripts/` 或同目录资源中。
- `.agents/`、根级 AI 记忆、monorepo `docs/reports/`、内部 CI/测试目录和 hardening archive 只能作为源码维护期证据，不能成为外发 skill 的运行时依赖。
- 如果历史事故中的因果记忆会影响未来维护者是否保留某个硬门，应把**当前仍有效的设计原因**提炼到外发 skill 自己的当前 reference；不要要求维护者回源 monorepo archive 才能理解当前设计。
- 外部网页或报告可以作为可选背景，但不能承载唯一执行真值；网络不可用时仍必须能从安装目录完成正常流程。
- 压缩外发 `SKILL.md` 前，先做“只复制该 skill 目录”的思想实验；如果离开 monorepo 后会丢失当前行为所需上下文，本次 hardening 直接失败。

项目级 archive 可以保留逐字历史原貌，但它解决的是**源仓库审计**，不能替代外发 skill 的**运行时自包含**。

## 证据读取清单

至少核对与本次目标相关的部分：

- 用户给出的报告、事故复盘、历史经验、review 评论或 handoff。
- 当前要加固的 `SKILL.md`，包括 frontmatter、触发条件、常见错误和完成条件。
- 相关 diff，确认实际改动而不是只相信代理报告。
- 根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 的技能表和已有规则。
- 相关 Memorix 记忆，查找同一事故、同类 skill、路径污染、发布或同步问题。
- 涉及对外分发 skill 时，额外检查 README、当前 references、scripts、CHANGELOG、plugin/marketplace 元数据和安装后路径假设。
- 对外 skill 做自包含审计时，区分“源仓库历史证据”与“安装后仍必须存在的当前记忆”；后者必须进入分发目录。

证据不足时，只能记录待确认问题，不能把猜测写成规则。

## 编辑准则

- `description` 只写触发条件，必须以 `Use when...` 开头，不概括 workflow。
- 正文写可复用流程、判断标准和验证清单，不写本次会话流水账。
- 使用小补丁修改；避免重写大文件或格式化无关文件。
- 保持项目局部、对外分发、全局 skill 的边界清楚；局部经验不得误塞进对外 skill。
- 对外 skill 的示例、脚本、引用文件均以安装目录为基准。
- 对外 skill 的当前执行规则不能反向依赖 `.agents`、根级记忆或源码仓库 archive。
- 同步根级 AI 记忆时，三份文档使用同一条目、同一措辞、同一插入位置。
