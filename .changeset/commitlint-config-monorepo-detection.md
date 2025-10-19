---
"@ruan-cat/commitlint-config": minor
---

更改处理 monorepo 项目的识别逻辑

- 新增独立的 monorepo 项目判别函数
- 判别逻辑更新为：同时满足以下条件时才认定为 monorepo 项目
  - 项目根目录存在 `pnpm-workspace.yaml` 文件
  - `pnpm-workspace.yaml` 文件中提供了有效的 packages 匹配配置
- 提高了 monorepo 项目识别的准确性和可靠性
