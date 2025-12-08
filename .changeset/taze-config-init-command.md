---
"@ruan-cat/taze-config": major
---

🚀🚀🚀 添加 init 命令用于快速初始化配置。 🎉🎉🎉

- 新增 CLI 工具，提供 `init` 命令快速初始化 taze 配置
- 自动创建 `taze.config.ts` 配置文件
- 智能识别项目类型（monorepo 或标准项目）
- 根据项目类型自动在 `package.json` 的 `scripts` 中添加对应的 `up-taze` 命令
  - Monorepo 项目：`pnpm -w up @ruan-cat/taze-config -L && npx taze -r`
  - 标准项目：`pnpm up @ruan-cat/taze-config -L && npx taze -r`
- `up-taze` 命令自动插入到 `scripts` 对象的第一行
- 支持 `--force` 选项强制覆盖已存在的文件
- 新增完整的测试用例，覆盖两种项目类型的文件复制和命令写入
