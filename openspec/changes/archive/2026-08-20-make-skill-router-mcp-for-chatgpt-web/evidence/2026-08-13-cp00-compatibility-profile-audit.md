# 2026-08-13 CP-00/0.1 ChatGPT Web MCP 兼容性审计

## 审计范围

- 输入：`docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/chatgpt-web-mcp-compatibility-profile.md`。
- 目标：在实现前确认 OpenAI 当前公开兼容路径，不把上游未来协议、Deep Research 专用契约或 Skills extension 静态快照误写成通用 Workspace MCP v1 要求。
- 时间：2026-08-13（Asia/Shanghai）。
- 执行工具/模型：Codex desktop agent，主代理与只读审计子代理协作；未执行代码、部署或账号操作。

## 官方资料核对

1. OpenAI Build an MCP server 文档继续以 TypeScript `@modelcontextprotocol/sdk`、`zod`、`McpServer` 稳定 `name/version`、工具 schema/annotations、Streamable HTTP 和 MCP Inspector 为当前实现路径。
2. OpenAI Connect ChatGPT 文档要求公开 HTTPS endpoint（通常 `/mcp`），并以 Developer Mode 连接测试；工具元数据改变后需要 refresh，已发布应用还需 scan、submit、publish 等外部证据。
3. OpenAI API MCP 文档中的 `search`/`fetch` 结构化契约适用于 Deep Research/Company Knowledge 场景，不是本 change 通用 Workspace Developer Mode v1 的硬性要求；本 change 不因此新增工具或扩大范围。
4. OpenAI Skills extension 是受限的静态 submission snapshot（包含 `SKILL.md`/资源/digest），与本 change 的 live Git exact-SHA `list/search/load` 路由不同；本 change 不采用该扩展。
5. MCP TypeScript SDK 文档支持 Streamable HTTP 的 stateless 每请求生命周期。实现不得跨请求复用 transport 或 `McpServer`，并需在 workerd harness 覆盖并发隔离；这不等于禁止 SDK 为协议合规维护必要的 transport/session 生命周期。
6. 审计时上游 MCP TypeScript SDK v2 已发布，但 OpenAI 当前 Build an MCP server 文档仍明确使用 `@modelcontextprotocol/sdk` v1 线；因此本 change 采用 compatibility-first，实施时锁定实际 v1 版本，不因上游 v2 自动迁移。

## 链接

- <https://developers.openai.com/plugins/build/mcp-server#choose-an-mcp-software-development-kit>
- <https://developers.openai.com/plugins/deploy/connect-chatgpt>
- <https://developers.openai.com/api/docs/mcp>
- <https://developers.openai.com/plugins/build/mcp-server#import-skills-from-the-mcp-server>
- <https://developers.openai.com/plugins/deploy/app-review>
- <https://ts.sdk.modelcontextprotocol.io/server>
- <https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7>

## 结论

当前 design/spec/tasks 的 SDK 基线成立；已补充每请求 transport/server 隔离约束及 v1/v2 升级门槛。未发现需要新增 `search`/`fetch`、Skills extension 或自定义 session 的理由。Cloudflare 账号、Developer Mode 实测和 Workspace 审核仍属于后续外部证据门，不能由本审计代替。
