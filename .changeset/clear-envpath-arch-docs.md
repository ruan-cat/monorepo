---
"@ruan-cat/vercel-deploy-tool": minor
---

- 恢复 deploy 命令 `--env-path` 支持，允许显式指定 dotenv 文件并通过 `VERCEL_DEPLOY_TOOL_ENV_PATH` 参与配置加载。
- 在配置加载流程中整合 dotenvx 与 c12 的优先级，完善多环境变量合并策略。
- 新增/完善架构与运行流程文档（含 mermaid 流程与引用图），指导使用与环境变量策略。
