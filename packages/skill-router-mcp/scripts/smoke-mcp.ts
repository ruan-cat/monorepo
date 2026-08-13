import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import packageJson from "../package.json" with { type: "json" };

const endpoint = process.argv[2];
const query = process.argv[3] ?? "skill";
if (!endpoint || !/^https:\/\//.test(endpoint)) {
	throw new Error("usage: node --experimental-strip-types scripts/smoke-mcp.ts https://endpoint");
}

const health = await fetch(new URL("/health", endpoint));
if (!health.ok) throw new Error(`health failed: ${health.status}`);
const healthBody = (await health.json()) as { ok?: boolean; version?: string; buildGitSha?: string };
if (healthBody.ok !== true) throw new Error("health payload is not ok");
if (healthBody.version !== packageJson.version) throw new Error(`health version mismatch: ${healthBody.version}`);
if (!healthBody.buildGitSha || healthBody.buildGitSha === "__BUILD_GIT_SHA__")
	throw new Error("health build SHA is not injected");

const client = new Client({ name: "skill-router-smoke", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL("/mcp", endpoint));
await client.connect(transport);
const tools = await client.listTools();
const names = tools.tools.map((tool) => tool.name);
for (const name of ["get_server_info", "list_skills", "search_skills", "load_skill"]) {
	if (!names.includes(name)) throw new Error(`missing tool: ${name}`);
}
const info = await client.callTool({ name: "get_server_info", arguments: {} });
const infoValue = readToolValue(info) as { server?: { version?: string; buildGitSha?: string } };
if (infoValue.server?.version !== packageJson.version) throw new Error("server SemVer mismatch");
if (infoValue.server.buildGitSha !== healthBody.buildGitSha) throw new Error("build SHA mismatch");
const search = await client.callTool({ name: "search_skills", arguments: { query } });
const searchValue = readToolValue(search) as
	| { candidates?: Array<{ id?: string; skillId?: string; sourceCommitSha?: string }>; sourceCommitSha?: string }
	| Array<{ id?: string; skillId?: string; sourceCommitSha?: string }>;
const candidates = Array.isArray(searchValue) ? searchValue : (searchValue.candidates ?? []);
const candidate = candidates.find((item) => item.skillId ?? item.id);
const candidateSkillId = candidate?.skillId ?? candidate?.id;
if (!candidateSkillId) throw new Error(`known-skill search returned no result for ${query}`);
const sourceCommitSha =
	candidate?.sourceCommitSha ?? (!Array.isArray(searchValue) ? searchValue.sourceCommitSha : undefined);
const loaded = await client.callTool({
	name: "load_skill",
	arguments: { skillId: candidateSkillId, ...(sourceCommitSha ? { sourceCommitSha } : {}) },
});
const loadedValue = readToolValue(loaded) as {
	id?: string;
	skillId?: string;
	sourceCommitSha?: string;
	content?: string;
};
const loadedSkillId = loadedValue.skillId ?? loadedValue.id;
if (loadedSkillId !== candidateSkillId || !loadedValue.content) throw new Error("pinned load returned invalid skill");
if (sourceCommitSha && loadedValue.sourceCommitSha !== sourceCommitSha) throw new Error("pinned load SHA mismatch");
await client.close();
console.log(JSON.stringify({ ok: true, endpoint, tools: names }, null, 2));

function readToolValue(result: unknown): unknown {
	const value = result as { structuredContent?: unknown; content?: Array<{ type: string; text?: string }> };
	if (value.structuredContent) return value.structuredContent;
	const text = value.content?.find((part) => part.type === "text")?.text;
	if (!text) throw new Error("tool returned no readable content");
	return JSON.parse(text);
}
