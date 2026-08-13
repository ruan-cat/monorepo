import { buildInfo } from "../../runtime/build-info.generated.ts";
import { createDeploymentInfo } from "../../runtime/deployment-info.ts";
import { extractRuntimeBindings } from "../../runtime/bindings.ts";
import type { H3Event } from "nitro/h3";
import { MCP_PACKAGE_VERSION } from "../../runtime/package-info.ts";
export function healthPayload(input: { version?: string; metadata?: unknown } = {}) {
	return {
		ok: true,
		service: "skill-router-mcp",
		version: input.version ?? MCP_PACKAGE_VERSION,
		buildGitSha: buildInfo.buildGitSha,
		deployment: createDeploymentInfo(input.metadata as never),
	};
}
export default (event: H3Event) => {
	const runtime = (event.req as unknown as { runtime?: { cloudflare?: { env?: unknown } } }).runtime?.cloudflare?.env;
	const bindings = extractRuntimeBindings(runtime);
	return healthPayload({ version: MCP_PACKAGE_VERSION, metadata: bindings.versionMetadata });
};
