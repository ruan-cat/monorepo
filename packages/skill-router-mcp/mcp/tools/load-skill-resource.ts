import { safeError } from "../../runtime/errors.ts";
import type {
	LoadedSkillResource,
	LoadSkillResourceInput,
} from "../../services/resource-resolver.ts";
import type { SkillRouter } from "../../services/skill-router.ts";

interface ResourceToolErrorResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent: { code: string; message: string };
	readonly isError: true;
}

interface LoadSkillResourceSuccessResult {
	readonly content: Array<{ readonly type: "text"; readonly text: string }>;
	readonly structuredContent: LoadedSkillResource;
}

export interface LoadSkillResourceContext {
	router: SkillRouter;
}

export async function loadSkillResource(
	input: LoadSkillResourceInput,
	context: LoadSkillResourceContext,
): Promise<LoadSkillResourceSuccessResult | ResourceToolErrorResult> {
	try {
		const result = await context.router.loadSkillResource(input);
		return {
			content: [
				{
					type: "text",
					text: result.contentType === "text" ? result.content : JSON.stringify(result),
				},
			],
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

export const handleLoadSkillResource = loadSkillResource;
