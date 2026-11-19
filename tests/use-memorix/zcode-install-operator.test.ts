import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	applyZCodeInstall,
	planZCodeInstall,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/zcode-install.mjs";
import {
	acceptCandidate,
	cleanupCandidates,
	exportBundle,
	planGoldenSetInit,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/operator.mjs";

const dirs: string[] = [];
function temp() {
	const dir = mkdtempSync(join(tmpdir(), "zcode-install-"));
	dirs.push(dir);
	return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("ZCode install and golden set operator", () => {
	test("INSTALL-01 merges ZCode config and only auto-upgrades marked launcher", () => {
		const root = temp();
		const config = join(root, ".zcode/config.json");
		const launcher = join(root, ".zcode/hooks/use-memorix-retrieval.mjs");
		mkdirSync(join(root, ".zcode/hooks"), { recursive: true });
		writeFileSync(config, JSON.stringify({ custom: true, hooks: { enabled: true, events: { Stop: [] } } }));
		writeFileSync(launcher, "// user-owned\n");
		const blocked = planZCodeInstall(root);
		expect(blocked.blocked).toContain("launcher-marker-missing");
		expect(() => applyZCodeInstall(blocked, "INSTALL_ZCODE_RETRIEVAL_CAPTURE")).toThrow();
		writeFileSync(launcher, "// use-memorix:zcode-retrieval-launcher:v1\nold\n");
		const plan = planZCodeInstall(root);
		applyZCodeInstall(plan, "INSTALL_ZCODE_RETRIEVAL_CAPTURE");
		const merged = JSON.parse(readFileSync(config, "utf8"));
		expect(merged.custom).toBe(true);
		expect(merged.hooks.events.Stop).toEqual([]);
		expect(merged.hooks.events.PostToolUse).toHaveLength(1);
		expect(readFileSync(launcher, "utf8")).toContain("use-memorix:zcode-retrieval-launcher:v1");
	});

	test("INSTALL-02 previews golden set initialization without writing", () => {
		const root = temp();
		const plan = planGoldenSetInit({ projectRoot: root, repository: "owner/repo" });
		expect(plan.writes.map((item: any) => item.path)).toEqual([
			join(root, ".memorix/golden-set/README.md"),
			join(root, ".memorix/golden-set/cases.json"),
			join(root, ".gitignore"),
		]);
		expect(existsSync(join(root, ".memorix/golden-set/cases.json"))).toBe(false);
	});

	test("INSTALL-03 accepts only a rerun-backed candidate and exports no local hints", () => {
		const golden = acceptCandidate({
			goldenSet: { schemaVersion: "memorix-golden-set-case/v1", project: { repository: "owner/repo" }, cases: [] },
			candidate: { query: { redactedOriginal: "find shim" }, signals: [{ kind: "zero-candidate" }] },
			rerun: { query: "find shim", structuredContent: { candidateCount: 1, results: [{ ref: "obs:1" }] } },
			expected: { mustMatch: [{ titleIncludes: ["shim"] }] },
			id: "shim-regression",
			capturedAt: "2026-11-17T01:02:03.000Z",
		});
		expect(golden.cases).toHaveLength(1);
		const bundle = exportBundle({
			goldenSet: golden,
			caseId: "shim-regression",
			projectId: "p1",
			sourceCommit: "a".repeat(40),
			exportedAt: "2026-11-17T02:03:04.000Z",
		});
		expect(JSON.stringify(bundle)).not.toContain("localHints");
		expect(JSON.stringify(bundle)).not.toContain("observationIds");
	});

	test("INSTALL-04 previews retention cleanup limited to 30 days and 500 candidates", () => {
		const now = "2026-12-17T00:00:00.000Z";
		const expired = Array.from({ length: 520 }, (_, index) => ({
			path: `expired-${index}.json`,
			capturedAt: "2026-11-17T00:00:00.000Z",
		}));
		const fresh = { path: "fresh.json", capturedAt: "2026-12-16T00:00:00.000Z" };
		const plan = cleanupCandidates({ now, candidates: [...expired, fresh] });
		expect(plan.requiresConfirmation).toBe(true);
		expect(plan.remove).toHaveLength(500);
		expect(plan.keep).toContain("fresh.json");
		expect(plan.remove).not.toContain("fresh.json");
		expect(cleanupCandidates({ now, candidates: [fresh] }).remove).toEqual([]);
	});
});
