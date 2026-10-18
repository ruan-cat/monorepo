# cf-build-notifier

Cloudflare Workers Builds 构建失败/取消邮件通知 Worker。当账号下任意 Worker 的 Git 集成构建失败或被取消时，通过 Cloudflare Email Service 发送告警邮件。

- 运行时：Nitro v3（`3.0.260610-beta`）+ `cloudflare_module` preset
- 事件接入：Workers Builds Event Subscriptions → Cloudflare Queue → `cloudflare:queue` runtime hook
- 发信通道：`send_email` binding（结构化发送，发件域 `ruan-cat.com`）
- 订阅范围：仅 `build.failed` + `build.canceled`

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
                                └─> env.EMAIL.send()（send_email binding）
                                      └─> 收件邮箱
```

## 目录结构

```plain
packages/cf-build-notifier/
├── server.ts                     # HTTP 健康检查入口
├── server/plugins/
│   └── queue-handler.ts          # cloudflare:queue 消费插件（核心入口）
├── server/notifier/
│   ├── types.ts                  # 事件 / Env / 邮件 payload 类型
│   ├── filter.ts                 # 结构校验、可通知性判定、摘要提取（纯函数）
│   ├── builds-api.ts             # 构建日志 API 分页拉取 + 尾部截取
│   └── email.ts                  # 邮件内容拼装 + 结构化发送
├── tests/                        # vitest 单测（29 用例）
├── nitro.config.ts               # preset + wrangler 配置注入
└── package.json
```

## 配置

### wrangler 配置（nitro.config.ts 注入，构建时生成 .output/server/wrangler.json）

| 项               | 值                           |
| :--------------- | :--------------------------- |
| name             | `cf-build-notifier`          |
| queues.consumers | `builds-event-subscriptions` |
| send_email       | `EMAIL`                      |

### 运行时 Env（wrangler secret / var）

| 变量                  | 必填 | 说明                                                                                                       |
| :-------------------- | :--- | :--------------------------------------------------------------------------------------------------------- |
| `NOTIFY_EMAIL_TO`     | ✅   | 通知收件邮箱                                                                                               |
| `NOTIFY_EMAIL_FROM`   | ❌   | 发件地址，默认 `builds@ruan-cat.com`                                                                       |
| `CF_BUILDS_API_TOKEN` | ❌   | 拉取构建日志用（权限：Workers Builds Configuration: Read + Workers Scripts: Read）；未配置时邮件不携带日志 |

### 首次上线的人工前置（Dashboard 操作）

1. **Onboard 发件域**：Compute > Email Service > Email Sending > Onboard Domain → 选 `ruan-cat.com`，自动添加 cf-bounce 子域 MX + SPF/DKIM + DMARC 记录（5-15 分钟生效）
2. 创建构建 API token 并写入 Worker：`wrangler secret put CF_BUILDS_API_TOKEN`（或 `cf` 对应 secret 命令），token 明文不经过 agent
3. 配置收件邮箱：`wrangler secret put NOTIFY_EMAIL_TO`

## 常用命令

```bash
pnpm install                    # 根目录安装，自动链接工作区
pnpm -F @ruan-cat/cf-build-notifier test        # vitest 单测
pnpm -F @ruan-cat/cf-build-notifier typecheck   # tsc --noEmit
pnpm -F @ruan-cat/cf-build-notifier build       # nitro build --preset=cloudflare_module
```

## 部署与订阅创建序列（顺序敏感）

> 先部署 Worker，再创建 Event Subscription——首次部署完成之前的构建失败是唯一通知盲区。订阅先建、消费者后上线时消息滞留队列不丢失。

```bash
# 1. 创建事件队列
cf queues create builds-event-subscriptions

# 2. 部署 Worker（.output 目录内执行）
pnpm build && cd .output && cf deploy

# 3. 写入 secrets（NOTIFY_EMAIL_TO / CF_BUILDS_API_TOKEN）
cf secret put NOTIFY_EMAIL_TO

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

## Workers Builds watch paths 建议配置

- Root directory：`packages/cf-build-notifier`
- Include paths：`packages/cf-build-notifier/**` + `pnpm-lock.yaml`

## 已知边界

- Miniflare 本地环境不支持 queue consumer，消费链路只能真机验证
- 通知 Worker 自身构建失败时，旧版本仍在运行并消费事件，链路不断
- 发送报 `E_RECIPIENT_NOT_ALLOWED` 时，在 send_email binding 配置 `allowed_destination_addresses`
- 方案调研与证据链：`docs/plan/2026-10-18-cf-build-notifier/2026-10-18-cloudflare-workers-builds-failure-notification.md`
