# 2026-10-18 cf-build-notifier 对齐实施计划（对齐 skill-router-mcp）

> 本文由 WorkBuddy agent（GLM-5.3-Flash 模型）完成撰写。
> 状态：**草案，待用户审核**。按用户指令：文档先行，代码实施等待用户命令。
> 前置文档：`2026-10-18-cf-build-notifier-nitro-architecture-spec.md`（架构规格与决策矩阵）
> 范围声明：本计划只覆盖**本地代码与配置重构**（T1-T6）。所有云端资源写操作（部署、订阅、Git 绑定）集中在第四章 Phase B，执行前逐项向用户确认。

---

## 一、范围与不变量

**改动范围**：`packages/cf-build-notifier/**` + 根 `pnpm-lock.yaml`（wrangler 新依赖）。不触碰其他任何包。

**不变量**：

1. 业务逻辑零改动——filter / builds-api / email 三个纯函数模块与 queue-handler 的处理流程不动。
2. 现有 29 个测试用例行为不变（仅新增 bindings 提取用例）。
3. secrets 不入库、明文不经 agent。
4. `tsconfig.json` 保持 `extends nitro/tsconfig` 现状（spec 决策 #13）。
5. `vitest.config.ts`（包根）保持不变。

## 二、任务分解

### T1 配置重构（核心任务）

**改动文件**：

| 文件                | 动作                                                                                                                                                                                                    |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nitro.config.ts`   | 重写为 spec 4.1：`defineNitroConfig`（from `nitro/config`）、preset 内置、`cloudflare.wrangler` 只留 `name`、删除 queues/send_email 注入                                                                |
| `wrangler.toml`     | **新建** spec 4.2：name / compatibility_date / compatibility_flags / main / `[vars]` NOTIFY_EMAIL_FROM / `[[send_email]]` EMAIL / `[[queues.consumers]]` builds-event-subscriptions / `[observability]` |
| `.gitignore`        | 重写为 `.output/` `.nitro/` `.wrangler/` `.dev.vars`（对齐 skill-router 写法 + 补 nitro 目录）                                                                                                          |
| `.dev.vars.example` | **新建** spec 4.5                                                                                                                                                                                       |

**验证**：`pnpm build` 后检查 `.output/server/wrangler.json` 五要素——`name=cf-build-notifier`、`queues.consumers[0].queue=builds-event-subscriptions`、`send_email[0].name=EMAIL`、`observability.enabled=true`、`vars.NOTIFY_EMAIL_FROM=builds@ruan-cat.com`。

**回退**：若 R1 命中（nitro 合并丢弃 queues/send_email 字段），将这两项回填 `nitro.config.ts` 的 `cloudflare.wrangler` 注入（Phase A 已实证可用），vars/observability 保留在 toml。

### T2 HTTP 入口迁移 + bindings 提取模式

**改动文件**：

| 文件                              | 动作                                                                                                                                                                 |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.ts`                       | **删除**                                                                                                                                                             |
| `server/api/health.get.ts`        | **新建**：`GET /health` 返回 `{ ok, service, emailConfigReady }`；env 经 `event.req.runtime?.cloudflare?.env` 获取（对齐 skill-router 写法）；payload 纯函数独立导出 |
| `server/notifier/bindings.ts`     | **新建**：`extractNotifierBindings(input)` —— 兼容 `{ env }` 包裹与裸 env；`NOTIFY_EMAIL_TO` 缺失不 throw（运行时降级为配置错误日志），类型层标记必填语义            |
| `server/plugins/queue-handler.ts` | env 获取改走 `extractNotifierBindings`，处理流程不变                                                                                                                 |
| `tests/bindings.test.ts`          | **新建**：提取函数用例（包裹/裸 env/缺省字段）                                                                                                                       |

**验证**：`pnpm test` 全绿（29 + 新增）；`pnpm typecheck` 零错误；`pnpm build` 成功。

**回退**：恢复 `server.ts` 与原 queue-handler 写法（git 单文件还原）。

### T3 package.json 对齐

**改动**：

| 项                                       | 动作                                                                                        |
| :--------------------------------------- | :------------------------------------------------------------------------------------------ |
| `devDependencies.wrangler`               | 新增 `4.122.0`（对齐 skill-router-mcp 版本，deploy_command 依赖包内可执行）                 |
| `scripts.build`                          | `nitro build`（去掉 `--preset` 传参）                                                       |
| `scripts.deploy`                         | `pnpm run build && wrangler deploy`（包根执行，跟随 `.wrangler/deploy/config.json` 重定向） |
| `scripts.wrangler`                       | 新增 `"wrangler": "wrangler"`                                                               |
| `scripts.prepare` / `typecheck` / `test` | 保持                                                                                        |
| `devDependencies.vitest`                 | 保持包内声明（`pnpm -F` 运行需要包内可执行；版本跟随 root 3.x）                             |

**验证**：`pnpm install` 成功；`pnpm -F @ruan-cat/cf-build-notifier exec wrangler --version` 输出 4.122.0。

### T4 验证闭环（T1-T3 完成后一次性执行）

```bash
pnpm install
pnpm -F @ruan-cat/cf-build-notifier test        # 29+ 用例全绿
pnpm -F @ruan-cat/cf-build-notifier typecheck   # tsc --noEmit 零错误
pnpm -F @ruan-cat/cf-build-notifier build       # 构建成功
# 五要素核验（T1 验证项）
cat packages/cf-build-notifier/.output/server/wrangler.json
# wrangler 配置 schema 本地校验（不部署、不需要 auth）
pnpm -F @ruan-cat/cf-build-notifier exec wrangler deploy --dry-run
```

**关键产物核验清单**（逐项打勾）：

- [ ] `name: "cf-build-notifier"`
- [ ] `queues.consumers: [{ queue: "builds-event-subscriptions" }]`
- [ ] `send_email: [{ name: "EMAIL" }]`
- [ ] `observability: { enabled: true, head_sampling_rate: 1 }`
- [ ] `vars: { NOTIFY_EMAIL_FROM: "builds@ruan-cat.com" }`
- [ ] `main: "index.mjs"` + `compatibility_flags: ["nodejs_compat"]`（nitro 生成项）
- [ ] `.wrangler/deploy/config.json` 重定向文件生成
- [ ] `wrangler deploy --dry-run` 无 schema 报错

### T5 README 更新

- 架构图部署通道改为 `wrangler deploy`（重定向机制）
- 配置章节：wrangler.toml 三类配置源说明（vars/secrets/bindings）
- 新增「Cloudflare Workers Builds 配置」章节（对齐线上实配三条命令 + Root=/）
- Phase B 前置清单与序列更新（与本文第四章一致）
- 部署上线后补 `homepage` 字段

### T6 文档与记忆收尾

- `docs/plan/2026-10-18-cf-build-notifier/2026-10-18-cf-build-notifier-nitro-alignment-report.md`：实施报告（改动清单 + 验证日志 + R1 验证结论）
- `.workbuddy/memory/2026-10-18.md` 追加
- memorix long-term add：wrangler.toml 合并机制、`cf builds workers get` 巡检模式、`--external-script-id` 不是 worker name 的坑

## 三、任务依赖与执行顺序

```text
T1（配置重构）──┐
T3（package.json）─┤──► T4（验证闭环）──► T5（README）──► T6（收尾）
T2（代码迁移）──┘
```

T1 / T2 / T3 相互独立可并行实施；T4 必须收口验证；T5/T6 依赖 T4 通过。

## 四、Phase B 部署序列（修订版，云端操作，逐项用户确认）

> 前置（用户）：① Dashboard Onboard 发件域 `ruan-cat.com`；② 提供收件邮箱；③ 创建构建 API token（Workers Builds Configuration: Read + Workers Scripts: Read）。

| 步骤 | 命令/动作                                                                         | 说明                                                                                                                                                                                                                                                                                                                                              |
| :--- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1   | `pnpm -F @ruan-cat/cf-build-notifier deploy`                                      | 首次部署，Worker 上线（先部署后订阅，消除首建盲区）                                                                                                                                                                                                                                                                                               |
| B2   | `cf builds workers create`（参数现场 `--help` 确认）                              | 绑定 Git 集成：repo=monorepo、branch=dev、root=/、build=`pnpm i && pnpm --dir packages/cf-build-notifier run build`、deploy=`pnpm --dir packages/cf-build-notifier exec wrangler deploy`、includes=`packages/cf-build-notifier/**`+`pnpm-lock.yaml`+`pnpm-workspace.yaml`、excludes=同 skill-router、previews=false。备选：Dashboard 向导一步到位 |
| B3   | `wrangler secret put NOTIFY_EMAIL_TO` / `wrangler secret put CF_BUILDS_API_TOKEN` | secrets 注入（明文用户亲手输入）                                                                                                                                                                                                                                                                                                                  |
| B4   | `cf queues create builds-event-subscriptions`                                     | 创建事件队列                                                                                                                                                                                                                                                                                                                                      |
| B5   | `cf queues subscriptions create --dry-run ...` → 正式执行                         | 订阅仅 `build.failed,build.canceled`，destination=builds-event-subscriptions                                                                                                                                                                                                                                                                      |
| B6   | 对任意 Worker 点 Retry build 触发失败（或 push 会失败的 commit）                  | 验证闭环：Queue 消费记录 + 收件邮箱 + `cf tail` 无 EMAIL 错误码                                                                                                                                                                                                                                                                                   |
| B7   | `cf builds list --external-script-id <tag>` + dashboard 巡检                      | 持续观测（注意：external-script-id 需从 `cf workers get` 获取，不是 worker 名）                                                                                                                                                                                                                                                                   |

## 五、风险与回滚（详见 spec 第七章）

- **R1（中）**：nitro 合并可能丢弃 `queues.consumers` / `send_email` → T4 五要素核验把关，回退方案已内置 T1。
- **R2（低）**：TOML binding 语法兼容性 → `wrangler deploy --dry-run` 前置拦截。
- **R3（低）**：`cf builds workers create` 参数形态未知 → B2 现场确认 help，Dashboard 兜底。
- **R4（低）**：`defineNitroConfig` 行为差异 → 构建产物对比，回退 `defineConfig`。

## 六、验收清单

- [ ] T4 八项产物核验全过
- [ ] 29+ 测试全绿、typecheck 零错误
- [ ] 根 `pnpm-lock.yaml` 变更仅 wrangler 相关
- [ ] `git status` 变更文件全部位于 `packages/cf-build-notifier/` + lockfile + plan 目录
- [ ] README 与线上实配一致（Root=/、wrangler deploy、includes 三项）
- [ ] 实施报告 + 记忆沉淀完成
- [ ] Phase B 序列经用户逐项确认后执行
