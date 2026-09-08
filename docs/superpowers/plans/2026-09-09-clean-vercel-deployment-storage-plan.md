# `clean-vercel-deployment-storage` 低频技能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 在 `ai-plugins/low-frequency-skill/skills/` 新增 `clean-vercel-deployment-storage` 技能（v1.0.0），含极简 SKILL.md、三份 references、三层 TS 脚本（仅 Node 内置模块，tsx 调度）与离线 vitest 测试，并同步插件 README/CHANGELOG。

**架构：** `src/core.ts` 纯函数（保留策略/分页合并/摘要）+ `src/api.ts` 薄 REST 封装（token 注入式 fetch）+ `src/cli.ts` argv 入口。测试只打纯函数与静态契约，零网络。

**技术栈：** TypeScript + Node 22 内置模块 + tsx（运行）+ Vitest（测试，遵循 monorepo `tests/` 公共配置）。

**对应 spec：** `docs/superpowers/specs/2026-09-09-clean-vercel-deployment-storage-design.md`

## 全局约束

- 脚本与技能正文零第三方运行时依赖，只允许 `node:*` 内置模块与全局 `fetch`。
- SKILL.md frontmatter：`name: clean-vercel-deployment-storage`、`user-invocable: true`、`metadata.version: "1.0.0"`；`description` 以「使用时机」开头，不复述流程。
- 测试文件放 `tests/clean-vercel-deployment-storage/`，继承根 `tests/vitest.config.ts`（`**/*.test.ts`、node 环境），import 源码用相对路径 `../../ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/...`。
- 正文与 references 禁止出现内部绝对路径（`C:\Users`、`D:\code`）与 SmallAliceWeb 项目特例。
- 测试用例使用 `describe`/`test` + 中文场景命名，风格对齐 `tests/init-simple-memorix/install-mcp.test.ts`。
- 本轮不跑 release 脚本、不改 `skill-registry.json`、不 bump 插件主版本。

---

### Task 1: core.ts 纯函数 + 单测转绿

**Files:**

- Create: `ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/core.ts`
- Test: `tests/clean-vercel-deployment-storage/core.test.ts`

**Interfaces:**

- Produces（后续任务依赖的精确签名）:
  - `type PlanAction = "KEEP" | "DELETE" | "SKIP-BUILDING"`
  - `interface DeploymentLike { uid: string; projectId?: string; target?: string; readyState?: string; createdAt: number; url?: string }`
  - `interface PlanEntry { project: string; uid: string; url: string; target: string; readyState: string; createdAt: string; action: PlanAction }`
  - `interface PlanSummary { totalProjects: number; totalDeployments: number; keep: number; delete: number; skipBuilding: number }`
  - `function mergePages<T extends { uid: string }>(accumulated: Map<string, T>, page: T[]): number`（返回新增条数）
  - `function buildPlan(deployments: DeploymentLike[], projectNames?: Record<string, string>): { summary: PlanSummary; entries: PlanEntry[] }`
  - `function summarize(entries: PlanEntry[]): PlanSummary`
  - `const PASS_ROLES = ["OWNER", "DEVELOPER"]`
  - `interface PreflightInput { identity?: string; teams: { id: string; slug?: string; name?: string; role?: string; plan?: string }[]; targetTeamId: string }`
  - `interface PreflightResult { status: "PASS" | "FAIL"; identity?: string; teamId?: string; role?: string; plan?: string; reason?: string }`
  - `function judgePreflight(input: PreflightInput): PreflightResult`（targetTeamId 兼容传 slug：按 id 或 slug 匹配；匹配不到团队 / 缺身份 / 角色不在 PASS_ROLES → FAIL + reason）
- 常量：`SKIP_STATES = ["BUILDING", "QUEUED", "INITIALIZING"]`；`target` 缺省视为 `"preview"`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, test, expect } from "vitest";
import {
	buildPlan,
	mergePages,
	summarize,
	judgePreflight,
} from "../../ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/core.ts";

describe("mergePages 分页合并", () => {
	test("M1: 首页全部新增 → 返回新增数并填充 Map", () => {
		const acc = new Map();
		const added = mergePages(acc, [
			{ uid: "dpl_a", createdAt: 3 },
			{ uid: "dpl_b", createdAt: 2 },
		]);
		expect(added).toBe(2);
		expect(acc.size).toBe(2);
	});

	test("M2: 重复 uid 跨页去重 → 不新增不覆盖", () => {
		const acc = new Map([{ dpl_a: { uid: "dpl_a", createdAt: 3 } } as never]);
		const added = mergePages(acc, [
			{ uid: "dpl_a", createdAt: 3 },
			{ uid: "dpl_c", createdAt: 1 },
		]);
		expect(added).toBe(1);
		expect(acc.get("dpl_a").createdAt).toBe(3);
	});
});

describe("buildPlan 保留策略", () => {
	const deps = [
		{
			uid: "p1_old",
			projectId: "prj_1",
			target: "production",
			readyState: "READY",
			createdAt: 1000,
			url: "a.vercel.app",
		},
		{
			uid: "p1_new",
			projectId: "prj_1",
			target: "production",
			readyState: "READY",
			createdAt: 2000,
			url: "b.vercel.app",
		},
		{ uid: "p1_pv", projectId: "prj_1", target: undefined, readyState: "READY", createdAt: 3000, url: "c.vercel.app" },
		{
			uid: "p2_bld",
			projectId: "prj_2",
			target: "preview",
			readyState: "BUILDING",
			createdAt: 4000,
			url: "d.vercel.app",
		},
		{
			uid: "p2_only",
			projectId: "prj_2",
			target: "preview",
			readyState: "READY",
			createdAt: 5000,
			url: "e.vercel.app",
		},
	];

	test("B1: 每项目只保留最新 production", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p1_new").action).toBe("KEEP");
		expect(entries.find((e) => e.uid === "p1_old").action).toBe("DELETE");
	});

	test("B2: preview 全部 DELETE", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p1_pv").action).toBe("DELETE");
	});

	test("B3: BUILDING 标记 SKIP-BUILDING 不删", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p2_bld").action).toBe("SKIP-BUILDING");
	});

	test("B4: 无 production 的项目一个都不留", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p2_only").action).toBe("DELETE");
	});

	test("B5: 项目名映射注入报告", () => {
		const { entries } = buildPlan(deps, { prj_1: "notes", prj_2: "demo" });
		expect(entries.find((e) => e.uid === "p1_new").project).toBe("notes");
		expect(entries.find((e) => e.uid === "p2_only").project).toBe("demo");
	});

	test("B6: 空输入 → 全零摘要不抛错", () => {
		const { summary, entries } = buildPlan([]);
		expect(entries).toEqual([]);
		expect(summary).toEqual({ totalProjects: 0, totalDeployments: 0, keep: 0, delete: 0, skipBuilding: 0 });
	});
});

describe("judgePreflight 权限预检", () => {
	const teams = [
		{ id: "team_ok", slug: "my-projects", name: "my team", role: "OWNER", plan: "hobby" },
		{ id: "team_view", slug: "other-projects", name: "other", role: "VIEWER" },
	];

	test("P1: OWNER 角色 + 按 id 命中 → PASS 且回填 canonical teamId", () => {
		const r = judgePreflight({ identity: "ruan-cat", teams, targetTeamId: "team_ok" });
		expect(r.status).toBe("PASS");
		expect(r.teamId).toBe("team_ok");
		expect(r.role).toBe("OWNER");
	});

	test("P2: 传 slug → 自动解析为 canonical team_xxx", () => {
		const r = judgePreflight({ identity: "ruan-cat", teams, targetTeamId: "my-projects" });
		expect(r.status).toBe("PASS");
		expect(r.teamId).toBe("team_ok");
	});

	test("P3: VIEWER 角色 → FAIL 且 reason 指向提权", () => {
		const r = judgePreflight({ identity: "ruan-cat", teams, targetTeamId: "team_view" });
		expect(r.status).toBe("FAIL");
		expect(r.reason).toContain("VIEWER");
	});

	test("P4: 目标团队不存在（token 属于另一账号）→ FAIL", () => {
		const r = judgePreflight({ identity: "ruan-cat", teams, targetTeamId: "team_elsewhere" });
		expect(r.status).toBe("FAIL");
		expect(r.reason).toContain("team_elsewhere");
	});

	test("P5: 身份缺失 → FAIL", () => {
		const r = judgePreflight({ teams, targetTeamId: "team_ok" });
		expect(r.status).toBe("FAIL");
	});
});

describe("summarize 摘要", () => {
	test("S1: 按 action 分类计数", () => {
		const { entries } = buildPlan([
			{ uid: "k", projectId: "p", target: "production", readyState: "READY", createdAt: 1 },
			{ uid: "d", projectId: "p", target: "preview", readyState: "READY", createdAt: 2 },
			{ uid: "s", projectId: "p", target: "preview", readyState: "QUEUED", createdAt: 3 },
		]);
		expect(summarize(entries)).toEqual({ totalProjects: 1, totalDeployments: 3, keep: 1, delete: 1, skipBuilding: 1 });
	});
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/clean-vercel-deployment-storage/core.test.ts`（在 monorepo 根执行）
Expected: FAIL（模块 `src/core.ts` 不存在）

- [ ] **Step 3: 实现 core.ts 最小实现**

```ts
/** 纯函数层：保留策略、分页合并、摘要。禁止任何 IO 与第三方依赖。 */
export type PlanAction = "KEEP" | "DELETE" | "SKIP-BUILDING";

export interface DeploymentLike {
	uid: string;
	projectId?: string;
	target?: string;
	readyState?: string;
	createdAt: number;
	url?: string;
}

export interface PlanEntry {
	project: string;
	uid: string;
	url: string;
	target: string;
	readyState: string;
	createdAt: string;
	action: PlanAction;
}

export interface PlanSummary {
	totalProjects: number;
	totalDeployments: number;
	keep: number;
	delete: number;
	skipBuilding: number;
}

export const SKIP_STATES = ["BUILDING", "QUEUED", "INITIALIZING"];

export function mergePages<T extends { uid: string }>(accumulated: Map<string, T>, page: T[]): number {
	let fresh = 0;
	for (const d of page) {
		if (!accumulated.has(d.uid)) {
			accumulated.set(d.uid, d);
			fresh++;
		}
	}
	return fresh;
}

export function buildPlan(
	deployments: DeploymentLike[],
	projectNames: Record<string, string> = {},
): { summary: PlanSummary; entries: PlanEntry[] } {
	const byProject = new Map<string, DeploymentLike[]>();
	for (const d of deployments) {
		const pid = d.projectId ?? "unknown";
		if (!byProject.has(pid)) byProject.set(pid, []);
		byProject.get(pid)!.push(d);
	}

	const entries: PlanEntry[] = [];
	for (const [pid, deps] of byProject) {
		const name = projectNames[pid] ?? pid;
		const latestProd = deps.filter((d) => d.target === "production").sort((a, b) => b.createdAt - a.createdAt)[0];
		for (const d of deps) {
			const action: PlanAction =
				d.uid === latestProd?.uid ? "KEEP" : SKIP_STATES.includes(d.readyState ?? "") ? "SKIP-BUILDING" : "DELETE";
			entries.push({
				project: name,
				uid: d.uid,
				url: d.url ?? "",
				target: d.target ?? "preview",
				readyState: d.readyState ?? "UNKNOWN",
				createdAt: new Date(d.createdAt).toISOString(),
				action,
			});
		}
	}

	entries.sort((a, b) => a.project.localeCompare(b.project) || b.createdAt.localeCompare(a.createdAt));
	return { summary: summarize(entries), entries };
}

export function summarize(entries: PlanEntry[]): PlanSummary {
	return {
		totalProjects: new Set(entries.map((e) => e.project)).size,
		totalDeployments: entries.length,
		keep: entries.filter((e) => e.action === "KEEP").length,
		delete: entries.filter((e) => e.action === "DELETE").length,
		skipBuilding: entries.filter((e) => e.action === "SKIP-BUILDING").length,
	};
}

/** token 权限预检：纯函数，输入身份与团队成员关系，输出 PASS/FAIL 证据。 */
export const PASS_ROLES = ["OWNER", "DEVELOPER"];

export interface PreflightInput {
	identity?: string;
	teams: { id: string; slug?: string; name?: string; role?: string; plan?: string }[];
	targetTeamId: string;
}

export interface PreflightResult {
	status: "PASS" | "FAIL";
	identity?: string;
	teamId?: string;
	role?: string;
	plan?: string;
	reason?: string;
}

export function judgePreflight(input: PreflightInput): PreflightResult {
	const { identity, teams, targetTeamId } = input;
	if (!identity) return { status: "FAIL", reason: "无法确认 token 身份（GET /v2/user 未返回 username）" };
	const team = teams.find((t) => t.id === targetTeamId || t.slug === targetTeamId);
	if (!team)
		return {
			status: "FAIL",
			reason: `目标团队 ${targetTeamId} 不在 token 所属账号的团队列表中（token 可能属于另一账号）`,
		};
	if (!PASS_ROLES.includes(team.role ?? "")) {
		return {
			status: "FAIL",
			identity,
			teamId: team.id,
			role: team.role ?? "UNKNOWN",
			reason: `团队角色 ${team.role ?? "UNKNOWN"} 无删除部署权限，请到 Vercel Dashboard → Team Settings → Members 提权为 OWNER 或 DEVELOPER`,
		};
	}
	return { status: "PASS", identity, teamId: team.id, role: team.role, plan: team.plan };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/clean-vercel-deployment-storage/core.test.ts`
Expected: PASS（14 个用例全绿：mergePages 2 + buildPlan 6 + judgePreflight 5 + summarize 1）

- [ ] **Step 5: 提交**

```bash
git add ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/core.ts tests/clean-vercel-deployment-storage/core.test.ts
git commit -m "✨ feat(clean-vercel-deployment-storage): 新增 core 纯函数层与单测"
```

---

### Task 2: api.ts REST 封装 + cli.ts 入口

**Files:**

- Create: `ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/api.ts`
- Create: `ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/cli.ts`

**Interfaces:**

- Consumes: Task 1 的 `mergePages` / `buildPlan` / `PlanEntry` / `PlanSummary` / `SKIP_STATES`
- Produces:
  - `function resolveToken(explicit?: string): string`（优先级：explicit → CLI auth.json → `VERCEL_TOKEN` env → throw 带指引的 Error）
  - `function createClient(token: string): VercelClient`，其中
    - `getMe(): Promise<{ username?: string }>`
    - `getTeams(): Promise<{ id: string; slug?: string; name?: string; role?: string; plan?: string }[]>`（`GET /v2/teams`，plan 取 `billing.plan ?? plan`）
    - `listAllDeployments(teamId: string): Promise<DeploymentLike[]>`
    - `listProjectNames(teamId: string): Promise<Record<string, string>>`
    - `deleteDeployment(uid: string, teamId: string): Promise<{ ok: boolean; note?: string; status?: number; error?: string }>`（404/NOT_FOUND → `{ ok: true, note: "already-deleted" }`）
    - `listProjectIds(teamId: string): Promise<{ id: string; name: string; deploymentExpiration?: unknown }[]>`
    - `setRetention(projectId: string, teamId: string, policy: Record<string, string>): Promise<{ ok: boolean; status: number; error?: string }>`
  - CLI 子命令：`scan` / `execute` / `retention` / `verify`（语义见 spec）
- 端点常量（照抄，勿改）：列表 `GET /v6/deployments?teamId=&limit=100[&until=]`；项目名 `GET /v9/projects?teamId=&limit=100[&until=]`；删除 `DELETE /v13/deployments/{uid}?teamId=`；retention `PATCH /v9/projects/{id}/deployment-expiration?teamId=`，body `{ expiration, expirationProduction, expirationCanceled, expirationErrored }`。

- [ ] **Step 1: 实现 api.ts**

```ts
/** 薄 REST 封装：token 由外部注入，全程仅全局 fetch。 */
import type { DeploymentLike } from "./core.ts";
import { mergePages } from "./core.ts";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const API = "https://api.vercel.com";

/** CLI auth.json 平台路径探测（Windows: %APPDATA%/com.vercel.cli/Data，Unix: ~/.local/share/com.vercel.cli） */
function cliAuthPaths(): string[] {
	const out: string[] = [];
	if (process.env.APPDATA) out.push(join(process.env.APPDATA, "com.vercel.cli", "Data", "auth.json"));
	if (process.env.HOME || process.env.USERPROFILE)
		out.push(join(process.env.HOME ?? process.env.USERPROFILE!, ".local", "share", "com.vercel.cli", "auth.json"));
	return out;
}

export function resolveToken(explicit?: string): string {
	if (explicit) return explicit;
	for (const p of cliAuthPaths()) {
		try {
			if (!existsSync(p)) continue;
			const j = JSON.parse(readFileSync(p, "utf8"));
			if (typeof j.token === "string" && j.token.length > 0) return j.token;
		} catch {
			/* 损坏文件跳过，继续下一个候选 */
		}
	}
	if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
	throw new Error(
		"未找到 Vercel token。请任选其一：1) vercel login 后重试；2) 设置环境变量 VERCEL_TOKEN；3) 从 Dashboard → Settings → Tokens 创建后用 --token 传入。",
	);
}

export interface VercelClient {
	getMe(): Promise<{ username?: string }>;
	getTeams(): Promise<{ id: string; slug?: string; name?: string; role?: string; plan?: string }[]>;
	listAllDeployments(teamId: string): Promise<DeploymentLike[]>;
	listProjectNames(teamId: string): Promise<Record<string, string>>;
	listProjectIds(teamId: string): Promise<{ id: string; name: string; deploymentExpiration?: unknown }[]>;
	deleteDeployment(
		uid: string,
		teamId: string,
	): Promise<{ ok: boolean; note?: string; status?: number; error?: string }>;
	setRetention(
		projectId: string,
		teamId: string,
		policy: Record<string, string>,
	): Promise<{ ok: boolean; status: number; error?: string }>;
}

export function createClient(token: string): VercelClient {
	const H = { Authorization: `Bearer ${token}` };

	async function getJson<T>(path: string): Promise<T> {
		const r = await fetch(`${API}${path}`, { headers: H });
		if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${(await r.text()).slice(0, 300)}`);
		return (await r.json()) as T;
	}

	return {
		async getMe() {
			const j = await getJson<{ user?: { username?: string } }>("/v2/user");
			return { username: j.user?.username };
		},

		async getTeams() {
			const j = await getJson<{
				teams: {
					id: string;
					slug?: string;
					name?: string;
					membership?: { role?: string };
					billing?: { plan?: string };
					plan?: string;
				}[];
			}>("/v2/teams");
			return (j.teams ?? []).map((t) => ({
				id: t.id,
				slug: t.slug,
				name: t.name,
				role: t.membership?.role,
				plan: t.billing?.plan ?? t.plan,
			}));
		},

		async listAllDeployments(teamId) {
			const all = new Map<string, DeploymentLike>();
			let until: number | undefined;
			for (let i = 0; i < 500; i++) {
				const q = new URLSearchParams({ teamId, limit: "100" });
				if (until !== undefined) q.set("until", String(until));
				const j = await getJson<{ deployments: DeploymentLike[] }>(`/v6/deployments?${q}`);
				const page = j.deployments ?? [];
				if (mergePages(all, page) === 0 || page.length === 0) break;
				until = page[page.length - 1].createdAt;
			}
			return [...all.values()];
		},

		async listProjectNames(teamId) {
			const names: Record<string, string> = {};
			let until: number | undefined;
			for (let i = 0; i < 50; i++) {
				const q = new URLSearchParams({ teamId, limit: "100" });
				if (until !== undefined) q.set("until", String(until));
				const j = await getJson<{ projects: { id: string; name: string; createdAt: number }[] }>(`/v9/projects?${q}`);
				const page = j.projects ?? [];
				let fresh = 0;
				for (const p of page) {
					if (!(p.id in names)) {
						names[p.id] = p.name;
						fresh++;
					}
				}
				if (fresh === 0 || page.length === 0) break;
				until = page[page.length - 1].createdAt;
			}
			return names;
		},

		async listProjectIds(teamId) {
			return (
				(
					await getJson<{ projects: { id: string; name: string; deploymentExpiration?: unknown }[] }>(
						`/v9/projects?teamId=${teamId}&limit=100`,
					)
				).projects ?? []
			);
		},

		async deleteDeployment(uid, teamId) {
			const r = await fetch(`${API}/v13/deployments/${uid}?teamId=${teamId}`, { method: "DELETE", headers: H });
			if (r.status === 200) return { ok: true };
			const body = await r.text();
			if (r.status === 404 || /not.?found/i.test(body)) return { ok: true, note: "already-deleted" };
			return { ok: false, status: r.status, error: body.slice(0, 300) };
		},

		async setRetention(projectId, teamId, policy) {
			const r = await fetch(`${API}/v9/projects/${projectId}/deployment-expiration?teamId=${teamId}`, {
				method: "PATCH",
				headers: { ...H, "Content-Type": "application/json" },
				body: JSON.stringify(policy),
			});
			if (r.ok) return { ok: true, status: r.status };
			return { ok: false, status: r.status, error: (await r.text()).slice(0, 300) };
		},
	};
}
```

- [ ] **Step 2: 实现 cli.ts**

```ts
/** 入口：tsx src/cli.ts <scan|execute|retention|verify>。只做参数解析与 IO 编排。 */
import { writeFileSync, readFileSync } from "node:fs";
import { resolveToken, createClient } from "./api.ts";
import { buildPlan, judgePreflight, type PlanEntry } from "./core.ts";

function arg(name: string): string | undefined {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1] : undefined;
}
function num(name: string): number | undefined {
	const v = arg(name);
	return v === undefined ? undefined : Number(v);
}

const cmd = process.argv[2];
const token = resolveToken(arg("token"));
const client = createClient(token);

if (cmd === "scan") {
	const targetTeam = arg("team-id") ?? process.env.VERCEL_TEAM_ID;
	if (!targetTeam) throw new Error("缺少 --team-id 或 VERCEL_TEAM_ID");
	// preflight：身份 + 团队归属 + 角色判定，证据写入报告
	const me = await client.getMe();
	const teams = await client.getTeams();
	const preflight = judgePreflight({ identity: me.username, teams, targetTeamId: targetTeam });
	console.log(`preflight: ${JSON.stringify(preflight)}`);
	if (preflight.status !== "PASS") {
		console.error(`权限预检未通过：${preflight.reason}`);
		process.exit(2);
	}
	const teamId = preflight.teamId!; // slug 已解析为 canonical team_xxx
	const deps = await client.listAllDeployments(teamId);
	const names = await client.listProjectNames(teamId);
	const { summary, entries } = buildPlan(deps, names);
	const out = arg("out") ?? "dry-run-report.json";
	writeFileSync(
		out,
		JSON.stringify({ scannedAt: new Date().toISOString(), teamId, preflight, summary, deployments: entries }, null, 2),
	);
	console.log(JSON.stringify(summary, null, 2));
	console.log(`\nreport → ${out}`);
} else if (cmd === "execute") {
	const report = JSON.parse(readFileSync(arg("report") ?? "dry-run-report.json", "utf8"));
	// 门控：报告必须携带通过的 preflight 证据，防止跨账号 token / 低权限角色 / 陈旧报告
	if (report.preflight?.status !== "PASS") {
		console.error("报告缺少通过记录的 preflight 证据，拒绝执行。请先重新运行 scan 生成带预检的清单。");
		process.exit(2);
	}
	let targets: PlanEntry[] = report.deployments.filter((d: PlanEntry) => d.action === "DELETE");
	const teamId = report.teamId ?? arg("team-id");
	if (!teamId) throw new Error("报告缺 teamId 且未传 --team-id");
	const limit = num("limit");
	if (limit !== undefined) targets = targets.slice(0, limit);
	const concurrency = num("concurrency") ?? 3;
	const queue = [...targets];
	const results: unknown[] = [];
	let done = 0;
	async function worker() {
		while (queue.length) {
			const t = queue.shift()!;
			const r = await client.deleteDeployment(t.uid, teamId);
			results.push({ ...r, uid: t.uid, project: t.project });
			done++;
			if (done % 10 === 0 || !r.ok)
				console.log(
					`[${done}/${targets.length}] ${r.ok ? "OK" : "FAIL"} ${t.project} ${t.uid}${r.ok ? "" : " :: " + r.error}`,
				);
		}
	}
	await Promise.all(Array.from({ length: Math.min(concurrency, 3) }, worker));
	const ok = results.filter((r: any) => r.ok).length;
	const fail = results.filter((r: any) => !r.ok);
	writeFileSync(
		"execution-report.json",
		JSON.stringify({ ranAt: new Date().toISOString(), total: results.length, ok, fail: fail.length, results }, null, 2),
	);
	console.log(`\nDONE ok=${ok} fail=${fail.length}`);
} else if (cmd === "retention") {
	const teamId = arg("team-id") ?? process.env.VERCEL_TEAM_ID;
	if (!teamId) throw new Error("缺少 --team-id 或 VERCEL_TEAM_ID");
	const policy = {
		expiration: arg("preview") ?? "1m",
		expirationProduction: arg("production") ?? "1m",
		expirationCanceled: arg("canceled") ?? "1m",
		expirationErrored: arg("errored") ?? "1m",
	};
	const projects = await client.listProjectIds(teamId);
	let fail = 0;
	for (const p of projects) {
		const r = await client.setRetention(p.id, teamId, policy);
		if (!r.ok) fail++;
		console.log(`${r.ok ? "OK " : "FAIL"} ${p.name}${r.ok ? "" : " :: " + r.status + " " + r.error}`);
	}
	console.log(`\nRETENTION total=${projects.length} fail=${fail}`);
} else if (cmd === "verify") {
	const teamId = arg("team-id") ?? process.env.VERCEL_TEAM_ID;
	if (!teamId) throw new Error("缺少 --team-id 或 VERCEL_TEAM_ID");
	const deps = await client.listAllDeployments(teamId);
	const names = await client.listProjectNames(teamId);
	const per = new Map<string, { total: number; production: number }>();
	for (const d of deps) {
		const pid = d.projectId ?? "unknown";
		const s = per.get(pid) ?? { total: 0, production: 0 };
		s.total++;
		if (d.target === "production") s.production++;
		per.set(pid, s);
	}
	console.log(`TOTAL remaining: ${deps.length}`);
	for (const [pid, s] of [...per].sort())
		console.log(
			`${(names[pid] ?? pid).padEnd(36)} total=${s.total} production=${s.production} preview=${s.total - s.production}`,
		);
} else {
	console.error(
		"用法: tsx src/cli.ts <scan|execute|retention|verify> [--team-id x] [--out x.json] [--report x.json] [--limit N] [--token x]",
	);
	process.exit(1);
}
```

- [ ] **Step 3: 本机真实通道 smoke（人工验收，不进 CI）**

Run（在技能目录）: `pnpm dlx tsx src/cli.ts scan --team-id <真实团队 slug 或 team_xxx> --out /tmp/scan-smoke.json`
Expected: 先输出 `preflight: {"status":"PASS",...}`（身份/角色/canonical teamId），再输出 summary 且 report 落盘；token 解析链走 CLI auth.json 时可不传 `--token`。
另需反向验证：故意传一个 token 无权访问的团队 id，确认 scan 以 exit 2 + FAIL reason 退出（预检门真实生效）。
若 token/团队不可用：标记「真实 smoke 未验证」，不得伪造输出。

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/api.ts ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/src/cli.ts
git commit -m "✨ feat(clean-vercel-deployment-storage): 新增 REST 封装与 CLI 入口"
```

---

### Task 3: SKILL.md 正文 + 三份 references

**Files:**

- Create: `ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/SKILL.md`
- Create: `.../references/tool-landscape.md`
- Create: `.../references/rest-api-playbook.md`
- Create: `.../references/incident-2026-09-08.md`

**Interfaces:**

- Consumes: Task 1/2 的脚本路径与子命令名（正文命令示例必须与 `src/cli.ts` 实际参数一致）
- Produces: 供 Task 4 静态契约测试断言的文件结构与措辞

- [ ] **Step 1: 写 SKILL.md（目标 < 500 词）**

```markdown
---
name: clean-vercel-deployment-storage
description: 使用时机：当 Vercel Deployment Storage 部署存储额度将满或已满、需要批量删除历史部署、需要为 Vercel 项目配置 Deployment Retention 自动清理、或删除部署时遇到 vercel api 要求确认、CLI 凭据失效等问题时使用。
user-invocable: true
metadata:
  version: "1.0.0"
---

# clean-vercel-deployment-storage：批量清理 Vercel 部署存储

## 核心认知

官方 Vercel MCP 无删除能力；大规模删除的最优解是 **REST API + Bearer token**（`DELETE /v13/deployments/{id}`）。CLI 可用但有两个坑（见 references）。

## 执行流程（严格按序）

1. **扫描**：`pnpm dlx tsx src/cli.ts scan --team-id <id> --out report.json`。scan 自动执行权限预检（token 身份 + 团队归属 + OWNER/DEVELOPER 角色判定），未通过直接退出；通过后生成 dry-run 清单（每项目保留最新 1 个 production，其余标记 DELETE），preflight 证据写入报告。
2. **确认**：把清单摘要（总数/删除数/每项目分布 + preflight 身份与角色）交给用户审核，**未经确认禁止执行**。
3. **删除**：先用 `execute --limit 10` 试跑验证通道，独立复查成功后再全量执行（默认并发 3，NOT_FOUND 视为已删）。
4. **治理**：`retention --team-id <id>` 为全部项目配置自动过期，防止额度复发；`verify` 复查最终状态。

## 红线

- 删除不可逆：无 dry-run 清单与用户确认，不得调用 execute 全量；execute 只接受携带 PASS preflight 证据的报告。
- 禁止大规模并发 spawn `vercel` CLI 执行删除——会把本地凭据打挂；脚本走 fetch 直连 REST API。
- 项目一律不删，只删部署；保留例外（平台自动保留最近 10/20 个 Ready 部署与带 alias 部署）见 references。

## 深入阅读（按需加载）

- [references/tool-landscape.md](./references/tool-landscape.md)：MCP/CLI/API 三通道边界与 CLI 两个坑的根因。
- [references/rest-api-playbook.md](./references/rest-api-playbook.md)：端点速查、retention 合法值、token 获取、平台保留例外、30 天恢复期。
- [references/incident-2026-09-08.md](./references/incident-2026-09-08.md)：845→27 实战复盘与凭据失效事故。
```

- [ ] **Step 2: 写 references/tool-landscape.md**

内容要点（正文详述，此处为必须覆盖的事实清单）：

- MCP 通道：官方 Vercel MCP 有 `list_deployments`/`list_projects`/`get_deployment`，无任何 delete 工具，只能用于查看。
- CLI 通道：`vercel remove <url...>` 批量删、`vercel remove <project> --safe` 整项目删；两个坑——(1) v58+ `vercel api -X DELETE` 非交互必须加 `--dangerously-skip-permissions`，否则报 `DELETE operations require confirmation`；（2） 大规模并发 spawn CLI 会使 auth.json 的过期 token refreshToken 刷新竞争失败，全程报 `No existing credentials found`（根因与恢复见 incident 文档）。
- API 通道：最优解。`DELETE /v13/deployments/{id}?teamId=`；分页 `GET /v6/deployments?limit=100&until=`；并发 3、顺序批处理即可；404 归为成功。
- token 获取链：CLI auth.json（Windows `%APPDATA%/com.vercel.cli/Data/auth.json`，Unix `~/.local/share/com.vercel.cli/auth.json`）→ `VERCEL_TOKEN` env → 向用户索要；`--token` 显式覆盖。

- [ ] **Step 3: 写 references/rest-api-playbook.md**

内容要点：

- 端点速查表：列表/删除/项目列表/retention 四个端点的方法、路径、关键参数、响应。
- 分页细节：`until` 游标语义、uid 去重防死循环、游标不前进即终止。
- Deployment Retention：端点 `PATCH /v9/projects/{idOrName}/deployment-expiration?teamId=`；body 字段 `expiration`（=preview）/`expirationProduction`/`expirationCanceled`/`expirationErrored`；合法值 `1d/1w/1m/2m/3m/6m/1y/unlimited`；**Hobby plan production 上限 `1m`**（超限报 `Cannot set expirationProduction to 1y on hobby plan`）。该端点不在官方 OpenAPI spec 中，出处是 terraform-provider-vercel 源码 `client/project_deployment_retention.go`。
- 平台保留例外（retention 不删除的情形）：项目最近 10 个部署、最近 20 个 Ready 生产部署、最近 20 个 Ready 非生产部署、带生产 alias、自定义环境分支 alias 目标、活跃分支的最新 preview。
- 删除后 30 天恢复期（Dashboard → Settings → Security → Recently Deleted）；retention 到期标记删除通常 48h 内执行。
- Deployment Storage 计费背景：$0.10/GB/月，Hobby 含 10GB；Usage 页按项目查看。

- [ ] **Step 4: 写 references/incident-2026-09-08.md**

内容要点（全中文，脱敏——团队写「某 Hobby 团队」，不出现 SmallAliceWeb、内部绝对路径）：

- 背景：Deployment Storage 额度将满，需批量清理；845 部署 / 27 项目 → 保留 27 个最新生产，删 818，0 失败。
- 流程复盘：dry-run 清单 → 用户确认 → 试跑 10 条验证 → 全量并发 3 → REST 收尾 → retention 治理。
- 事故 1：试跑 10 条全 FAIL，报 `DELETE operations require confirmation. Use --dangerously-skip-permissions`——CLI v58 对非交互 DELETE 的确认门，加标志解决。
- 事故 2：全量执行至 676/818 时 CLI 本地凭据失效。根因证据链：auth.json 中 `expiresAt` 为过去时间戳（token 已过期）+ 3 并发进程同时触发 refreshToken 刷新竞争 → CLI 判定无凭据。剩余 142 个改用独立 Bearer token 走 REST API 收尾。
- 教训：批量删除工具链必须「REST fetch 直连为正路，CLI 仅小规模使用」；任何批量脚本先 `--limit` 试跑 + 独立 API 复查，再全量。
- WorkBuddy 环境补充（仅本仓库 agent 参考，外发执行者可忽略）：`~/.workbuddy/.mcp.json` 的 vercel server `headers.Authorization` 存有独立有效 Bearer token，可作 CLI 凭据失效时的兜底。

- [ ] **Step 5: 提交**

```bash
git add ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/SKILL.md ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage/references/
git commit -m "📃 docs(clean-vercel-deployment-storage): 新增技能正文与三份 references"
```

---

### Task 4: 静态契约测试 + 插件 README/CHANGELOG 同步

**Files:**

- Create: `tests/clean-vercel-deployment-storage/skill-contract.test.ts`
- Modify: `ai-plugins/low-frequency-skill/README.md`（Skills 清单追加一行）
- Modify: `ai-plugins/low-frequency-skill/CHANGELOG.md`（`[Unreleased] → Added` 追加一条）

**Interfaces:**

- Consumes: Task 1-3 产出的全部文件路径
- Produces: 无（最终守护测试）

- [ ] **Step 1: 写失败的契约测试**

```ts
import { describe, test, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = "ai-plugins/low-frequency-skill/skills/clean-vercel-deployment-storage";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skill = (...p: string[]) => join(repoRoot, ROOT, ...p);

describe("clean-vercel-deployment-storage 技能契约", () => {
	test("C1: SKILL.md 存在且 frontmatter 含 name/version 1.0.0/user-invocable", () => {
		const md = readFileSync(skill("SKILL.md"), "utf8");
		expect(md).toContain("name: clean-vercel-deployment-storage");
		expect(md).toContain('"1.0.0"');
		expect(md).toContain("user-invocable: true");
		expect(md).toMatch(/description: *使用时机/);
	});

	test("C2: 三份 references 全部存在", () => {
		for (const f of ["tool-landscape.md", "rest-api-playbook.md", "incident-2026-09-08.md"]) {
			expect(existsSync(skill("references", f)), `missing ${f}`).toBe(true);
		}
	});

	test("C3: src 三层文件存在且无第三方 import", () => {
		for (const f of ["core.ts", "api.ts", "cli.ts"]) {
			const src = readFileSync(skill("src", f), "utf8");
			const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
			for (const i of imports) {
				expect(i.startsWith("node:") || i.startsWith(".") || i.startsWith("/"), `非白名单 import: ${i}`).toBe(true);
			}
		}
	});

	test("C4: 外发正文无内部绝对路径泄漏", () => {
		for (const f of [
			"SKILL.md",
			"references/tool-landscape.md",
			"references/rest-api-playbook.md",
			"references/incident-2026-09-08.md",
		]) {
			const text = readFileSync(skill(f), "utf8");
			expect(text.includes("C:\\Users") || text.includes("D:\\code"), `${f} 疑似内部路径泄漏`).toBe(false);
			expect(text).not.toContain("SmallAliceWeb");
		}
	});

	test("C5: 插件 README 与 CHANGELOG 已收录本技能", () => {
		const readme = readFileSync(join(repoRoot, "ai-plugins/low-frequency-skill/README.md"), "utf8");
		const changelog = readFileSync(join(repoRoot, "ai-plugins/low-frequency-skill/CHANGELOG.md"), "utf8");
		expect(readme).toContain("clean-vercel-deployment-storage");
		expect(changelog).toContain("clean-vercel-deployment-storage");
	});

	test("C6: SKILL.md 含权限预检流程描述，execute 有 preflight 门控", () => {
		const md = readFileSync(skill("SKILL.md"), "utf8");
		expect(md).toContain("预检");
		const cliSrc = readFileSync(skill("src", "cli.ts"), "utf8");
		expect(cliSrc).toContain("preflight");
	});
});
```

- [ ] **Step 2: 运行测试确认 C5 失败（C1-C4 应通过）**

Run: `pnpm vitest run tests/clean-vercel-deployment-storage/skill-contract.test.ts`
Expected: C5 FAIL（README/CHANGELOG 尚未收录），其余 PASS

- [ ] **Step 3: 更新插件 README 与 CHANGELOG**

README.md 的 Skills 清单末尾追加：

```markdown
- **clean-vercel-deployment-storage**: 批量清理 Vercel 部署存储并配置 Retention 自动清理，附 REST API 端点速查与大规模删除事故复盘。
```

CHANGELOG.md 的 `[Unreleased] → Added` 末尾追加：

```markdown
- 新增 **clean-vercel-deployment-storage**：批量清理 Vercel 部署存储（每项目保留最新生产部署）并配置 Deployment Retention 防额度复发，附 TS 批处理脚本（仅 Node 内置模块，tsx 调度）、REST API 端点速查与 2026-09-08 实战复盘。
```

- [ ] **Step 4: 运行全部测试确认通过**

Run: `pnpm vitest run tests/clean-vercel-deployment-storage`
Expected: PASS（core 14 例 + contract 6 例全绿）

- [ ] **Step 5: 提交**

```bash
git add tests/clean-vercel-deployment-storage/skill-contract.test.ts ai-plugins/low-frequency-skill/README.md ai-plugins/low-frequency-skill/CHANGELOG.md
git commit -m "✅ test(clean-vercel-deployment-storage): 静态契约测试与插件文档同步"
```

---

### Task 5: 最终验收（人工 gate）

- [ ] **Step 1**: monorepo 根 `pnpm vitest run tests/clean-vercel-deployment-storage` 全绿。
- [ ] **Step 2**: 真实通道 smoke：`scan --limit 1` 打通（若团队/token 不可用，在交付说明标记「未验证」）。
- [ ] **Step 3**: `git diff --check` 通过；`git status` 仅含本计划内文件。
- [ ] **Step 4**: 对照 spec「验收设计」逐项勾选；确认未触碰 `skill-registry.json` 与插件主版本号。
- [ ] **Step 5**: 通知用户进入发布轮（`release-ai-plugins -NewSkill clean-vercel-deployment-storage -ChangeType added`，DryRun → Apply 另行执行）。

## 自检记录

- Spec 覆盖：架构分层（T1/T2）、token 解析链（T2）、**token 权限预检 judgePreflight(T1 纯函数 + T2 scan 前置 + execute 门控）**、四子命令（T2）、SKILL.md+references(T3)、双测试（T1/T4）、README/CHANGELOG(T4)、发布联动边界（全局约束+T5）——无缺口。
- 类型一致性：`DeploymentLike`/`PlanEntry`/`PlanSummary`/`PreflightInput`/`PreflightResult`/`mergePages`/`buildPlan`/`summarize`/`judgePreflight`/`resolveToken`/`createClient` 在 T1/T2/T4 间签名一致。
- 无占位符：所有步骤含完整代码或精确事实清单。
