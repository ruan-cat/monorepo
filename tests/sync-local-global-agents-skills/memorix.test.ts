import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, test } from "vitest";

import {
	getMetadataPath,
	loadMetadata,
	pickLatestLocalSource,
	refreshMemorixSkills,
	saveMetadata,
	scanLocalSources,
	sha256,
	LOCAL_SOURCE_CANDIDATES,
	META_FILE,
} from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix";
import type {
	LocalSourceEntry,
	MemorixMetadata,
} from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** 测试中创建的临时目录，由 afterEach 统一清理 */
const tempDirs: string[] = [];

/**
 * 在系统临时目录中创建以 prefix 开头的唯一子目录。
 * 自动加入清理列表。
 */
function createTempDir(prefix: string): string {
	const dir = mkdtempSync(path.join(tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of tempDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	tempDirs.length = 0;
});

// ---------------------------------------------------------------------------
// sha256
// ---------------------------------------------------------------------------

describe("sha256", () => {
	test("generates consistent hash", () => {
		const input = "hello world";
		const hash1 = sha256(input);
		const hash2 = sha256(input);
		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(64);
		expect(hash1).toMatch(/^[0-9a-f]{64}$/);
	});

	test("different content produces different hash", () => {
		const hash1 = sha256("hello");
		const hash2 = sha256("world");
		expect(hash1).not.toBe(hash2);
	});

	test("Buffer and string yield same hash for identical content", () => {
		const content = "consistent test";
		const hash1 = sha256(content);
		const hash2 = sha256(Buffer.from(content, "utf-8"));
		expect(hash1).toBe(hash2);
	});
});

// ---------------------------------------------------------------------------
// getMetadataPath
// ---------------------------------------------------------------------------

describe("getMetadataPath", () => {
	test("returns path under ~/.memorix/memorix-skills/", () => {
		const metaPath = getMetadataPath();
		expect(metaPath).toContain(".memorix");
		expect(metaPath).toContain("memorix-skills");
		expect(metaPath).toContain("memorix-meta.json");
	});

	test("path starts with homedir", () => {
		const metaPath = getMetadataPath();
		const home = homedir();
		expect(metaPath.startsWith(home)).toBe(true);
	});

	test("creates metadata directory if it does not exist", () => {
		const metaPath = getMetadataPath();
		const dir = path.dirname(metaPath);
		expect(existsSync(dir)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// loadMetadata / saveMetadata
// ---------------------------------------------------------------------------

describe("loadMetadata / saveMetadata", () => {
	// 备份现有元数据，测试结束后恢复
	const existingMeta = loadMetadata();
	const existingMetaRaw = existsSync(META_FILE) ? readFileSync(META_FILE) : null;

	afterAll(() => {
		// 恢复原始元数据
		if (existingMetaRaw) {
			writeFileSync(META_FILE, existingMetaRaw);
		} else if (existsSync(META_FILE)) {
			rmSync(META_FILE);
		}
	});

	const sampleMeta: MemorixMetadata = {
		version: "1.0.0",
		lastRefreshAt: new Date().toISOString(),
		source: "local",
		agent: "cursor",
		skills: {
			"memorix-test-metadata": {
				sourceSha256: sha256("test-content"),
				localSha256: sha256("test-content"),
				updatedAt: new Date().toISOString(),
				source: "local",
			},
		},
	};

	test("saves and loads metadata correctly", () => {
		saveMetadata(sampleMeta);
		const loaded = loadMetadata();
		expect(loaded).toBeDefined();
		expect(loaded!.version).toBe("1.0.0");
		expect(loaded!.source).toBe("local");
		expect(loaded!.agent).toBe("cursor");
		expect(Object.keys(loaded!.skills)).toHaveLength(1);
		expect(loaded!.skills["memorix-test-metadata"].sourceSha256).toBe(sha256("test-content"));
	});

	test("returns undefined for missing metadata file", () => {
		// 删除元数据文件（如果存在）
		if (existsSync(META_FILE)) {
			rmSync(META_FILE);
		}
		// 目录仍存在（由 getMetadataPath 创建），但文件不存在
		const result = loadMetadata();
		expect(result).toBeUndefined();
	});

	test("JSON saved by saveMetadata contains expected fields", () => {
		saveMetadata(sampleMeta);
		const raw = readFileSync(META_FILE, "utf-8");
		const parsed = JSON.parse(raw) as MemorixMetadata;
		expect(parsed.version).toBe("1.0.0");
		expect(parsed.skills).toBeDefined();
		expect(typeof parsed.lastRefreshAt).toBe("string");
	});
});

// ---------------------------------------------------------------------------
// scanLocalSources
// ---------------------------------------------------------------------------

describe("scanLocalSources", () => {
	test("returns an array of LocalSourceEntry objects", () => {
		const sources = scanLocalSources();
		expect(Array.isArray(sources)).toBe(true);
		for (const s of sources) {
			expect(typeof s.path).toBe("string");
			expect(typeof s.mtime).toBe("number");
			expect(typeof s.skillCount).toBe("number");
			expect(s.mtime).toBeGreaterThanOrEqual(0);
			expect(s.skillCount).toBeGreaterThanOrEqual(0);
		}
	});

	test("results are sorted by mtime descending", () => {
		const sources = scanLocalSources();
		for (let i = 1; i < sources.length; i++) {
			expect(sources[i].mtime).toBeLessThanOrEqual(sources[i - 1].mtime);
		}
	});
});

// ---------------------------------------------------------------------------
// pickLatestLocalSource
// ---------------------------------------------------------------------------

describe("pickLatestLocalSource", () => {
	test("returns first valid entry (caller is responsible for sorting by mtime)", () => {
		const sources: LocalSourceEntry[] = [
			{ path: "/path/new", mtime: 3000, skillCount: 2 },
			{ path: "/path/mid", mtime: 2000, skillCount: 5 },
			{ path: "/path/old", mtime: 1000, skillCount: 3 },
		];
		expect(pickLatestLocalSource(sources)).toBe("/path/new");
	});

	test("returns undefined when input array is empty", () => {
		expect(pickLatestLocalSource([])).toBeUndefined();
	});

	test("returns undefined when all entries have zero skillCount", () => {
		const sources: LocalSourceEntry[] = [
			{ path: "/path/a", mtime: 1000, skillCount: 0 },
			{ path: "/path/b", mtime: 2000, skillCount: 0 },
		];
		expect(pickLatestLocalSource(sources)).toBeUndefined();
	});

	test("skips entries with zero skillCount and picks the latest valid one", () => {
		const sources: LocalSourceEntry[] = [
			{ path: "/path/zero", mtime: 9999, skillCount: 0 },
			{ path: "/path/valid-new", mtime: 3000, skillCount: 2 },
			{ path: "/path/valid-old", mtime: 1000, skillCount: 5 },
		];
		expect(pickLatestLocalSource(sources)).toBe("/path/valid-new");
	});
});

// ---------------------------------------------------------------------------
// refreshMemorixSkills
// ---------------------------------------------------------------------------

describe("refreshMemorixSkills", () => {
	// 使用 .codex 候选目录（索引 1），最不易与既有配置冲突
	const codexSkillsDir = LOCAL_SOURCE_CANDIDATES[1];
	const testSkillName = "memorix-test-unit-refresh";

	/**
	 * 在 .codex 候选目录中创建测试用 memorix skill，
	 * 并返回清理函数。
	 */
	function setupTestLocalSource(): () => void {
		mkdirSync(codexSkillsDir, { recursive: true });
		const skillDir = path.join(codexSkillsDir, testSkillName);
		if (existsSync(skillDir)) {
			rmSync(skillDir, { recursive: true, force: true });
		}
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(path.join(skillDir, "SKILL.md"), "# Refresh Test Skill\n");
		return () => {
			rmSync(skillDir, { recursive: true, force: true });
			// 仅在目录完全为空时才移除候选目录
			if (existsSync(codexSkillsDir)) {
				try {
					if (readdirSync(codexSkillsDir).length === 0) {
						rmSync(codexSkillsDir, { recursive: true, force: true });
					}
				} catch {
					// 忽略清理错误
				}
			}
		};
	}

	test("dryRun does not write files to target directory", async () => {
		const cleanupSource = setupTestLocalSource();
		const targetDir = createTempDir("target-");

		const results = await refreshMemorixSkills({
			targetDir,
			source: "local",
			dryRun: true,
		});

		expect(results).toBeDefined();
		expect(results.length).toBeGreaterThanOrEqual(1);

		// 每个结果都应标记有 skill / status 字段
		for (const r of results) {
			expect(typeof r.skill).toBe("string");
			expect(["skipped", "created", "updated", "error"]).toContain(r.status);
		}

		// 目标目录不应有任何文件写入
		const targetEntries = existsSync(targetDir) ? readdirSync(targetDir) : [];
		expect(targetEntries).toHaveLength(0);

		cleanupSource();
	});

	test("creates skills in target directory", async () => {
		// 备份现有元数据
		const existingMetaRaw = existsSync(META_FILE) ? readFileSync(META_FILE) : null;

		const cleanupSource = setupTestLocalSource();
		const targetDir = createTempDir("target-");

		try {
			const results = await refreshMemorixSkills({
				targetDir,
				source: "local",
			});

			// 验证目标目录中创建了 skill 文件
			const targetSkillDir = path.join(targetDir, testSkillName);
			expect(existsSync(targetSkillDir)).toBe(true);

			const skillMd = path.join(targetSkillDir, "SKILL.md");
			expect(existsSync(skillMd)).toBe(true);
			expect(readFileSync(skillMd, "utf-8")).toContain("# Refresh Test Skill");

			// 结果中应包含该 skill 的 created 记录
			const created = results.some((r) => r.status === "created" && r.skill === testSkillName);
			expect(created).toBe(true);
		} finally {
			cleanupSource();
			// 恢复元数据
			if (existingMetaRaw) {
				writeFileSync(META_FILE, existingMetaRaw);
			} else if (existsSync(META_FILE)) {
				rmSync(META_FILE);
			}
		}
	});
});
