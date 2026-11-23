# Embedding、项目黄金集与检索捕获

本文件负责检索质量治理：embedding 诊断、项目黄金集、ZCode 自动捕获、非 ZCode 交互采集、审核与联邦导出。

## Embedding

| 动作                               | 授权   |
| :--------------------------------- | :----- |
| 查看 provider / 模型 / 维度 / 状态 | 自动   |
| 用黄金集跑评测并解释结果           | 自动   |
| 改 provider、换模型、下载模型      | 需确认 |
| 清缓存、重建索引、执行 repair      | 需确认 |

### 用户级检索策略

`~/.memorix/config.toml` 与项目 `memorix.toml` 都能写 `[retrieval]`，项目覆盖用户。环境变量 `MEMORIX_RETRIEVAL_CJK` / `MEMORIX_RETRIEVAL_ASCII` 再覆盖文件。非法值忽略，不要自行发明第三个取值。

```toml
[retrieval]
cjk = "vector"
ascii = "hybrid"
```

- `cjk = "vector"`：中文查询走向量近邻序。这是默认。
- `ascii = "hybrid"`：英文继续 hybrid。
- 查看当前文件可以读。改这两个字段必须先展示将写入的段落，得到确认后再写。
- 不要把 embedding 的 `base_url` 改成原生 embed 路径。不要把进程级驻留改成几分钟。这两件不是 `[retrieval]` 的事。

判定顺序（不要跳步）：

1. 数据是否真的缺失：用 `memory detail` 查具体 id，而不是靠 search 未命中。
2. 项目绑定是否正确：`memorix status`。
3. 索引是否健康：`doctor` 与索引状态。
4. 是否只是 fuzzy-only 假召回：看 `matchedFields`。
5. 才是 fallback / generation 链路是否降级。

不要因为一次 lexical 命中失败就改 provider。任何 provider / 缓存 / 索引修复都必须精确到动作级确认。

## 项目黄金集

### 创建时机

只在普通项目首次出现**真实检索失效**时才提出初始化。真实失效是可复核的判断，不是空想例子。创建 tracked 文件与合并 `.gitignore` 前要确认。

### 目录合同

```text
.memorix/
├── hooks.json                         # 既有软保留路径，必须保留
└── golden-set/
    ├── README.md                      # tracked
    ├── cases.json                     # tracked；项目 canonical
    └── .local/                        # ignored
        ├── inbox/
        ├── promoted/
        ├── rejected/
        └── logs/
```

`.gitignore` 只增量加入：

```gitignore
.memorix/golden-set/.local/
```

不得忽略 `README.md` 或 `cases.json`，不得删除或忽略 `.memorix/hooks.json`。

### 冻结 schemaVersion

```text
memorix-golden-set-case/v1
memorix-retrieval-candidate/v1
memorix-golden-set-bundle/v1
```

这三个字符串由 `src/golden-set/contracts.mjs` 唯一导出。下游只能逐字消费，不得自创平行版本。

### case 最小化

- query 保存脱敏后的原文。
- 期望以 topicKey、entity、type、标题关键词、concept 关键词等语义锚点为主；`expected.mustMatch` 至少一项。
- observationId 只能放在 `localHints.observationIds`，仅作本机提示。
- 不保存结果正文、完整 observation、token、header、绝对主目录或数据库路径。
- `project.repository` 必须是 `owner/repository` 形式，不是 URL 或本机路径。
- `id` 单项目内唯一，小写 kebab-case；`failureKinds` 至少一项且不重复。

## 检索捕获

### host 边界

| host                                                                  | 自动 hook | 交互式采集 |
| :-------------------------------------------------------------------- | :-------- | :--------- |
| ZCode                                                                 | 支持      | 支持       |
| Claude Code / Codex / Cursor / Antigravity / Trae / Qoder / WorkBuddy | 不支持    | 支持       |

WorkBuddy 只能作为 `host: "workbuddy"` 走交互式 preview/apply，没有 hook，不安装模板，不宣称自动支持。

### 结构判定（冻结）

归一化字段固定为 `candidateCount`、`topN[].channel`、`fallbackUsed`、`generationStatus`；只读 `tool_response.structuredContent`。

```ts
zeroCandidate = enabled(candidateCount) && candidateCount === 0;
fuzzyOnly = enabled(topN.channel) && candidateCount > 0 && topN.every((item) => item.channel === "fuzzy");
fallbackGeneration =
	enabled(fallbackUsed, generationStatus) &&
	(fallbackUsed === true || ["fallback", "generated", "generation-error"].includes(generationStatus));
```

- fuzzy-only 必须有至少一个 candidate；空集合不得因 `every()` 真空真而命中。
- channel 缺失、混合或未知时禁用 fuzzy-only，不猜测。
- fallback-generation 只接受上述布尔与枚举；未知字符串禁用该规则，不做 substring 匹配。
- 三条规则都不可用时整体 fail-open：exit 0，不产生 candidate。
- 禁止回退到 `tool_response.content`、console 文本或正则解析自然语言。

### 捕获产物

- 自动 hook 必须是 `host: "zcode"` + `captureMode: "automatic-hook"`。
- `candidateId` 由 validator 重算：`sha256(sourceProject + "\n" + captureDate + "\n" + query.redactedOriginal)`。
- `captureDate` 为 `YYYY-MM-DD`，`capturedAt` 为可解析 ISO 8601，两者 UTC 日期一致。
- top-N 最多 5 条，只存 `ref`、`channel`、`score`、`matchedFields`。
- 写入 `.memorix/golden-set/.local/inbox/<candidateId>.json`；已存在即跳过。
- hook 不移动候选、不写 `cases.json`、不调用 Memorix、不跑 shell、不联网、不起后台进程。

### 非 ZCode 交互采集

```bash
node scripts/capture-interactive.mjs --host codex --project-root . --repository owner/repo \
  --query "..." --result-json ./result.json
```

默认只输出脱敏 preview；只有 `--apply --approval-token CAPTURE_INTERACTIVE_CANDIDATE` 才写同一 inbox schema。

### 留存

- 本地 candidate 保留 30 天，最多 500 条。
- 达到 500 条时停止新增并 fail-open，不自动删除。
- 清理由 operator 先预演（数量与日期边界），确认后执行。

## 审核与联邦导出

1. 审核候选时用 one-shot CLI 复跑同一脱敏 query，拿到当前真实结果。
2. 依据真实结果补 `expected`，人工确认后写入 tracked `cases.json`。
3. accepted 只在审核动作中发生；promoted 目录不是项目 canonical。
4. reject 的候选移入 `rejected/`，保留理由，不删除证据。
5. 联邦导出一次只导一个 accepted case，必须显式授权。

bundle 合同：

```text
sourceProject   owner/repository
sourceCommit    导出时产品项目的完整 Git commit SHA
case            不含 localHints 的 case
```

禁止把 `localHints`、observationId、候选日志、绝对路径、结果正文写进 bundle。本技能只生成 bundle，不写 common 仓库；跨仓回流需另行确认。

## 失败分支

| 现象                       | 处理                                                      |
| :------------------------- | :-------------------------------------------------------- |
| hook 没产生候选            | 先看 `.local/logs/` 诊断，确认 structuredContent 是否存在 |
| 候选重复                   | 同项目 + 同脱敏 query + 同捕获日天然去重，属预期          |
| 候选含敏感内容             | 立即停止审核，修正脱敏器并重跑，不入库                    |
| 黄金集评测与人工判断不一致 | 回到 detail 看真实正文，修正锚点，不改判分器              |
| 导出被拒                   | 检查是否残留 localHints 或非法 identity                   |
