# 2026-08-13 CP-05 tool contract review

本证据由 Codex（GPT-5）记录。

## 2026-08-13 初始工具契约审计

- 与本次实现开始前的远程 `dev` 基线相比，`skill-router-mcp` 及其四项工具是新增能力，不存在已保存的 ChatGPT 工具契约可做“无差异”结论。
- 当前 canonical 工具目录由 `toolDefinitions` 单一来源生成：`get_server_info`、`list_skills`、`search_skills`、`load_skill`；所有工具均声明只读、非破坏性 annotation。
- 本地 SDK client contract、workerd 测试、production harness 和线上 production smoke 均已覆盖初始化与 `tools/list`，并验证四项工具可发现和调用。
- 因为这是新的工具契约，ChatGPT Developer Mode 必须执行首次连接/refresh/rescan；在该外部产品会话实际完成前，不把本地或线上 MCP 客户端结果冒充为 ChatGPT/Workspace 审核证据。

## 2026-08-13 Developer Mode 首次扫描与复评

- ChatGPT Developer Mode 首次创建应用时完成了真实工具扫描；连接详情页显示四项工具及其输入架构、只读属性和 public 可见性。
- 扫描到的工具名称与 canonical `toolDefinitions` 一致：`get_server_info`、`list_skills`、`search_skills`、`load_skill`。
- 真实对话先调用 `get_server_info`，再调用 `search_skills`、`list_skills` 和 pinned `load_skill`；工具调用列表显示请求与响应，未出现名称、输入架构或只读注释不一致。
- 本次是首次开发模式扫描，不存在旧工具快照需要比较；因此 5.4 的 refresh/rescan 与重新评估门禁已获得产品侧证据。
