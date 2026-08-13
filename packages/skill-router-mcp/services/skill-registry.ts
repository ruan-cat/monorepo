import { SkillRouterError } from "../runtime/errors.ts";

export interface SkillRegistryEntry {
	id: string;
	plugin: string;
	name: string;
	description: string;
	version: string;
	entry: string;
}

export interface SkillRegistryDocument {
	schemaVersion: "1";
	roots?: string[];
	source?: { repository?: string };
	skills: SkillRegistryEntry[];
}
export const REQUIRED_REGISTRY_ROOTS = ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills"] as const;

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function isSafeSkillEntry(entry: string): boolean {
	if (!text(entry) || entry !== entry.replace(/\\/g, "/") || entry.startsWith("/") || entry.includes("\0"))
		return false;
	const parts = entry.split("/");
	return (
		parts.length >= 5 &&
		parts.every((part) => part && part !== "." && part !== "..") &&
		entry.endsWith("/SKILL.md") &&
		parts[0] === "ai-plugins" &&
		parts[2] === "skills"
	);
}

export function parseSkillRegistry(value: unknown): SkillRegistryDocument {
	if (!value || typeof value !== "object") {
		throw new SkillRouterError("REGISTRY_NOT_FOUND", "Skill registry is missing.");
	}
	const raw = value as Record<string, unknown>;
	if (raw.schemaVersion !== "1") {
		throw new SkillRouterError("REGISTRY_SCHEMA_UNSUPPORTED", "Only Skill registry schema v1 is supported.");
	}
	if (!Array.isArray(raw.skills)) {
		throw new SkillRouterError("REGISTRY_ENTRY_INVALID", "Skill registry entries are invalid.");
	}
	const roots = raw.roots;
	if (!Array.isArray(roots) || REQUIRED_REGISTRY_ROOTS.some((root) => !roots.includes(root))) {
		throw new SkillRouterError("REGISTRY_ENTRY_INVALID", "Skill registry roots are invalid.");
	}
	const ids = new Set<string>();
	const skills = raw.skills.map((candidate) => {
		if (!candidate || typeof candidate !== "object")
			throw new SkillRouterError("REGISTRY_ENTRY_INVALID", "A Skill registry entry is invalid.");
		const entry = candidate as Record<string, unknown>;
		const fields = ["id", "plugin", "name", "description", "version", "entry"] as const;
		if (!fields.every((field) => text(entry[field])) || !isSafeSkillEntry(entry.entry as string)) {
			throw new SkillRouterError("REGISTRY_ENTRY_INVALID", "A Skill registry entry is invalid.");
		}
		const typed = Object.fromEntries(
			fields.map((field) => [field, (entry[field] as string).trim()]),
		) as unknown as SkillRegistryEntry;
		if (ids.has(typed.id)) throw new SkillRouterError("REGISTRY_ENTRY_INVALID", "Skill ids must be globally unique.");
		ids.add(typed.id);
		return Object.freeze(typed);
	});
	return Object.freeze({
		schemaVersion: "1" as const,
		roots: roots.filter(text),
		source: raw.source && typeof raw.source === "object" ? (raw.source as SkillRegistryDocument["source"]) : undefined,
		skills,
	});
}

export class SkillRegistry {
	readonly document: SkillRegistryDocument;
	private readonly byId: ReadonlyMap<string, SkillRegistryEntry>;

	constructor(value: unknown) {
		this.document = parseSkillRegistry(value);
		this.byId = new Map(this.document.skills.map((skill) => [skill.id, skill]));
	}

	list(): SkillRegistryEntry[] {
		return [...this.document.skills];
	}

	get(skillId: string): SkillRegistryEntry {
		const skill = this.byId.get(skillId);
		if (!skill) throw new SkillRouterError("SKILL_NOT_FOUND", "The requested Skill was not found.");
		return skill;
	}
}
