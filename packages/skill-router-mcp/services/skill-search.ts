import type { SkillRegistryEntry } from "./skill-registry.ts";
import { SkillRouterError } from "../runtime/errors.ts";

export interface SkillSearchResult extends SkillRegistryEntry {
	score: number;
}

const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();

export function searchSkills(entries: SkillRegistryEntry[], query: string): SkillSearchResult[] {
	const needle = normalize(query);
	if (!needle) throw new SkillRouterError("INVALID_QUERY", "Search query must not be empty.");
	const terms = needle.split(/\s+/).filter(Boolean);
	return entries
		.map((entry) => {
			const haystack = normalize([entry.id, entry.name, entry.description, entry.plugin].join(" "));
			const score = terms.reduce(
				(total, term) => total + (haystack.includes(term) ? (entry.id === term ? 10 : 1) : 0),
				0,
			);
			return { ...entry, score };
		})
		.filter((entry) => entry.score > 0)
		.sort((left, right) => right.score - left.score || compareCodePoint(left.id, right.id));
}

function compareCodePoint(left: string, right: string): number {
	if (left === right) return 0;
	return left < right ? -1 : 1;
}
