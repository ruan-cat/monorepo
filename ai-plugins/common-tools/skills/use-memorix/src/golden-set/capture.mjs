import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	CANDIDATE_HOSTS,
	FAILURE_KINDS,
	GENERATION_STATUSES,
	RETRIEVAL_CANDIDATE_SCHEMA_VERSION,
	computeCandidateId,
	isGitHubIdentity,
	sha256,
	validateRetrievalCandidate,
} from "./contracts.mjs";
import { redactQuery } from "./redaction.mjs";

const MAX_TOP_N = 5;
const KNOWN_CHANNELS = ["fuzzy", "semantic", "lexical"];
const RESULT_ARRAY_KEYS = ["results", "candidates", "topN"];

function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickArray(value) {
	if (!isPlainObject(value)) return undefined;
	for (const key of RESULT_ARRAY_KEYS) {
		if (Array.isArray(value[key])) return value[key];
	}
	return undefined;
}

function pickCount(value, results) {
	if (isPlainObject(value) && Number.isInteger(value.candidateCount) && value.candidateCount >= 0) {
		return value.candidateCount;
	}
	if (Array.isArray(results)) return results.length;
	return undefined;
}

function normalizeTopN(results) {
	if (!Array.isArray(results)) return [];
	return results.slice(0, MAX_TOP_N).map((item) => {
		const entry = {};
		if (!isPlainObject(item)) return entry;
		if (typeof item.ref === "string") entry.ref = item.ref;
		if (typeof item.channel === "string") entry.channel = item.channel;
		if (typeof item.score === "number") entry.score = item.score;
		if (Array.isArray(item.matchedFields)) {
			entry.matchedFields = item.matchedFields.filter((field) => typeof field === "string");
		}
		return entry;
	});
}

/**
 * 只读取结构化字段；任何缺失都不做文本兜底。
 *
 * 归一化后固定输出 candidateCount、topN、fallbackUsed、generationStatus 与规则分区。
 */
export function normalizeStructuredSearchResult(value) {
	const results = pickArray(value);
	const candidateCount = pickCount(value, results);
	const topN = normalizeTopN(results);
	const fallbackUsed = isPlainObject(value) && typeof value.fallbackUsed === "boolean" ? value.fallbackUsed : undefined;
	const generationStatus =
		isPlainObject(value) && GENERATION_STATUSES.includes(value.generationStatus) ? value.generationStatus : undefined;

	const zeroEnabled = typeof candidateCount === "number";
	const fuzzyEnabled =
		typeof candidateCount === "number" &&
		candidateCount > 0 &&
		topN.length > 0 &&
		topN.every((item) => typeof item.channel === "string" && KNOWN_CHANNELS.includes(item.channel)) &&
		topN.every((item) => item.channel === "fuzzy");
	const fallbackEnabled = fallbackUsed !== undefined || generationStatus !== undefined;

	const enabledRules = FAILURE_KINDS.filter((kind) =>
		kind === "zero-candidate" ? zeroEnabled : kind === "fuzzy-only" ? fuzzyEnabled : fallbackEnabled,
	);
	const disabledRules = FAILURE_KINDS.filter((kind) => !enabledRules.includes(kind));

	const normalized = { topN, enabledRules, disabledRules };
	if (typeof candidateCount === "number") normalized.candidateCount = candidateCount;
	if (fallbackUsed !== undefined) normalized.fallbackUsed = fallbackUsed;
	if (generationStatus !== undefined) normalized.generationStatus = generationStatus;
	return normalized;
}

/** 按冻结规则判定失效类型；空集合不会因 every() 真空真而命中 fuzzy-only。 */
export function classifyRetrievalFailure(value) {
	const kinds = [];
	const hasZero = value.enabledRules.includes("zero-candidate");
	const hasFuzzy = value.enabledRules.includes("fuzzy-only");
	const hasFallback = value.enabledRules.includes("fallback-generation");
	if (hasZero && value.candidateCount === 0) kinds.push("zero-candidate");
	if (hasFuzzy && typeof value.candidateCount === "number" && value.candidateCount > 0) {
		const channels = value.topN.map((item) => item.channel);
		if (channels.length > 0 && channels.every((channel) => channel === "fuzzy")) kinds.push("fuzzy-only");
	}
	if (hasFallback && (value.fallbackUsed === true || GENERATION_STATUSES.includes(value.generationStatus))) {
		kinds.push("fallback-generation");
	}
	return FAILURE_KINDS.filter((kind) => kinds.includes(kind));
}

function reasonFor(kind, value) {
	if (kind === "zero-candidate") return `candidateCount=${value.candidateCount}`;
	if (kind === "fuzzy-only") return `channels=${value.topN.map((item) => item.channel).join(",")}`;
	return `fallbackUsed=${String(value.fallbackUsed) ?? "undefined"};generationStatus=${value.generationStatus ?? "undefined"}`;
}

/** 构建候选；三条规则都不可用时返回 null（fail-open，不产生候选）。 */
export function buildCandidate(input) {
	const normalized = input.normalized;
	const failures = classifyRetrievalFailure(normalized);
	if (failures.length === 0) return null;
	const captureDate = new Date(input.capturedAt).toISOString().slice(0, 10);
	const redacted = input.query;
	const candidate = {
		schemaVersion: RETRIEVAL_CANDIDATE_SCHEMA_VERSION,
		candidateId: computeCandidateId(input.sourceProject, captureDate, redacted),
		sourceProject: input.sourceProject,
		host: input.host,
		captureMode: input.captureMode,
		toolName: input.toolName,
		captureDate,
		capturedAt: new Date(input.capturedAt).toISOString(),
		query: { redactedOriginal: redacted, sha256: sha256(redacted) },
		signals: failures.map((kind) => ({ kind, reasons: [reasonFor(kind, normalized)] })),
		resultSummary: {
			candidateCount: normalized.candidateCount ?? normalized.topN.length,
			topN: normalized.topN,
		},
		contract: {
			structuredContent: true,
			enabledRules: normalized.enabledRules,
			disabledRules: normalized.disabledRules,
		},
	};
	if (normalized.fallbackUsed !== undefined) candidate.resultSummary.fallbackUsed = normalized.fallbackUsed;
	if (normalized.generationStatus !== undefined) {
		candidate.resultSummary.generationStatus = normalized.generationStatus;
	}
	return candidate;
}

export function candidatePath(projectRoot, candidateId) {
	return join(projectRoot, ".memorix/golden-set/.local/inbox", `${candidateId}.json`);
}

/** 写入 ignored inbox；已存在即跳过（天然去重），不移动、不写 cases.json。 */
export async function writeCandidate(projectRoot, candidate) {
	const validation = validateRetrievalCandidate(candidate);
	if (!validation.ok) throw new Error(`invalid-candidate: ${validation.errors.join("; ")}`);
	const target = candidatePath(projectRoot, candidate.candidateId);
	mkdirSync(join(projectRoot, ".memorix/golden-set/.local/inbox"), { recursive: true });
	if (existsSync(target)) return false;
	writeFileSync(target, `${JSON.stringify(candidate, null, "\t")}\n`, "utf8");
	return true;
}

export function readRepository(projectRoot) {
	const configPath = join(projectRoot, ".git/config");
	if (!existsSync(configPath)) return undefined;
	const text = readFileSync(configPath, "utf8");
	const match = text.match(/\[remote "origin"\][^[]*?url\s*=\s*(\S+)/);
	if (!match) return undefined;
	const raw = match[1].trim();
	const ssh = raw.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/);
	const https = raw.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
	const identity = ssh?.[1] ?? https?.[1];
	return identity && isGitHubIdentity(identity) ? identity : undefined;
}

export function redactForProject(query, projectRoot) {
	return redactQuery(query, { homeDir: homedir(), projectRoot });
}

export function isSupportedHost(host) {
	return CANDIDATE_HOSTS.includes(host);
}
