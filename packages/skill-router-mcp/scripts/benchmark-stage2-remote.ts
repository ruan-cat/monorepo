import { performance } from "node:perf_hooks";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = process.argv[2];
const iterations = Number(process.argv[3] ?? "20");
if (!endpoint || !/^https:\/\//.test(endpoint)) {
	throw new Error("usage: pnpm benchmark:remote -- https://worker.example.com [iterations]");
}
if (!Number.isInteger(iterations) || iterations < 5 || iterations > 200) {
	throw new Error("iterations must be an integer between 5 and 200");
}

const client = new Client({ name: "skill-router-stage2-benchmark", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL("/mcp", endpoint));

try {
	await client.connect(transport);
	const search = readToolValue(await client.callTool({ name: "search_skills", arguments: { query: "git-commit" } })) as Array<{
		id?: string;
		sourceCommitSha?: string;
	}>;
	const candidate = search.find((item) => item.id === "git-commit");
	if (!candidate?.sourceCommitSha) throw new Error("git-commit search did not return sourceCommitSha");
	const sourceCommitSha = candidate.sourceCommitSha;

	const firstObservedListMs = await timed(async () => {
		await assertPinnedList(client, sourceCommitSha);
	});
	const listSamples: number[] = [];
	const loadSamples: number[] = [];
	for (let index = 0; index < iterations; index += 1) {
		listSamples.push(
			await timed(async () => {
				await assertPinnedList(client, sourceCommitSha);
			}),
		);
		loadSamples.push(
			await timed(async () => {
				await assertPinnedLoad(client, sourceCommitSha);
			}),
		);
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				endpoint,
				sourceCommitSha,
				iterations,
				firstObservedListMs: round(firstObservedListMs),
				warmListMs: stats(listSamples),
				warmLoadMs: stats(loadSamples),
				note: "firstObservedListMs is observational and is not guaranteed to be a fresh Cloudflare isolate; use Preview/Staging isolate controls for a true cold-start measurement.",
			},
			null,
			2,
		),
	);
} finally {
	await client.close();
}

async function assertPinnedList(client: Client, sourceCommitSha: string): Promise<void> {
	const value = readToolValue(
		await client.callTool({
			name: "list_skill_resources",
			arguments: { skillId: "git-commit", sourceCommitSha, prefix: "references/", limit: 200 },
		}),
	) as { sourceCommitSha?: string; resources?: Array<{ path?: string }> };
	if (value.sourceCommitSha !== sourceCommitSha) throw new Error("list snapshot mismatch");
	if (!(value.resources ?? []).some((resource) => resource.path === "references/commit-types.ts")) {
		throw new Error("list response is missing commit-types.ts");
	}
}

async function assertPinnedLoad(client: Client, sourceCommitSha: string): Promise<void> {
	const value = readToolValue(
		await client.callTool({
			name: "load_skill_resource",
			arguments: { skillId: "git-commit", sourceCommitSha, path: "references/commit-types.ts" },
		}),
	) as { sourceCommitSha?: string; contentType?: string; content?: string };
	if (value.sourceCommitSha !== sourceCommitSha || value.contentType !== "text" || !value.content?.includes("commitTypes")) {
		throw new Error("load response is invalid");
	}
}

async function timed(action: () => Promise<void>): Promise<number> {
	const started = performance.now();
	await action();
	return performance.now() - started;
}

function stats(values: number[]) {
	const sorted = [...values].sort((left, right) => left - right);
	return {
		min: round(sorted[0]),
		p50: round(percentile(sorted, 0.5)),
		p95: round(percentile(sorted, 0.95)),
		max: round(sorted.at(-1) ?? 0),
		mean: round(values.reduce((sum, value) => sum + value, 0) / values.length),
	};
}

function percentile(sorted: number[], ratio: number): number {
	const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
	return sorted[index] ?? 0;
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

function readToolValue(result: unknown): unknown {
	const value = result as { structuredContent?: unknown; content?: Array<{ type: string; text?: string }> };
	if (value.structuredContent !== undefined) return value.structuredContent;
	const text = value.content?.find((part) => part.type === "text")?.text;
	if (!text) throw new Error("tool returned no readable content");
	return JSON.parse(text);
}
