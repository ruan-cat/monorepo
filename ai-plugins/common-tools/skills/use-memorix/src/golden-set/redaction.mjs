const SECRET_PATTERNS = [
	[/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer <redacted>"],
	[/\b(?:gh[pousr]_[A-Za-z0-9._-]{10,}|github_pat_[A-Za-z0-9._-]{10,})/g, "<secret>"],
	[/\b(?:sk|pk)[-_][A-Za-z0-9._-]{10,}/g, "<secret>"],
	[/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, "<secret>"],
	[/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "<email>"],
];

const URL_SECRET_QUERY = /([?&](?:token|access_token|api_key|apikey|key|secret|password)=)[^&\s#]+/gi;

function normalizePath(value) {
	return String(value ?? "")
		.replace(/\\/g, "/")
		.replace(/\/+$/, "");
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 对 query 做确定性脱敏。
 *
 * 顺序固定：先 projectRoot -> `<project-root>`，再 homeDir -> `~`，最后处理密钥/邮箱/URL 查询参数。
 * projectRoot 位于 homeDir 内部时仍优先 projectRoot，避免项目内路径被折叠成 `~` 后丢失项目语义。
 */
export function redactQuery(value, options) {
	const homeDir = normalizePath(options?.homeDir);
	const projectRoot = normalizePath(options?.projectRoot);
	let output = String(value ?? "").replace(/\\/g, "/");

	if (projectRoot) {
		output = output.replace(new RegExp(escapeRegExp(projectRoot), "gi"), "<project-root>");
	}
	if (homeDir) {
		output = output.replace(new RegExp(escapeRegExp(homeDir), "gi"), "~");
	}
	for (const [pattern, replacement] of SECRET_PATTERNS) {
		output = output.replace(pattern, replacement);
	}
	output = output.replace(URL_SECRET_QUERY, "$1<redacted>");
	return output;
}

export { normalizePath };
