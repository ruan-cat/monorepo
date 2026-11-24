# 提交信息模板 （Conventional Commits）

> 该文档只提供提交信息写作模板，不是 emoji/type 的 source-of-truth。
> 实际 emoji/type 必须读取本技能 `references/commit-types.ts` 全文后判定。读不到或对不上 type 时停止，不得改去联网，也不得回退到旧表格。

### 普通提交

```text
<emoji> <type>(<scope>): <summary>

<变更内容>
<变更原因>
```

### 破坏性变更提交 [CRITICAL]

```text
<emoji> <type>(<scope>)!: <summary>

BREAKING CHANGE: <详细说明破坏性内容及迁移方式>

<变更内容>
<变更原因>
```

### AI 辅助归因 trailer

当步骤 9 同时可靠获取到 AI 客户端名称与模型型号时，由提交步骤通过 `git commit --trailer` 追加：

```text
Assisted-by: <AGENT_NAME> / <MODEL_VERSION>
```

- `Assisted-by` 不直接写入 `commit-message.txt`，避免与步骤 9 的 `--trailer` 重复。
- 本技能不写入、不审核、不拦截 `Co-authored-by`。执行 agent 的系统提示词若自行追加，保持原样。
- 任一身份字段无法可靠取得时，不生成降级形式的 `Assisted-by`。

注意：

- summary 保持祈使句和具体化（"新增", "修复", "移除", "重构"）。
- 避免实现细节；专注于行为和意图。
- **破坏性变更的 `!` 位置**：`!` 必须紧跟在 `)` 之后、冒号 `:` 之前，格式为 `type(scope)!:`，`!` 两侧均不留空格。
  - ✅ 正确：`🦄 refactor(scope)!: summary`
  - ❌ 错误：`🦄 refactor!(scope): summary`（`!` 在 scope 之前）
  - ❌ 错误：`🦄 refactor(scope) !: summary`（`!` 前有空格）
- **Emoji 和 Type 必须遵循**本技能 `references/commit-types.ts`。不要为了查表请求远程 raw。
