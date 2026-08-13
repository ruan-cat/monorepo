import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { defineEventHandler, type H3Event } from "nitro/h3";
import { createServer, type CreateServerOptions } from "../../mcp/create-server.ts";
import { toolCatalog } from "../../mcp/tool-definitions.ts";
import { createServerInfo } from "../../mcp/tools/get-server-info.ts";
import { GitHubSkillSource } from "../../repositories/github-skill-source.ts";
import { extractRuntimeBindings } from "../../runtime/bindings.ts";
import { buildInfo } from "../../runtime/build-info.generated.ts";
import { createDeploymentInfo } from "../../runtime/deployment-info.ts";
import { SkillRouter } from "../../services/skill-router.ts";
import { MCP_PACKAGE_VERSION } from "../../runtime/package-info.ts";

/**
 * Per-request factory seam used by the MCP contract tests. The production
 * handler intentionally creates both objects for every HTTP request: the
 * stateless transport must never be shared between clients.
 */
export interface McpRequestHandlerOptions {
	readonly serverOptions?: CreateServerOptions;
	readonly createServer?: (options?: CreateServerOptions) => ReturnType<typeof createServer>;
}

export const MAX_REQUEST_BYTES = 256 * 1024;
export const MAX_RESPONSE_BYTES = 1024 * 1024;
export const REQUEST_TIMEOUT_MS = 15_000;

export function createRequestServer(options: CreateServerOptions = {}) {
	return createServer(options);
}

export function createRequestTransport() {
	return new WebStandardStreamableHTTPServerTransport({
		// Stateless JSON responses are the compatibility baseline for the
		// anonymous Cloudflare endpoint. No MCP session is persisted here.
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});
}

function runtimeEnv(event: H3Event): unknown {
	const request = event.req as unknown as { runtime?: { cloudflare?: { env?: unknown } } };
	return request.runtime?.cloudflare?.env;
}

export function createRuntimeServerOptions(event: H3Event): CreateServerOptions {
	const bindings = extractRuntimeBindings(runtimeEnv(event));
	const source = new GitHubSkillSource({
		owner: bindings.owner,
		repository: bindings.repository,
		token: bindings.token,
		apiBaseUrl: bindings.apiBaseUrl,
	});
	const router = new SkillRouter({ source, ref: bindings.ref });
	const version = MCP_PACKAGE_VERSION;
	const info = createServerInfo({
		version,
		buildGitSha: buildInfo.buildGitSha,
		deployment: createDeploymentInfo(bindings.versionMetadata),
		owner: bindings.owner,
		repository: bindings.repository,
		ref: bindings.ref,
		tools: toolCatalog(),
	});
	return { version, router, serverInfo: info };
}

/** Adapt a Web Standard Request to the SDK's Web Standard transport. */
export async function handleMcpRequest(request: Request, options: McpRequestHandlerOptions = {}): Promise<Response> {
	const declaredLength = Number(request.headers.get("content-length") ?? "0");
	if (declaredLength > MAX_REQUEST_BYTES)
		return new Response(JSON.stringify({ error: "REQUEST_TOO_LARGE" }), {
			status: 413,
			headers: { "content-type": "application/json" },
		});
	if (request.body && declaredLength === 0) {
		const actualLength = (await request.clone().arrayBuffer()).byteLength;
		if (actualLength > MAX_REQUEST_BYTES)
			return new Response(JSON.stringify({ error: "REQUEST_TOO_LARGE" }), {
				status: 413,
				headers: { "content-type": "application/json" },
			});
	}
	const serverFactory = options.createServer ?? createRequestServer;
	const server = serverFactory(options.serverOptions);
	const transport = createRequestTransport();
	await server.connect(transport);
	let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
	try {
		const response = await Promise.race([
			transport.handleRequest(request),
			new Promise<Response>((_, reject) => {
				timeoutHandle = setTimeout(() => reject(new Error("MCP request timed out")), REQUEST_TIMEOUT_MS);
			}),
		]);
		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			const responseLength = (await response.clone().arrayBuffer()).byteLength;
			if (responseLength > MAX_RESPONSE_BYTES)
				return new Response(JSON.stringify({ error: "RESPONSE_TOO_LARGE" }), {
					status: 413,
					headers: { "content-type": "application/json" },
				});
		}
		return response;
	} catch {
		return new Response(JSON.stringify({ error: "MCP_REQUEST_FAILED" }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	} finally {
		if (timeoutHandle) clearTimeout(timeoutHandle);
		// JSON response mode has completed its response promise at this point.
		// Closing the request-local transport releases its maps without creating
		// a server-side session or affecting other requests.
		await transport.close();
	}
}

export default defineEventHandler((event: H3Event) =>
	handleMcpRequest(event.req, { serverOptions: createRuntimeServerOptions(event) }),
);
