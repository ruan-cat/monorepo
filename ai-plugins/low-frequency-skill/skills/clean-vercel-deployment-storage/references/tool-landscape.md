# 工具边界矩阵：MCP / CLI / REST API

清理 Vercel 部署有三条通道，能力与风险完全不同。结论先行：**大规模删除只用 REST API**，CLI 仅限小规模，MCP 只用于查看。

## 通道对比

| 通道                    | 能力                                                                                       | 适用场景               | 风险                       |
| :---------------------- | :----------------------------------------------------------------------------------------- | :--------------------- | :------------------------- |
| 官方 Vercel MCP         | `list_deployments` / `list_projects` / `get_deployment` 等只读工具，**无任何 delete 工具** | 查看、核对清单         | 无删除能力，指望它删是死路 |
| Vercel CLI              | `vercel remove <url...>` 批量删、`vercel remove <project> --safe` 整项目删                 | 小规模（≤10 条）       | 两个坑，见下文             |
| REST API + Bearer token | `DELETE /v13/deployments/{id}?teamId=`                                                     | **大规模删除的最优解** | 需自行处理并发与 404 归类  |

## CLI 通道的两个坑

### 坑 1：非交互 DELETE 要求确认标志

CLI v58 起，`vercel api -X DELETE ...` 在非交互环境下会报：

```log
Error: DELETE operations require confirmation. Use --dangerously-skip-permissions to confirm.
```

解法：非交互调用必须加 `--dangerously-skip-permissions`。这是 CLI 的防误删确认门，不是 bug；但批量脚本里漏掉它会导致试跑全 FAIL。

### 坑 2：大规模并发 spawn CLI 会打挂本地凭据

现象：并发 spawn 多个 `vercel` CLI 进程执行删除，中途开始全程报 `No existing credentials found`。

根因：CLI 的 `auth.json` 中 token 带 `expiresAt` 过期时间戳；过期后每个 CLI 进程都会尝试 refreshToken 刷新。多个进程并发刷新产生竞争，刷新失败后 CLI 判定「无凭据」，后续所有进程全部失败。

恢复：重新 `vercel login`，或改用独立 Bearer token 走 REST API 收尾（见 incident 文档）。

结论：**批量删除工具链必须「REST fetch 直连为正路，CLI 仅小规模使用」**。

## REST API 通道（推荐）

- 删除：`DELETE /v13/deployments/{uid}?teamId=<teamId>`，响应 200 即成功，404/NOT_FOUND 归为「已删除」成功。
- 分页列表：`GET /v6/deployments?teamId=&limit=100&until=<cursor>`。
- 并发建议：3 路并发、顺序批处理即可，更高并发无收益且有触发限流风险。
- token 获取链（按优先级）：
  1. CLI auth.json（Windows `%APPDATA%/com.vercel.cli/Data/auth.json`，Unix `~/.local/share/com.vercel.cli/auth.json`，读 `token` 字段）
  2. 环境变量 `VERCEL_TOKEN`
  3. 都取不到 → 向用户索要（Dashboard → Settings → Tokens 创建）
  4. `--token` 参数始终可作显式覆盖
