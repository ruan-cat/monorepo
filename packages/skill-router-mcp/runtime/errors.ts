export type SkillRouterErrorCode =
	| "REGISTRY_NOT_FOUND"
	| "REGISTRY_SCHEMA_UNSUPPORTED"
	| "REGISTRY_ENTRY_INVALID"
	| "SKILL_NOT_FOUND"
	| "SOURCE_COMMIT_INVALID"
	| "SOURCE_READ_FAILED"
	| "GITHUB_AUTH_FAILED"
	| "GITHUB_RATE_LIMITED"
	| "GITHUB_NOT_FOUND"
	| "GITHUB_UPSTREAM_FAILED"
	| "INVALID_QUERY"
	| "INVALID_PATH";

export class SkillRouterError extends Error {
	readonly code: SkillRouterErrorCode;
	readonly status?: number;

	constructor(code: SkillRouterErrorCode, message: string, status?: number) {
		super(message);
		this.name = "SkillRouterError";
		this.code = code;
		this.status = status;
	}
}

export const safeError = (error: unknown): SkillRouterError => {
	if (error instanceof SkillRouterError) return error;
	return new SkillRouterError("SOURCE_READ_FAILED", "Unable to read the configured skill source.");
};
