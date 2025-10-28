---
"@ruan-cat/utils": patch
---

修复 package.json 中 types 字段路径拼写错误

## 问题描述

在 `exports` 字段中，主入口的 `types` 路径存在拼写错误，导致 TypeScript 编译器无法正确定位类型声明文件。

## 修复内容

将 `types` 字段路径从 `./dsit/index.d.ts` 更正为 `./dist/index.d.ts`

## 影响范围

此修复解决了依赖 `@ruan-cat/utils` 包的其他包（如 `@ruan-cat/vitepress-preset-config`）在构建时出现的类型声明文件找不到的错误。
