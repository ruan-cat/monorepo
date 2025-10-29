---
"@ruan-cat/vitepress-preset-config": minor
---

重构 `addChangelog2doc` 函数的 markdown 数据写入 yaml 的实现方式

**主要变更：**

- 使用 `gray-matter` 库替代原有的 `writeYaml2md` 函数实现 YAML frontmatter 的写入
- 移除了 `lodash-es` 的数据合并逻辑，改为直接覆盖写入
- 新增 `data` 参数的默认值 `pageOrderConfig.changelog`，使用更加灵活
- 代码实现与 `writeYaml2PromptsIndexMd` 函数保持一致的风格和库选择
