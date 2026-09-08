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
