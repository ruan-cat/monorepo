---
"@ruan-cat/vercel-deploy-tool": minor
---

统一 Vercel CLI 调用配置，抽取公共 spawn 选项（含 Windows shell/编码/stdout 管理），并将 link 命令改用 `--project` 参数，提升跨平台和 CLI 兼容性。
