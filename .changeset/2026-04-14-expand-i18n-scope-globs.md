---
"@ruan-cat/commitlint-config": minor
---

1. 为 `i18n` 提交范围补充常见的 glob 匹配规则，覆盖 Vite、Vue、Nuxt 项目里常见的 `locales`、`lang`、`i18n` 目录，以及 `i18n.ts`、`plugins/i18n.ts`、`i18n.config.ts` 等国际化入口文件。
2. 为国际化范围新增回归测试，确保常见目录结构能够稳定匹配到 `i18n` scope。
