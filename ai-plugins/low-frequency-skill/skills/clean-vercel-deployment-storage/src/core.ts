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
