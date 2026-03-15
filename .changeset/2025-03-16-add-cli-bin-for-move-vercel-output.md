---
"@ruan-cat/utils": minor
---

1. 新增 CLI 命令行工具，通过标准 `bin` 字段提供 `ruan-cat-utils` 和 `move-vercel-output-to-root` 两个可执行命令
2. 新增 `src/cli/index.ts` 统一 CLI 入口和 `src/cli/move-vercel-output-to-root.ts` 快捷命令入口
3. 新增 `tsup.config.ts` 中的 CLI 构建配置，构建产物自动注入 `#!/usr/bin/env node` shebang
4. 移除 `exports` 中的 `"./move-vercel-output-to-root"` 导出入口，该脚本现在统一通过 `bin` 命令调用
5. 编程式调用请改用 `import { moveVercelOutputToRoot } from "@ruan-cat/utils/node-esm"`
6. 废弃 `tsx @ruan-cat/utils/move-vercel-output-to-root` 调用方式，该方式在 monorepo 子包内会因 CLI 路径解析与模块解析的差异导致 `ERR_MODULE_NOT_FOUND` 错误
