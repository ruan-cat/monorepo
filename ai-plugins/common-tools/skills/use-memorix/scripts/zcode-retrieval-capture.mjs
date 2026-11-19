#!/usr/bin/env node
import { appendFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
	buildCandidate,
	normalizeStructuredSearchResult,
	readRepository,
	redactForProject,
	writeCandidate,
} from "../src/golden-set/capture.mjs";

const MAX_CANDIDATES = 500;

function readStream(stream) {
	if (!stream) return Promise.resolve("");
	return new Promise((resolve) => {
		let buffer = "";
		stream.setEncoding?.("utf8");
		stream.on("data", (chunk) => {
			buffer += chunk;
		});
		stream.on("end", () => resolve(buffer));
		stream.on("error", () => resolve(buffer));
	});
}

function logDiagnostic(projectRoot, message) {
	try {
		const dir = join(projectRoot, ".memorix/golden-set/.local/logs");
		mkdirSync(dir, { recursive: true });
		appendFileSync(join(dir, "zcode-capture.log"), `${new Date().toISOString()} ${message}\n`, "utf8");
	} catch {
		// 诊断写入失败也不能阻断原搜索。
	}
}

function inboxCount(projectRoot) {
	try {
		return readdirSync(join(projectRoot, ".memorix/golden-set/.local/inbox")).filter((name) => name.endsWith(".json"))
			.length;
	} catch {
		return 0;
	}
}

/**
 * ZCode PostToolUse 检索候选捕获。
 *
 * 纯本地：只读 structuredContent、写 ignored inbox 与最小诊断；任何异常都返回 0，不阻断原搜索。
 */
export async function main(options = {}) {
	const projectRootHint = options.projectRoot;
	try {
		const raw = options.payload ?? (await readStream(options.stdin ?? process.stdin));
		if (!raw || !raw.trim()) return 0;
		const envelope = JSON.parse(raw);
		const structured = envelope?.tool_response?.structuredContent;
		if (!structured || typeof structured !== "object") return 0;

		const normalized = normalizeStructuredSearchResult(structured);
		if (normalized.enabledRules.length === 0) return 0;

		const projectRoot = projectRootHint ?? envelope.cwd ?? process.cwd();
		const repository = readRepository(projectRoot);
		if (!repository) {
			logDiagnostic(projectRoot, "skip:repository-identity-missing");
			return 0;
		}

		const rawQuery = envelope?.tool_input?.query;
		if (typeof rawQuery !== "string" || !rawQuery.trim()) {
			logDiagnostic(projectRoot, "skip:query-missing");
			return 0;
		}
		if (inboxCount(projectRoot) >= MAX_CANDIDATES) {
			logDiagnostic(projectRoot, "skip:inbox-limit-500");
			return 0;
		}

		const candidate = buildCandidate({
			host: "zcode",
			captureMode: "automatic-hook",
			sourceProject: repository,
			toolName: typeof envelope.tool_name === "string" ? envelope.tool_name : "memorix_search",
			query: redactForProject(rawQuery, projectRoot),
			capturedAt: (options.now ? options.now() : new Date()).toISOString(),
			normalized,
		});
		if (!candidate) return 0;
		const written = await writeCandidate(projectRoot, candidate);
		if (!written) logDiagnostic(projectRoot, `skip:duplicate:${candidate.candidateId}`);
		return 0;
	} catch (error) {
		const root = projectRootHint ?? process.cwd();
		logDiagnostic(root, `error:${error instanceof Error ? error.message.slice(0, 120) : "unknown"}`);
		return 0;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main({});
	process.exit(0);
}
