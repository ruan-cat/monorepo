---
"@ruan-cat/claude-notifier": patch
---

修复云端环境中文档构建失败的问题

在根包的 package.json 中添加 @ruan-cat/claude-notifier 作为 devDependencies，确保 turbo deploy-vercel 命令能够正确识别并执行该包的 build:docs 任务。

**技术细节**：

- Turbo 的 `^build:docs` 依赖解析基于 package.json 的依赖声明
- 只有在根包中声明的工作区包才会被包含在根任务的依赖图中
- 本次修复确保 GitHub Actions 工作流能够正确部署 claude-notifier 的文档站点

**相关文档**：

- 详细事故报告：docs/incident-reports/2025-10-28-claude-notifier-build-docs-failure.md
