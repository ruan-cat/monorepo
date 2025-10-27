---
"@ruan-cat/claude-notifier": patch
---

修复生产环境资源路径问题，并重构路径查找逻辑：

- 修复：生产环境下无法找到 assets 内的图片和音频资源
- 重构：提取公共的路径查找逻辑到 `src/config/utils.ts`
- 新增：`findResourceDir()` 工具函数，统一处理开发环境和生产环境的路径差异
- 优化：简化 `sounds.ts` 和 `icons.ts` 的代码，提升可维护性
- 文档：更新 `architecture.md`，详细说明路径查找策略和技术背景
