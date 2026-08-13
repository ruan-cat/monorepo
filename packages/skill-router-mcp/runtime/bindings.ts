import type { CloudflareVersionMetadata } from "./deployment-info.ts";

export interface SkillSourceBindings {
	GITHUB_OWNER?: string;
	GITHUB_REPO?: string;
	GITHUB_REF?: string;
	GITHUB_TOKEN?: string;
	/** Test-only upstream override; production Wrangler config does not declare it. */
	GITHUB_API_BASE_URL?: string;
	CF_VERSION_METADATA?: CloudflareVersionMetadata;
}

export interface RuntimeBindings {
	owner: string;
	repository: string;
	ref: string;
	/** Deliberately not included in public diagnostics. */
	token?: string;
	versionMetadata?: CloudflareVersionMetadata;
	apiBaseUrl?: string;
}

const value = (candidate: unknown): string | undefined =>
	typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;

export function extractRuntimeBindings(input: unknown): RuntimeBindings {
	const env = (input as { env?: SkillSourceBindings } | null)?.env ?? (input as SkillSourceBindings | null) ?? {};
	return {
		owner:
			value(env.GITHUB_OWNER) ??
			(() => {
				throw new Error("GITHUB_OWNER is required");
			})(),
		repository:
			value(env.GITHUB_REPO) ??
			(() => {
				throw new Error("GITHUB_REPO is required");
			})(),
		ref:
			value(env.GITHUB_REF) ??
			(() => {
				throw new Error("GITHUB_REF is required");
			})(),
		token: value(env.GITHUB_TOKEN),
		apiBaseUrl: value(env.GITHUB_API_BASE_URL),
		versionMetadata: env.CF_VERSION_METADATA,
	};
}
