import type { GitHubSkillSource, GitTreeEntry } from "../repositories/github-skill-source.ts";
import { SkillRouterError } from "../runtime/errors.ts";
import type { SkillRegistryEntry } from "./skill-registry.ts";
import type { SourceSnapshot } from "./source-snapshot.ts";

export const RESOURCE_LIST_DEFAULT_LIMIT = 50;
export const RESOURCE_LIST_MAX_LIMIT = 200;
export const RESOURCE_TEXT_DEFAULT_BYTES = 262_144;
export const RESOURCE_TEXT_MAX_BYTES = 1_048_576;
export const RESOURCE_BINARY_MAX_BYTES = 65_536;

export type SkillResourceKind = "skill" | "reference" | "script" | "asset" | "other";
export type SkillResourceType = "file" | "symlink" | "submodule";

export interface SkillResourceRecord {
	path: string;
	uri: string;
	kind: SkillResourceKind;
	resourceType: SkillResourceType;
	mimeType: string;
	size?: number;
	textReadable: boolean;
}

export interface ListSkillResourcesInput {
	skillId: string;
	sourceCommitSha?: string;
	prefix?: string;
	cursor?: string;
	limit?: number;
}

export interface ListSkillResourcesOutput {
	skillId: string;
	plugin: string;
	name: string;
	sourceCommitSha: string;
	prefix?: string;
	resources: SkillResourceRecord[];
	total: number;
	nextCursor?: string;
}

export interface LoadSkillResourceInput {
	skillId: string;
	path: string;
	sourceCommitSha?: string;
	startLine?: number;
	endLine?: number;
	maxBytes?: number;
	binaryMode?: "metadata" | "base64";
}

export interface TextSkillResourceOutput {
	skillId: string;
	plugin: string;
	name: string;
	sourceCommitSha: string;
	path: string;
	uri: string;
	kind: SkillResourceKind;
	resourceType: "file";
	mimeType: string;
	size: number;
	contentType: "text";
	content: string;
	range?: {
		startLine: number;
		endLine: number;
		totalLines: number;
	};
}

export interface BlobSkillResourceOutput {
	skillId: string;
	plugin: string;
	name: string;
	sourceCommitSha: string;
	path: string;
	uri: string;
	kind: SkillResourceKind;
	resourceType: "file";
	mimeType: string;
	size: number;
	contentType: "blob";
	encoding: "base64";
	contentIncluded: boolean;
	content?: string;
}

export type LoadedSkillResource = TextSkillResourceOutput | BlobSkillResourceOutput;

export interface ResourceCursorV1 {
	v: 1;
	skillId: string;
	sourceCommitSha: string;
	prefix: string;
	offset: number;
}

interface InventoryEntry extends SkillResourceRecord {
	objectSha: string;
}

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = Object.freeze({
	".md": "text/markdown",
	".txt": "text/plain",
	".ts": "text/typescript",
	".tsx": "text/typescript",
	".js": "text/javascript",
	".mjs": "text/javascript",
	".cjs": "text/javascript",
	".jsx": "text/javascript",
	".json": "application/json",
	".yaml": "application/yaml",
	".yml": "application/yaml",
	".xml": "application/xml",
	".html": "text/html",
	".css": "text/css",
	".py": "text/x-python",
	".sh": "text/x-shellscript",
	".ps1": "text/plain",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".pdf": "application/pdf",
});

const PERCENT_TRIPLET = /%[0-9a-fA-F]{2}/;
const WINDOWS_DRIVE = /^[A-Za-z]:/;

export class ResourceResolver {
	readonly source: GitHubSkillSource;
	private readonly inventoryCache = new Map<string, Promise<InventoryEntry[]>>();

	constructor(source: GitHubSkillSource) {
		this.source = source;
	}

	async listResources(
		skill: SkillRegistryEntry,
		snapshot: SourceSnapshot,
		options: { prefix?: string; offset?: number; limit?: number } = {},
	): Promise<ListSkillResourcesOutput> {
		const prefix = normalizeResourcePrefix(options.prefix);
		const offset = options.offset ?? 0;
		const limit = options.limit ?? RESOURCE_LIST_DEFAULT_LIMIT;
		const inventory = await this.inventory(skill, snapshot);
		const filtered = prefix ? inventory.filter((entry) => entry.path.startsWith(prefix)) : inventory;
		const page = filtered.slice(offset, offset + limit).map(stripInventoryEntry);
		const nextOffset = offset + page.length;
		const nextCursor =
			nextOffset < filtered.length
				? encodeResourceCursor({
						v: 1,
						skillId: skill.id,
						sourceCommitSha: snapshot.sourceCommitSha,
						prefix,
						offset: nextOffset,
					})
				: undefined;
		return {
			skillId: skill.id,
			plugin: skill.plugin,
			name: skill.name,
			sourceCommitSha: snapshot.sourceCommitSha,
			prefix: prefix || undefined,
			resources: page,
			total: filtered.length,
			nextCursor,
		};
	}

	async loadResource(
		skill: SkillRegistryEntry,
		snapshot: SourceSnapshot,
		input: Omit<LoadSkillResourceInput, "skillId" | "sourceCommitSha">,
	): Promise<LoadedSkillResource> {
		const path = normalizeResourcePath(input.path);
		validateRange(input.startLine, input.endLine);
		const inventory = await this.inventory(skill, snapshot);
		const entry = inventory.find((candidate) => candidate.path === path);
		if (!entry) {
			throw new SkillRouterError("RESOURCE_NOT_FOUND", "Resource does not exist in this Skill snapshot.");
		}
		if (entry.resourceType !== "file") {
			throw new SkillRouterError("RESOURCE_TYPE_UNSUPPORTED", "This Git object type cannot be loaded as a Skill resource.");
		}
		if (typeof entry.size !== "number") {
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub tree metadata did not include the resource size.");
		}

		if (entry.textReadable) {
			return this.loadText(skill, snapshot, entry, input);
		}
		return this.loadBinary(skill, snapshot, entry, input);
	}

	private async inventory(skill: SkillRegistryEntry, snapshot: SourceSnapshot): Promise<InventoryEntry[]> {
		const key = `${this.source.owner}/${this.source.repository}:${snapshot.sourceCommitSha}:${skill.id}`;
		let pending = this.inventoryCache.get(key);
		if (!pending) {
			pending = this.buildInventory(skill, snapshot);
			this.inventoryCache.set(key, pending);
		}
		try {
			return await pending;
		} catch (error) {
			this.inventoryCache.delete(key);
			throw error;
		}
	}

	private async buildInventory(skill: SkillRegistryEntry, snapshot: SourceSnapshot): Promise<InventoryEntry[]> {
		const skillRoot = skill.entry.slice(0, skill.entry.lastIndexOf("/"));
		const entries = await this.source.listTree(skillRoot, snapshot.sourceCommitSha);
		return entries
			.map((entry) => this.toInventoryEntry(skill, snapshot, entry))
			.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
	}

	private toInventoryEntry(skill: SkillRegistryEntry, snapshot: SourceSnapshot, entry: GitTreeEntry): InventoryEntry {
		const resourceType = resourceTypeFor(entry);
		const mimeType = mimeTypeFor(entry.path);
		return {
			path: entry.path,
			uri: resourceUri(skill, snapshot.sourceCommitSha, entry.path),
			kind: resourceKindFor(entry.path),
			resourceType,
			mimeType,
			size: entry.size,
			textReadable: resourceType === "file" && isTextMime(mimeType),
			objectSha: entry.sha,
		};
	}

	private async loadText(
		skill: SkillRegistryEntry,
		snapshot: SourceSnapshot,
		entry: InventoryEntry,
		input: Omit<LoadSkillResourceInput, "skillId" | "sourceCommitSha">,
	): Promise<TextSkillResourceOutput> {
		if ((entry.size ?? 0) > RESOURCE_TEXT_MAX_BYTES) {
			throw new SkillRouterError("RESOURCE_TOO_LARGE", "Text resource exceeds the Stage 2 source-size limit.");
		}
		const bytes = await this.source.readBlob(entry.objectSha);
		if (bytes.byteLength > RESOURCE_TEXT_MAX_BYTES) {
			throw new SkillRouterError("RESOURCE_TOO_LARGE", "Text resource exceeds the Stage 2 source-size limit.");
		}
		let decoded: string;
		try {
			decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		} catch {
			throw new SkillRouterError("RESOURCE_ENCODING_UNSUPPORTED", "Resource is not valid UTF-8 text.");
		}

		let content = decoded;
		let range: TextSkillResourceOutput["range"];
		if (input.startLine !== undefined || input.endLine !== undefined) {
			const lines = decoded.split(/\r\n|\n|\r/);
			const startLine = input.startLine ?? 1;
			const endLine = input.endLine ?? lines.length;
			if (startLine > lines.length || endLine > lines.length) {
				throw new SkillRouterError("RESOURCE_RANGE_INVALID", "Requested line range is outside the text resource.");
			}
			content = lines.slice(startLine - 1, endLine).join("\n");
			range = { startLine, endLine, totalLines: lines.length };
		}
		const budget = input.maxBytes ?? RESOURCE_TEXT_DEFAULT_BYTES;
		if (new TextEncoder().encode(content).byteLength > budget) {
			throw new SkillRouterError("RESOURCE_TOO_LARGE", "Text resource exceeds the requested inline byte limit.");
		}
		return {
			skillId: skill.id,
			plugin: skill.plugin,
			name: skill.name,
			sourceCommitSha: snapshot.sourceCommitSha,
			path: entry.path,
			uri: entry.uri,
			kind: entry.kind,
			resourceType: "file",
			mimeType: entry.mimeType,
			size: entry.size ?? bytes.byteLength,
			contentType: "text",
			content,
			range,
		};
	}

	private async loadBinary(
		skill: SkillRegistryEntry,
		snapshot: SourceSnapshot,
		entry: InventoryEntry,
		input: Omit<LoadSkillResourceInput, "skillId" | "sourceCommitSha">,
	): Promise<BlobSkillResourceOutput> {
		const base: BlobSkillResourceOutput = {
			skillId: skill.id,
			plugin: skill.plugin,
			name: skill.name,
			sourceCommitSha: snapshot.sourceCommitSha,
			path: entry.path,
			uri: entry.uri,
			kind: entry.kind,
			resourceType: "file",
			mimeType: entry.mimeType,
			size: entry.size ?? 0,
			contentType: "blob",
			encoding: "base64",
			contentIncluded: false,
		};
		if ((input.binaryMode ?? "metadata") === "metadata") return base;

		const effectiveLimit = Math.min(input.maxBytes ?? RESOURCE_BINARY_MAX_BYTES, RESOURCE_BINARY_MAX_BYTES);
		if ((entry.size ?? 0) > effectiveLimit) {
			throw new SkillRouterError("RESOURCE_TOO_LARGE", "Binary resource exceeds the inline byte limit.");
		}
		const bytes = await this.source.readBlob(entry.objectSha);
		if (bytes.byteLength > effectiveLimit) {
			throw new SkillRouterError("RESOURCE_TOO_LARGE", "Binary resource exceeds the inline byte limit.");
		}
		return {
			...base,
			size: bytes.byteLength,
			contentIncluded: true,
			content: encodeBase64(bytes),
		};
	}
}

export function decodeResourceCursor(value: string): ResourceCursorV1 {
	try {
		const parsed = JSON.parse(decodeBase64Url(value)) as unknown;
		if (!parsed || typeof parsed !== "object") throw new Error("cursor");
		const cursor = parsed as Record<string, unknown>;
		if (
			cursor.v !== 1 ||
			typeof cursor.skillId !== "string" ||
			typeof cursor.sourceCommitSha !== "string" ||
			typeof cursor.prefix !== "string" ||
			typeof cursor.offset !== "number" ||
			!Number.isInteger(cursor.offset) ||
			cursor.offset < 0
		) {
			throw new Error("cursor");
		}
		return {
			v: 1,
			skillId: cursor.skillId,
			sourceCommitSha: cursor.sourceCommitSha,
			prefix: cursor.prefix,
			offset: cursor.offset,
		};
	} catch {
		throw new SkillRouterError("RESOURCE_CURSOR_INVALID", "Resource cursor is invalid.");
	}
}

export function encodeResourceCursor(cursor: ResourceCursorV1): string {
	return encodeBase64Url(JSON.stringify(cursor));
}

export function normalizeResourcePath(value: string): string {
	if (!value) throw invalidResourcePath();
	assertRawRelativePath(value);
	const segments = value.split("/");
	if (segments.some((segment) => !segment || segment === "." || segment === "..")) throw invalidResourcePath();
	return segments.join("/");
}

export function normalizeResourcePrefix(value?: string): string {
	if (!value) return "";
	assertRawRelativePath(value);
	const segments = value.split("/");
	const trailingSlash = segments.at(-1) === "";
	if (trailingSlash) segments.pop();
	if (segments.some((segment) => !segment || segment === "." || segment === "..")) throw invalidResourcePath();
	return `${segments.join("/")}${trailingSlash ? "/" : ""}`;
}

function assertRawRelativePath(value: string): void {
	if (
		value.startsWith("/") ||
		value.includes("\\") ||
		value.includes("\0") ||
		WINDOWS_DRIVE.test(value) ||
		PERCENT_TRIPLET.test(value)
	) {
		throw invalidResourcePath();
	}
}

function invalidResourcePath(): SkillRouterError {
	return new SkillRouterError("INVALID_RESOURCE_PATH", "Resource path must be a raw Skill-root relative POSIX path.");
}

function validateRange(startLine?: number, endLine?: number): void {
	if (endLine !== undefined && startLine === undefined) {
		throw new SkillRouterError("RESOURCE_RANGE_INVALID", "endLine requires startLine.");
	}
	if (startLine !== undefined && (!Number.isInteger(startLine) || startLine < 1)) {
		throw new SkillRouterError("RESOURCE_RANGE_INVALID", "startLine must be a positive integer.");
	}
	if (endLine !== undefined && (!Number.isInteger(endLine) || endLine < startLine!)) {
		throw new SkillRouterError("RESOURCE_RANGE_INVALID", "endLine must be greater than or equal to startLine.");
	}
}

function resourceTypeFor(entry: GitTreeEntry): SkillResourceType {
	if (entry.mode === "120000") return "symlink";
	if (entry.mode === "160000" || entry.type === "commit") return "submodule";
	return "file";
}

function resourceKindFor(path: string): SkillResourceKind {
	if (path === "SKILL.md") return "skill";
	if (path.startsWith("references/")) return "reference";
	if (path.startsWith("scripts/")) return "script";
	if (path.startsWith("assets/")) return "asset";
	return "other";
}

function mimeTypeFor(path: string): string {
	const filename = path.slice(path.lastIndexOf("/") + 1);
	const dot = filename.lastIndexOf(".");
	if (dot < 0) return "application/octet-stream";
	return MIME_BY_EXTENSION[filename.slice(dot).toLowerCase()] ?? "application/octet-stream";
}

function isTextMime(mimeType: string): boolean {
	return (
		mimeType.startsWith("text/") ||
		mimeType === "application/json" ||
		mimeType === "application/yaml" ||
		mimeType === "application/xml" ||
		mimeType.endsWith("+xml")
	);
}

function resourceUri(skill: SkillRegistryEntry, sourceCommitSha: string, path: string): string {
	const encodedPath = path
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return `skill://${encodeURIComponent(skill.plugin)}/${sourceCommitSha}/${encodeURIComponent(skill.id)}/${encodedPath}`;
}

function stripInventoryEntry(entry: InventoryEntry): SkillResourceRecord {
	const { objectSha: _objectSha, ...record } = entry;
	return record;
}

function encodeBase64(bytes: Uint8Array): string {
	if (typeof btoa === "function") {
		let binary = "";
		for (const byte of bytes) binary += String.fromCharCode(byte);
		return btoa(binary);
	}
	return Buffer.from(bytes).toString("base64");
}

function encodeBase64Url(value: string): string {
	return encodeBase64(new TextEncoder().encode(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
	let bytes: Uint8Array;
	if (typeof atob === "function") {
		const binary = atob(padded);
		bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	} else {
		bytes = Uint8Array.from(Buffer.from(padded, "base64"));
	}
	return new TextDecoder().decode(bytes);
}
