---
"@ruan-cat/commitlint-config": minor
---

为提交类型配置添加语义化版本号支持

**新增功能**

- 新增 `changelogen` 依赖，用于语义化版本号管理
- 在 `CommitType` 接口中添加 `semver` 字段，支持指定版本号 bump 类型
- 为各个提交类型配置了对应的语义化版本号策略：
  - `feat` → `minor`（次版本号）
  - `fix`, `deps`, `build`, `refactor`, `perf`, `init`, `config`, `chore` → `patch`（修订号）

**技术细节**

- 导入 `SemverBumpType` 类型定义从 `changelogen`
- `semver` 字段为可选字段，保持向后兼容性
- 支持与 changelogen 工具的集成，实现自动化版本号管理
