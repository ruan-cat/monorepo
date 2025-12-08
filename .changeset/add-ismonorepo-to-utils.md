---
"@ruan-cat/utils": minor
---

新增 `isMonorepoProject` monorepo 检测工具函数

- 新增 `monorepo.ts` 模块，提供 `isMonorepoProject` 函数用于检测当前项目是否为 pnpm monorepo 项目
- 该工具函数在默认环境（ESM）以及 CJS 环境内均可使用
- 从 `@ruan-cat/utils` 或 `@ruan-cat/utils/node-cjs` 均可导入使用
- 新增 `glob` 依赖以支持 workspace 包匹配功能
