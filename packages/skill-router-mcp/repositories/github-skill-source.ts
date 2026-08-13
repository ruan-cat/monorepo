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

// GitHub returns hexadecimal commit ids; branch-like values such as `main`
// and `feature/foo` are never valid pins.
const SHA_PATTERN = /^[a-f0-9]{7,128}$/;

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
		this.transport = options.transport ?? (async ({ url, init }) => fetch(url, init));
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
			`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(commitSha)}`,
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
			return decodeBase64(payload.content);
		} catch {
			console.warn("github_content_invalid", {
				status: response.status,
				contentType: response.headers.get("content-type"),
			});
			throw new SkillRouterError("SOURCE_READ_FAILED", "GitHub returned invalid file content.");
		}
	}

	private async request(path: string): Promise<Response> {
		const headers = new Headers({
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "skill-router-mcp/0.1.0",
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

function decodeBase64(content: string): string {
	if (typeof atob === "function") {
		const binary = atob(content.replace(/\s/g, ""));
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	}
	return Buffer.from(content, "base64").toString("utf8");
}
