# 记忆基本操作

本文件是 context / search / detail / store / resolve 的权威日常入口。MCP 工具的实际名字、参数与可用性以当前宿主暴露的 schema 为准；本文件只写决策与安全门，不复制易漂移的完整 tool schema。

## 路由表

| 用户意图           | 首选 MCP 能力                  | CLI 兜底                                                                                                                    | 授权       |
| :----------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :--------- |
| 获取项目工作上下文 | project context / context pack | `memorix context --cwd <当前工作区绝对路径>`                                                                                | 只读，自动 |
| 搜索记忆           | search                         | `memorix search --cwd <当前工作区绝对路径> --query ... --json`                                                              | 只读，自动 |
| 查看单条详情       | detail                         | `memorix memory detail --cwd <当前工作区绝对路径> --id ...`                                                                 | 只读，自动 |
| 存储记忆           | store                          | `memorix memory store --cwd <git 项目> --entity <实体> --type <类型> --title "<标题>" --topic-key <主题键> --text "<正文>"` | 写前确认   |
| resolve / archived | resolve                        | `memorix memory resolve --cwd <当前工作区绝对路径> ...`                                                                     | 写前确认   |

context、search、detail 属于纯读取，直接执行，不需要额外确认。store、resolve 属于写入，每次都要先展示目标与载荷摘要，再等确认。

## 读取路径

1. 先执行本文件「项目绑定硬门」，再看 handoff 和记忆条目。
2. 再按需搜索：query 用目标记忆的标题原词或 ASCII 标识符，避免意图式中文多词组合。
3. 命中后逐条看详情：搜索结果是索引摘要，不足以判断内容是否真相关。

判读规则：

- `matchedFields` 只含 `fuzzy` 的条目按 0 命中处理，不要当成证据。
- 判断某主题是否已入库，用 `memory detail --id <N>`，不要用 search 未命中去反证「不存在」。
- 搜索结果里的分数与通道只说明排序，不说明事实正确性；结论必须回到详情正文。
- 项目 scope 检索优先；需要跨项目历史时才显式切全局 scope，并在结论里标注来源不同。

## 写入路径

### 项目绑定硬门

活动会话存在不能跳过 MCP 根目录核对。不一致时先确认，再把当前工作区绝对路径传给 `projectRoot`。CLI 项目 id 与 MCP 根目录必须同时等于当前工作区。

1. 运行 `memorix session context --cwd <当前工作区绝对路径>`，记下 CLI 项目 id 和根目录。不带 `--cwd` 的结果不能当作这次核对。
2. 读取 MCP `memorix_project_context`，记下它绑定的项目 id 和根目录。
3. 两边都必须等于当前工作区。CLI 报本项目已有活动会话，不能代替这次核对。
4. 有一边不是，停止 `memorix_store` 和 `memorix_resolve`。向用户展示两边的项目 id 与根目录，确认后第一件 MCP 调用才是 `memorix_session_start`，`projectRoot` 传当前工作区绝对路径。
5. `session_start` 会关闭该项目上一个活动会话。确认前不调用。
6. 绑定成功后再次核对。仍不一致就停止，不写。
7. 本会话工具列表里没有 memorix MCP 时，跳过第 2–6 步。不调用 `memorix_session_start`，也不运行 `memorix session start`。只读和已经确认的存储直接走 CLI，并带同一条 `--cwd`。只有 MCP 工具在列表里且 `session_start` 失败，才改为 CLI。两种情况都不能靠进程当前目录。

分区由显式路径决定，不由 agent 自称的工作区决定。同一个数据目录下，两个 git 根是两条记忆分区。CLI 与 MCP 用同一个路径，参数名不同：

- CLI：会读出或写入项目分区的命令都必须带 `--cwd <当前工作区绝对路径>`，包括 `status`、`session context`、`context`、`search`、`memory detail`、`memory store`。不带 `--cwd` 等于未指定分区。
- MCP：工具没有 `--cwd`。对应参数是 `memorix_session_start` 的 `projectRoot`，值必须和 `--cwd` 是同一条绝对路径。绑定前的 MCP 读写不算已经对准当前工作区。

CLI 打印出的项目 id 或根目录有一项不等于当前工作区，就停在第 4 步，不写。

store 之前必须能说清四件事：

| 字段         | 要求                                                   |
| :----------- | :----------------------------------------------------- |
| `entityName` | 归属实体，稳定、可复用，不用一次性临时词               |
| `type`       | gotcha / decision / problem-solution / what-changed 等 |
| `title`      | 5–10 个词，能独立读懂                                  |
| `narrative`  | 发生了什么、为什么、如何验证、以后要记住什么           |

补充约定：

- 有明确演进主题时用 `--topic-key` 做 upsert。同一 git 项目、同一主题键更新原记录。没有这个键才新建。
- 进度类写入用 `progress.feature/status/completion`，不要把进度写进 narrative。
- 不写密钥、token、连接串、完整用户主目录；路径用占位符。
- 写入前展示「实体 / 类型 / 标题 / 摘要 / 影响范围」，用户确认后才调用。

### 并发写入与字段卫生

多个 agent 可以同时读同一个数据目录。写入仍只落在 `--cwd` 或 `projectRoot` 指向的那一个项目分区。

- `filesModified` 只传这次真实写入的文件。正文里的文件名、只读路径和命令表达式会被收进这个字段。写完用 detail 回读。字段里出现没有写过的路径时，停止，把这份字段给用户看，不要再插入一条去解释。
- `--topic-key` 写成「用途/对象」。不要用裸实体名。裸实体名会让下一次写入覆盖别人的那一行，而不是新增。
- 同一项目、同一实体已经有活动记忆时，不追加第二条去纠正。先 detail 已有 id，向用户确认是更新那一条，还是停止。
- 不 resolve、不归档不是本对话写入的 id。不在正文里宣布别人的编号已归档或禁止引用。
- 方案和判据写成仓库相对路径加章节。不用 A/B/C/D/E。不把别的 observation 编号写成依据。
- 废止一句旧结论时，新正文不重复那句旧口号，也不重复错误路径。
- 删除 observation 行不会把下一号拨回去。日常写入不改编号计数器。要复用被删区间，另得用户确认，改计数器，重启进程，再复读最大号和下一号。

resolve 之前必须展示：目标 id、当前状态、目标状态、后继关系（若有）。resolve 不改内容，只改状态；归档场景另受 retention 域硬门约束。

## CLI 兜底

MCP 工具不在本会话工具列表里、宿主未暴露或连接异常时，直接用本节命令。不要先补一次 `session start`。`memory store` 不创建会话；`session start` 会关掉该项目上一个活动会话，只有用户明确要开会话时才跑。

1. 先读 `memorix --version`。除存储以外的命令，再读 `memorix <command> --help`，参数以这次帮助为准，不照抄旧文档。
2. 存储走下面这条命令。`memorix memory store --help` 打印的是 memory 动作总览，不列出 `--entity` 和 `--topic-key`。`memorix remember --help` 只列出 `--title`、`--type`、`--visibility`、`--json`。这两份帮助都不是主题键更新的参数合同。
3. 在结论中标注「本次走 CLI 兜底」，避免后续误以为 MCP 链路健康。

```bash
memorix memory store --cwd <git 项目> --entity <实体> --type <类型> --title "<标题>" --topic-key <主题键> --text "<正文>"
```

- `memorix remember` 不是 upsert 入口。它不转发 `--entity` 和 `--topic-key`。
- 主题键只在 `--cwd` 指向的那个 git 项目里查找。指错项目会插入新记录。MCP store 的主题键同样只在当前绑定项目里查找。

示例（只读）：

```bash
memorix context --cwd <当前工作区绝对路径>
memorix search --cwd <当前工作区绝对路径> --query "shim 劫持" --json
memorix memory detail --cwd <当前工作区绝对路径> --id 123
```

## 失败分支

| 现象               | 先查                                         | 不要做                                           |
| :----------------- | :------------------------------------------- | :----------------------------------------------- |
| 搜不到预期记忆     | 项目绑定、scope、query 用词、是否 fuzzy-only | 直接重建索引或改 embedding                       |
| 详情 id 不存在     | 是否跨项目、是否已 archived                  | 反复 search 猜 id                                |
| 写入报 schema 错   | 当前 `--help` 的必填字段                     | 猜字段名、塞文本兜底                             |
| 写入成功但检索不到 | 索引健康、embedding 状态、是否需要强制刷新   | 立刻重复写入制造重复条目                         |
| 帮助里看不到主题键 | 存储以本文件的存储命令为准                   | 改走 `memorix remember`，或据此判定 CLI 不能更新 |

跨域问题（索引健康、embedding、存储）转到 health 与 retrieval 域处理，不在本文件内顺手改配置。
