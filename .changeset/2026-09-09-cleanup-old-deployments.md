---
"@ruan-cat/vercel-deploy-tool": minor
---

1. 新增「部署后自动清理旧部署」功能（deploymentCleanup 配置）的配套文档与发版日志，覆盖功能定位、配置示例与默认值、保留策略、vercel CLI 版本要求与删除红线。
2. 在 README 特性列表中新增一条入口，链接到清理旧部署文档页面。
3. 文档明确本功能与 clean-vercel-deployment-storage 技能的职责边界，并强调删除仅允许显式 url 列表、绝不以项目名整删的红线。
