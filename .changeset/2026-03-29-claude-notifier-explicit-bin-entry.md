---
"@ruan-cat/claude-notifier": minor
---

1. 在 `package.json` 的 `bin` 中显式增加语义化短名入口 `claude-notifier`，与 `@ruan-cat/claude-notifier` 共同指向同一 CLI，使 npm / pnpm / yarn 全局安装后均可稳定使用短命令。
2. 更新 `src/docs/use/cli.md`：补充 CLI 双入口说明、将全局安装短名作为推荐用法，并调整 hooks 集成示例与最佳实践说明。
