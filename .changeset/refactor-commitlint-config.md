---
"@ruan-cat/commitlint-config": minor
---

内部代码重构

- 将 `isMonorepoProject` 函数迁移至 `@ruan-cat/utils` 包
- 现在从 `@ruan-cat/utils/node-cjs` 导入 `isMonorepoProject` 函数
- 相关测试用例也已迁移至 `@ruan-cat/utils` 包
