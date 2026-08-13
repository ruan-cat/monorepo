import type { SkillRouter, SkillSummary } from "../../services/skill-router.ts";

export interface ListSkillsInput {
	sourceCommitSha?: string;
}

export interface SkillToolContext {
	router: SkillRouter;
}

/** Resolve one request-local snapshot and list only registry summaries. */
export async function listSkills(input: ListSkillsInput = {}, context: SkillToolContext): Promise<SkillSummary[]> {
	return context.router.listSkills(await context.router.snapshot(input.sourceCommitSha));
}

export const handleListSkills = listSkills;
