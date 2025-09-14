---
"@ruan-cat/commitlint-config": minor
---

## 添加基于 glob 模式的智能范围匹配功能

新增功能:

- 支持根据 commonScopes 配置中的 glob 字段自动匹配文件路径
- 当文件匹配到 glob 模式时，自动添加对应的提交范围
- 保留现有的包路径匹配逻辑，实现范围的叠加匹配

示例:

- `configs-package/commitlint-config/prompts/test.md` → 匹配到 `commitlint-config` + `prompt`
- `packages/utils/turbo.json` → 匹配到 `utils` + `config` + `turbo`
