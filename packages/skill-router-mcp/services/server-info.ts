/**
 * Server-info assembly lives under `mcp/tools` because it is a protocol
 * projection.  This compatibility module gives service callers a stable
 * import without duplicating the projection or its metadata shape.
 */
export {
	createServerInfo,
	getServerInfo,
	type ServerInfo,
	type ServerInfoOptions,
	type ServerToolSummary,
} from "../mcp/tools/get-server-info.ts";
