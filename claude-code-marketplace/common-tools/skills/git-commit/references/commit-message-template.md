# 提交信息模板 (Conventional Commits)

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
- **Emoji 和 Type 必须遵循** [configs-package/commitlint-config/src/commit-types.ts](https://github.com/ruan-cat/monorepo/blob/dev/configs-package/commitlint-config/src/commit-types.ts) 中的定义。

| Emoji | Type      | Description |
| :---: | :-------- | :---------- |
|  ✨   | feat      | 新增功能    |
|  🐞   | fix       | 修复缺陷    |
|  📃   | docs      | 文档更新    |
|  📦   | deps      | 依赖更新    |
|  🧪   | test      | 测试相关    |
|  🔨   | build     | 构建相关    |
|  🐎   | ci        | 持续集成    |
|  📢   | publish   | 发布依赖包  |
|  🦄   | refactor  | 代码重构    |
|  🎈   | perf      | 性能提升    |
|  🎉   | init      | 初始化项目  |
|  🔧   | config    | 更新配置    |
|  🐳   | chore     | 其他修改    |
|  🔙   | revert    | 回退代码    |
|  🔪   | delete    | 删除垃圾    |
|  🌐   | i18n      | 国际化      |
|  🌈   | style     | 代码格式    |
|  🤔   | save-file | 保存文件    |
