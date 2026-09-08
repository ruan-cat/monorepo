# `cleanup-old-deployments` 旧部署批量删减能力实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 为 `@ruan-cat/vercel-deploy-tool` 实现「部署后自动清理旧部署」能力（默认关闭，`deploymentCleanup` 字段开启），CLI 单进程批量删除形态，peerDependencies 抬至 `>=50.5.0`。

**架构：** `src/core/cleanup-plan.ts` 纯函数（JSON 解析/保留策略/分批）+ `src/core/tasks/cleanup.ts` 任务封装（ls 列取 + 分批 remove spawn + 失败降级）+ 工作流阶段 6 接线。

**技术栈：** TypeScript + 既有 tasuku 任务编排 + spawnSync（沿用 `createVercelSpawnOptions`）+ Vitest（包内 `tests/` 目录惯例）。

**对应 spec：** `packages/vercel-deploy-tool/src/docs/superpower/2026-09-09-cleanup-old-deployments-design.md`

## 全局约束

- 遵循仓库 `AGENTS.md`：测试用 vitest `describe`/`test` 中文场景命名；包规范对照 `package-linter` 技能；发版日志走 `.changeset`（`pnpm dlx @changesets/cli add --empty`，minor，禁用 markdown 标题）。
- 删除红线（来自 spec）：禁止项目名整删形态、禁止并发 spawn remove、BUILDING 类状态跳过、失败不阻塞部署。
- 本计划不触碰 `docs/prompts/` 内的 prompt 记录文件。
- 先红后绿：每个 Task 的测试先于实现确认失败，实现后转绿。

---

### Task 1: 配置 Schema + 版本下限对齐

**Files:**

- Modify: `src/config/schema.ts`
- Modify: `src/core/vercel.ts`
- Modify: `package.json`
- Modify: `tests/vercel-cli-version.test.ts`

**Interfaces（Produces）:**

```ts
// schema.ts 追加
export interface DeploymentCleanup {
	/** 是否开启部署后自动清理 @default false */
	isEnable?: boolean;
	/** 保留最近 N 个生产部署 @default 10 */
	keepProductionCount?: number;
	/** 保留最近 N 个预览部署 @default 5 */
	keepPreviewCount?: number;
	/** 是否跳过带活跃 alias 的部署（remove --safe） @default true */
	isKeepAliased?: boolean;
}
// VercelDeployConfig 追加字段：
//   deploymentCleanup?: DeploymentCleanup;
```

- `src/core/vercel.ts`：`MIN_VERCEL_CLI_VERSION = "47.2.2"` → `"50.5.0"`（注释注明幽灵版本 47.2.2 不存在 + `ls --format json` 二分实证链，引用 spec）。
- `package.json`：`peerDependencies.vercel: ">=47.2.2"` → `">=50.5.0"`；`version: "2.0.3"` → `"2.1.0"`。
- `tests/vercel-cli-version.test.ts`：断言更新——`isVercelCliVersionSupported("50.4.11") === false`、`("50.5.0") === true`、`("58.7.1") === true`；删除 47.2.x 相关断言。

**Steps:**

- [ ] **Step 1**: 更新 `tests/vercel-cli-version.test.ts` 断言（先红）。
- [ ] **Step 2**: 修改 `src/core/vercel.ts` 常量与注释、`src/config/schema.ts` 接口、`package.json`。
- [ ] **Step 3**: `pnpm vitest run packages/vercel-deploy-tool/tests/vercel-cli-version.test.ts`（monorepo 根执行）→ 全绿。
- [ ] **Step 4**: `pnpm -C packages/vercel-deploy-tool build` 通过（prebuild automd 正常）。
- [ ] **Step 5**: 提交 `✨ feat(vercel-deploy-tool): 新增 deploymentCleanup 配置并抬升 vercel peerDep 至 50.5.0`。

---

### Task 2: cleanup-plan 纯函数 + 单测转绿

**Files:**

- Create: `src/core/cleanup-plan.ts`
- Create: `tests/cleanup-plan.test.ts`

**Interfaces（Produces，Task 3 依赖的精确签名）:**

```ts
/** ls --format json 的部署条目（防御式子集，其余字段忽略） */
export interface ListedDeployment {
	url: string;
	name?: string;
	state?: string;
	target?: string;
	createdAt?: number;
}

/** ls --format json 整体输出（兼容 50.5.0 ~ 58.x 差异） */
export interface LsJsonOutput {
	deployments?: ListedDeployment[];
	pagination?: { cursor?: string | number | null } | unknown;
}

/** 清理动作 */
export type CleanupAction = "KEEP" | "DELETE" | "SKIP-BUILDING";

export interface CleanupEntry {
	url: string;
	state: string;
	target: string;
	createdAt: number;
	action: CleanupAction;
}

export interface CleanupSummary {
	total: number;
	keepProduction: number;
	keepPreview: number;
	deleteCount: number;
	skipBuilding: number;
}

export const SKIP_BUILDING_STATES = ["BUILDING", "QUEUED", "INITIALIZING"];
/** 每批 remove 的最大 url 数（控制单命令长度） */
export const REMOVE_BATCH_SIZE = 20;

export function parseDeploymentsJson(raw: string): ListedDeployment[];
export function buildCleanupPlan(
	deployments: ListedDeployment[],
	options: { keepProductionCount: number; keepPreviewCount: number },
): { summary: CleanupSummary; entries: CleanupEntry[] };
export function chunkUrls(urls: string[], size?: number): string[][];
```

语义约定（单测固化）：

- `parseDeploymentsJson`：优先取对象 `.deployments`；若 raw 本身是裸数组直接用；`deployments` 缺失/非数组 → 返回 `[]`；无 `url` 字段的条目丢弃；JSON 语法错误抛 `Error`。
- `buildCleanupPlan`：production = `target === "production"`；其余（含 target 缺失）视为预览；两组分别按 `createdAt` 降序保留前 N（`createdAt` 缺失按 0 处理）；`state ∈ SKIP_BUILDING_STATES` 强制 `SKIP-BUILDING`（不占保留名额也不删）；`--safe` 的 alias 保护在 CLI 侧，计划层不感知。
- `chunkUrls`：默认 20；空数组 → `[]`。

**Steps:**

- [ ] **Step 1**: 写 `tests/cleanup-plan.test.ts` 失败测试（场景覆盖：解析 4 态 + 保留策略 6 场景 + 分批 4 边界，≥ 14 用例）。
- [ ] **Step 2**: `pnpm vitest run packages/vercel-deploy-tool/tests/cleanup-plan.test.ts` → FAIL（模块不存在）。
- [ ] **Step 3**: 实现 `src/core/cleanup-plan.ts`。
- [ ] **Step 4**: 复跑 → 全绿。
- [ ] **Step 5**: 提交 `✨ feat(vercel-deploy-tool): 新增清理计划纯函数层与单测`。

---

### Task 3: cleanup 任务 + 工作流阶段 6 接线

**Files:**

- Create: `src/core/tasks/cleanup.ts`
- Modify: `src/core/tasks/index.ts`

**Interfaces:**

- Consumes: Task 1 的 `DeploymentCleanup`、Task 2 的 `parseDeploymentsJson` / `buildCleanupPlan` / `chunkUrls` / `REMOVE_BATCH_SIZE`、既有 `createVercelSpawnOptions` / `getVercelScopeArg` / `getVercelTokenArg`。
- Produces: `createCleanupTask(config: VercelDeployConfig): { name: string; fn: () => Promise<void> }`——`isEnable !== true` 时返回带「未开启」提示的空任务（与 AfterBuild 无任务的同款形态）。

**`createCleanupTask` 行为规格：**

1. `fn` 整体 try/catch：catch 内 `consola.warn("清理旧部署失败（不影响部署结果）", err)` 后 return——失败不阻塞红线在此落地。
2. 列取：`spawnSync("vercel", ["ls", config.vercelProjectName, "--format", "json", ...getVercelScopeArg(config), ...getVercelTokenArg(config)], createVercelSpawnOptions("pipe"))`；非零退出或 stdout 无法解析 → throw（由步骤 1 兜底）。
3. 翻页：跟随响应 `pagination.cursor` 追加 `-N <cursor>` 再列，最多 10 页；游标缺失/不前进即终止（防死循环）。
4. 计划：`buildCleanupPlan(all, { keepProductionCount: cfg.keepProductionCount ?? 10, keepPreviewCount: cfg.keepPreviewCount ?? 5 })`；`deleteCount === 0` → `consola.info` 提示后 return。
5. 输出计划明细（每条 DELETE 一行：url / state / target），然后 `chunkUrls` 分批串行 `spawnSync("vercel", ["remove", ...batch, "--yes", ...(cfg.isKeepAliased !== false ? ["--safe"] : []), ...scope, ...token])`。
6. 单批失败（非零退出）记录 `failedBatches`，继续下一批；最终汇总 `consola.success/warn`。

**工作流接线（`index.ts`）：**

- import `createCleanupTask`；在「5. 部署与设置别名」task 块之后追加：

```ts
// 6. 清理旧部署（deploymentCleanup.isEnable 时生效；失败不阻塞）
await task("6. 清理旧部署", async () => {
	const cleanupTask = createCleanupTask(config);
	await cleanupTask.fn();
});
```

- 成功收尾日志 `🎉 Vercel 部署工作流完成！` 保持最后。

**Steps:**

- [ ] **Step 1**: 实现 `src/core/tasks/cleanup.ts` 与 `index.ts` 接线。
- [ ] **Step 2**: `pnpm -C packages/vercel-deploy-tool build` 通过；`pnpm vitest run packages/vercel-deploy-tool/tests`（既有测试回归）全绿。
- [ ] **Step 3**: 真实通道 smoke（人工 gate）：任选一个低风险测试项目配置 `deploymentCleanup: { isEnable: true }` 跑 `pnpm -C packages/vercel-deploy-tool test:dev`，核对阶段 6 日志链（列取 → 计划明细 → 分批删除 → 汇总）与退出码 0。若项目/凭据不可用，如实标记「真实 smoke 未验证」。
- [ ] **Step 4**: 提交 `✨ feat(vercel-deploy-tool): 部署后自动清理旧部署任务与工作流接线`。

---

### Task 4: 功能文档 + 发版日志

**Files:**

- Create: `src/docs/cleanup-deployments.md`（vitepress 页面，frontmatter 按站点惯例，sidebar 自动生成）
- Create: `.changeset/<日期>-cleanup-old-deployments.md`（`pnpm dlx @changesets/cli add --empty` 后重命名）
- Modify: `README.md`（若包 README 有功能清单段落则追加一条；无则不动）

**文档要点（`cleanup-deployments.md`）：**

- 功能定位：部署后增量维护，防 Deployment Storage 额度增长；与 `clean-vercel-deployment-storage` 技能（一次性大清理）的职责边界。
- 配置示例（`defineConfig` 片段：isEnable / keepProductionCount / keepPreviewCount / isKeepAliased 全字段 + 默认值表）。
- 行为说明：保留策略、BUILDING 跳过、`--safe` alias 保护、失败不阻塞、日志形态。
- 版本要求：vercel CLI ≥ 50.5.0（`ls --format json` 能力引入版本，附二分实证表）；包 peerDependencies 已声明。
- 红线提示：绝不使用 `vercel remove <project-name>` 项目名整删形态。

**changeset 规范（仓库 AGENTS.md）：**

- minor 等级；正文用有序序号，禁用任何等级 markdown 标题；文件名 `2026-09-09-cleanup-old-deployments.md`。

**Steps:**

- [ ] **Step 1**: 写 `src/docs/cleanup-deployments.md`；`pnpm -C packages/vercel-deploy-tool build:docs` 通过。
- [ ] **Step 2**: 生成并填写 changeset。
- [ ] **Step 3**: 提交 `📃 docs(vercel-deploy-tool): 新增部署后清理旧部署功能文档与发版日志`。

---

### Task 5: 最终验收（人工 gate）

- [ ] **Step 1**: monorepo 根 `pnpm vitest run packages/vercel-deploy-tool/tests` 全绿（cleanup-plan + vercel-cli-version + 既有回归）。
- [ ] **Step 2**: `pnpm -C packages/vercel-deploy-tool build` 与 `build:docs` 双通过。
- [ ] **Step 3**: `git diff --check` 通过；`git status` 仅含本计划内文件（`packages/vercel-deploy-tool/src/docs/prompts/index.md` 为另一任务记录，仍保持未提交）。
- [ ] **Step 4**: 对照 spec「红线」逐条核对实现（重点：代码中无项目名整删路径、无并发 remove spawn）。
- [ ] **Step 5**: 真实 smoke 结论如实标注；未验证项不得伪造输出。
- [ ] **Step 6**: 通知用户进入发版流程（changeset 已就绪，版本 2.1.0）。

## 自检记录

- Spec 覆盖：配置字段（T1）、纯函数层（T2）、任务与工作流接线（T3）、文档与 changeset（T4）、红线核对（T5）、peerDep + 幽灵版本修复（T1）——无缺口。
- 类型一致性：`ListedDeployment` / `CleanupEntry` / `CleanupSummary` / `parseDeploymentsJson` / `buildCleanupPlan` / `chunkUrls` / `createCleanupTask` 在 T2/T3 间签名一致。
- 实证锚点：`ls --format json` 引入版本 50.5.0（50.4.11 无 / 50.5.0 有）；47.2.2 幽灵版本；ls JSON 无 uid 用 url 删——全部写入 spec，plan 不重复展开。
- 未决风险已挂到 T3 Step 3（smoke 收敛分页与部分失败行为）。
