import { SkillRouterError } from "../runtime/errors.ts";

export interface GitHubRequest {
	url: string;
	init?: RequestInit;
}

export type GitHubTransport = (request: GitHubRequest) => Promise<Response>;

export interface GitHubSkillSourceOptions {
	owner: string;
	repository: string;
	token?: string;
	transport?: GitHubTransport;
	apiBaseUrl?: string;
}

interface GitHubContentResponse {
	content?: string;
	encoding?: string;
	download_url?: string | null;
}

interface GitHubCommitObjectResponse {
	tree?: { sha?: string };
}

interface GitHubTreeResponse {
	tree?: unknown;
	truncated?: boolean;
}

interface GitHubBlobResponse {
	content?: string;
	encoding?: string;
	size?: number;
}

export type GitObjectType = "blob" | "tree" | "commit";

export interface GitTreeEntry {
	path: string;
	mode: string;
	type: GitObjectType;
	sha: string;
	size?: number;
}

// GitHub returns hexadecimal object ids; branch-like values are never valid pins.
const SHA_PATTERN = /^[a-f0-9]{7,128}$/;
const TREE_CACHE_MAX_ENTRIES = 64;
const DEFAULT_GITHUB_TRANSPORT: GitHubTransport = async ({ url, init }) => fetch(url, init);
const treeCacheByTransport = new WeakMap<object, Map<string, Promise<GitTreeEntry[]>>>();

/** A read-only adapter. The configured owner/repository cannot be replaced by callers. */
export class GitHubSkillSource {
	readonly owner: string;
	readonly repository: string;
	readonly token?: string;
	private readonly transport: GitHubTransport;
	private readonly apiBaseUrl: string;

	constructor(options: GitHubSkillSourceOptions) {
		if (!options.owner || !options.repository) {
			throw new Error("GitHub owner and repository are required");
		}
		this.owner = options.owner;
		this.repository = options.repository;
		this.token = options.token;
		this.transport = options.transport ?? DEFAULT_GITHUB_TRANSPORT;
		this.apiBaseUrl = (options.apiBaseUrl ?? "https://api.github.com").replace(/\/$/, "");
	}

	static isCommitSha(value: string): boolean {
		return SHA_PATTERN.test(value) && !value.includes("/");
	}

	validateCommitSha(value: string): string {
		if (!GitHubSkillSource.isCommitSha(value)) {
			throw new SkillRouterError("SOURCE_COMMIT_INVALID", "sourceCommitSha must be an exact commit identifier.");
		}
		return value;
	}

	async resolveRef(ref: string): Promise<string> {
		if (!ref || ref.includes("\0")) {
			throw new SkillRouterError("SOURCE_COMMIT_INVALID", "Git ref is invalid.");
		}
		const response = await this.request(
			`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/commits/${encodeURIComponent(ref)}`,
		);
		const payload = await this.json(response);
		const sha = typeof payload.sha === "string" ? payload.sha : undefined;
		if (!sha || !GitHubSkillSource.isCommitSha(sha)) {
			throw new SkillRouterError("SOURCE_COMMIT_INVALID", "GitHub did not return a valid commit identifier.");
		}
		return sha;
	}

	async readFile(path: string, commitSha: string): Promise<string> {
		this.validateCommitSha(commitSha);
		if (!isSafeRepositoryPath(path)) {
			throw new SkillRouterError("INVALID_PATH", "The requested repository path is invalid.");
		}
		const response = await this.request(
			`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/contents/${path
				.split("/")
				.map(encodeURIComponent)
				.join("/")}?ref=${encodeURIComponent(commitSha)}`,
		);
		const payload = (await this.json(response)) as GitHubContentResponse;
		if (typeof payload.content !== "string") {
			console.warn("github_content_missing", {
				status: response.status,
				contentType: response.headers.get("content-type"),
			});
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned no file content.");
		}
		if (payload.encoding && payload.encoding !== "base64") {
			return payload.content;
		}
		try {
			return new TextDecoder().decode(decodeBase64Bytes(payload.content));
		} catch {
			console.warn("github_content_invalid", {
				status: response.status,
				contentType: response.headers.get("content-type"),
			});
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned invalid file content.");
		}
	}

	/** List non-directory Git objects under one repository subtree at an exact commit. */
	async listTree(path: string, commitSha: string): Promise<GitTreeEntry[]> {
		this.validateCommitSha(commitSha);
		if (!isSafeRepositoryPath(path)) {
			throw new SkillRouterError("INVALID_PATH", "The requested repository path is invalid.");
		}
		const cache = treeCacheFor(this.transport);
		const key = `${this.apiBaseUrl}:${this.owner}/${this.repository}:${commitSha}:${path}`;
		let pending = cache.get(key);
		if (pending) {
			cache.delete(key);
			cache.set(key, pending);
			return pending;
		}
		pending = this.listTreeUncached(path, commitSha);
		cache.set(key, pending);
		trimTreeCache(cache);
		try {
			return await pending;
		} catch (error) {
			cache.delete(key);
			throw error;
		}
	}

	/** Read raw blob bytes without any text decoding. */
	async readBlob(blobSha: string): Promise<Uint8Array> {
		if (!isGitObjectSha(blobSha)) {
			throw new SkillRouterError("SOURCE_READ_FAILED", "Git blob identifier is invalid.");
		}
		const response = await this.request(
			`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/git/blobs/${encodeURIComponent(blobSha)}`,
		);
		const payload = (await this.json(response)) as GitHubBlobResponse;
		if (typeof payload.content !== "string" || (payload.encoding && payload.encoding !== "base64")) {
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned invalid blob content.");
		}
		try {
			return decodeBase64Bytes(payload.content);
		} catch {
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned invalid blob content.");
		}
	}

	private async listTreeUncached(path: string, commitSha: string): Promise<GitTreeEntry[]> {
		let treeSha = await this.getCommitTreeSha(commitSha);
		for (const segment of path.split("/")) {
			const level = await this.readGitTree(treeSha, false);
			const next = level.entries.find((entry) => entry.path === segment && entry.type === "tree");
			if (!next) {
				throw new SkillRouterError("GITHUB_NOT_FOUND", "The configured GitHub source was not found.", 404);
			}
			treeSha = next.sha;
		}
		const recursive = await this.readGitTree(treeSha, true);
		if (!recursive.truncated) {
			return recursive.entries.filter((entry) => entry.type !== "tree");
		}
		return this.walkTree(treeSha);
	}

	private async getCommitTreeSha(commitSha: string): Promise<string> {
		const response = await this.request(
			`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/git/commits/${encodeURIComponent(commitSha)}`,
		);
		const payload = (await this.json(response)) as GitHubCommitObjectResponse;
		const treeSha = payload.tree?.sha;
		if (!treeSha || !isGitObjectSha(treeSha)) {
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub commit did not contain a valid tree.");
		}
		return treeSha;
	}

	private async readGitTree(treeSha: string, recursive: boolean): Promise<{ entries: GitTreeEntry[]; truncated: boolean }> {
		if (!isGitObjectSha(treeSha)) {
			throw new SkillRouterError("SOURCE_READ_FAILED", "Git tree identifier is invalid.");
		}
		const suffix = recursive ? "?recursive=1" : "";
		const response = await this.request(
			`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/git/trees/${encodeURIComponent(treeSha)}${suffix}`,
		);
		const payload = (await this.json(response)) as GitHubTreeResponse;
		if (!Array.isArray(payload.tree)) {
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned an invalid tree.");
		}
		return {
			entries: payload.tree.map(parseTreeEntry),
			truncated: payload.truncated === true,
		};
	}

	private async walkTree(treeSha: string, prefix = ""): Promise<GitTreeEntry[]> {
		const level = await this.readGitTree(treeSha, false);
		const result: GitTreeEntry[] = [];
		for (const entry of level.entries) {
			const path = prefix ? `${prefix}/${entry.path}` : entry.path;
			if (entry.type === "tree") {
				result.push(...(await this.walkTree(entry.sha, path)));
			} else {
				result.push({ ...entry, path });
			}
		}
		return result;
	}

	private async request(path: string): Promise<Response> {
		const headers = new Headers({
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "skill-router-mcp/0.2.0",
		});
		if (this.token) headers.set("Authorization", `Bearer ${this.token}`);
		let response: Response;
		try {
			response = await this.transport({
				url: `${this.apiBaseUrl}${path}`,
				init: { method: "GET", headers },
			});
		} catch (error) {
			console.warn("github_upstream_unreachable", { errorName: error instanceof Error ? error.name : "unknown" });
			throw new SkillRouterError("GITHUB_UPSTREAM_FAILED", "GitHub source request failed.");
		}
		if (response.ok) return response;
		console.warn("github_upstream_rejected", {
			status: response.status,
			rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
			retryAfter: response.headers.get("retry-after"),
		});
		if (response.status === 401) throw new SkillRouterError("GITHUB_AUTH_FAILED", "GitHub authentication failed.", 401);
		if (response.status === 403 || response.status === 429)
			throw new SkillRouterError(
				"GITHUB_RATE_LIMITED",
				"GitHub rate limit or access policy rejected the request.",
				response.status,
			);
		if (response.status === 404)
			throw new SkillRouterError("GITHUB_NOT_FOUND", "The configured GitHub source was not found.", 404);
		throw new SkillRouterError("GITHUB_UPSTREAM_FAILED", "GitHub source request failed.", response.status);
	}

	private async json(response: Response): Promise<Record<string, unknown>> {
		try {
			const body = (await response.json()) as unknown;
			return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
		} catch {
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned invalid JSON.");
		}
	}
}

export function isSafeRepositoryPath(path: string): boolean {
	return (
		Boolean(path) &&
		path === path.replace(/\\/g, "/") &&
		!path.startsWith("/") &&
		!path.includes("\0") &&
		path.split("/").every((part) => part.length > 0 && part !== "." && part !== "..")
	);
}

function treeCacheFor(transport: GitHubTransport): Map<string, Promise<GitTreeEntry[]>> {
	const scope = transport as unknown as object;
	let cache = treeCacheByTransport.get(scope);
	if (!cache) {
		cache = new Map<string, Promise<GitTreeEntry[]>>();
		treeCacheByTransport.set(scope, cache);
	}
	return cache;
}

function trimTreeCache(cache: Map<string, Promise<GitTreeEntry[]>>): void {
	while (cache.size > TREE_CACHE_MAX_ENTRIES) {
		const oldest = cache.keys().next().value as string | undefined;
		if (!oldest) return;
		cache.delete(oldest);
	}
}

function isGitObjectSha(value: string): boolean {
	return SHA_PATTERN.test(value);
}

function parseTreeEntry(value: unknown): GitTreeEntry {
	if (!value || typeof value !== "object") {
		throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned an invalid tree entry.");
	}
	const record = value as Record<string, unknown>;
	if (
		typeof record.path !== "string" ||
		typeof record.mode !== "string" ||
		(record.type !== "blob" && record.type !== "tree" && record.type !== "commit") ||
		typeof record.sha !== "string" ||
		!isGitObjectSha(record.sha)
	) {
		throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned an invalid tree entry.");
	}
	return {
		path: record.path,
		mode: record.mode,
		type: record.type,
		sha: record.sha,
		size: typeof record.size === "number" ? record.size : undefined,
	};
}

function decodeBase64Bytes(content: string): Uint8Array {
	const compact = content.replace(/\s/g, "");
	if (typeof atob === "function") {
		const binary = atob(compact);
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	}
	return Uint8Array.from(Buffer.from(compact, "base64"));
}
