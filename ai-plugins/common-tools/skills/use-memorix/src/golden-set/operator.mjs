import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	FEDERATION_BUNDLE_SCHEMA_VERSION,
	GOLDEN_SET_CASE_SCHEMA_VERSION,
	isGitHubIdentity,
	validateFederatedBundle,
	validateGoldenSetFile,
} from "./contracts.mjs";
import { GITIGNORE_LINE } from "./zcode-install.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_DAYS = 30;
const RETENTION_LIMIT = 500;

const templateRoot = fileURLToPath(new URL("../../templates/golden-set/", import.meta.url));

function template(name) {
	return readFileSync(join(templateRoot, name), "utf8");
}

function fail(message) {
	throw new Error(message);
}

/**
 * 规划项目黄金集初始化（默认只预览）。
 *
 * 只在真实检索失效后调用；写入前必须展示 README、cases 与 .gitignore 三处变更。
 */
export function planGoldenSetInit(input) {
	if (!isGitHubIdentity(input.repository)) fail("repository must be a GitHub owner/repository identity");
	const writes = [];
	const blocked = [];
	const readmePath = join(input.projectRoot, ".memorix/golden-set/README.md");
	const casesPath = join(input.projectRoot, ".memorix/golden-set/cases.json");
	const gitignorePath = join(input.projectRoot, ".gitignore");

	if (existsSync(readmePath)) blocked.push("readme-exists");
	else writes.push({ path: readmePath, content: template("README.md"), before: null });

	if (existsSync(casesPath)) blocked.push("cases-exists");
	else {
		const cases = {
			schemaVersion: GOLDEN_SET_CASE_SCHEMA_VERSION,
			project: { repository: input.repository },
			cases: [],
		};
		writes.push({ path: casesPath, content: `${JSON.stringify(cases, null, "\t")}\n`, before: null });
	}

	const gitignoreBefore = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf8") : null;
	if (gitignoreBefore === null || !gitignoreBefore.split(/\r?\n/).includes(GITIGNORE_LINE)) {
		const prefix =
			gitignoreBefore === null || gitignoreBefore.length === 0
				? ""
				: gitignoreBefore.endsWith("\n")
					? gitignoreBefore
					: `${gitignoreBefore}\n`;
		writes.push({ path: gitignorePath, content: `${prefix}${GITIGNORE_LINE}\n`, before: gitignoreBefore });
	}

	return { writes, blocked };
}

/**
 * 只接受有 one-shot CLI 复跑证据的候选。
 *
 * rerun.query 必须与候选的脱敏 query 完全一致；rerun.structuredContent 必须是结构化对象。
 */
export function acceptCandidate(input) {
	const candidateQuery = input.candidate?.query?.redactedOriginal;
	if (typeof candidateQuery !== "string" || !candidateQuery.trim()) fail("candidate query is required");
	if (!input.rerun || input.rerun.query !== candidateQuery) fail("rerun query must match candidate query");
	if (typeof input.rerun.structuredContent !== "object" || input.rerun.structuredContent === null) {
		fail("rerun structuredContent must be a structured object");
	}
	const signals = Array.isArray(input.candidate.signals) ? input.candidate.signals : [];
	if (signals.length === 0) fail("candidate signals are required");
	const failureKinds = ["zero-candidate", "fuzzy-only", "fallback-generation"].filter((kind) =>
		signals.some((signal) => signal?.kind === kind),
	);
	if (failureKinds.length === 0) fail("candidate has no supported failure kind");

	const caseValue = {
		id: input.id,
		query: candidateQuery,
		capturedAt: input.capturedAt,
		failureKinds,
		expected: input.expected,
	};
	const goldenSet = {
		schemaVersion: GOLDEN_SET_CASE_SCHEMA_VERSION,
		project: { repository: input.goldenSet.project.repository },
		cases: [...input.goldenSet.cases.filter((item) => item.id !== input.id), caseValue],
	};
	const validation = validateGoldenSetFile(goldenSet);
	if (!validation.ok) fail(`invalid-golden-set: ${validation.errors.join("; ")}`);
	return goldenSet;
}

/** 留存预演：超过 30 天（按 UTC 日期）的候选才进入 remove，单次最多 500 条。 */
export function cleanupCandidates(input) {
	const nowMs = Date.parse(input.now);
	if (!Number.isFinite(nowMs)) fail("now must be an ISO timestamp");
	const cutoff = nowMs - RETENTION_DAYS * DAY_MS;
	const expired = input.candidates
		.filter((item) => {
			const capturedMs = Date.parse(item.capturedAt);
			return Number.isFinite(capturedMs) && capturedMs <= cutoff;
		})
		.sort((a, b) => {
			const delta = Date.parse(a.capturedAt) - Date.parse(b.capturedAt);
			return delta !== 0 ? delta : a.path.localeCompare(b.path);
		});
	const remove = expired.slice(0, RETENTION_LIMIT).map((item) => item.path);
	const removeSet = new Set(remove);
	const keep = input.candidates.filter((item) => !removeSet.has(item.path)).map((item) => item.path);
	return { remove, keep, requiresConfirmation: true };
}

/** 导出单 case 联邦 bundle；localHints 与 observationId 一律剥离。 */
export function exportBundle(input) {
	const target = input.goldenSet.cases.find((item) => item.id === input.caseId);
	if (!target) fail(`case not found: ${input.caseId}`);
	const { localHints: _ignored, ...caseWithoutLocalHints } = target;
	const bundle = {
		schemaVersion: FEDERATION_BUNDLE_SCHEMA_VERSION,
		sourceProject: input.goldenSet.project.repository,
		projectId: input.projectId,
		sourceCommit: input.sourceCommit,
		capturedAt: target.capturedAt,
		exportedAt: input.exportedAt,
		upstreamCaseId: target.id,
		case: caseWithoutLocalHints,
	};
	const validation = validateFederatedBundle(bundle);
	if (!validation.ok) fail(`invalid-bundle: ${validation.errors.join("; ")}`);
	return bundle;
}
