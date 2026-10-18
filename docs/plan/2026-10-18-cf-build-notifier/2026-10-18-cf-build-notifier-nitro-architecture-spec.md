# 2026-10-18 cf-build-notifier Nitro 架构规格（对齐 skill-router-mcp）

> 本文由 WorkBuddy agent（GLM-5.3-Flash 模型）完成调研与撰写。
> 状态：**草案，待用户审核**。按用户指令：先调研、写文档，代码实施等待用户命令。
> 调研对象：`packages/skill-router-mcp`（同形态前例：Nitro v3 + Cloudflare Worker）
> 关联文档：`2026-10-18-cloudflare-workers-builds-failure-notification.md`（方案调研）、`2026-10-18-cf-build-notifier-nitro-alignment-plan.md`（实施计划）

---

## 一、背景与目标

cf-build-notifier Phase A 已完成落码（nitro 脚手架 + queue consumer + wrangler 配置注入 + 29 测试），但当时的配置形态基于调研报告第八章的**未验证假设**（Root directory = 包目录、`cf deploy` 部署）。用户指出 `packages/skill-router-mcp` 是同架构成熟前例，要求深度调研并全面对齐。

本 spec 回答三个问题：

1. skill-router-mcp 的完整架构与部署链路是什么（含 cf CLI 线上实配证据）？
2. cf-build-notifier 哪些复刻、哪些砍掉、哪些保留现状？
3. 终态配置与代码长什么样？

## 二、skill-router-mcp 架构解剖

### 2.1 目录结构

```text
packages/skill-router-mcp/
├── nitro.config.ts              # defineNitroConfig（from "nitro/config"），preset 内置
├── wrangler.toml                # 手写部署配置源（main/vars/version_metadata/observability）
├── tsconfig.json                # 独立显式配置（非 extends nitro/tsconfig）
├── package.json                 # nitro 为 dependency；wrangler 为 devDependency
├── vitest.unit.config.ts        # 测试三层之一：node 环境
├── vitest.worker.config.ts      # 测试三层之二：@cloudflare/vitest-pool-workers + workerd
├── vitest.integration.config.ts # 测试三层之三：production harness
├── .dev.vars.example            # 本地 dev vars 模板（含安全注释）
├── .gitignore                   # .output/ .wrangler/ .dev.vars + 生成物
├── server/api/
│   ├── health.get.ts            # GET /health（file-based routing）
│   └── mcp.post.ts              # POST /mcp（MCP Streamable HTTP）
├── runtime/
│   ├── bindings.ts              # env bindings 类型化提取（extractRuntimeBindings）
│   ├── deployment-info.ts       # CF_VERSION_METADATA → DeploymentInfo
│   ├── build-info.generated.ts  # 构建期生成（.gitignore）
│   └── ...
├── scripts/generate-build-info.mjs  # predev/pretest/build 前生成 build SHA
├── mcp/ + services/ + repositories/ # 业务逻辑（对 cf-build-notifier 无直接参考价值）
└── tests/                       # 17 个测试文件，按三层 config 分流
```

### 2.2 配置三件套与合并链路（核心机制）

```text
wrangler.toml（手写，部署配置单一事实源）
        │  nitro build 读取并合并
        ▼
.output/server/wrangler.json（最终部署配置 = nitro 生成项 + toml 合并项）
        │  nitro 同步生成
        ▼
.wrangler/deploy/config.json（重定向指针，指向上面那个文件）
        │  包根执行 wrangler deploy（不传 --config，自动跟随重定向）
        ▼
Cloudflare Worker 上线
```

**铁证**（`skill-router-mcp/.output/server/wrangler.json` 实拍，2026-10-14 构建）：

```json
{
	"compatibility_date": "2024-09-19",
	"name": "skill-router-mcp",
	"compatibility_flags": ["nodejs_compat"],
	"main": "index.mjs",
	"vars": { "GITHUB_OWNER": "ruan-cat", "GITHUB_REPO": "monorepo", "GITHUB_REF": "dev" },
	"version_metadata": { "binding": "CF_VERSION_METADATA" },
	"observability": { "enabled": true, "head_sampling_rate": 1 },
	"assets": { "binding": "ASSETS", "directory": "..\\public" },
	"no_bundle": true,
	"rules": [{ "type": "ESModule", "globs": ["**/*.mjs", "**/*.js"] }]
}
```

其中 `vars` / `version_metadata` / `observability` 全部来自手写 wrangler.toml 的合并，`main` / `assets` / `no_bundle` / `rules` 由 nitro 生成——**单一职责分工清晰：nitro 管构建入口，wrangler.toml 管部署配置**。

wrangler.toml 源文件全文：

```toml
name = "skill-router-mcp"
compatibility_date = "2024-09-19"
compatibility_flags = ["nodejs_compat"]
main = "./.output/server/index.mjs"
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
[version_metadata]
binding = "CF_VERSION_METADATA"

[observability]
enabled = true
head_sampling_rate = 1
```

secrets（GITHUB_TOKEN）**不进 toml**，仅由 `wrangler secret put` 或本地 `.dev.vars` 注入。

### 2.3 代码形态

- **nitro 配置 API**：`import { defineNitroConfig } from "nitro/config"`；`preset: "cloudflare_module"` 写在配置内，build 命令不带 `--preset`；`cloudflare.wrangler` 仅写 `name`（其余部署配置全部在 toml）；`serverDir: "./server"`；`apiBaseURL: "/"`。
- **env 提取**（`runtime/bindings.ts`）：`extractRuntimeBindings(input)` 统一兼容 `{ env }` 包裹与裸 env 两种形态；必填缺失直接 throw；敏感 token 不进公开诊断。HTTP 侧通过 `event.req.runtime?.cloudflare?.env` 拿到 env。
- **HTTP 路由**：file-based routing（`server/api/health.get.ts` → `GET /health`）；`healthPayload` 纯函数独立导出供测试。
- **端点工程化**（`server/api/mcp.post.ts`，参考价值在模式而非业务）：请求/响应字节数上限、15s 超时、per-request factory（stateless transport 不跨请求共享）、finally 里释放资源。

### 2.4 测试三层

| 层          | 配置                                                          | 运行环境           | 覆盖                                                             |
| :---------- | :------------------------------------------------------------ | :----------------- | :--------------------------------------------------------------- |
| unit        | `vitest.unit.config.ts`（node）                               | node               | 全部纯逻辑，排除 worker/harness 文件                             |
| worker      | `vitest.worker.config.ts` + `@cloudflare/vitest-pool-workers` | workerd 真实运行时 | `stage2-worker-runtime.test.ts`（configPath 指向 wrangler.toml） |
| integration | `vitest.integration.config.ts`（node）                        | node               | `production-harness.test.ts`（构建产物 harness）                 |

另有远端验收脚本 `scripts/verify-stage2-remote.ts`（对 preview/staging URL 做端到端检查）与 `benchmark:remote`。

### 2.5 部署链路（cf CLI 线上实配，2026-10-18 只读巡检）

`cf workers get skill-router-mcp` 关键输出：observability/logs 全开（enabled, head_sampling_rate 1, invocation_logs, persist），`deployed_on: 2026-10-14`。

`cf builds workers get 4351c4e4a0c9476bb6b78c219d6e3350` 全量实配：

```json
{
	"script_tag": "4351c4e4a0c9476bb6b78c219d6e3350",
	"git_repository": {
		"repo_name": "monorepo",
		"provider_type": "github",
		"provider_account_name": "ruan-cat",
		"branch": "dev"
	},
	"production_settings": {
		"build_command": "pnpm i && pnpm --dir packages/skill-router-mcp run build",
		"deploy_command": "pnpm --dir packages/skill-router-mcp exec wrangler deploy",
		"root_directory": "/",
		"build_caching_enabled": false,
		"path_includes": ["packages/skill-router-mcp/**", "pnpm-lock.yaml", "pnpm-workspace.yaml"],
		"path_excludes": ["ai-plugins/**", "docs/**"],
		"build_token_uuid": "e2ac8025-b2a7-4e00-9f2a-d771a6b0db5e",
		"environment_variables": {}
	},
	"auto_build_enabled": true,
	"previews_enabled": false,
	"previews_base_config": {
		"build_command": "pnpm --dir packages/skill-router-mcp run build",
		"deploy_command": "pnpm --dir packages/skill-router-mcp exec wrangler versions upload",
		"root_directory": "/",
		"proposed_deploy_command": "pnpm --dir packages/skill-router-mcp exec wrangler preview"
	}
}
```

**修正调研报告第八章的关键假设**：

| 项             | 线上实配                                              | 报告第八章旧假设  |
| :------------- | :---------------------------------------------------- | :---------------- |
| Root directory | `/`（仓库根）                                         | `packages/<pkg>`  |
| build_command  | `pnpm i && pnpm --dir <pkg> run build`                | 未指定            |
| deploy_command | **`wrangler deploy`**（非 cf deploy）                 | `cf deploy`       |
| path_includes  | 包目录 + `pnpm-lock.yaml` + **`pnpm-workspace.yaml`** | 包目录 + lockfile |
| path_excludes  | `ai-plugins/**`、`docs/**`                            | 无需              |

部署 authority 结论（README 原文 + 实配互证）：**生产部署 authority 是 Cloudflare Workers Builds Git Integration；仓库 GitHub workflow 只做静态检查/typecheck/测试/构建，不执行 wrangler deploy**。

## 三、cf-build-notifier 对齐决策矩阵

| #   | 项                            | skill-router-mcp                            | Phase A 现状                         | 决策                                                    | 理由                                                                           |
| :-- | :---------------------------- | :------------------------------------------ | :----------------------------------- | :------------------------------------------------------ | :----------------------------------------------------------------------------- |
| 1   | nitro 配置 API                | `defineNitroConfig`（`nitro/config`）       | `defineConfig`（`nitro`）            | **对齐**                                                | 同架构包形态统一；改动成本一行 import                                          |
| 2   | preset 位置                   | 配置内置                                    | build 命令 `--preset` 传参           | **对齐（配置内置）**                                    | build 命令简化，与参考一致                                                     |
| 3   | 部署配置源                    | 手写 wrangler.toml + nitro 合并             | `cloudflare.wrangler` 全注入         | **迁移到 wrangler.toml**                                | 单一事实源；vars/observability 只能进 toml；实证合并链路                       |
| 4   | queues.consumers + send_email | —（无此两类 binding 先例）                  | nitro.config 注入                    | **迁移到 wrangler.toml** + 构建后验证合并产物           | 见风险 R1；合并机制同源（vars 实证）                                           |
| 5   | observability                 | toml `[observability]` enabled              | 无                                   | **新增**                                                | 通知排障必需（EMAIL 错误码、消费日志）                                         |
| 6   | vars                          | toml `[vars]`（非敏感配置）                 | 无                                   | **新增** `NOTIFY_EMAIL_FROM`                            | 发件地址非敏感，dashboard 可见可改                                             |
| 7   | HTTP 入口                     | `server/api/health.get.ts` 文件路由         | `server.ts` 根 handler               | **对齐文件路由**                                        | 一致性；`apiBaseURL: "/"` 下挂 `/health`                                       |
| 8   | env 提取                      | `extractRuntimeBindings` 模式               | 函数内直接 cast                      | **对齐模式**                                            | 结构化、必填校验、纯函数可测                                                   |
| 9   | build-info 生成机制           | `generate-build-info.mjs` + generated.ts    | 无                                   | **砍掉（不引入）**                                      | YAGNI；通知邮件不依赖 Worker 自身 SHA                                          |
| 10  | version_metadata binding      | `[version_metadata]`                        | 无                                   | **砍掉**                                                | 排障由 observability logs 覆盖                                                 |
| 11  | openAPI / scalar              | `experimental.openAPI`                      | 无                                   | **砍掉**                                                | queue-only worker 无 API 文档面                                                |
| 12  | 测试分层                      | 三层（unit/worker/integration）             | 单层 unit                            | **保持 unit 单层**；worker 层列为可选项                 | queue consumer 在 workerd/pool-workers 同样不可测（官方限制）；HTTP 面板价值低 |
| 13  | tsconfig                      | 独立显式形态                                | `extends nitro/tsconfig`             | **保持现状**                                            | typecheck 已过；形态差异无行为收益，避免无意义 churn                           |
| 14  | deploy 通道                   | 包根 `wrangler deploy`（重定向）            | `cd .output && cf deploy`            | **改为 wrangler deploy**                                | 对齐 Workers Builds deploy_command 实配；重定向是官方形态                      |
| 15  | wrangler devDep               | `4.122.0` + `"wrangler": "wrangler"` script | 无                                   | **新增**                                                | deploy_command 依赖包内可执行 wrangler（pnpm 隔离不透传根）                    |
| 16  | vitest 版本                   | 包内独立 4.1.0                              | root 共享 3.x                        | **保持 root 共享**                                      | unit 层无 pool-workers 需求，少一份闭包                                        |
| 17  | .gitignore                    | `.output/` `.wrangler/` `.dev.vars`         | `.output .nitro .turbo node_modules` | **对齐**：`.output/` `.nitro/` `.wrangler/` `.dev.vars` | 根 gitignore 只覆盖 node_modules/.turbo；.output/.nitro 必须包级声明           |
| 18  | .dev.vars.example             | 有（含安全注释）                            | 无                                   | **新增**                                                | 配置文档化；queue consumer 本地不可跑，但 secret 名单需要明确载体              |
| 19  | package.json author           | 有                                          | 有                                   | 保持                                                    | 已一致                                                                         |
| 20  | homepage                      | workers.dev URL                             | 无                                   | **部署上线后补**                                        | URL 依赖部署产物                                                               |

## 四、终态配置草案

### 4.1 `nitro.config.ts`（瘦身：nitro 只管构建）

```ts
import { defineNitroConfig } from "nitro/config";

/**
 * Cloudflare Workers Builds 失败通知 Worker 配置。
 *
 * 部署配置（name/vars/send_email/queues/observability）的单一事实源是
 * 包根 wrangler.toml，nitro 构建时读取并合并进 .output/server/wrangler.json。
 *
 * @see https://nitro.build/deploy/providers/cloudflare
 */
export default defineNitroConfig({
	preset: "cloudflare_module",
	compatibilityDate: {
		cloudflare: "2024-09-19",
	},
	serverDir: "./server",
	apiBaseURL: "/",
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			name: "cf-build-notifier",
		},
	},
});
```

### 4.2 `wrangler.toml`（部署配置单一事实源，新建）

```toml
name = "cf-build-notifier"
compatibility_date = "2024-09-19"
compatibility_flags = ["nodejs_compat"]
main = "./.output/server/index.mjs"

[vars]
NOTIFY_EMAIL_FROM = "builds@ruan-cat.com"

# Cloudflare Email Service 结构化发送 binding
[[send_email]]
name = "EMAIL"

# 消费 Workers Builds 事件订阅投递的队列
[[queues.consumers]]
queue = "builds-event-subscriptions"

[observability]
enabled = true
head_sampling_rate = 1
```

secrets（不入库，deploy 后注入）：`NOTIFY_EMAIL_TO`（收件邮箱）、`CF_BUILDS_API_TOKEN`（Workers Builds Configuration: Read + Workers Scripts: Read）。

### 4.3 `package.json`（scripts 对齐）

```jsonc
{
	"scripts": {
		"typecheck": "tsc --noEmit",
		"test": "vitest run",
		"build": "nitro build", // preset 已内置配置
		"dev": "nitro dev",
		"deploy": "pnpm run build && wrangler deploy", // 包根执行，跟随 .wrangler/deploy/config.json 重定向
		"wrangler": "wrangler",
		"prepare": "nitro prepare",
	},
	"devDependencies": {
		// 新增 wrangler 4.122.0（对齐 skill-router-mcp），保留 nitro/typescript/vitest
	},
}
```

### 4.4 `.gitignore`（对齐 + 补 nitro 目录）

```text
.output/
.nitro/
.wrangler/
.dev.vars
```

（`node_modules`/`.turbo` 由根 .gitignore 覆盖；`.output`/`.nitro` 根未覆盖，必须包级声明。）

### 4.5 `.dev.vars.example`（新建）

```ini
# 通知收件邮箱（生产走 wrangler secret put NOTIFY_EMAIL_TO）
NOTIFY_EMAIL_TO=

# 构建日志 API token（可选；生产走 wrangler secret put CF_BUILDS_API_TOKEN）
# 权限：Workers Builds Configuration: Read + Workers Scripts: Read
CF_BUILDS_API_TOKEN=
```

## 五、终态代码结构

```text
packages/cf-build-notifier/
├── nitro.config.ts               # 4.1 终态
├── wrangler.toml                 # 4.2 终态（新建）
├── tsconfig.json                 # 不变（extends nitro/tsconfig）
├── package.json                  # 4.3 终态
├── vitest.config.ts              # 不变
├── .gitignore / .dev.vars.example # 4.4 / 4.5
├── server/
│   ├── api/
│   │   └── health.get.ts         # GET /health（迁移自 server.ts，对齐 skill-router 的 apiBaseURL:"/" + file routing）
│   ├── plugins/
│   │   └── queue-handler.ts      # 逻辑不变；env 提取改走 runtime 层 bindings 提取
│   └── notifier/
│       ├── types.ts              # 不变（Env 接口语义对齐 bindings 提取模式）
│       ├── bindings.ts           # 新增：extractNotifierBindings 模式（对齐 skill-router runtime/bindings.ts）
│       ├── filter.ts             # 不变
│       ├── builds-api.ts         # 不变
│       └── email.ts              # 不变（FROM 默认值与 toml vars 保持一致）
├── tests/                        # 29 用例不变 + bindings 提取用例
└── README.md                     # 部署章节对齐线上实配
```

删除：`server.ts`（根 handler 迁移至 `server/routes/health.get.ts`）。

## 六、边界与不变量

1. **secrets 卫生**：`NOTIFY_EMAIL_TO` / `CF_BUILDS_API_TOKEN` 一律 `wrangler secret put`，不进 toml、不进 .dev.vars.example 的赋值、明文不经 agent。
2. **部署 authority**：生产部署 = Workers Builds Git Integration；本地手动部署仅作应急通道（`wrangler deploy`）。
3. **顺序敏感**：先部署 Worker，再创建 Event Subscription。
4. **本地边界**：Miniflare / `nitro dev` 不支持 queue consumer，消费链路只能真机验证。
5. **测试基线**：现有 29 个纯函数用例行为不变（业务逻辑零改动，本次只动配置形态与 env 提取结构）。

## 七、风险与待验证点

| #   | 风险                                                                                                                                      | 等级 | 验证方式                                                                      | 回退方案                                                                                        |
| :-- | :---------------------------------------------------------------------------------------------------------------------------------------- | :--- | :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| R1  | nitro 合并 wrangler.toml 时是否保留 `queues.consumers` / `send_email`（skill-router 仅有 vars/version_metadata/observability 的合并先例） | 中   | T1 后跑 build，检查 `.output/server/wrangler.json` 是否含三要素+observability | 保留 Phase A 的 `cloudflare.wrangler` 注入形态（已实证可用），仅迁移 vars/observability 进 toml |
| R2  | `[[send_email]]` / `[[queues.consumers]]` 的 TOML 语法与 wrangler 4.122.0 schema 兼容性                                                   | 低   | `wrangler deploy --dry-run` 本地校验                                          | 调整为 nitro.config 注入                                                                        |
| R3  | Workers Builds Git 绑定配置的更新通道（cf-build-notifier worker 尚未创建，`cf builds workers create` 需先有 worker）                      | 低   | Phase B 序列化处理（见 plan 第四章）                                          | Dashboard 手动配置                                                                              |
| R4  | `defineNitroConfig` 与 `defineConfig` 行为差异（理论同源）                                                                                | 低   | build 产物对比                                                                | 回退 `defineConfig`                                                                             |

## 八、证据链附录

| #   | 证据                                                                            | 来源                                                                            |
| :-- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------ |
| 1   | wrangler.toml 全文（main/vars/version_metadata/observability）                  | `packages/skill-router-mcp/wrangler.toml`                                       |
| 2   | nitro 合并产物实拍（vars 等三项来自 toml 合并）                                 | `packages/skill-router-mcp/.output/server/wrangler.json`（2026-10-14 构建）     |
| 3   | 配置合并链路与「deploy 不传 --config」约定                                      | skill-router-mcp README「Cloudflare Workers Builds 配置」章节                   |
| 4   | 线上 Builds 实配（Root=/、build/deploy 命令、path_includes/excludes、previews） | `cf builds workers get 4351c4e4a0c9476bb6b78c219d6e3350`（2026-10-18 只读巡检） |
| 5   | 线上 observability/logs 全开                                                    | `cf workers get skill-router-mcp`                                               |
| 6   | env 提取模式 / 健康路由写法 / 端点工程化                                        | `runtime/bindings.ts`、`server/api/health.get.ts`、`server/api/mcp.post.ts`     |
| 7   | 测试三层形态                                                                    | `vitest.{unit,worker,integration}.config.ts`                                    |
| 8   | 根 .gitignore 仅覆盖 node_modules/.turbo                                        | `D:/code/ruan-cat/monorepo/.gitignore` grep 实证                                |
