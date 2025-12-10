---
"@ruan-cat/commitlint-config": minor
---

为 `commitlint` 范围规则添加更多匹配项。

- 为 `openspec` 提示词文档配置添加新的范围支持（glob: `**/openspec/**/*.md`）
- 为 `vitepress` 配置增加 `config.ts` 文件匹配（之前只支持 `config.mts`）
- 为 `claude` 配置增加 `.claude-plugin/**` 和 `CLAUDE*.md` 匹配规则（之前只支持 `.claude/**` 和 `CLAUDE.md`）
