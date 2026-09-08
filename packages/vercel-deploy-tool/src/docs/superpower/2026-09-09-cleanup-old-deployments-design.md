# 2026-09-09 `cleanup-old-deployments` 旧部署批量删减能力设计

> 完成主体：WorkBuddy / GLM-5.3-Flash。

## 目标

为 `@ruan-cat/vercel-deploy-tool` 新增**部署后自动清理旧部署**能力：当配置开启时，每次部署工作流完成后，自动删除该 vercel 项目存续的多余历史部署，只保留最近 N 个生产部署与 M 个预览部署，防止 Deployment Storage 额度随部署次数无限增长。

**默认不开启**。通过新增配置字段 `deploymentCleanup` 显式开启，字段可配置保留数量。

## 背景（历史证据链）

- 2026-09-08 事故复盘（见 `ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/references/incident-2026-09-08.md`）：845 部署 → 27，其中「并发 spawn vercel CLI」因 token 过期 + refreshToken 刷新竞争打挂本地凭据，142 个改走 REST API 收尾。
- 本工具的定位差异：`vercel-deploy-tool` 是**部署后增量维护**（每次删个位数到数十个），不是一次性大规模清理（800+）。结合用户拍板「默认使用 vercel cli」，采用 CLI 通道 + **单进程批量删除**形态规避凭据竞争。

## CLI 能力实证（全部本机验证，2026-09-09）

| 版本                | `vercel ls --format json`       | `vercel remove --safe --yes` | 证据方式                                                               |
| :------------------ | :------------------------------ | :--------------------------- | :--------------------------------------------------------------------- |
| 47.1.4（47.x 最高） | ❌ 无                           | ✅                           | `pnpm dlx vercel@47.1.4 ls --help`                                     |
| 48.0.0 – 50.4.11    | ❌ 无                           | ✅                           | 二分验证 48.0.0 / 50.0.0 / 50.0.1 / 50.1.6 / 50.3.3 / 50.4.0 / 50.4.11 |
| **50.5.0**          | ✅ 首次引入                     | ✅                           | `pnpm dlx vercel@50.5.0 ls --help` / `remove --help`                   |
| 58.7.1（本机当前）  | ✅（另含 `--json` / `--limit`） | ✅                           | 本机直接验证                                                           |

**幽灵版本发现**：现有 `peerDependencies.vercel: ">=47.2.2"` 指向的 47.2.2 在 npmjs 上**不存在**（npmjs registry 实查 47.x 稳定版最高 47.1.4），`>=47.2.2` 实际等效 `>=47.3.0`。

**`ls --format json` 输出形态**（58.7.1 实测，只读探测 `ruancat-projects/notes` 项目）：

```json
{
	"contextName": "ruancat-projects",
	"deployments": [
		{
			"url": "notes-f28lutryb-ruancat-projects.vercel.app",
			"name": "notes",
			"state": "READY",
			"target": "production",
			"createdAt": 1788894773448,
			"buildingAt": 1788894775000,
			"ready": "...",
			"creator": "...",
			"meta": {}
		}
	],
	"pagination": {}
}
```

关键事实：**列表项没有 `uid` 字段**，删除标识使用 `url`（deployment-url）；官方文档确认 `vercel remove` 接受 deployment-url 形态（`vercel remove my-deployment.com --yes`）。

## 已确认设计决策（用户拍板）

| 决策点           | 结论                                                                                                         |
| :--------------- | :----------------------------------------------------------------------------------------------------------- |
| peerDependencies | **直接抬至 `>=50.5.0`**（方案 B），同时消除幽灵版本号；全局 `MIN_VERCEL_CLI_VERSION` 同步改为 `50.5.0`       |
| 删除执行形态     | **单进程批量删除**：一次 spawn 执行 `vercel remove <url1> ... <urlN> --yes --safe`，每批 ≤ 20 条，批次间串行 |
| 失败策略         | **清理失败仅告警不阻塞**：部署 + alias 成功后清理失败只 `consola.warn`，不抛出，不影响部署命令退出码         |
| 配置字段         | `deploymentCleanup?: DeploymentCleanup` 对象字段，默认不开启                                                 |

## 配置 Schema

```ts
/** 旧部署清理配置 */
export interface DeploymentCleanup {
	/**
	 * 是否开启部署后自动清理
	 * @default false
	 */
	isEnable?: boolean;

	/**
	 * 保留最近 N 个生产部署（target === "production"，按 createdAt 降序）
	 * @default 10
	 */
	keepProductionCount?: number;

	/**
	 * 保留最近 N 个预览部署（target 非 production，按 createdAt 降序）
	 * @default 5
	 */
	keepPreviewCount?: number;

	/**
	 * 是否跳过带活跃 alias 的部署（对应 remove 的 --safe 标志）
	 * @default true
	 */
	isKeepAliased?: boolean;
}

// VercelDeployConfig 追加：
export interface VercelDeployConfig {
	// ...既有字段不变
	/** 部署完成后自动清理旧部署（默认不开启） */
	deploymentCleanup?: DeploymentCleanup;
}
```

命名对齐仓库既有惯例（`isNeedVercelBuild` / `isCopyDist` 的 `isXxx` 风格）。

## 执行流程

新增部署工作流 **阶段 6**（`src/core/tasks/index.ts` 的 `executeDeploymentWorkflow`，在「5. 部署与设置别名」之后、成功收尾日志之前）：

```text
6. 清理旧部署（仅当 deploymentCleanup.isEnable === true）
   6.1 assertVercelCliAvailable() 已在流程入口完成（版本检查全局生效）
   6.2 spawn: vercel ls <vercelProjectName> --format json --scope <orgId> --token <token>
       → 解析 JSON（防御式：非数组 deployments / 空 deployments 均视为无需清理）
       → 翻页跟随 pagination.cursor（-N/--next），最多 10 页，防游标不前进死循环
   6.3 buildCleanupPlan(deployments, options) 纯函数计算删除清单：
       - 生产部署按 createdAt 降序，保留前 keepProductionCount 个
       - 预览部署按 createdAt 降序，保留前 keepPreviewCount 个
       - state ∈ {BUILDING, QUEUED, INITIALIZING} 一律 SKIP-BUILDING 不删
       - 其余标记 DELETE
       - 空清单直接返回（consola.info 提示）
   6.4 分批（每批 ≤ 20）串行 spawn:
       vercel remove <url1> ... <url20> --yes [--safe] --scope <orgId> --token <token>
       单批失败：记录失败清单 + consola.warn，继续下一批
   6.5 汇总输出：保留 X 个生产 / Y 个预览，删除 Z 个，失败 W 个
   6.6 任何异常 catch 后降级为 consola.warn，不向工作流抛出（失败不阻塞）
```

## 红线

1. **禁止 `vercel remove <project-name>` 项目名整删形态**——该形态会删除整个项目全部部署（官方文档明示）。删除只允许显式 url 列表。代码中不出现以项目名作为 remove 参数的调用路径。
2. **单进程批量，禁止并发 spawn remove**——规避 2026-09-08 refreshToken 竞争事故。
3. **BUILDING/QUEUED/INITIALIZING 状态一律跳过**——正在构建的部署不可删。
4. **清理失败不得影响部署结果**——部署已成功，删除失败仅告警，下次部署自然重试。
5. `--safe` 默认开启（isKeepAliased 默认 true），保护带活跃 alias 的部署。

## 文件结构与职责

| 路径                               | 变更职责                                                                          |
| :--------------------------------- | :-------------------------------------------------------------------------------- |
| `src/config/schema.ts`             | 新增 `DeploymentCleanup` 接口 + `VercelDeployConfig.deploymentCleanup` 字段       |
| `src/core/cleanup-plan.ts`         | 纯函数层：`parseDeploymentsJson`、`buildCleanupPlan`、`chunkUrls`。零 IO 零 spawn |
| `src/core/tasks/cleanup.ts`        | `createCleanupTask(config)`：ls 列取 + 计划 + 分批 remove spawn + 失败降级        |
| `src/core/tasks/index.ts`          | 工作流接入阶段 6                                                                  |
| `src/core/vercel.ts`               | `MIN_VERCEL_CLI_VERSION` 改为 `"50.5.0"`（消除幽灵版本 + 对齐 peerDep）           |
| `package.json`                     | `peerDependencies.vercel: ">=50.5.0"`；包版本 bump `2.1.0`（minor，新功能）       |
| `src/docs/cleanup-deployments.md`  | 功能说明文档（vitepress 站点页，sidebar 自动生成）                                |
| `tests/cleanup-plan.test.ts`       | 纯函数单测                                                                        |
| `tests/vercel-cli-version.test.ts` | 最低版本断言更新为 50.5.0                                                         |

发版按仓库规范生成 changeset（`.changeset` 目录，minor）。

## 测试设计

### 纯函数单测（`tests/cleanup-plan.test.ts`，vitest describe/test 中文场景）

- `parseDeploymentsJson`：合法对象（`{ deployments, pagination }`）→ 数组；裸数组输入兼容；`deployments` 缺失/非数组/空 → 空数组；JSON 解析失败 → 抛出带上下文的错误。
- `buildCleanupPlan`：生产/预览分别按数量保留最新；BUILDING/QUEUED/INITIALIZING 跳过；数量不足时不误删；空输入全零；`isKeepAliased=false` 时仅影响 remove 参数不影响计划（计划层不管 alias，alias 保护由 `--safe` 在 CLI 侧兜底——计划与保护分离，单测固定该语义）。
- `chunkUrls`：20 条分批边界（19/20/21/41）；空数组 → 空批次。

### 既有测试回归

- `tests/vercel-cli-version.test.ts`：`isVercelCliVersionSupported("50.4.11") === false`、`("50.5.0") === true`。

### 真实通道 smoke（人工 gate，不进 CI）

- 在测试项目上开启 `deploymentCleanup` 跑 `test:dev`，验证：阶段 6 列表输出 → 计划明细 → 批量删除日志 → 退出码 0。
- 反向验证：故意构造删除失败（无效 url 混入）确认仅告警、部署流水线仍成功。

## 非目标

- 不做 REST API 直连删除通道（CLI 单进程批量已规避凭据竞争；本工具是增量维护场景，非 800+ 大清理场景）。
- 不做交互式确认、dry-run 配置项（YAGNI；计划明细日志已提供审计能力）。
- 不做 Deployment Retention 配置（额度治理的自动过期归 `clean-vercel-deployment-storage` 技能，与本工具职责分离）。
- 不做多项目批量编排（一个 config 对应一个 vercelProjectName）。

## 未决风险（实现期收敛）

1. 50.5.0 与 58.x 的 `ls --format json` 分页字段形态可能存在差异——实现 Task 中先对两者各做一次只读 probe，解析层做防御式兼容。
2. `remove` 多 url 批量时**部分失败**的退出码行为未验证——真实 smoke 覆盖，必要时降级为更小批次（≤ 5）。
3. `--limit` 在 50.5.0 不可用（晚于该版本引入），依赖默认页大小 + `--next` 翻页；若实测 50.5.0 无 `pagination.cursor`，则接受单页最大量的保守行为并在文档注明。
