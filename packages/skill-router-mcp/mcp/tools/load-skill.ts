import type { LoadedSkill, SkillRouter } from "../../services/skill-router.ts";
import { GitHubSkillSource } from "../../repositories/github-skill-source.ts";
import { SkillRouterError } from "../../runtime/errors.ts";
import { safeError } from "../../runtime/errors.ts";

interface LoadSkillErrorResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent: { code: string; message: string };
	readonly isError: true;
}

interface LoadSkillSuccessResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent: LoadedSkill;
}

export interface LoadSkillInput {
	skillId: string;
	sourceCommitSha?: string;
}

export interface LoadSkillContext {
	router: SkillRouter;
}

/** Load one SKILL.md from the configured repository and exact commit. */
function loadSkillError(error: unknown): LoadSkillErrorResult {
	const safe = safeError(error);
	return {
		content: [{ type: "text", text: safe.message }],
		structuredContent: { code: safe.code, message: safe.message },
		isError: true,
	};
}

export async function loadSkill(
	input: LoadSkillInput,
	context: LoadSkillContext,
): Promise<LoadSkillSuccessResult | LoadSkillErrorResult> {
	try {
		if (input.sourceCommitSha && !GitHubSkillSource.isCommitSha(input.sourceCommitSha)) {
			throw new SkillRouterError("SOURCE_COMMIT_INVALID", "sourceCommitSha must be an exact commit identifier.");
		}
		const loaded = await context.router.loadSkill(input.skillId, input.sourceCommitSha);
		return {
			content: [{ type: "text", text: loaded.content }],
			structuredContent: loaded,
		};
	} catch (error) {
		return loadSkillError(error);
	}
}

export const handleLoadSkill = loadSkill;
