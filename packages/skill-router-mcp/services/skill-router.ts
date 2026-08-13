import type { GitHubSkillSource } from "../repositories/github-skill-source.ts";
import { SkillRouterError } from "../runtime/errors.ts";
import { createSourceSnapshot, type SourceSnapshot } from "./source-snapshot.ts";
import { SkillRegistry, type SkillRegistryEntry } from "./skill-registry.ts";
import { searchSkills, type SkillSearchResult } from "./skill-search.ts";

export const REGISTRY_PATH = "ai-plugins/skill-registry.json";

export interface SkillRouterOptions {
	source: GitHubSkillSource;
	ref: string;
}

export interface SkillSummary extends SkillRegistryEntry {
	sourceCommitSha: string;
}

export type SkillSearchResultWithSource = SkillSearchResult & { sourceCommitSha: string };

export interface LoadedSkill extends SkillRegistryEntry {
	content: string;
	sourceCommitSha: string;
}

export class SkillRouter {
	readonly source: GitHubSkillSource;
	readonly ref: string;

	constructor(options: SkillRouterOptions) {
		this.source = options.source;
		this.ref = options.ref;
	}

	async snapshot(sourceCommitSha?: string): Promise<SourceSnapshot> {
		return createSourceSnapshot({ source: this.source, ref: this.ref, sourceCommitSha });
	}

	async listSkills(snapshot?: SourceSnapshot): Promise<SkillSummary[]> {
		const current = snapshot ?? (await this.snapshot());
		const registry = await this.readRegistry(current);
		return registry.list().map((skill) => ({ ...skill, sourceCommitSha: current.sourceCommitSha }));
	}

	async searchSkills(query: string, snapshot?: SourceSnapshot): Promise<SkillSearchResultWithSource[]> {
		const current = snapshot ?? (await this.snapshot());
		const registry = await this.readRegistry(current);
		return searchSkills(registry.list(), query).map((skill) => ({
			...skill,
			sourceCommitSha: current.sourceCommitSha,
		}));
	}

	async loadSkill(skillId: string, sourceCommitSha?: string, snapshot?: SourceSnapshot): Promise<LoadedSkill> {
		const current = snapshot ?? (await this.snapshot(sourceCommitSha));
		if (sourceCommitSha && current.sourceCommitSha !== sourceCommitSha)
			throw new SkillRouterError("SOURCE_COMMIT_INVALID", "Pinned source commit could not be honoured.");
		const skill = (await this.readRegistry(current)).get(skillId);
		const content = await this.source.readFile(skill.entry, current.sourceCommitSha);
		return { ...skill, content, sourceCommitSha: current.sourceCommitSha };
	}

	async readRelatedFile(skillId: string, relativePath: string, snapshot: SourceSnapshot): Promise<string> {
		const skill = (await this.readRegistry(snapshot)).get(skillId);
		const directory = skill.entry.slice(0, skill.entry.lastIndexOf("/"));
		const normalizedRelative = relativePath.replace(/\\/g, "/");
		if (normalizedRelative.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
			throw new SkillRouterError("INVALID_PATH", "Related file is outside the selected Skill directory.");
		}
		const path = `${directory}/${normalizedRelative}`;
		if (!isWithinDirectory(path, directory))
			throw new SkillRouterError("INVALID_PATH", "Related file is outside the selected Skill directory.");
		return this.source.readFile(path, snapshot.sourceCommitSha);
	}

	private async readRegistry(snapshot: SourceSnapshot): Promise<SkillRegistry> {
		let raw: string;
		try {
			raw = await this.source.readFile(REGISTRY_PATH, snapshot.sourceCommitSha);
		} catch (error) {
			if (
				error instanceof SkillRouterError &&
				(error.code === "GITHUB_NOT_FOUND" || error.code === "SOURCE_READ_FAILED")
			) {
				throw new SkillRouterError(
					"REGISTRY_NOT_FOUND",
					"Skill registry is not available at the requested source commit.",
				);
			}
			throw error;
		}
		try {
			return new SkillRegistry(JSON.parse(raw) as unknown);
		} catch (error) {
			if (error instanceof SkillRouterError) throw error;
			throw new SkillRouterError("REGISTRY_ENTRY_INVALID", "Skill registry JSON is invalid.");
		}
	}
}

function isWithinDirectory(path: string, directory: string): boolean {
	if (!path || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
	const normalize = (value: string) => {
		const segments: string[] = [];
		for (const segment of value.split("/")) {
			if (!segment || segment === ".") continue;
			if (segment === "..") {
				segments.pop();
				continue;
			}
			segments.push(segment);
		}
		return segments.join("/");
	};
	const base = normalize(directory);
	const candidate = normalize(path);
	return candidate.startsWith(`${base}/`) && candidate !== base;
}
