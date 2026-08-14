import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolDefinitions, type ToolContext } from "./tool-definitions.ts";
import { registerSkillResourceTemplate } from "./skill-resource-template.ts";
import { MCP_PACKAGE_NAME, MCP_PACKAGE_VERSION } from "../runtime/package-info.ts";
import { safeError, type SkillRouterErrorCode } from "../runtime/errors.ts";

export interface CreateServerOptions extends ToolContext {
	name?: string;
	version?: string;
}

export function createServer(options: CreateServerOptions = {}) {
	const server = new McpServer({
		name: options.name ?? MCP_PACKAGE_NAME,
		version: options.version ?? MCP_PACKAGE_VERSION,
	});
	const toolError = (error: unknown) => {
		const safe = safeError(error);
		return {
			content: [{ type: "text" as const, text: safe.message }],
			structuredContent: { code: safe.code as SkillRouterErrorCode, message: safe.message },
			isError: true,
		};
	};
	for (const definition of toolDefinitions) {
		(server as any).registerTool(
			definition.name,
			{
				title: definition.title,
				description: definition.description,
				inputSchema: definition.inputSchema,
				annotations: definition.annotations,
			},
			async (input: unknown) => {
				return Promise.resolve(definition.handler(input, options)).catch((error) => {
					return toolError(error);
				});
			},
		);
	}
	if (options.router) registerSkillResourceTemplate(server, options.router);
	return server;
}
