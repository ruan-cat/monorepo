import { buildInfo } from "./build-info.generated.ts";

export interface CloudflareVersionMetadata {
	id?: unknown;
	tag?: unknown;
	timestamp?: unknown;
}

export interface DeploymentInfo {
	workerVersionId?: string;
	workerVersionTag?: string;
	workerVersionTimestamp?: string;
	buildGitSha: string;
}

const asString = (value: unknown): string | undefined =>
	typeof value === "string" && value.trim() ? value.trim() : undefined;

export function createDeploymentInfo(
	metadata?: CloudflareVersionMetadata | null,
	buildGitSha = buildInfo.buildGitSha,
): DeploymentInfo {
	return {
		workerVersionId: asString(metadata?.id),
		workerVersionTag: asString(metadata?.tag),
		workerVersionTimestamp: asString(metadata?.timestamp),
		buildGitSha,
	};
}
