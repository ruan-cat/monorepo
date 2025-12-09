---
"@ruan-cat/utils": minor
---

**修复：将 `isMonorepoProject` 函数限制为仅在 Node.js 环境中使用**

## 问题说明

在 4.18.0 版本中，`isMonorepoProject` 函数从主入口 (`@ruan-cat/utils`) 导出，导致在浏览器环境的构建中引入了 Node.js 特定的依赖（`tinyglobby`、`node:path`、`node:fs`）。这会导致 Vite/Nitro 构建失败，报错：`"createRequire" is not exported by "__vite-browser-external"`。

详细的故障分析请参考：[Nitro 构建故障报告](https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-12-09-nitro-build-ruan-cat-utils-version-fix.md)

## 重大变更

- **从主入口移除 `isMonorepoProject` 导出**：主入口 (`@ruan-cat/utils`) 不再导出 `isMonorepoProject` 函数，避免在浏览器环境中引入 Node.js 特定代码
- **仅在 Node.js 专用路径导出**：`isMonorepoProject` 现在只能从以下路径导入：
  - `@ruan-cat/utils/node-esm` - 适用于 Node.js ESM 环境
  - `@ruan-cat/utils/node-cjs` - 适用于 Node.js CommonJS 环境

## 迁移指南

如果你之前从主入口导入 `isMonorepoProject`：

```typescript
// ❌ 旧的导入方式（不再支持）
import { isMonorepoProject } from "@ruan-cat/utils";
```

请改为从 Node.js 专用路径导入：

```typescript
// ✅ Node.js ESM 环境
import { isMonorepoProject } from "@ruan-cat/utils/node-esm";

// ✅ Node.js CommonJS 环境
import { isMonorepoProject } from "@ruan-cat/utils/node-cjs";
```

## 构建产物验证

- 主入口 `dist/index.js` 不再包含 `tinyglobby`、`node:path`、`node:fs` 等 Node.js 特定代码
- `isMonorepoProject` 函数仍然在 `dist/node-esm/index.js` 和 `dist/node-cjs/index.cjs` 中正常导出

## 文档

新增 `packages/utils/src/monorepo/index.md` 文档，详细说明了 `isMonorepoProject` 的正确使用方式。
