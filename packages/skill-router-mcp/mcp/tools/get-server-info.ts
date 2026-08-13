import type { DeploymentInfo } from "../../runtime/deployment-info.ts";

/** The public, secret-free shape returned by `get_server_info`. */
export interface ServerInfo {
	server: {
		name: string;
		version: string;
		buildGitSha: string;
	};
	deployment: DeploymentInfo;
	skillSource: {
		repository: string;
		ref: string;
	};
	registrySchemaVersion: "1";
	tools: readonly ServerToolSummary[];
}

export interface ServerToolSummary {
	name: string;
	title: string;
	description: string;
	annotations: {
		readOnlyHint: true;
		destructiveHint: false;
		openWorldHint: boolean;
	};
}

export interface ServerInfoOptions {
	name?: string;
	version: string;
	buildGitSha: string;
	deployment: DeploymentInfo;
	owner: string;
	repository: string;
	ref: string;
	tools: readonly ServerToolSummary[];
}

/**
 * Assemble diagnostics from already-normalized runtime values.
 *
 * This function intentionally has no repository/source argument.  Calling
 * `get_server_info` must not resolve GitHub HEAD or touch the GitHub token.
 */
export function createServerInfo(options: ServerInfoOptions): ServerInfo {
	const repository = `${options.owner}/${options.repository}`;
	return Object.freeze({
		server: Object.freeze({
			name: options.name ?? "skill-router-mcp",
			version: options.version,
			buildGitSha: options.buildGitSha,
		}),
		deployment: Object.freeze({ ...options.deployment }),
		skillSource: Object.freeze({ repository, ref: options.ref }),
		registrySchemaVersion: "1" as const,
		tools: Object.freeze(
			options.tools.map((tool) =>
				Object.freeze({
					name: tool.name,
					title: tool.title,
					description: tool.description,
					annotations: Object.freeze({ ...tool.annotations }),
				}),
			),
		),
	});
}

export const getServerInfo = createServerInfo;
