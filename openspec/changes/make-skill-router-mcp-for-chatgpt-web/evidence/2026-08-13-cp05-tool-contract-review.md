# 2026-08-13 CP-05 tool contract review

本证据由 Codex（GPT-5）记录。

## 2026-08-13 初始工具契约审计

- 与本次实现开始前的远程 `dev` 基线相比，`skill-router-mcp` 及其四项工具是新增能力，不存在已保存的 ChatGPT 工具契约可做“无差异”结论。
- 当前 canonical 工具目录由 `toolDefinitions` 单一来源生成：`get_server_info`、`list_skills`、`search_skills`、`load_skill`；所有工具均声明只读、非破坏性 annotation。
- 本地 SDK client contract、workerd 测试、production harness 和线上 production smoke 均已覆盖初始化与 `tools/list`，并验证四项工具可发现和调用。
- 因为这是新的工具契约，ChatGPT Developer Mode 必须执行首次连接/refresh/rescan；在该外部产品会话实际完成前，不把本地或线上 MCP 客户端结果冒充为 ChatGPT/Workspace 审核证据。
