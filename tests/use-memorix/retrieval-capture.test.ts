import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { afterEach, describe, expect, test } from "vitest";
import {
	buildCandidate,
	classifyRetrievalFailure,
	normalizeStructuredSearchResult,
	writeCandidate,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/capture.mjs";
import { runInteractiveCapture } from "../../ai-plugins/common-tools/skills/use-memorix/scripts/capture-interactive.mjs";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

const dirs: string[] = [];
function temp() {
	const dir = mkdtempSync(join(tmpdir(), "capture-"));
	dirs.push(dir);
	return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const full = {
	candidateCount: 2,
	results: [
		{ ref: "obs:1", channel: "fuzzy", score: 0.2, matchedFields: ["title"] },
		{ ref: "obs:2", channel: "fuzzy", score: 0.1, matchedFields: ["concepts"] },
	],
	fallbackUsed: true,
	generationStatus: "fallback",
};

describe("retrieval capture", () => {
	test("CAPTURE-01 partitions structured signals and fails open without text parsing", () => {
		const normalized = normalizeStructuredSearchResult(full);
		expect(normalized.enabledRules).toEqual(["zero-candidate", "fuzzy-only", "fallback-generation"]);
		expect(normalized.disabledRules).toEqual([]);
		expect(classifyRetrievalFailure(normalized)).toEqual(["fuzzy-only", "fallback-generation"]);
		const textOnly = normalizeStructuredSearchResult({ content: "0 candidates fuzzy fallback" });
		expect(textOnly.enabledRules).toEqual([]);
		expect(textOnly.disabledRules).toEqual(["zero-candidate", "fuzzy-only", "fallback-generation"]);
		expect(classifyRetrievalFailure(textOnly)).toEqual([]);
	});

	test("CAPTURE-02 creates interactive candidates for non-ZCode hosts without hook claims", async () => {
		const dir = temp();
		const resultPath = join(dir, "result.json");
		writeFileSync(resultPath, JSON.stringify(full));
		const output: string[] = [];
		const writes: Array<[string, string]> = [];
		const code = await runInteractiveCapture(
			[
				"--host",
				"codex",
				"--project-root",
				dir,
				"--repository",
				"owner/repo",
				"--query",
				"find regression",
				"--result-json",
				resultPath,
			],
			{
				now: () => new Date("2026-11-17T01:02:03.000Z"),
				readText: (path: string) => readFileSync(path, "utf8"),
				writeText: (path: string, text: string) => writes.push([path, text]),
				stdout: (text: string) => output.push(text),
			},
		);
		expect(code).toBe(0);
		expect(writes).toEqual([]);
		const preview = JSON.parse(output.join(""));
		expect(preview.host).toBe("codex");
		expect(preview.captureMode).toBe("interactive");
		expect(preview.signals.map((item: any) => item.kind)).toEqual(["fuzzy-only", "fallback-generation"]);
	});

	test("CAPTURE-03 freezes fuzzy and fallback structural rules", () => {
		const empty = normalizeStructuredSearchResult({ candidateCount: 0, results: [] });
		expect(classifyRetrievalFailure(empty)).toEqual(["zero-candidate"]);
		const mixed = normalizeStructuredSearchResult({
			candidateCount: 2,
			results: [{ channel: "fuzzy" }, { channel: "semantic" }],
		});
		expect(classifyRetrievalFailure(mixed)).toEqual([]);
		const missing = normalizeStructuredSearchResult({ candidateCount: 1, results: [{}] });
		expect(missing.disabledRules).toContain("fuzzy-only");
		expect(classifyRetrievalFailure(missing)).toEqual([]);
	});

	test("CAPTURE-04 builds sorted deduplicated candidate metadata only", () => {
		const value = buildCandidate({
			host: "zcode",
			captureMode: "automatic-hook",
			sourceProject: "owner/repo",
			toolName: "memorix_search",
			query: "find regression",
			capturedAt: "2026-11-17T01:02:03.000Z",
			normalized: normalizeStructuredSearchResult(full),
		});
		expect(value?.signals.map((item: any) => item.kind)).toEqual(["fuzzy-only", "fallback-generation"]);
		expect(value?.resultSummary.topN).toHaveLength(2);
		expect(value?.resultSummary.topN[0]).toEqual({
			ref: "obs:1",
			channel: "fuzzy",
			score: 0.2,
			matchedFields: ["title"],
		});
		expect(value?.query.redactedOriginal).toBe("find regression");
		expect(value?.query.sha256).toBe(sha("find regression"));
		expect(JSON.stringify(value)).not.toContain("observation body");
	});

	test("CAPTURE-05 writes deduplicated redacted candidates into ignored inbox", async () => {
		const dir = temp();
		const candidate = buildCandidate({
			host: "zcode",
			captureMode: "automatic-hook",
			sourceProject: "owner/repo",
			toolName: "memorix_search",
			query: "find regression",
			capturedAt: "2026-11-17T01:02:03.000Z",
			normalized: normalizeStructuredSearchResult(full),
		});
		expect(candidate).not.toBeNull();
		expect(await writeCandidate(dir, candidate!)).toBe(true);
		const storedPath = join(dir, ".memorix/golden-set/.local/inbox", `${candidate!.candidateId}.json`);
		const stored = JSON.parse(readFileSync(storedPath, "utf8"));
		expect(stored.schemaVersion).toBe("memorix-retrieval-candidate/v1");
		expect(stored.query.redactedOriginal).toBe("find regression");
		expect(stored.query.sha256).toBe(sha("find regression"));
		expect(JSON.stringify(stored)).not.toContain("observation body");
		expect(await writeCandidate(dir, candidate!)).toBe(false);
	});

	test("PERF-01 keeps warm capture core P95 below 100ms without network shell or workers", () => {
		for (let i = 0; i < 50; i++) classifyRetrievalFailure(normalizeStructuredSearchResult(full));
		const samples = Array.from({ length: 1000 }, () => {
			const start = performance.now();
			classifyRetrievalFailure(normalizeStructuredSearchResult(full));
			return performance.now() - start;
		}).sort((a, b) => a - b);
		expect(samples[Math.ceil(samples.length * 0.95) - 1]).toBeLessThan(100);
		const sources = [
			"src/golden-set/capture.mjs",
			"scripts/zcode-retrieval-capture.mjs",
			"templates/zcode/retrieval-capture-launcher.mjs",
		].map((p) =>
			readFileSync(resolve(import.meta.dirname, "../../ai-plugins/common-tools/skills/use-memorix", p), "utf8"),
		);
		for (const forbidden of ["node:child_process", "node:worker_threads", "fetch(", "memorix serve"])
			for (const source of sources) expect(source).not.toContain(forbidden);
	});
});
