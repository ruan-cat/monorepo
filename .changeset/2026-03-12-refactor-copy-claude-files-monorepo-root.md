---
"@ruan-cat/vitepress-preset-config": patch
---

1. 重构 `copy-claude-files.ts` 内部的 monorepo 根目录定位逻辑，移除包内重复维护的 `findMonorepoRoot()` 私有实现，改为直接复用 `@ruan-cat/utils/monorepo` 提供的公共函数。
2. 通过复用工具包内统一维护的根目录寻址能力，`copyClaudeFiles()` 在从嵌套子项目目录运行时，将与仓库内其他脚本保持一致的根目录判定行为，减少不同包各自维护同一套向上查找逻辑带来的实现漂移和后续维护成本。
3. 本次重构不会改变 `copyClaudeFiles()` 的对外调用方式和已有参数语义，原有 `rootDir` 显式传参、自动向上查找 monorepo 根目录、以及查找失败时回退到 `process.cwd()` 的行为保持不变，但底层实现改为共享公共工具函数。
