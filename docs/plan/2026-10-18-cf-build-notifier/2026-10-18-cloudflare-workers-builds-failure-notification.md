# Cloudflare Workers Builds 构建失败通知方案调研

> 日期：2026-10-18
> 背景：本机管理 10 个 Cloudflare Workers（其中 7 个使用 Workers Builds Git 集成绑定 GitHub 仓库）。Vercel 与 GitHub Actions 部署失败均有邮件通知，但 Cloudflare Workers Builds 构建失败无任何通知，故障静默。
> 调研方式：官方文档 + changelog + 本地 cf CLI v1.0.0-beta.3 实证。

---

## 一、结论（TL;DR）

**Cloudflare 有官方方案，但不是传统「邮件告警」形态，而是「事件订阅 + Worker 转发」。**

| 问题                     | 答案                                                                                                                                                                                                |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 为什么收不到邮件？       | Cloudflare 传统 Notifications（Alerts）产品**没有** Workers Builds 告警类型（只有 Pages 有 "Project updates"），根因是产品缺口，不是配置遗漏                                                        |
| 官方有通知能力吗？       | 有。2025-12-11 上线 **Event Subscriptions**：Workers Builds 把 `build.started/succeeded/failed/canceled` 结构化事件发布到 Queue，由你的 Worker 消费后转发到任意目的地（邮件/Slack/Discord/webhook） |
| 本地 cf CLI 能配吗？     | 能。`cf` v1.0.0-beta.3 原生支持 `cf queues subscriptions create --source-type workersBuilds.worker`，含 `--dry-run` 验证                                                                            |
| 发邮件需要第三方服务吗？ | 不需要。Cloudflare Email Service 的 `send_email` binding 可在 Worker 内直接发邮件（需发送域名验证）                                                                                                 |

---

## 二、根因分析：为什么没有邮件通知

官方 Alerts 产品可用告警清单（`developers.cloudflare.com/notifications/notification-available/`，2026-10-02 更新）中：

- ✅ **Pages** 有 "Project updates" 告警：支持 Deployment started / **Deployment failed** / Deployment success，可投递到 Email / Webhook
- ❌ **Workers / Workers Builds** 没有任何对应告警类型

历史佐证：2025-01 社区帖子 "Notifications for failed worker builds?" 中官方 MVP 回复"目前不可能"，2025-12-11 才通过 Event Subscriptions 补齐。即：**Workers Builds 的失败通知能力在 2025-12-11 之前根本不存在，之后以「事件订阅」而非「内置邮件告警」的形态提供。**

---

## 三、方案矩阵

| 方案                                                          | 形态           | 优点                                                                                                                          | 缺点                                                                                                                                         | 推荐度                |
| :------------------------------------------------------------ | :------------- | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **A. Event Subscriptions + 通知 Worker + send_email binding** | Queue 事件驱动 | 官方正解；实时秒级；结构化 JSON（branch/commit/author/错误摘要）；**一个订阅覆盖账号下所有 Worker**；纯 Cloudflare 栈零第三方 | 需部署 1 个通知 Worker（可基于官方模板改造）                                                                                                 | ★★★★★                 |
| **B. Worker Settings > Notifications 邮件**                   | Dashboard 配置 | 零代码；官方界面配置                                                                                                          | 需逐个 Worker 配置；功能存在于社区博客记录，官方文档未见完整说明，**需先在 dashboard 验证是否覆盖 build 失败**（可能只覆盖 deployment 事件） | ★★★☆☆（先验证再依赖） |
| **C. GitHub Actions 轮询 Builds API**                         | 外部轮询       | 不依赖 CF 事件能力                                                                                                            | 非事件驱动、有延迟；引入双平台耦合；与 Workers Builds 自治理念冲突                                                                           | ★★☆☆☆（不推荐）       |
| **D. 传统 Alerts 产品**                                       | Dashboard 告警 | —                                                                                                                             | **不支持 Workers Builds**，直接排除                                                                                                          | ✕                     |

---

## 四、方案 A 实施步骤（cf CLI 命令级）

### Step 1：创建事件队列

```bash
cf queues create builds-event-subscriptions
```

### Step 2：部署通知 Worker

官方模板（发 Slack，可改造为发邮件）：

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/workers-builds-notifications-template
```

模板自带：构建状态 + 失败时**错误信息智能提取**（通过 Cloudflare API 拉取构建日志，token 需 `Workers Builds Configuration: Read` + `Workers Scripts: Read` 权限）+ Preview/Live URL + branch/commit hash/author。

**改造为邮件通知**：在 Worker 的 wrangler 配置中加 `send_email` binding，消费到 `build.failed` 事件时调用 `env.EMAIL.send(...)`：

```jsonc
// wrangler.jsonc 增加配置
{
	"send_email": [{ "name": "EMAIL" }],
}
```

```ts
// 队列消费者中
if (message.type === "cf.workersBuilds.worker.build.failed") {
	const meta = message.payload.buildTriggerMetadata;
	await env.EMAIL.send({
		to: "you@example.com",
		from: "builds@yourdomain.com", // 需域名接入 Email Service 并验证
		subject: `❌ [CF Builds] ${message.source.workerName} 构建失败 (${meta.branch})`,
		text: `commit: ${meta.commitHash}\nmessage: ${meta.commitMessage}\nauthor: ${meta.author}`,
	});
}
```

注意：发送域名需在 Cloudflare Email Service（原 Email Routing）完成验证；收件人可能需在 allowed destination addresses 内（错误码 `E_SENDER_NOT_VERIFIED` / `E_RECIPIENT_NOT_ALLOWED`）。

### Step 3：创建事件订阅（本地 cf CLI 实证可用）

```bash
# 账号级订阅：不指定 --source-worker-name 则覆盖该账号全部 Worker（含全部 7 个 Git 集成 Worker）
cf queues subscriptions create \
  --name builds-failure-notify \
  --source-type workersBuilds.worker \
  --events build.started,build.succeeded,build.failed,build.canceled \
  --destination-type queues.queue \
  --destination-queue-id <queue-id> \
  --enabled true

# 仅关注失败时，可只订阅 build.failed
# 指定单个 Worker：追加 --source-worker-name <worker-name>

# 不确定参数时先干跑验证：
cf queues subscriptions create --dry-run ...
# 查看 exact API request：
cf schema queues subscriptions create
```

本地 `cf` v1.0.0-beta.3 实测 `cf queues subscriptions --help` 输出确认：`--source-type` 的合法枚举值明确包含 `workersBuilds.worker`（另有 `kv`/`r2`/`workersAi.model`/`workers.script`/`workflows.workflow` 等）。

### Step 4：验证闭环

push 一个会导致构建失败的 commit（或对任意 Worker 点 Retry build），观察：

1. Queue 有消息消费记录（dashboard > Queues）
2. 邮箱收到失败通知邮件
3. Worker 日志（`cf tail <notify-worker>` 或 dashboard > Logs）确认 `EMAIL.send` 无错误码

---

## 五、方案 B 验证路径（零代码备选）

社区博客（nicholas.clooney.io，2025）记录的路径：**Workers & Pages > 你的 Worker > Settings > Notifications** 中可为 deployment success/failure 添加通知邮箱。**验证要点**：进入 dashboard 确认该设置是否存在、是否对 build 失败（不只是 deploy 失败）触发。若覆盖，可作为最轻量方案；若不覆盖，回到方案 A。

---

## 六、证据链附录

| #   | 证据                                                                                                           | 来源                                                                                   |
| :-- | :------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| 1   | Event Subscriptions changelog（2025-12-11）：Workers Builds 事件可订阅，支持失败通知                           | developers.cloudflare.com/changelog/post/2025-12-11-builds-event-subscriptions         |
| 2   | 事件类型与 payload 完整定义（build.started/failed/canceled/succeeded，含 buildTriggerMetadata）                | developers.cloudflare.com/workers/ci-cd/builds/event-subscriptions（2026-04-23 更新）  |
| 3   | 官方通知模板仓库（cloudflare/templates/workers-builds-notifications-template）含错误提取逻辑与 CLI 订阅命令    | github.com/cloudflare/templates                                                        |
| 4   | 传统 Alerts 产品无 Workers Builds 告警（仅 Pages "Project updates"）                                           | developers.cloudflare.com/notifications/notification-available（2026-10-02 更新）      |
| 5   | 本地 `cf` v1.0.0-beta.3 `cf queues subscriptions create --help`：`--source-type` 枚举含 `workersBuilds.worker` | 本机实机验证（2026-10-18）                                                             |
| 6   | `send_email` binding 结构化 API、错误码、限制                                                                  | developers.cloudflare.com/email-service/api/send-emails/workers-api（2026-10-15 更新） |
| 7   | 2025-01 社区确认当时无失败通知 → 2025-12 补齐的时间线                                                          | community.cloudflare.com/t/756875                                                      |

## 七、遗留事项

- 方案 A 的账号级订阅（不指定 worker-name）行为建议部署时用 `--dry-run` + 实测确认官方文档未明确写明账号级语义
- Queues 与 Email Sending 有免费额度，超出后计费规则以官方 pricing 页为准
- 若后续 Cloudflare 把 Workers Builds 告警补进传统 Alerts 产品，可迁移为纯 dashboard 配置（关注 changelog）

---

## 八、方案 A 实施细节补充（二轮调研，2026-10-18）

> 用户拍板：monorepo 子包（`D:\code\ruan-cat\monorepo`）+ Workers Builds Git 集成部署 + 仅订阅 failed/canceled + 发件域 `ruan-cat.com`。

### 8.1 Nitro v3 包装 Queue Consumer（结论：官方支持）

| 项                     | 结论                                                                                                                                                                                                   | 证据                                                          |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| 官方支持               | Nitro 3 `cloudflare_module` preset 明确提供 `cloudflare:queue` runtime hook（接收 message batch），另有 `cloudflare:scheduled` / `cloudflare:email` / `cloudflare:tail` / `cloudflare:trace`           | nitro.build/deploy/providers/cloudflare（Runtime Hooks 章节） |
| 代码形态               | `server/plugins/queue-handler.ts`：`defineNitroPlugin((nitroApp) => nitroApp.hooks.hook("cloudflare:queue", async ({ batch, env, context }) => {...}))`；handler 内 throw 触发 Cloudflare 队列自动重试 | keith-mifsud.me 实战博客 + unjs/nitro PR #1579                |
| HTTP 侧                | 官方模板里 Hono 只用于 HTTP 部分（拉构建日志/格式化）；nitro 中对应普通 route（`defineHandler`），迁移无障碍                                                                                           | 模板源码 + nitro 文档                                         |
| 本地开发限制           | Miniflare 环境下 queue consumers 不可用，验证必须真机部署                                                                                                                                              | nitro 官方文档 Cloudflare 章节                                |
| 社区模块 `nitro-queue` | 提供 `queues/` 目录扫描式 `defineQueue`，但自述 "has not been thoroughly tested"；官方 hook 已够用，不引入                                                                                             | npmjs.com/package/nitro-queue                                 |

### 8.2 monorepo 部署成本与路径监听（用户记忆验证：正确）

**Workers Builds 官方支持 Build watch paths（`workers/ci-cd/builds/build-watch-paths/`）**：

- 配置位置：Worker > Settings > Build > Build watch paths（Include paths / Exclude paths，支持 wildcard）
- 评估顺序：excludes 先过滤 → 剩余路径对 includes 匹配 → 有匹配才构建，否则 skip
- monorepo 官方工作流：每个 Worker 绑同一仓库 + 各自 Root directory（构建命令运行位置）+ 各自 watch paths（`workers/ci-cd/builds/advanced-setups`）

**bypass 例外**（强制构建，绕过路径匹配）：

1. push 事件含 0 个文件变更（空 push 主动触发）
2. push 事件含 3000+ 文件变更或 **20+ commits**（批量合并时多跑一次，成本可忽略）

**本 Worker 的建议配置**：

- Root directory：`packages/cf-build-notifier`
- Include paths：`packages/cf-build-notifier/**` + `pnpm-lock.yaml`（依赖升级时也重建）
- Exclude paths：无需（include 已收紧）

部署成本：仅触碰子包路径的 push 触发构建；小 Worker 构建（pnpm install + nitro build + wrangler deploy）约 1-3 分钟。

### 8.3 自举边界 case（Git 集成部署的固有属性）

- 通知 Worker 自身构建失败 → 新版本未部署，但**旧版本仍在运行并消费事件**，依然能发通知（旧代码兜底，链路不断）
- 唯一盲区：**首次部署完成之前**的构建失败。实施顺序必须：先部署 Worker → 再建 Event Subscription（订阅先建、消费者后上线时，消息滞留队列不丢失，消费后补发）

### 8.4 用户人工配置清单（send_email / ruan-cat.com）

| #   | 事项           | 方式                                       | 说明                                                                                                                                                                                                                   |
| :-- | :------------- | :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Onboard 发件域 | Dashboard（建议用户亲自操作，涉 DNS 变更） | Compute > Email Service > Email Sending > Onboard Domain → 选 `ruan-cat.com` → Cloudflare 自动添加 cf-bounce 子域的 MX + SPF/DKIM TXT + DMARC 记录，通常 5-15 分钟生效。硬前提：域名 DNS 已托管在 Cloudflare（已满足） |
| 2   | 通知收件邮箱   | 用户提供                                   | send_email 的 `to` 字段；若发送报 `E_RECIPIENT_NOT_ALLOWED`，在 binding 配置 `allowed_destination_addresses`                                                                                                           |
| 3   | 构建 API token | 用户创建，值不经过 agent                   | 权限：Workers Builds Configuration: Read + Workers Scripts: Read；用于消费事件后拉取构建日志做错误提取；通过 `wrangler secret put` 存入 Worker，agent 不接触 token 明文                                                |

其余步骤（nitro 子包脚手架、queue consumer 代码、binding 配置、`cf queues create`、`cf queues subscriptions create`、部署、真机验证闭环）由 agent 执行。
