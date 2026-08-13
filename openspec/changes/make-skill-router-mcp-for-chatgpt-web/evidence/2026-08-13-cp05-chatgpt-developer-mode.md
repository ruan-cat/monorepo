# 2026-08-13 CP-05 ChatGPT Developer Mode

本证据由 Codex（GPT-5）记录。文档先保留首次未登录时的阻断记录，随后追加用户登录后的真实产品侧验收；不以本地 SDK contract 替代外部证据。

## 2026-08-13 浏览器复核（首次未登录）

- 首次检查时 Codex 内置浏览器显示“登录”和“免费注册”，因此当时没有执行连接操作。

## 2026-08-13 Developer Mode 真实验收

- 用户随后在 Codex 内置浏览器完成 ChatGPT Pro 登录。
- 在 ChatGPT 设置中确认“开发人员模式”已开启；通过“插件 → 创建应用”创建了开发模式应用 `Skill Router MCP`。
- 应用连接地址为 `https://skill-router-mcp.1219043956.workers.dev/mcp`，认证方式为“无身份验证”，ChatGPT 显示“Skill Router MCP”已连接。
- ChatGPT 工具目录实际发现四项只读工具：`get_server_info`、`list_skills`、`load_skill`、`search_skills`。
- 首次真实调用：`get_server_info` 成功返回服务信息；`search_skills("cloudflare")` 返回空数组，未将空结果误判为 Skill 不存在。
- 随后真实调用 `list_skills` 返回完整注册表，并选取首项 `add-favicon`；使用同一精确提交 `6207e8185f40f44181c2951dcae7f45dae3d9dc3` 调用 `load_skill`，内容成功返回。
- ChatGPT 对话中展示了 `list_skills` 与 `load_skill` 的工具调用记录、Skill ID、精确提交 SHA，以及“内容是否成功返回：是”。

这证明 ChatGPT Developer Mode 的首次连接、工具发现、服务信息读取、注册表读取和 pinned load 均已在真实产品会话中完成。
