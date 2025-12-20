---
"@ruan-cat/commitlint-config": minor
---

1. 新增 `changelogen-use-types.ts` 文件，为 `@ruan-cat/commitlint-config` 包提供 changelogen 工具集成支持
2. 导出 `ChangelogogenUseTypes` 类型和 `changelogogenUseTypes` 常量对象，将现有的 `commitTypes` 转换为 changelogen 所需的格式
3. 筛选特定提交类型（feat、fix、refactor、build、config），为每个类型提供 emoji、描述和版本号信息，优化 changelog 生成体验
