import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SkillRouterError } from "../runtime/errors.ts";
import type { SkillRouter } from "../services/skill-router.ts";

export const SKILL_RESOURCE_URI_TEMPLATE = "skill://{plugin}/{sourceCommitSha}/{skillId}/{+path}";

export function registerSkillResourceTemplate(server: McpServer, router: SkillRouter): void {
	server.registerResource(
		"skill-resource",
		new ResourceTemplate(SKILL_RESOURCE_URI_TEMPLATE, { list: undefined }),
		{
			title: "Skill resource",
			description: "Read one immutable resource from a registered Skill snapshot.",
		},
		async (uri, variables) => {
			const plugin = resourceVariable(variables, "plugin");
			const sourceCommitSha = resourceVariable(variables, "sourceCommitSha");
			const skillId = resourceVariable(variables, "skillId");
			const path = resourceVariable(variables, "path");
			const loaded = await router.loadSkillResource({
				skillId,
				path,
				sourceCommitSha,
				binaryMode: "base64",
			});
			if (loaded.plugin !== plugin || loaded.uri !== uri.href) {
				throw new SkillRouterError("RESOURCE_NOT_FOUND", "Resource URI does not match the selected Skill snapshot.");
			}
			if (loaded.contentType === "text") {
				return {
					contents: [{ uri: loaded.uri, mimeType: loaded.mimeType, text: loaded.content }],
				};
			}
			if (!loaded.contentIncluded || loaded.content === undefined) {
				throw new SkillRouterError("SOURCE_READ_FAILED", "Binary resource content was not returned.");
			}
			return {
				contents: [{ uri: loaded.uri, mimeType: loaded.mimeType, blob: loaded.content }],
			};
		},
	);
}

function resourceVariable(variables: unknown, name: string): string {
	if (!variables || typeof variables !== "object") {
		throw new SkillRouterError("INVALID_RESOURCE_PATH", "Resource URI variables are invalid.");
	}
	const value = (variables as Record<string, unknown>)[name];
	if (typeof value !== "string" || value.length === 0) {
		throw new SkillRouterError("INVALID_RESOURCE_PATH", "Resource URI variables are invalid.");
	}
	return value;
}
