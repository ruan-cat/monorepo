# skill-router-mcp

面向 ChatGPT Web Developer Mode 的只读 Skill Router MCP Worker。

## 本地运行

1. 复制 `.dev.vars.example` 为 `.dev.vars`，填写 GitHub fine-grained token（只授予目标仓库 Contents read）。
2. 执行 `pnpm install`，再运行 `pnpm dev` 或 `pnpm build`。
3. 运行 `pnpm test:unit`、`pnpm test:worker`、`pnpm test:integration`，或执行 `pnpm test:all`。

`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_REF` 是公开 source 配置；`GITHUB_TOKEN` 只能通过本地 `.dev.vars` 或 Cloudflare secret 注入。`.dev.vars` 不得提交。

## 版本与安全边界

- MCP SemVer 来自 `package.json`；Worker 版本来自 `CF_VERSION_METADATA`；Skill 内容版本来自 GitHub exact commit SHA；build SHA 是构建期元数据，三者不能混用。
- Worker 只提供四个只读工具：`get_server_info`、`list_skills`、`search_skills`、`load_skill`。
- Skill-only 内容更新不部署 Worker；tool name/schema/description/annotation 变更必须重新进行 Inspector 与 ChatGPT Developer Mode refresh/rescan gate。
- 生产部署 authority 是 Cloudflare Workers Builds Git Integration；本仓库 workflow 只做静态检查、typecheck、测试和构建，不执行 Wrangler deploy 或 promotion。
