import { createHash } from "node:crypto";

export const GOLDEN_SET_CASE_SCHEMA_VERSION = "memorix-golden-set-case/v1";
export const RETRIEVAL_CANDIDATE_SCHEMA_VERSION = "memorix-retrieval-candidate/v1";
export const FEDERATION_BUNDLE_SCHEMA_VERSION = "memorix-golden-set-bundle/v1";

export const FAILURE_KINDS = ["zero-candidate", "fuzzy-only", "fallback-generation"];
export const GENERATION_STATUSES = ["fallback", "generated", "generation-error"];
export const CANDIDATE_HOSTS = [
	"zcode",
	"claude-code",
	"codex",
	"cursor",
	"antigravity",
	"trae",
	"qoder",
	"workbuddy",
	"other",
];

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GITHUB_IDENTITY = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/;
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}

export function isGitHubIdentity(value) {
	if (typeof value !== "string") return false;
	if (value.includes("://") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
	if (!GITHUB_IDENTITY.test(value)) return false;
	const [owner, repository] = value.split("/");
	return Boolean(owner) && Boolean(repository) && repository !== "." && repository !== "..";
}

export function isIsoTimestamp(value) {
	if (typeof value !== "string" || !ISO_8601.test(value)) return false;
	return Number.isFinite(Date.parse(value));
}

function utcDateOf(timestamp) {
	return new Date(timestamp).toISOString().slice(0, 10);
}

function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function hasNonEmptyField(anchor) {
	if (!isPlainObject(anchor)) return false;
	if (nonEmptyString(anchor.topicKey)) return true;
	if (nonEmptyString(anchor.entity)) return true;
	if (nonEmptyString(anchor.type)) return true;
	for (const key of ["titleIncludes", "conceptsAny"]) {
		const list = anchor[key];
		if (Array.isArray(list) && list.length > 0 && list.every(nonEmptyString)) return true;
	}
	return false;
}

function validateAnchorList(value, label, errors, { required }) {
	if (value === undefined) {
		if (required) errors.push(`${label} is required`);
		return;
	}
	if (!Array.isArray(value) || value.length === 0) {
		errors.push(`${label} must be a non-empty array`);
		return;
	}
	value.forEach((anchor, index) => {
		if (!hasNonEmptyField(anchor)) errors.push(`${label}[${index}] needs at least one non-empty semantic field`);
	});
}

const UNREDACTED_PATTERNS = [
	/[A-Za-z]:[\\/]Users[\\/](?!<)/i,
	/\/(?:Users|home)\/[^/<\s]+/,
	/\bBearer\s+[A-Za-z0-9._-]{8,}/i,
	/\b(?:gh[pousr]_[A-Za-z0-9._-]{10,}|github_pat_[A-Za-z0-9._-]{10,})/,
];

export function queryLooksUnredacted(value) {
	if (typeof value !== "string") return true;
	return UNREDACTED_PATTERNS.some((pattern) => pattern.test(value));
}

function validateQuery(query, errors, label = "query") {
	if (!nonEmptyString(query)) {
		errors.push(`${label} must be a non-empty string`);
		return;
	}
	if (queryLooksUnredacted(query)) errors.push(`${label} must be redacted before persisting`);
}

function validateFailureKinds(value, errors, label) {
	if (!Array.isArray(value) || value.length === 0) {
		errors.push(`${label} must be a non-empty array`);
		return;
	}
	const seen = new Set();
	for (const kind of value) {
		if (!FAILURE_KINDS.includes(kind)) errors.push(`${label} contains unknown kind: ${String(kind)}`);
		if (seen.has(kind)) errors.push(`${label} contains duplicate kind: ${String(kind)}`);
		seen.add(kind);
	}
	const ordered = FAILURE_KINDS.filter((kind) => seen.has(kind));
	if (JSON.stringify(value) !== JSON.stringify(ordered)) errors.push(`${label} must follow the frozen kind order`);
}

function validateCaseShape(value, errors, label) {
	if (!isPlainObject(value)) {
		errors.push(`${label} must be an object`);
		return;
	}
	if (!nonEmptyString(value.id) || !KEBAB_CASE.test(value.id)) errors.push(`${label}.id must be lowercase kebab-case`);
	validateQuery(value.query, errors, `${label}.query`);
	if (!isIsoTimestamp(value.capturedAt)) errors.push(`${label}.capturedAt must be an ISO 8601 timestamp`);
	validateFailureKinds(value.failureKinds, errors, `${label}.failureKinds`);
	const expected = value.expected;
	if (!isPlainObject(expected)) {
		errors.push(`${label}.expected must be an object`);
	} else {
		validateAnchorList(expected.mustMatch, `${label}.expected.mustMatch`, errors, { required: true });
		validateAnchorList(expected.mustNotMatch, `${label}.expected.mustNotMatch`, errors, { required: false });
		if (expected.notes !== undefined && typeof expected.notes !== "string") {
			errors.push(`${label}.expected.notes must be a string`);
		}
	}
	const hints = value.localHints;
	if (hints !== undefined && hints !== null) {
		if (!isPlainObject(hints)) errors.push(`${label}.localHints must be an object`);
		else if (hints.observationIds !== undefined) {
			const ids = hints.observationIds;
			if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id) || id < 0)) {
				errors.push(`${label}.localHints.observationIds must be non-negative integers`);
			}
		}
	}
}

function collectObservationIdKeys(value, errors) {
	const stack = [value];
	while (stack.length) {
		const current = stack.pop();
		if (Array.isArray(current)) {
			stack.push(...current);
			continue;
		}
		if (!isPlainObject(current)) continue;
		for (const [key, child] of Object.entries(current)) {
			if (key === "localHints" && child === undefined) continue;
			if (key === "observationIds" || key === "localHints") errors.push(`bundle must not contain ${key}`);
			if (typeof child === "object" && child !== null) stack.push(child);
		}
	}
}

export function computeCandidateId(sourceProject, captureDate, query) {
	return sha256(`${sourceProject}\n${captureDate}\n${query}`);
}

export function validateGoldenSetFile(value) {
	const errors = [];
	if (!isPlainObject(value)) return { ok: false, errors: ["golden set must be an object"] };
	if (value.schemaVersion !== GOLDEN_SET_CASE_SCHEMA_VERSION) {
		errors.push(`schemaVersion must be ${GOLDEN_SET_CASE_SCHEMA_VERSION}`);
	}
	if (!isPlainObject(value.project) || !isGitHubIdentity(value.project.repository)) {
		errors.push("project.repository must be a GitHub owner/repository identity");
	}
	if (!Array.isArray(value.cases)) {
		errors.push("cases must be an array");
	} else {
		const ids = new Set();
		value.cases.forEach((item, index) => {
			validateCaseShape(item, errors, `cases[${index}]`);
			if (isPlainObject(item) && nonEmptyString(item.id)) {
				if (ids.has(item.id)) errors.push(`cases[${index}].id is duplicated`);
				ids.add(item.id);
			}
		});
	}
	return errors.length ? { ok: false, errors } : { ok: true, value };
}

export function validateRetrievalCandidate(value) {
	const errors = [];
	if (!isPlainObject(value)) return { ok: false, errors: ["candidate must be an object"] };
	if (value.schemaVersion !== RETRIEVAL_CANDIDATE_SCHEMA_VERSION) {
		errors.push(`schemaVersion must be ${RETRIEVAL_CANDIDATE_SCHEMA_VERSION}`);
	}
	if (!isGitHubIdentity(value.sourceProject)) {
		errors.push("sourceProject must be a GitHub owner/repository identity");
	}
	if (!CANDIDATE_HOSTS.includes(value.host)) errors.push(`unknown host: ${String(value.host)}`);
	if (value.captureMode !== "automatic-hook" && value.captureMode !== "interactive") {
		errors.push("captureMode must be automatic-hook or interactive");
	}
	if (value.captureMode === "automatic-hook" && value.host !== "zcode") {
		errors.push("automatic-hook capture is ZCode-only");
	}
	if (value.host !== "zcode" && value.captureMode === "automatic-hook") {
		errors.push("non-ZCode hosts must use interactive capture");
	}
	if (!nonEmptyString(value.toolName)) errors.push("toolName must be a non-empty string");
	if (typeof value.captureDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.captureDate)) {
		errors.push("captureDate must be YYYY-MM-DD");
	}
	if (!isIsoTimestamp(value.capturedAt)) errors.push("capturedAt must be an ISO 8601 timestamp");
	else if (typeof value.captureDate === "string" && utcDateOf(value.capturedAt) !== value.captureDate) {
		errors.push("capturedAt must match captureDate in UTC");
	}
	if (!isPlainObject(value.query)) {
		errors.push("query must be an object");
	} else {
		validateQuery(value.query.redactedOriginal, errors, "query.redactedOriginal");
		if (value.query.sha256 !== sha256(String(value.query.redactedOriginal))) {
			errors.push("query.sha256 must match sha256(redactedOriginal)");
		}
	}
	if (isGitHubIdentity(value.sourceProject) && typeof value.captureDate === "string" && isPlainObject(value.query)) {
		const expected = computeCandidateId(value.sourceProject, value.captureDate, String(value.query.redactedOriginal));
		if (value.candidateId !== expected)
			errors.push("candidateId must be recomputed from sourceProject/captureDate/query");
	}
	validateFailureKinds(
		Array.isArray(value.signals) ? value.signals.map((item) => item?.kind) : value.signals,
		errors,
		"signals",
	);
	if (!Array.isArray(value.signals) || value.signals.length === 0) {
		errors.push("signals must be a non-empty array");
	} else {
		value.signals.forEach((signal, index) => {
			if (!isPlainObject(signal)) errors.push(`signals[${index}] must be an object`);
			else if (
				!Array.isArray(signal.reasons) ||
				signal.reasons.length === 0 ||
				signal.reasons.some((r) => typeof r !== "string")
			) {
				errors.push(`signals[${index}].reasons must be a non-empty string array`);
			}
		});
	}
	const summary = value.resultSummary;
	if (!isPlainObject(summary)) {
		errors.push("resultSummary must be an object");
	} else {
		if (!Number.isInteger(summary.candidateCount) || summary.candidateCount < 0) {
			errors.push("resultSummary.candidateCount must be a non-negative integer");
		}
		if (!Array.isArray(summary.topN) || summary.topN.length > 5) {
			errors.push("resultSummary.topN must be an array of at most 5 entries");
		} else {
			summary.topN.forEach((item, index) => {
				if (!isPlainObject(item)) {
					errors.push(`resultSummary.topN[${index}] must be an object`);
					return;
				}
				const allowedKeys = ["ref", "channel", "score", "matchedFields"];
				for (const key of Object.keys(item)) {
					if (!allowedKeys.includes(key)) errors.push(`resultSummary.topN[${index}] has forbidden field ${key}`);
				}
				if (item.ref !== undefined && typeof item.ref !== "string")
					errors.push(`resultSummary.topN[${index}].ref must be a string`);
				if (item.channel !== undefined && typeof item.channel !== "string") {
					errors.push(`resultSummary.topN[${index}].channel must be a string`);
				}
				if (item.score !== undefined && typeof item.score !== "number")
					errors.push(`resultSummary.topN[${index}].score must be a number`);
				if (item.matchedFields !== undefined) {
					if (!Array.isArray(item.matchedFields) || item.matchedFields.some((field) => typeof field !== "string")) {
						errors.push(`resultSummary.topN[${index}].matchedFields must be a string array`);
					}
				}
			});
		}
		if (summary.fallbackUsed !== undefined && typeof summary.fallbackUsed !== "boolean") {
			errors.push("resultSummary.fallbackUsed must be a boolean");
		}
		if (summary.generationStatus !== undefined && !GENERATION_STATUSES.includes(summary.generationStatus)) {
			errors.push("resultSummary.generationStatus must be a frozen enum value");
		}
	}
	const contract = value.contract;
	if (!isPlainObject(contract)) {
		errors.push("contract must be an object");
	} else {
		if (contract.structuredContent !== true) errors.push("contract.structuredContent must be exactly true");
		for (const key of ["enabledRules", "disabledRules"]) {
			const rules = contract[key];
			if (!Array.isArray(rules)) {
				errors.push(`contract.${key} must be an array`);
				continue;
			}
			if (new Set(rules).size !== rules.length) errors.push(`contract.${key} must not repeat rules`);
			if (rules.some((rule) => !FAILURE_KINDS.includes(rule))) errors.push(`contract.${key} contains unknown rule`);
			const ordered = FAILURE_KINDS.filter((rule) => rules.includes(rule));
			if (JSON.stringify(rules) !== JSON.stringify(ordered))
				errors.push(`contract.${key} must follow the frozen rule order`);
		}
		const enabled = Array.isArray(contract.enabledRules) ? contract.enabledRules : [];
		const disabled = Array.isArray(contract.disabledRules) ? contract.disabledRules : [];
		const overlap = enabled.filter((rule) => disabled.includes(rule));
		if (overlap.length) errors.push(`contract rules must be disjoint: ${overlap.join(",")}`);
		const union = FAILURE_KINDS.filter((rule) => enabled.includes(rule) || disabled.includes(rule));
		if (union.length !== FAILURE_KINDS.length) errors.push("contract rules must partition all failure kinds");
		if (Array.isArray(value.signals)) {
			for (const signal of value.signals) {
				if (isPlainObject(signal) && !enabled.includes(signal.kind)) {
					errors.push(`signal ${String(signal.kind)} must come from enabledRules`);
				}
			}
		}
	}
	return errors.length ? { ok: false, errors } : { ok: true, value };
}

export function validateFederatedBundle(value) {
	const errors = [];
	if (!isPlainObject(value)) return { ok: false, errors: ["bundle must be an object"] };
	if (value.schemaVersion !== FEDERATION_BUNDLE_SCHEMA_VERSION) {
		errors.push(`schemaVersion must be ${FEDERATION_BUNDLE_SCHEMA_VERSION}`);
	}
	if (!isGitHubIdentity(value.sourceProject)) errors.push("sourceProject must be a GitHub owner/repository identity");
	if (!nonEmptyString(value.projectId)) errors.push("projectId must be a non-empty string");
	if (typeof value.sourceCommit !== "string" || !/^[a-f0-9]{40}$/.test(value.sourceCommit)) {
		errors.push("sourceCommit must be a full 40-character Git SHA");
	}
	if (!isIsoTimestamp(value.capturedAt)) errors.push("capturedAt must be an ISO 8601 timestamp");
	if (!isIsoTimestamp(value.exportedAt)) errors.push("exportedAt must be an ISO 8601 timestamp");
	if (!nonEmptyString(value.upstreamCaseId)) errors.push("upstreamCaseId must be a non-empty string");
	if (!isPlainObject(value.case)) {
		errors.push("case must be an object");
	} else {
		const localHints = value.case.localHints;
		if (localHints !== undefined && localHints !== null) errors.push("bundle case must not contain localHints");
		collectObservationIdKeys(value.case, errors);
		validateCaseShape(value.case, errors, "case");
	}
	return errors.length ? { ok: false, errors } : { ok: true, value };
}

export { sha256 };
