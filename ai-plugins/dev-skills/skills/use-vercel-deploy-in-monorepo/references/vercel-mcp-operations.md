# Vercel MCP 操作边界

## 定位

Vercel MCP 是项目、部署和日志的辅助读取通道，不是配置写入的默认控制面。先枚举当前客户端实际暴露的工具及参数；工具名、返回字段和可用权限会随客户端变化，不能把 MCP 配置存在当成已就绪或有写权限。运行时枚举优先，再以 [Vercel 官方 MCP tools](https://vercel.com/docs/agent-resources/vercel-mcp/tools) 页面复核公开能力边界。

当前公开读取/诊断能力包括团队与项目查询、部署列表与部署详情、构建日志和运行时日志。可用时用它辅助确认目标团队、Project、部署状态、commit 元数据和日志；不可用时直接回退到 CLI/API，不把“工具缺失”误判为项目不存在。

## 明确禁止的能力推断

- MCP 的 list/get 项目返回不能证明 Settings 已写入；Settings 更新仍按[Settings 写回](vercel-project-settings-writeback.md)走 CLI API 或直接 REST 的 GET → compare → PATCH → GET → inspect。
- MCP 当前公开工具清单没有 Shared Environment Variable 的查询、增量 link、写后回读能力。**MCP 不得被描述为能 Link Shared Variable。** 该操作只可在运行时验证存在专用写工具且能回读时新增路径；否则走[共享环境变量](vercel-shared-environment-variables.md)的 REST 流程或停止等待具备权限的操作者。
- MCP 触发本地/Prebuilt 部署只属于辅助链，READY 不等于 Vercel Git Integration 已验收。

## 建议顺序

1. 用 MCP 或 CLI/API 确认目标团队与目标 Project。
2. 用 CLI/API 完成单槽 link、Settings 与共享变量的严格 gate。
3. 用 MCP 辅助查看 Git-triggered deployment、构建日志和运行时日志。
4. 若 MCP 返回与 CLI/API 不一致，以 API/CLI 的可复核响应为准，停止写入并记录差异。
