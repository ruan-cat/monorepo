---
"@ruan-cat/domains": minor
---

1. 新增 `DeployPlatform` 类型（`"cloudflare" | "vercel"`），并在 `ProjectLikeDomain` 接口中添加 `deployPlatform` 可选字段，用于标注域名的部署平台。
2. 新增 VitePress 文档组件 `ProjectDomainDisplay.vue` 的平台徽章展示，使用 `@iconify/vue` 渲染 Vercel / Cloudflare 品牌图标。
3. 修复 `11comm` 项目中域名 `order` 字段重复问题，统一调整为 1→10 连续排序。
