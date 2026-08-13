import type { GitHubSkillSource } from "../repositories/github-skill-source.ts";

export interface SourceSnapshot {
	readonly owner: string;
	readonly repository: string;
	readonly ref: string;
	readonly sourceCommitSha: string;
	readonly pinned: boolean;
}

export interface SourceSnapshotInput {
	source: Pick<GitHubSkillSource, "owner" | "repository" | "resolveRef" | "validateCommitSha">;
	ref: string;
	sourceCommitSha?: string;
}

/** Resolves a mutable ref at most once. Downstream code receives only this immutable id. */
export async function createSourceSnapshot(input: SourceSnapshotInput): Promise<SourceSnapshot> {
	const pinned = input.sourceCommitSha !== undefined;
	const sourceCommitSha = pinned
		? input.source.validateCommitSha(input.sourceCommitSha!)
		: await input.source.resolveRef(input.ref);
	return Object.freeze({
		owner: input.source.owner,
		repository: input.source.repository,
		ref: input.ref,
		sourceCommitSha,
		pinned,
	});
}
