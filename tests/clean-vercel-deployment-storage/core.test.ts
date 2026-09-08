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
		const acc = new Map([["dpl_a", { uid: "dpl_a", createdAt: 3 }]]);
		const added = mergePages(acc, [
			{ uid: "dpl_a", createdAt: 3 },
			{ uid: "dpl_c", createdAt: 1 },
		]);
		expect(added).toBe(1);
		expect(acc.get("dpl_a")?.createdAt).toBe(3);
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
		expect(entries.find((e) => e.uid === "p1_new")?.action).toBe("KEEP");
		expect(entries.find((e) => e.uid === "p1_old")?.action).toBe("DELETE");
	});

	test("B2: preview 全部 DELETE", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p1_pv")?.action).toBe("DELETE");
	});

	test("B3: BUILDING 标记 SKIP-BUILDING 不删", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p2_bld")?.action).toBe("SKIP-BUILDING");
	});

	test("B4: 无 production 的项目一个都不留", () => {
		const { entries } = buildPlan(deps);
		expect(entries.find((e) => e.uid === "p2_only")?.action).toBe("DELETE");
	});

	test("B5: 项目名映射注入报告", () => {
		const { entries } = buildPlan(deps, { prj_1: "notes", prj_2: "demo" });
		expect(entries.find((e) => e.uid === "p1_new")?.project).toBe("notes");
		expect(entries.find((e) => e.uid === "p2_only")?.project).toBe("demo");
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
		expect(summarize(entries)).toEqual({
			totalProjects: 1,
			totalDeployments: 3,
			keep: 1,
			delete: 1,
			skipBuilding: 1,
		});
	});
});
