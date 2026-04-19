# 提交信息模板 (Conventional Commits)

> 该文档只提供提交信息写作模板，不是 emoji/type 的 source-of-truth。
> 实际 emoji/type 必须读取远程 raw `commit-types.ts` 全文后判定；如果抓取失败或无法可靠定位，必须停止提交流程，不得回退到旧表格。

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

注意：

- summary 保持祈使句和具体化（"新增", "修复", "移除", "重构"）。
- 避免实现细节；专注于行为和意图。
- **破坏性变更的 `!` 位置**：`!` 必须紧跟在 `)` 之后、冒号 `:` 之前，格式为 `type(scope)!:`，`!` 两侧均不留空格。
  - ✅ 正确：`🦄 refactor(scope)!: summary`
  - ❌ 错误：`🦄 refactor!(scope): summary`（`!` 在 scope 之前）
  - ❌ 错误：`🦄 refactor(scope) !: summary`（`!` 前有空格）
- **Emoji 和 Type 必须遵循** [raw commit-types.ts](https://raw.githubusercontent.com/ruan-cat/monorepo/dev/configs-package/commitlint-config/src/commit-types.ts) 中的定义。
