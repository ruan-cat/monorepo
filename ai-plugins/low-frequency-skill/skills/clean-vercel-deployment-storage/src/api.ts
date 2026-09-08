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
