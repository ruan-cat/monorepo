---
"@ruan-cat/commitlint-config": minor
---

feat: 新增 CLI 初始化命令

- 添加 `init` 命令，支持快速初始化 commitlint 配置文件
- 支持通过 `pnpm dlx @ruan-cat/commitlint-config init` 或 `npx @ruan-cat/commitlint-config init` 使用
- 自动复制 `.czrc` 和 `commitlint.config.cjs` 模板文件到当前目录
- 提供友好的控制台输出和文件覆盖警告
- 增加完整的中文注释和错误处理
