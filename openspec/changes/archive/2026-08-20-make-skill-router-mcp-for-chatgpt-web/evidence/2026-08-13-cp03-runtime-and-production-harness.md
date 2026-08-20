# 2026-08-13 CP-03 运行时与生产构建测试证据

本证据由 Codex（GPT-5）记录，依据 Cloudflare 官方 Workers 测试指导执行。

## 验证命令

```log
pnpm --dir packages/skill-router-mcp run test:integration
```

结果：Nitro Cloudflare production build 成功；Wrangler `createTestHarness()` 启动构建产物成功；2 个集成测试通过。

## 覆盖范围

- 通过 `createTestHarness({ workers: [{ configPath: "./.output/server/wrangler.json", vars: { GITHUB_API_BASE_URL: <本地 mock 地址> } }] })` 启动真实构建产物。
- 通过 harness 外部 HTTP 请求验证 `/health`、MCP `initialize`、`tools/list`、`get_server_info`。
- 通过本地 HTTP mock GitHub 服务验证 `list_skills`、`search_skills`、最新 `load_skill`、exact-SHA pinned `load_skill` 与无效 pin 错误路径。
- 通过两个并发 harness HTTP 请求验证请求之间不共享 MCP 状态。
- `GITHUB_API_BASE_URL` 仅作为测试 harness 注入变量，生产 `wrangler.toml` 不声明该变量；生产仍固定 owner/repository/ref，且 secret 不进入结果或日志。
- `wrangler.toml` 仅声明公开 source vars 与 `CF_VERSION_METADATA`，不声明 `GITHUB_TOKEN`、KV/R2/D1/DO。MCP adapter 的 256 KiB 请求与 1 MiB JSON 响应边界由 unit contract 测试验证：超限均返回安全的 HTTP 413 与固定错误码，不回显运行时细节。

## 官方依据

Cloudflare 官方文档建议使用 Workers Vitest 集成测试运行 Worker 运行时单元测试，使用 Wrangler `createTestHarness()` 对生产构建进行 Node 测试；本 CP-03 已按该边界分别配置 worker 与 integration 测试。
