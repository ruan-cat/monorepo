# 2026-11-22 给 use-memorix 补上 [retrieval] 配置说明

## 1. 背景

中文排序已经在 memorix 1.10.4 里。用户级 `config.toml` 可以写 `[retrieval]`。全局技能 `use-memorix` 的 retrieval 参考只写了 embedding 诊断和黄金集，没有告诉执行代理这两个字段是什么、能改什么、不能顺手改什么。

本包只补这一段说明。黄金集初始化、mirror 导出、本机 toml 已经在 `ruan-cat/common` 做完，不属于本包。

同日另有 `docs/plan/2026-11-22-fix-use-memorix-01/` 和 `docs/plan/2026-11-22-fix-use-memorix-02/`。它们改会话和项目绑定。本包不碰那些文件。

## 2. 目标

在技能事实源补一段可执行的配置说明。执行代理读完后，知道 `[retrieval]` 写在哪、两个字段的含义，以及改文件前必须先确认。

写集只有一个文件：

`ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md`

插入位置：`## Embedding` 的动作表之后、`判定顺序（不要跳步）` 之前。新增 `### 用户级检索策略`。

插入正文以本节为准，不要改写用词：

```markdown
### 用户级检索策略

`~/.memorix/config.toml` 与项目 `memorix.toml` 都能写 `[retrieval]`，项目覆盖用户。环境变量 `MEMORIX_RETRIEVAL_CJK` / `MEMORIX_RETRIEVAL_ASCII` 再覆盖文件。非法值忽略，不要自行发明第三个取值。

​`toml
[retrieval]
cjk = "vector"
ascii = "hybrid"
​`

- `cjk = "vector"`：中文查询走向量近邻序。这是默认。
- `ascii = "hybrid"`：英文继续 hybrid。
- 查看当前文件可以读。改这两个字段必须先展示将写入的段落，得到确认后再写。
- 不要把 embedding 的 `base_url` 改成原生 embed 路径。不要把进程级驻留改成几分钟。这两件不是 `[retrieval]` 的事。
```

上面展示用了零宽字符，避免本规格文件的围栏被提前闭合。落地时写成普通 Markdown 围栏，不要把零宽字符写进技能文件。

## 3. 非目标

- 不改 `SKILL.md`，不改七域路由表。
- 不改 `session-and-reasoning.md`、`memory-operations.md`，也不改 01、02 两个任务包。
- 不改 `~\.agents\skills\use-memorix` 或任何已安装副本。
- 不运行 `skills add`。
- 不改本机 `config.toml`，不初始化黄金集，不导出 mirror。
- 不把 observation id、查询原文、本机路径写进技能。
- 不提交，不推送，不暂存本包之外的既有改动。
- 不创建 `agent-progress.md`、`agent-findings.md`、`tasks.md` 或 OpenSpec change。

## 4. 验收

- 技能文件里 `### 用户级检索策略` 只出现一次，位置在 Embedding 动作表和判定顺序之间。
- 正文含 `cjk = "vector"` 与 `ascii = "hybrid"`，并写明改文件前要确认。
- `SKILL.md` 无 diff。
- 该文件不含 observation id，不含盘符用户目录。
