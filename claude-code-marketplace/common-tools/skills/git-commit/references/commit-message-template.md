# 提交信息模板 (Conventional Commits)

```text
<emoji> <type>(<scope>): <summary>

<变更内容>
<变更原因>
```

注意：

- summary 保持祈使句和具体化（"新增", "修复", "移除", "重构"）。
- 避免实现细节；专注于行为和意图。
- 如果是破坏性变更：在头部使用 `!` 和/或添加 `BREAKING CHANGE:`页脚。
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
