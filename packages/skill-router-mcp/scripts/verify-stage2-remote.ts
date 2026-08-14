import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import packageJson from "../package.json" with { type: "json" };

const endpoint = process.argv[2];
if (!endpoint || !/^https:\/\//.test(endpoint)) {
	throw new Error("usage: pnpm verify:remote -- https://worker.example.com");
}

const EXPECTED_TOOLS = [
	"get_server_info",
	"list_skills",
	"search_skills",
	"load_skill",
	"list_skill_resources",
	"load_skill_resource",
] as const;
const EXPECTED_TEMPLATE = "skill://{plugin}/{sourceCommitSha}/{skillId}/{+path}";
const PR_REFERENCES = [
	"references/batch-pr-script.ts",
	"references/target-repos.md",
	"references/workflow-and-template.md",
] as const;

const health = await fetch(new URL("/health", endpoint));
if (!health.ok) throw new Error(`health failed: ${health.status}`);
const healthBody = (await health.json()) as { ok?: boolean; version?: string; buildGitSha?: string };
if (healthBody.ok !== true) throw new Error("health payload is not ok");
if (healthBody.version !== packageJson.version) throw new Error(`health version mismatch: ${healthBody.version}`);
if (!healthBody.buildGitSha || healthBody.buildGitSha === "__BUILD_GIT_SHA__") throw new Error("health build SHA is not injected");

const client = new Client({ name: "skill-router-stage2-verify", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL("/mcp", endpoint));

try {
	await client.connect(transport);

	const tools = await client.listTools();
	const names = tools.tools.map((tool) => tool.name).sort();
	const expected = [...EXPECTED_TOOLS].sort();
	if (JSON.stringify(names) !== JSON.stringify(expected)) {
		throw new Error(`tool contract mismatch: ${JSON.stringify(names)}`);
	}

	const info = readToolValue(await client.callTool({ name: "get_server_info", arguments: {} })) as {
		server?: { version?: string; buildGitSha?: string };
	};
	if (info.server?.version !== packageJson.version) throw new Error("server SemVer mismatch");
	if (info.server?.buildGitSha !== healthBody.buildGitSha) throw new Error("build SHA mismatch");

	const gitCommit = await loadKnownSkill(client, "git-commit");
	const gitReferences = await listReferences(client, gitCommit.id, gitCommit.sourceCommitSha);
	if (!gitReferences.includes("references/commit-types.ts")) throw new Error("git-commit reference inventory is incomplete");
	const commitTypes = await loadReference(client, gitCommit.id, gitCommit.sourceCommitSha, "references/commit-types.ts");
	if (!commitTypes.includes("commitTypes")) throw new Error("git-commit commit-types content is invalid");

	const prSkill = await loadKnownSkill(client, "pr-ruancat-repo");
	const prReferences = await listReferences(client, prSkill.id, prSkill.sourceCommitSha);
	for (const path of PR_REFERENCES) {
		if (!prReferences.includes(path)) throw new Error(`missing pr-ruancat-repo resource: ${path}`);
		const content = await loadReference(client, prSkill.id, prSkill.sourceCommitSha, path);
		if (!content.trim()) throw new Error(`empty pr-ruancat-repo resource: ${path}`);
	}

	const templates = await client.listResourceTemplates();
	if (!templates.resourceTemplates.some((template) => template.uriTemplate === EXPECTED_TEMPLATE)) {
		throw new Error("immutable Skill ResourceTemplate is missing");
	}
	const resourceUri = canonicalResourceUri(
		gitCommit.plugin,
		gitCommit.sourceCommitSha,
		gitCommit.id,
		"references/commit-types.ts",
	);
	const resource = await client.readResource({ uri: resourceUri });
	const text = resource.contents.find((item): item is typeof item & { text: string } => "text" in item && typeof item.text === "string")?.text;
	if (!text?.includes("commitTypes")) throw new Error("resources/read did not return git-commit reference content");

	console.log(
		JSON.stringify(
			{
				ok: true,
				endpoint,
				version: packageJson.version,
				buildGitSha: healthBody.buildGitSha,
				tools: names,
				resourceTemplate: EXPECTED_TEMPLATE,
				gitCommitSourceCommitSha: gitCommit.sourceCommitSha,
				prSourceCommitSha: prSkill.sourceCommitSha,
			},
			null,
			2,
		),
	);
} finally {
	await client.close();
}

async function loadKnownSkill(client: Client, skillId: string) {
	const search = readToolValue(await client.callTool({ name: "search_skills", arguments: { query: skillId } })) as Array<{
		id?: string;
		skillId?: string;
		sourceCommitSha?: string;
	}>;
	const found = search.find((item) => (item.skillId ?? item.id) === skillId);
	if (!found?.sourceCommitSha) throw new Error(`search did not return pinned ${skillId}`);
	const loaded = readToolValue(
		await client.callTool({ name: "load_skill", arguments: { skillId, sourceCommitSha: found.sourceCommitSha } }),
	) as { id?: string; plugin?: string; sourceCommitSha?: string; content?: string };
	if (loaded.id !== skillId || !loaded.plugin || !loaded.content || loaded.sourceCommitSha !== found.sourceCommitSha) {
		throw new Error(`pinned load failed for ${skillId}`);
	}
	return { id: skillId, plugin: loaded.plugin, sourceCommitSha: found.sourceCommitSha };
}

async function listReferences(client: Client, skillId: string, sourceCommitSha: string): Promise<string[]> {
	const value = readToolValue(
		await client.callTool({
			name: "list_skill_resources",
			arguments: { skillId, sourceCommitSha, prefix: "references/", limit: 200 },
		}),
	) as { sourceCommitSha?: string; resources?: Array<{ path?: string }> };
	if (value.sourceCommitSha !== sourceCommitSha) throw new Error(`resource list snapshot mismatch for ${skillId}`);
	return (value.resources ?? []).map((resource) => resource.path).filter((path): path is string => typeof path === "string");
}

async function loadReference(client: Client, skillId: string, sourceCommitSha: string, path: string): Promise<string> {
	const value = readToolValue(
		await client.callTool({ name: "load_skill_resource", arguments: { skillId, sourceCommitSha, path } }),
	) as { sourceCommitSha?: string; path?: string; contentType?: string; content?: string };
	if (value.sourceCommitSha !== sourceCommitSha || value.path !== path || value.contentType !== "text" || typeof value.content !== "string") {
		throw new Error(`resource load failed for ${skillId}:${path}`);
	}
	return value.content;
}

function canonicalResourceUri(plugin: string, sourceCommitSha: string, skillId: string, path: string): string {
	const encodedPath = path.split("/").map(encodeURIComponent).join("/");
	return `skill://${encodeURIComponent(plugin)}/${sourceCommitSha}/${encodeURIComponent(skillId)}/${encodedPath}`;
}

function readToolValue(result: unknown): unknown {
	const value = result as { structuredContent?: unknown; content?: Array<{ type: string; text?: string }> };
	if (value.structuredContent !== undefined) return value.structuredContent;
	const text = value.content?.find((part) => part.type === "text")?.text;
	if (!text) throw new Error("tool returned no readable content");
	return JSON.parse(text);
}
