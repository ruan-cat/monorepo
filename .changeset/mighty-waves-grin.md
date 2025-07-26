---
"@ruan-cat/vercel-deploy-tool": minor
---

1. 不再从 `--env-path` 配置内获取环境变量。
2. 不再从 `dotenvConfig` 函数内获取环境变量，一律从 `process.env` 内获取环境变量
