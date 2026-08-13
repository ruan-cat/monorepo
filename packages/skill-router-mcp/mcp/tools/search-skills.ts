import type { SkillRouter, SkillSearchResultWithSource } from "../../services/skill-router.ts";

export interface SearchSkillsInput {
	query: string;
	sourceCommitSha?: string;
}

export interface SearchSkillsContext {
	router: SkillRouter;
}

/** Search registry metadata using a single request-local source snapshot. */
export async function searchSkills(
	input: SearchSkillsInput,
	context: SearchSkillsContext,
): Promise<SkillSearchResultWithSource[]> {
	return context.router.searchSkills(input.query, await context.router.snapshot(input.sourceCommitSha));
}

export const handleSearchSkills = searchSkills;
