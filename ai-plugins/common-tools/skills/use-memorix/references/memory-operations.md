# 记忆基本操作

本文件是 context / search / detail / store / resolve 的权威日常入口。MCP 工具的实际名字、参数与可用性以当前宿主暴露的 schema 为准；本文件只写决策与安全门，不复制易漂移的完整 tool schema。

## 路由表

| 用户意图           | 首选 MCP 能力                  | CLI 兜底                            | 授权       |
| :----------------- | :----------------------------- | :---------------------------------- | :--------- |
| 获取项目工作上下文 | project context / context pack | `memorix context`                   | 只读，自动 |
| 搜索记忆           | search                         | `memorix search --query ... --json` | 只读，自动 |
| 查看单条详情       | detail                         | `memorix memory detail --id ...`    | 只读，自动 |
| 存储记忆           | store                          | `memorix memory store ...`          | 写前确认   |
| resolve / archived | resolve                        | `memorix memory resolve ...`        | 写前确认   |

context、search、detail 属于纯读取，直接执行，不需要额外确认。store、resolve 属于写入，每次都要先展示目标与载荷摘要，再等确认。

## 读取路径

1. 先取项目上下文：确认当前项目绑定、最近 handoff、可用的记忆条目。
2. 再按需搜索：query 用目标记忆的标题原词或 ASCII 标识符，避免意图式中文多词组合。
3. 命中后逐条看详情：搜索结果是索引摘要，不足以判断内容是否真相关。

判读规则：

- `matchedFields` 只含 `fuzzy` 的条目按 0 命中处理，不要当成证据。
- 判断某主题是否已入库，用 `memory detail --id <N>`，不要用 search 未命中去反证「不存在」。
- 搜索结果里的分数与通道只说明排序，不说明事实正确性；结论必须回到详情正文。
- 项目 scope 检索优先；需要跨项目历史时才显式切全局 scope，并在结论里标注来源不同。

## 写入路径

store 之前必须能说清四件事：

| 字段         | 要求                                                   |
| :----------- | :----------------------------------------------------- |
| `entityName` | 归属实体，稳定、可复用，不用一次性临时词               |
| `type`       | gotcha / decision / problem-solution / what-changed 等 |
| `title`      | 5–10 个词，能独立读懂                                  |
| `narrative`  | 发生了什么、为什么、如何验证、以后要记住什么           |

补充约定：

- 有明确演进主题时用 `topicKey` 做 upsert，避免同一决策堆多份互相矛盾的记录。
- 进度类写入用 `progress.feature/status/completion`，不要把进度写进 narrative。
- 不写密钥、token、连接串、完整用户主目录；路径用占位符。
- 写入前展示「实体 / 类型 / 标题 / 摘要 / 影响范围」，用户确认后才调用。

resolve 之前必须展示：目标 id、当前状态、目标状态、后继关系（若有）。resolve 不改内容，只改状态；归档场景另受 retention 域硬门约束。

## CLI 兜底

MCP 工具缺失、宿主未暴露或连接异常时：

1. 先读 `memorix --version` 与 `memorix <command> --help`，确认当前可用子命令。
2. 用 CLI 完成同一动作，参数以 `--help` 为准，不照抄旧文档。
3. 在结论中标注「本次走 CLI 兜底」，避免后续误以为 MCP 链路健康。

示例（只读）：

```bash
memorix context
memorix search --query "shim 劫持" --json
memorix memory detail --id 123
```

## 失败分支

| 现象               | 先查                                         | 不要做                     |
| :----------------- | :------------------------------------------- | :------------------------- |
| 搜不到预期记忆     | 项目绑定、scope、query 用词、是否 fuzzy-only | 直接重建索引或改 embedding |
| 详情 id 不存在     | 是否跨项目、是否已 archived                  | 反复 search 猜 id          |
| 写入报 schema 错   | 当前 `--help` 的必填字段                     | 猜字段名、塞文本兜底       |
| 写入成功但检索不到 | 索引健康、embedding 状态、是否需要强制刷新   | 立刻重复写入制造重复条目   |

跨域问题（索引健康、embedding、存储）转到 health 与 retrieval 域处理，不在本文件内顺手改配置。
