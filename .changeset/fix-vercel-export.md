---
"@ruan-cat/vercel-deploy-tool": patch
---

修复包导出：恢复 main/types 指向构建产物并为 require/default 提供入口，避免 `No "exports" main defined` 导致的部署失败。
