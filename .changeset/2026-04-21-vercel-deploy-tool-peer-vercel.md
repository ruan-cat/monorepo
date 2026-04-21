---
"@ruan-cat/vercel-deploy-tool": major
---

1. 重大变更：不再把 `vercel` 作为内部依赖随包安装，改为要求使用方项目显式安装 `vercel` peer dependency。
2. 增加 Vercel CLI 版本预检，部署前会校验本地 CLI 至少为 `47.2.2`，避免上传阶段才被 Vercel 服务端拒绝。
3. 更新安装文档与 GitHub Actions 示例，推荐使用 `vercel@latest` 并在 CI 中输出 `pnpm exec vercel --version` 便于排查。
