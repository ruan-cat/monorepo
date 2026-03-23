---
"@ruan-cat/utils": minor
---

1. 新增 `relizy-runner`：在调用 `relizy` 前补齐 Windows 下 GNU 工具（grep / head / sed）路径，并在 `release` / `bump` 前校验 independent 基线 tag；通过 `bin` 暴露 `relizy-runner`，并在 `ruan-cat-utils` 中增加 `relizy-runner` 子命令。
2. 新增生产依赖 `pkg-types`，与既有 `pnpm-workspace-yaml`、`consola` 配合解析工作区与子包信息。
3. 在 `packages/utils/src/node-esm/scripts/relizy-runner` 下提供脚本实现、说明文档与 Vitest 测试用例；`@ruan-cat/utils/node-esm` 导出相关 API。
