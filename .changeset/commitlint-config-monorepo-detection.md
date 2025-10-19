---
"@ruan-cat/commitlint-config": minor
---

更改处理 monorepo 项目的识别逻辑

## 新增功能

- **新增独立的 monorepo 判别函数** `isMonorepoProject()`
  - 统一了 monorepo 项目的识别逻辑，避免代码重复
  - 位置：`src/utils.ts`，可通过包导出使用

## 判别逻辑优化

更严格的 monorepo 识别标准，同时满足以下三个条件：

1. 项目根目录存在 `pnpm-workspace.yaml` 文件
2. `pnpm-workspace.yaml` 中的 `packages` 字段存在且不为空数组
3. **至少能匹配到一个 `package.json` 文件**（新增条件）

以下情况不再认定为有效的 monorepo 项目：

- `packages: []`（空数组配置）
- `packages: ['!**/*']`（仅包含排除模式）
- 配置的 glob 模式匹配不到任何 `package.json` 文件

## 代码重构

- 重构 `getPackagesNameAndDescription()` 使用新的判别函数
- 重构 `getPackagePathToScopeMapping()` 使用新的判别函数
- 减少重复代码，提高可维护性

## 错误处理改进

- 当 `pnpm-workspace.yaml` 格式错误时，会抛出包含详细错误信息的异常
- 帮助开发者更快定位配置问题

## 测试覆盖

- 新增 9 个测试用例覆盖 monorepo 识别逻辑
- 测试文件：`src/tests/check-monorepo.test.ts`
- 包括集成测试、边界情况测试和错误处理测试

## 破坏性变更

⚠️ **更严格的识别逻辑**：如果项目的 `pnpm-workspace.yaml` 配置的 packages 匹配不到任何文件，现在会被识别为非 monorepo 项目（之前仅检查文件是否存在）。这种情况在实际项目中极少出现，如果遇到说明配置本身存在问题。
