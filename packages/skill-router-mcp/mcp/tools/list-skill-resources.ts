import { safeError } from "../../runtime/errors.ts";
import type {
	ListSkillResourcesInput,
	ListSkillResourcesOutput,
} from "../../services/resource-resolver.ts";
import type { SkillRouter } from "../../services/skill-router.ts";

interface ResourceToolErrorResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent: { code: string; message: string };
	readonly isError: true;
}

interface ListSkillResourcesSuccessResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent: ListSkillResourcesOutput;
}

export interface ListSkillResourcesContext {
	router: SkillRouter;
}

export async function listSkillResources(
	input: ListSkillResourcesInput,
	context: ListSkillResourcesContext,
): Promise<ListSkillResourcesSuccessResult | ResourceToolErrorResult> {
	try {
		const result = await context.router.listSkillResources(input);
		return {
			content: [{ type: "text", text: JSON.stringify(result) }],
			structuredContent: result,
		};
	} catch (error) {
		const safe = safeError(error);
		return {
			content: [{ type: "text", text: safe.message }],
			structuredContent: { code: safe.code, message: safe.message },
			isError: true,
		};
	}
}

export const handleListSkillResources = listSkillResources;
