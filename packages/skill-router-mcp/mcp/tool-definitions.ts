import { z } from "zod";
import type { SkillRouter } from "../services/skill-router.ts";
import { listSkills } from "./tools/list-skills.ts";
import { searchSkills } from "./tools/search-skills.ts";
import { loadSkill } from "./tools/load-skill.ts";
import { listSkillResources } from "./tools/list-skill-resources.ts";
import { loadSkillResource } from "./tools/load-skill-resource.ts";
import type { ServerInfo } from "./tools/get-server-info.ts";

export const toolNames = [
	"get_server_info",
	"list_skills",
	"search_skills",
	"load_skill",
	"list_skill_resources",
	"load_skill_resource",
] as const;
export type ToolName = (typeof toolNames)[number];

export interface ToolContext {
	readonly router?: SkillRouter;
	readonly serverInfo?: ServerInfo | (() => ServerInfo);
}

export interface ToolDefinition {
	readonly name: ToolName;
	readonly title: string;
	readonly description: string;
	readonly inputSchema: z.ZodType;
	readonly annotations: { readOnlyHint: true; destructiveHint: false; openWorldHint: boolean };
	readonly handler: (input: unknown, context: ToolContext) => Promise<unknown>;
}

export interface ToolCallResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent?: unknown;
	readonly isError?: boolean;
}

function isToolCallResult(value: unknown): value is ToolCallResult {
	if (!value || typeof value !== "object") return false;
	const record = value as { [key: string]: unknown };
	return "content" in record || "structuredContent" in record || "isError" in record;
}

export const toolResult = (value: unknown): ToolCallResult =>
	isToolCallResult(value)
		? (value as ToolCallResult)
		: { content: [{ type: "text" as const, text: JSON.stringify(value) }] };

function requireRouter(context: ToolContext): SkillRouter {
	if (!context.router) throw new Error("Skill Router context is required for this tool.");
	return context.router;
}

function resolveServerInfo(context: ToolContext): unknown {
	if (typeof context.serverInfo === "function") return context.serverInfo();
	return context.serverInfo ?? {};
}

const sourceCommitShaSchema = z.string().min(7).max(128).optional();

export const toolDefinitions: readonly ToolDefinition[] = [
	{
		name: "get_server_info",
		title: "Get server info",
		description: "Return safe Skill Router service and tool metadata.",
		inputSchema: z.object({}),
		annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
		handler: async (_input, context) => toolResult(resolveServerInfo(context)),
	},
	{
		name: "list_skills",
		title: "List skills",
		description: "List registry Skill summaries from one exact source commit.",
		inputSchema: z.object({ sourceCommitSha: sourceCommitShaSchema }),
		annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
		handler: async (input, context) =>
			toolResult(await listSkills(input as { sourceCommitSha?: string }, { router: requireRouter(context) })),
	},
	{
		name: "search_skills",
		title: "Search skills",
		description: "Search Skill registry metadata deterministically.",
		inputSchema: z.object({ query: z.string().min(1), sourceCommitSha: sourceCommitShaSchema }),
		annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
		handler: async (input, context) =>
			toolResult(
				await searchSkills(input as { query: string; sourceCommitSha?: string }, { router: requireRouter(context) }),
			),
	},
	{
		name: "load_skill",
		title: "Load skill",
		description: "Load one Skill SKILL.md at latest or an exact source commit.",
		inputSchema: z.object({ skillId: z.string().min(1).max(128), sourceCommitSha: sourceCommitShaSchema }),
		annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
		handler: async (input, context) =>
			toolResult(
				await loadSkill(input as { skillId: string; sourceCommitSha?: string }, { router: requireRouter(context) }),
			),
	},
	{
		name: "list_skill_resources",
		title: "List Skill resources",
		description: "List files belonging to one registered Skill at one exact source snapshot.",
		inputSchema: z.object({
			skillId: z.string().min(1).max(128),
			sourceCommitSha: sourceCommitShaSchema,
			prefix: z.string().max(512).optional(),
			cursor: z.string().min(1).max(2048).optional(),
			limit: z.number().int().min(1).max(200).optional(),
		}),
		annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
		handler: async (input, context) =>
			toolResult(
				await listSkillResources(
					input as {
						skillId: string;
						sourceCommitSha?: string;
						prefix?: string;
						cursor?: string;
						limit?: number;
					},
					{ router: requireRouter(context) },
				),
			),
	},
	{
		name: "load_skill_resource",
		title: "Load Skill resource",
		description: "Load one file belonging to a registered Skill at an exact source snapshot.",
		inputSchema: z.object({
			skillId: z.string().min(1).max(128),
			path: z.string().min(1).max(1024),
			sourceCommitSha: sourceCommitShaSchema,
			startLine: z.number().int().positive().optional(),
			endLine: z.number().int().positive().optional(),
			maxBytes: z.number().int().min(1).max(1_048_576).optional(),
			binaryMode: z.enum(["metadata", "base64"]).optional(),
		}),
		annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
		handler: async (input, context) =>
			toolResult(
				await loadSkillResource(
					input as {
						skillId: string;
						path: string;
						sourceCommitSha?: string;
						startLine?: number;
						endLine?: number;
						maxBytes?: number;
						binaryMode?: "metadata" | "base64";
					},
					{ router: requireRouter(context) },
				),
			),
	},
];

export function toolCatalog() {
	return toolDefinitions.map(({ name, title, description, annotations }) => ({
		name,
		title,
		description,
		annotations,
	}));
}
