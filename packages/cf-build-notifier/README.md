# cf-build-notifier

Cloudflare Workers Builds 构建失败/取消邮件通知 Worker。当账号下任意 Worker 的 Git 集成构建失败或被取消时，通过 send_email binding（免费路径）发送告警邮件。

- 运行时：Nitro v3（`3.0.260610-beta`）+ `cloudflare_module` preset
- 事件接入：Workers Builds Event Subscriptions → Cloudflare Queue → `cloudflare:queue` runtime hook
- 发信通道：restricted `send_email` binding（MIME 形态，发件域 `ruan-cat.com`）
- 订阅范围：仅 `build.failed` + `build.canceled`
- 计费：**Workers Free 计划可用，零成本**（详见下文免费路径说明）

## 架构

```plain
GitHub push
  └─> Workers Builds（7 个 Git 集成 Worker）
        └─ 构建失败/取消
              └─> Event Subscription（builds-failure-notify）
                    └─> Queue（builds-event-subscriptions）
                          └─> 本 Worker 消费（server/plugins/queue-handler.ts）
                                ├─ 结构校验 + type 权威过滤（failed/canceled）
                                ├─ （可选）拉取构建日志尾部做错误提取
                                └─> env.EMAIL.send(new EmailMessage(...))（restricted send_email binding）
                                      └─> 已验证收件邮箱
```

## 目录结构

```plain
packages/cf-build-notifier/
├── wrangler.toml                 # 部署配置单一事实源（vars/send_email/queues/observability）
├── server.ts                     # HTTP 健康检查入口
├── server/plugins/
│   └── queue-handler.ts          # cloudflare:queue 消费插件（核心入口）
├── server/notifier/
│   ├── types.ts                  # 事件 / Env / 邮件内容类型
│   ├── filter.ts                 # 结构校验、可通知性判定、摘要提取（纯函数）
│   ├── builds-api.ts             # 构建日志 API 分页拉取 + 尾部截取
│   └── email.ts                  # MIME 构造 + send_email binding 发送
├── server/types/
│   └── cloudflare-email.d.ts     # cloudflare:email 运行时模块最小类型声明
├── tests/                        # vitest 单测（32 用例）
├── nitro.config.ts               # preset 内置 + cloudflare.deployConfig
└── package.json
```

## 配置

### wrangler 配置（单一事实源 wrangler.toml，构建时合并生成 .output/server/wrangler.json）

| 项                     | 值                                  |
| :--------------------- | :---------------------------------- |
| name                   | `cf-build-notifier`                 |
| queues.consumers       | `builds-event-subscriptions`        |
| send_email             | `EMAIL`（restricted，限定目标地址） |
| vars.NOTIFY_EMAIL_FROM | `builds@ruan-cat.com`               |
| observability          | enabled，head_sampling_rate 1       |

### 运行时 Env（wrangler secret）

| 变量                  | 必填 | 说明                                                                                                       |
| :-------------------- | :--- | :--------------------------------------------------------------------------------------------------------- |
| `NOTIFY_EMAIL_TO`     | ✅   | 通知收件邮箱，必须为 Email Routing 已验证的目标地址                                                        |
| `CF_BUILDS_API_TOKEN` | ❌   | 拉取构建日志用（权限：Workers Builds Configuration: Read + Workers Scripts: Read）；未配置时邮件不携带日志 |

> `NOTIFY_EMAIL_FROM` 已固化在 wrangler.toml `[vars]`，无需 secret。

### 免费路径说明（无 Workers Paid）

- Email Sending（结构化发送、onboard 发送域）需要 Workers Paid（$5/月）——**本 Worker 不走该通道**。
- 发送走 **restricted send_email binding**（`allowed_destination_addresses` 限定收件邮箱）：发到已验证目标地址在所有计划免费、不占配额（官方 Pricing/Limits 页原文）。
- 发件域 `ruan-cat.com` 已由 Email Routing 托管（MX 实证 `routeN.mx.cloudflare.net`），**无需 Onboard 发送域、无需 Workers Paid**。
- 收件邮箱 `1219043956@qq.com` 已完成目标地址验证，并固化在 wrangler.toml `allowed_destination_addresses`。
- 发送 API 为 MIME 形态：`env.EMAIL.send(new EmailMessage(from, to, raw))`，`EmailMessage` 来自 `cloudflare:email` 运行时模块（类型声明见 `server/types/cloudflare-email.d.ts`），MIME 由 `mimetext` 构造。

## 常用命令

```bash
pnpm install                    # 根目录安装，自动链接工作区
pnpm -F @ruan-cat/cf-build-notifier test        # vitest 单测
pnpm -F @ruan-cat/cf-build-notifier typecheck   # tsc --noEmit
pnpm -F @ruan-cat/cf-build-notifier build       # nitro build（preset 内置配置）
pnpm -F @ruan-cat/cf-build-notifier exec wrangler deploy --dry-run   # 本地 schema 校验
```

## 部署与订阅创建序列（顺序敏感）

> 先部署 Worker，再创建 Event Subscription——首次部署完成之前的构建失败是唯一通知盲区。订阅先建、消费者后上线时消息滞留队列不丢失。

```bash
# 1. 创建事件队列
cf queues create builds-event-subscriptions

# 2. 首次部署（包根执行，跟随 .wrangler/deploy/config.json 重定向）
pnpm build && pnpm exec wrangler deploy

# 3. 写入 secrets（NOTIFY_EMAIL_TO / CF_BUILDS_API_TOKEN）
pnpm exec wrangler secret put NOTIFY_EMAIL_TO

# 4. 干跑验证订阅参数
cf queues subscriptions create --dry-run \
  --name builds-failure-notify \
  --source-type workersBuilds.worker \
  --events build.failed,build.canceled \
  --destination-type queues.queue \
  --destination-queue-id <queue-id> \
  --enabled true

# 5. 正式创建订阅（去掉 --dry-run）

# 6. 验证闭环：对任意 Worker 点 Retry build（或 push 一个会失败的 commit），
#    确认 Queue 有消费记录、邮箱收到通知、Worker 日志无 EMAIL 错误码
```

## Workers Builds watch paths 建议配置（对齐 skill-router-mcp 线上实配）

- Root directory：`/`（仓库根）
- Build：`pnpm i && pnpm --dir packages/cf-build-notifier run build`
- Deploy：`pnpm --dir packages/cf-build-notifier exec wrangler deploy`
- Include paths：`packages/cf-build-notifier/**` + `pnpm-lock.yaml` + `pnpm-workspace.yaml`
- Previews：关闭

## 已知边界

- Miniflare 本地环境不支持 queue consumer，消费链路只能真机验证
- 通知 Worker 自身构建失败时，旧版本仍在运行并消费事件，链路不断
- restricted binding 只能发送到 `allowed_destination_addresses` 内的地址；更换收件邮箱需先完成目标地址验证再同步 wrangler.toml
- 方案调研与证据链：`docs/plan/2026-10-18-cf-build-notifier/2026-10-18-cloudflare-workers-builds-failure-notification.md`
