# REST API 端点速查（Vercel 部署清理与 Retention）

## 端点速查表

| 操作                 | 方法与路径                                            | 关键参数                                              | 响应要点                                                            |
| :------------------- | :---------------------------------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------ |
| 部署列表（分页）     | `GET /v6/deployments`                                 | `teamId`、`limit=100`、`until=<cursor>`（毫秒时间戳） | `deployments[]`，含 `uid/projectId/target/readyState/createdAt/url` |
| 删除部署             | `DELETE /v13/deployments/{uid}`                       | `teamId`                                              | 200 成功；404/NOT_FOUND 归为已删除                                  |
| 项目列表             | `GET /v9/projects`                                    | `teamId`、`limit=100`                                 | `projects[]`，含 `id/name`                                          |
| Deployment Retention | `PATCH /v9/projects/{idOrName}/deployment-expiration` | `teamId`                                              | 非 200 时打印原始校验错误（发现 plan 上限的唯一途径）               |
| token 身份           | `GET /v2/user`                                        | 无                                                    | `user.username`                                                     |
| 团队列表             | `GET /v2/teams`                                       | 无                                                    | `teams[]`，`membership.role`、`billing.plan`                        |

认证：全部请求带 `Authorization: Bearer <token>`。

## 分页细节

- `until` 游标语义：传上一页最后一条的 `createdAt`（毫秒时间戳），API 返回该时间之前的部署。
- **uid 去重防死循环**：跨页用 `Map<uid, deployment>` 合并去重；新增条数为 0 或页为空即终止。游标不前进时强制终止，防止 API 异常导致死循环。

## Deployment Retention

- 端点：`PATCH /v9/projects/{idOrName}/deployment-expiration?teamId=<teamId>`
- body 字段：
  - `expiration`：非生产部署过期时长（等价于 preview）
  - `expirationProduction`：生产部署过期时长
  - `expirationCanceled`：已取消部署过期时长
  - `expirationErrored`：错误部署过期时长
- 合法值：`1d / 1w / 1m / 2m / 3m / 6m / 1y / unlimited`
- **Hobby plan 的 `expirationProduction` 上限是 `1m`**，超限报错形如 `Cannot set expirationProduction to 1y on hobby plan`。
- 出处说明：该端点**不在官方 OpenAPI spec 中**（官方文档亦查不到），出处是 terraform-provider-vercel 源码 `client/project_deployment_retention.go`。

## 平台保留例外（retention 到期也不删的情形）

配置了 retention 后，Vercel 平台仍自动保留：

- 每个项目最近 10 个部署
- 最近 20 个 Ready 生产部署
- 最近 20 个 Ready 非生产部署
- 带生产 alias 的部署
- 自定义环境分支 alias 目标
- 活跃分支的最新 preview

因此「保留最新 1 个 production」的清理策略是安全的——平台保留规则只会多留，不会误删。

## 删除后的恢复期

- 手动删除的部署有 **30 天恢复期**：Dashboard → Settings → Security → Recently Deleted。
- retention 到期标记删除的部署通常在 **48h 内**执行。

## Deployment Storage 计费背景

- $0.10/GB/月，Hobby plan 含 10GB 免费额度。
- Usage 页（Dashboard → Usage）可按项目查看存储占用。
