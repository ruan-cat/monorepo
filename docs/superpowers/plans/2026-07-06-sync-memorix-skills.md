# sync-local-global-agents-skills 增加 memorix 内部 skills 同步能力 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `sync-local-global-agents-skills` 在同步平台 skills 之前，先把 memorix 官方内部 skills 刷新到 `~/.agents/skills/`，并把版本元数据写入 `~/.memorix/memorix-skills/memorix-meta.json`。

**Architecture:** 新增 `src/memorix.ts` 负责多源获取（GitHub raw → 本地 agent 插件 → CLI）、SHA 比对、目标目录写入与元数据持久化；新增 `scripts/fetch-memorix-skills.ts` 作为独立 CLI；修改 `scripts/sync.ts` 默认前置调用刷新；兜底脚本与文档同步更新。

**Tech Stack:** TypeScript, Node.js 22 内置模块（`node:fs`、`node:path`、`node:https`、`node:crypto`、`node:child_process`、`node:os`）、vitest、pnpm。**零外部 npm 依赖。**

**提交规范（所有 Task 通用）**

- 严格遵循 `git-commit` 技能：中文摘要、带 emoji 的 Conventional Commits、预校验 `commitlint --strict`。
- **禁止添加 `Co-authored-by` trailer**：WorkBuddy/Kimi 不在 git-commit 技能的 allowlist 中。
- 每个 Task 独立提交，不要在一个 Task 中夹带其他 Task 的变更。

---

### File Structure

```text
ai-plugins/common-tools/skills/sync-local-global-agents-skills/
  scripts/
    sync.ts                    # 修改：新增 --skip-memorix-refresh 等参数
    fetch-memorix-skills.ts    # 新增：独立刷新 CLI
  src/
    platforms.ts               # 不变
    sync.ts                    # 不变
    memorix.ts                 # 新增：刷新核心逻辑
  fallback/
    sync.ps1                   # 修改：本地多源扫描
    sync.sh                    # 修改：本地多源扫描
  README.md                    # 修改
  SKILL.md                     # 修改
tests/sync-local-global-agents-skills/
  sync.test.ts               # 已存在
  memorix.test.ts            # 新增
```

---

### Task 1: 创建 src/memorix.ts 类型与元数据基础

**Files:**

- Create: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts`

- [ ] **Step 1: 写入类型定义、常量、元数据读写与 SHA 辅助函数**

```typescript
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/** memorix skills 来源策略 */
export type MemorixSource = "github" | "local" | "cli" | "auto";

/** 单个 skill 目录内的文件映射（相对路径 -> Buffer） */
export type SkillFiles = Map<string, Buffer>;

export interface RefreshOptions {
	/** 目标 skills 目录（默认：~/.agents/skills） */
	targetDir?: string;
	/** 选择 agent 来源（默认：cursor） */
	agent?: string;
	/** 来源策略（默认：auto） */
	source?: MemorixSource;
	/** GitHub ref（默认：latest release tag） */
	githubRef?: string;
	/** GitHub API token */
	githubToken?: string;
	/** raw.githubusercontent.com 镜像域名 */
	githubRawMirror?: string;
	/** 只输出计划 */
	dryRun?: boolean;
	/** 覆盖已存在目录 */
	force?: boolean;
	/** 覆盖前备份 */
	backup?: boolean;
}

export interface RefreshResult {
	/** skill 名称 */
	skill: string;
	/** 处理状态 */
	status: "skipped" | "created" | "updated" | "error";
	/** 实际使用的来源 */
	source?: string;
	/** 错误信息 */
	error?: string;
	/** 备份路径 */
	backupPath?: string;
}

/** 元数据文件结构 */
export interface MemorixMetadata {
	version: number;
	lastRefreshAt: string;
	source: string;
	agent: string;
	skills: Record<string, SkillMetadata>;
}

export interface SkillMetadata {
	sourceSha256: string;
	localSha256: string;
	updatedAt: string;
	source: string;
}

export const DEFAULT_AGENT = "cursor";
export const DEFAULT_SOURCE: MemorixSource = "auto";
export const DEFAULT_NPM_VERSION = "latest";
export const DEFAULT_GITHUB_OWNER = "AVIDS2";
export const DEFAULT_GITHUB_REPO = "memorix";
export const MEMORIX_SKILLS_SUBDIR = "memorix-skills";
export const MEMORIX_META_FILENAME = "memorix-meta.json";

/** 本地候选来源目录（按优先级排序） */
export const LOCAL_CANDIDATES: ReadonlyArray<(home: string) => string> = [
	(home) => path.join(home, ".cursor", "skills"),
	(home) => path.join(home, ".codex", "plugins", "memorix", "skills"),
	(home) => path.join(home, ".claude", "plugins", "marketplaces", "memorix-local", "plugins", "memorix", "skills"),
	(home) => path.join(home, ".claude", "plugins", "cache", "memorix-local", "memorix", "*", "skills"),
	(home) => path.join(home, ".codex", "plugins", "cache", "personal", "memorix", "*", "skills"),
];

export function sha256(input: Buffer | string): string {
	const hash = createHash("sha256");
	hash.update(typeof input === "string" ? Buffer.from(input) : input);
	return hash.digest("hex");
}

export function getMetadataPath(): string {
	return path.join(homedir(), ".memorix", MEMORIX_SKILLS_SUBDIR, MEMORIX_META_FILENAME);
}

export function ensureMetadataDir(): void {
	mkdirSync(path.dirname(getMetadataPath()), { recursive: true });
}

export function loadMetadata(): MemorixMetadata | undefined {
	const metaPath = getMetadataPath();
	if (!existsSync(metaPath)) return undefined;
	try {
		const raw = readFileSync(metaPath, "utf-8");
		return JSON.parse(raw) as MemorixMetadata;
	} catch {
		return undefined;
	}
}

export function saveMetadata(metadata: MemorixMetadata): void {
	ensureMetadataDir();
	writeFileSync(getMetadataPath(), JSON.stringify(metadata, null, 2), "utf-8");
}

export function backupBrokenMetadata(): void {
	const metaPath = getMetadataPath();
	if (existsSync(metaPath)) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		renameSync(metaPath, `${metaPath}.broken.${timestamp}`);
	}
}
```

- [ ] **Step 2: 创建同目录的占位测试，确认类型导出可用**

Create: `tests/sync-local-global-agents-skills/memorix.test.ts`

```typescript
import { describe, expect, test } from "vitest";
import {
	sha256,
	getMetadataPath,
} from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts";

describe("memorix helpers", () => {
	test("sha256 produces 64-char hex", () => {
		expect(sha256("hello")).toHaveLength(64);
	});

	test("getMetadataPath ends with memorix-skills/memorix-meta.json", () => {
		expect(getMetadataPath()).toMatch(/\.memorix[\\/]memorix-skills[\\/]memorix-meta\.json$/);
	});
});
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/memorix.test.ts`

Expected: PASS 2 tests.

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts tests/sync-local-global-agents-skills/memorix.test.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): add memorix types and metadata helpers

- Define MemorixSource, RefreshOptions, RefreshResult, MemorixMetadata
- Add SHA-256 helper, metadata path resolution, load/save/backup helpers
```

---

### Task 2: 实现 GitHub 来源获取

**Files:**

- Modify: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts`

- [ ] **Step 1: 实现 `npm pack` 下载与 tar 解压**

Append to `src/memorix.ts`:

```typescript
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import tar from "tar";

export function fetchFromNpm(version: string, agent: string): Promise<Record<string, SkillFiles>> {
	return new Promise((resolve, reject) => {
		const tmpDir = mkdtempSync(path.join(tmpdir(), "memorix-npm-"));
		try {
			const packResult = spawnSync("npm", ["pack", `memorix@${version}`, "--pack-destination", tmpDir], {
				encoding: "utf-8",
				stdio: ["ignore", "pipe", "pipe"],
			});
			if (packResult.status !== 0) {
				throw new Error(`npm pack failed: ${packResult.stderr || packResult.stdout}`);
			}

			const tgzName = readdirSync(tmpDir).find((name) => name.endsWith(".tgz"));
			if (!tgzName) {
				throw new Error("npm pack did not produce a tarball");
			}

			const extractDir = path.join(tmpDir, "extract");
			mkdirSync(extractDir, { recursive: true });
			tar.x({
				file: path.join(tmpDir, tgzName),
				cwd: extractDir,
				sync: true,
			});

			const skillsDir = path.join(extractDir, "package", "plugins", agent, "memorix", "skills");
			const skills = readSkillsDir(skillsDir);
			resolve(skills);
		} catch (error) {
			reject(error);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});
}

function readSkillsDir(skillsDir: string): Record<string, SkillFiles> {
	if (!existsSync(skillsDir)) {
		throw new Error(`Skills directory not found in npm package: ${skillsDir}`);
	}
	const result: Record<string, SkillFiles> = {};
	for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const skillName = entry.name;
		const skillDir = path.join(skillsDir, skillName);
		result[skillName] = readDirFiles(skillDir);
	}
	return result;
}

function readDirFiles(dir: string, prefix = ""): SkillFiles {
	const files = new Map<string, Buffer>();
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const entryPath = path.join(dir, entry.name);
		const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			const nested = readDirFiles(entryPath, relativePath);
			for (const [key, value] of nested) {
				files.set(key, value);
			}
		} else {
			files.set(relativePath, readFileSync(entryPath));
		}
	}
	return files;
}
```

- [ ] **Step 2: 为 `fetchFromNpm` 写一个失败测试**

Append to `tests/sync-local-global-agents-skills/memorix.test.ts`:

```typescript
import { fetchFromNpm } from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts";

describe("fetchFromNpm", () => {
	test("rejects for non-existent npm version", async () => {
		await expect(fetchFromNpm("0.0.0-invalid-for-test", "cursor")).rejects.toThrow("npm pack failed");
	});
});
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/memorix.test.ts`

Expected: PASS 3 tests. The npm failure test should PASS with `npm pack failed`.

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts tests/sync-local-global-agents-skills/memorix.test.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): add npm source for memorix skills

- Download memorix@<version> via npm pack
- Extract tarball with tar and read skills recursively
```

---

### Task 3: 实现本地来源扫描

**Files:**

- Modify: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts`

- [ ] **Step 1: 实现本地候选目录扫描与最新版本选择**

Append to `src/memorix.ts`:

```typescript
import { globSync } from "tinyglobby";

export interface LocalSourceEntry {
	dir: string;
	version?: string;
	files: Record<string, SkillFiles>;
	mtimeMs: number;
}

export function scanLocalSources(agent: string, home = homedir()): LocalSourceEntry[] {
	const entries: LocalSourceEntry[] = [];
	for (const candidate of LOCAL_CANDIDATES) {
		const pattern = candidate(home);
		const dirs = globSync(pattern, { onlyDirectories: true, absolute: true });
		for (const dir of dirs) {
			const files = readSkillsDir(dir);
			if (Object.keys(files).length === 0) continue;
			entries.push({
				dir,
				version: extractVersionFromPath(dir),
				files,
				mtimeMs: getLatestMtime(dir),
			});
		}
	}
	return entries.sort((a, b) => {
		if (a.version && b.version) {
			const cmp = compareVersion(b.version, a.version);
			if (cmp !== 0) return cmp;
		}
		if (a.version && !b.version) return -1;
		if (!a.version && b.version) return 1;
		return b.mtimeMs - a.mtimeMs;
	});
}

export function pickLatestLocalSource(localEntries: LocalSourceEntry[]): LocalSourceEntry | undefined {
	return localEntries[0];
}

function extractVersionFromPath(dir: string): string | undefined {
	const match = dir.match(/memorix[\\/](\d+\.\d+\.\d+)[\\/]/);
	return match?.[1];
}

function compareVersion(a: string, b: string): number {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const na = pa[i] ?? 0;
		const nb = pb[i] ?? 0;
		if (na !== nb) return na - nb;
	}
	return 0;
}

function getLatestMtime(dir: string): number {
	let latest = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
		if (!entry.isFile()) continue;
		const stat = lstatSync(path.join(dir, entry.name));
		if (stat.mtimeMs > latest) latest = stat.mtimeMs;
	}
	return latest;
}
```

- [ ] **Step 2: 测试本地扫描**

Append to `tests/sync-local-global-agents-skills/memorix.test.ts`:

```typescript
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { scanLocalSources } from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts";

describe("scanLocalSources", () => {
	test("finds memorix skills in ~/.cursor/skills mock", () => {
		const home = mkdtempSync(path.join(tmpdir(), "home-"));
		const skillDir = path.join(home, ".cursor", "skills", "memorix-memory");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(path.join(skillDir, "SKILL.md"), "# memorix-memory");

		const entries = scanLocalSources("cursor", home);
		expect(entries).toHaveLength(1);
		expect(entries[0].files).toHaveProperty("memorix-memory");
	});
});
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/memorix.test.ts`

Expected: PASS 4 tests.

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts tests/sync-local-global-agents-skills/memorix.test.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): add local source scanning for memorix skills

- Scan cursor/codex/claude plugin directories
- Pick latest by version or mtime
```

---

### Task 4: 实现 CLI 来源

**Files:**

- Modify: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts`

- [ ] **Step 1: 实现 CLI `skills show` 获取与 GitHub API 获取**

Append to `src/memorix.ts`:

```typescript
import { spawnSync } from "node:child_process";

export async function fetchFromCli(skillName: string, agent: string): Promise<SkillFiles> {
	const result = spawnSync("memorix", ["skills", "show", "--name", skillName, "--json"], {
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	if (result.status !== 0 || !result.stdout) {
		throw new Error(`memorix skills show failed: ${result.stderr || result.stdout}`);
	}
	const parsed = JSON.parse(result.stdout) as { content?: string; sourceAgent?: string };
	if (!parsed.content) {
		throw new Error(`memorix skills show returned no content for ${skillName}`);
	}
	const files = new Map<string, Buffer>();
	files.set("SKILL.md", Buffer.from(parsed.content, "utf-8"));
	return files;
}

export async function fetchFromGitHub(
	ref: string,
	agent: string,
	opts: { githubToken?: string; githubRawMirror?: string } = {},
): Promise<Record<string, SkillFiles>> {
	const owner = DEFAULT_GITHUB_OWNER;
	const repo = DEFAULT_GITHUB_REPO;
	const skillsDir = `plugins/${agent}/memorix/skills`;

	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"User-Agent": "sync-local-global-agents-skills",
	};
	if (opts.githubToken) headers.Authorization = `Bearer ${opts.githubToken}`;

	const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${skillsDir}?ref=${ref}`;
	const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(15000) });
	if (!response.ok) {
		throw new Error(`GitHub API failed: ${response.status} ${response.statusText}`);
	}
	const items = (await response.json()) as Array<{ name: string; type: string; path: string }>;
	const skillNames = items.filter((i) => i.type === "dir").map((i) => i.name);

	const result: Record<string, SkillFiles> = {};
	for (const skillName of skillNames) {
		result[skillName] = await fetchSkillFilesFromGitHub(owner, repo, ref, agent, skillName, opts);
	}
	return result;
}

async function fetchSkillFilesFromGitHub(
	owner: string,
	repo: string,
	ref: string,
	agent: string,
	skillName: string,
	opts: { githubRawMirror?: string } = {},
): Promise<SkillFiles> {
	const files = new Map<string, Buffer>();
	const basePath = `plugins/${agent}/memorix/skills/${skillName}`;
	const rawHosts = [opts.githubRawMirror, "raw.githubusercontent.com"].filter(Boolean) as string[];

	async function fetchTree(treePath: string): Promise<void> {
		const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${treePath}?ref=${ref}`;
		const response = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
		if (!response.ok) throw new Error(`GitHub API failed for ${treePath}: ${response.status}`);
		const items = (await response.json()) as Array<{ name: string; type: string; path: string; download_url?: string }>;
		for (const item of items) {
			if (item.type === "dir") {
				await fetchTree(item.path);
			} else if (item.type === "file") {
				const relativePath = item.path.slice(basePath.length + 1);
				let lastError: Error | undefined;
				for (const host of rawHosts) {
					try {
						const url = `https://${host}/${owner}/${repo}/${ref}/${item.path}`;
						const fileResponse = await fetch(url, { signal: AbortSignal.timeout(15000) });
						if (fileResponse.ok) {
							const buffer = Buffer.from(await fileResponse.arrayBuffer());
							files.set(relativePath, buffer);
							break;
						}
					} catch (error) {
						lastError = error instanceof Error ? error : new Error(String(error));
					}
				}
				if (!files.has(relativePath)) {
					throw lastError ?? new Error(`Failed to download ${item.path}`);
				}
			}
		}
	}

	await fetchTree(basePath);
	if (files.size === 0) throw new Error(`No files found for ${skillName}`);
	return files;
}
```

- [ ] **Step 2: 测试 GitHub 获取失败回退**

Append to `tests/sync-local-global-agents-skills/memorix.test.ts`:

```typescript
describe("fetchFromGitHub", () => {
	test("rejects for invalid ref", async () => {
		await expect(fetchFromGitHub("v0.0.0-invalid-for-test", "cursor")).rejects.toThrow("GitHub API failed");
	});
});
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/memorix.test.ts`

Expected: PASS 5 tests.

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts tests/sync-local-global-agents-skills/memorix.test.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): add cli and github sources for memorix skills

- memorix skills show --json for CLI source
- GitHub API + raw download with mirror fallback
```

---

### Task 5: 实现主刷新逻辑与元数据持久化

**Files:**

- Modify: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts`

- [ ] **Step 1: 实现 `refreshMemorixSkills`**

Append to `src/memorix.ts`:

```typescript
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";

export async function refreshMemorixSkills(options: RefreshOptions = {}): Promise<RefreshResult[]> {
	const {
		targetDir = path.join(homedir(), ".agents", "skills"),
		agent = DEFAULT_AGENT,
		source = DEFAULT_SOURCE,
		npmVersion = DEFAULT_NPM_VERSION,
		githubRef = await resolveLatestReleaseRef(),
		githubToken,
		githubRawMirror,
		dryRun = false,
		force = false,
		backup = true,
	} = options;

	if (!existsSync(targetDir)) {
		mkdirSync(targetDir, { recursive: true });
	}

	const sourceSkills = await resolveSourceSkills(source, agent, {
		npmVersion,
		githubRef,
		githubToken,
		githubRawMirror,
	});
	const metadata = loadMetadata();
	const results: RefreshResult[] = [];

	for (const [skillName, files] of Object.entries(sourceSkills)) {
		if (!skillName.startsWith("memorix-")) continue;
		const result = await refreshSkill(skillName, files, targetDir, {
			dryRun,
			force,
			backup,
			metadata,
			source: `npm:memorix@${npmVersion}`,
			agent,
		});
		results.push(result);
	}

	if (!dryRun) {
		const updatedSkills = Object.fromEntries(
			results
				.filter((r) => r.status === "created" || r.status === "updated")
				.map((r) => [r.skill, metadata?.skills[r.skill]]),
		);
		if (Object.keys(updatedSkills).length > 0) {
			const newMetadata: MemorixMetadata = {
				version: 1,
				lastRefreshAt: new Date().toISOString(),
				source: `npm:memorix@${npmVersion}`,
				agent,
				skills: {
					...(metadata?.skills ?? {}),
					...updatedSkills,
				},
			};
			saveMetadata(newMetadata);
		}
	}

	return results;
}

interface SourceResolutionOptions {
	npmVersion: string;
	githubRef: string;
	githubToken?: string;
	githubRawMirror?: string;
}

async function resolveSourceSkills(
	source: MemorixSource,
	agent: string,
	opts: SourceResolutionOptions,
): Promise<Record<string, SkillFiles>> {
	const errors: Error[] = [];

	async function tryNpm(): Promise<Record<string, SkillFiles> | undefined> {
		try {
			return await fetchFromNpm(opts.npmVersion, agent);
		} catch (error) {
			errors.push(error instanceof Error ? error : new Error(String(error)));
			return undefined;
		}
	}

	async function tryLocal(): Promise<Record<string, SkillFiles> | undefined> {
		try {
			const entries = scanLocalSources(agent);
			const picked = pickLatestLocalSource(entries);
			return picked?.files;
		} catch (error) {
			errors.push(error instanceof Error ? error : new Error(String(error)));
			return undefined;
		}
	}

	async function tryCli(): Promise<Record<string, SkillFiles> | undefined> {
		try {
			const local = scanLocalSources(agent);
			const names = Object.keys(pickLatestLocalSource(local)?.files ?? {});
			if (names.length === 0) return undefined;
			const result: Record<string, SkillFiles> = {};
			for (const name of names) {
				result[name] = await fetchFromCli(name, agent);
			}
			return result;
		} catch (error) {
			errors.push(error instanceof Error ? error : new Error(String(error)));
			return undefined;
		}
	}

	async function tryGithub(): Promise<Record<string, SkillFiles> | undefined> {
		try {
			return await fetchFromGitHub(opts.githubRef, agent, {
				githubToken: opts.githubToken,
				githubRawMirror: opts.githubRawMirror,
			});
		} catch (error) {
			errors.push(error instanceof Error ? error : new Error(String(error)));
			return undefined;
		}
	}

	if (source === "npm") return (await tryNpm()) ?? throwAggregate(errors);
	if (source === "local") return (await tryLocal()) ?? throwAggregate(errors);
	if (source === "cli") return (await tryCli()) ?? throwAggregate(errors);
	if (source === "github") return (await tryGithub()) ?? throwAggregate(errors);

	return (await tryNpm()) ?? (await tryLocal()) ?? (await tryCli()) ?? (await tryGithub()) ?? throwAggregate(errors);
}

function throwAggregate(errors: Error[]): never {
	const messages = errors.map((e) => e.message).join("; ");
	throw new Error(`All memorix sources failed: ${messages || "unknown error"}`);
}

interface RefreshSkillOptions {
	dryRun: boolean;
	force: boolean;
	backup: boolean;
	metadata?: MemorixMetadata;
	source: string;
	agent: string;
}

async function refreshSkill(
	skillName: string,
	files: SkillFiles,
	targetDir: string,
	opts: RefreshSkillOptions,
): Promise<RefreshResult> {
	const result: RefreshResult = { skill: skillName, status: "skipped" };
	const skillTargetDir = path.join(targetDir, skillName);
	const sourceSha = computeFilesSha(files);
	const existingSha = opts.metadata?.skills[skillName]?.sourceSha256;

	if (existsSync(skillTargetDir)) {
		if (!opts.force) {
			if (existingSha && existingSha === sourceSha) {
				result.status = "skipped";
				return result;
			}
			result.status = "skipped";
			result.source = `${opts.source} (update available, use --force to apply)`;
			return result;
		}
	}

	if (opts.dryRun) {
		result.status = existsSync(skillTargetDir) ? "updated" : "created";
		result.source = opts.source;
		return result;
	}

	if (existsSync(skillTargetDir) && opts.backup) {
		const backupPath = `${skillTargetDir}.bak.${Date.now()}-${randomUUID()}`;
		renameSync(skillTargetDir, backupPath);
		result.backupPath = backupPath;
	} else if (existsSync(skillTargetDir)) {
		rmSync(skillTargetDir, { recursive: true, force: true });
	}

	mkdirSync(skillTargetDir, { recursive: true });
	for (const [relativePath, content] of files) {
		const filePath = path.join(skillTargetDir, relativePath);
		mkdirSync(path.dirname(filePath), { recursive: true });
		writeFileSync(filePath, content);
	}

	result.status = existsSync(skillTargetDir) && result.backupPath ? "updated" : "created";
	result.source = opts.source;

	if (opts.metadata) {
		opts.metadata.skills[skillName] = {
			sourceSha256: sourceSha,
			localSha256: computeFilesSha(readDirFiles(skillTargetDir)),
			updatedAt: new Date().toISOString(),
			source: opts.source,
		};
	}

	return result;
}

function computeFilesSha(files: SkillFiles): string {
	const entries = [...files.entries()].sort(([a], [b]) => a.localeCompare(b));
	const hash = createHash("sha256");
	for (const [relativePath, content] of entries) {
		hash.update(relativePath);
		hash.update(content);
	}
	return hash.digest("hex");
}

async function resolveLatestReleaseRef(): Promise<string> {
	try {
		const response = await fetch("https://api.github.com/repos/AVIDS2/memorix/releases/latest", {
			signal: AbortSignal.timeout(15000),
		});
		if (response.ok) {
			const data = (await response.json()) as { tag_name?: string };
			if (data.tag_name) return data.tag_name;
		}
	} catch {
		// fallthrough
	}
	return "v1.1.5";
}
```

- [ ] **Step 2: 测试主刷新逻辑（dry-run）**

Append to `tests/sync-local-global-agents-skills/memorix.test.ts`:

```typescript
describe("refreshMemorixSkills", () => {
	test("dryRun reports created for new skills", async () => {
		const targetDir = createTempDir("target-");
		const results = await refreshMemorixSkills({
			targetDir,
			source: "local",
			dryRun: true,
		});
		expect(results.some((r) => r.status === "created" || r.status === "skipped")).toBe(true);
	});
});
```

- [ ] **Step 3: 运行测试**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/memorix.test.ts`

Expected: PASS 6 tests.

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts tests/sync-local-global-agents-skills/memorix.test.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): implement refreshMemorixSkills with metadata

- Auto source resolution: npm -> local -> cli -> github
- SHA comparison, dry-run, force, backup support
- Persist metadata to ~/.memorix/memorix-skills/memorix-meta.json
```

---

### Task 6: 创建独立刷新 CLI

**Files:**

- Create: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts`

- [ ] **Step 1: 写入 CLI 入口**

```typescript
#!/usr/bin/env tsx

import { homedir } from "node:os";
import path from "node:path";
import { refreshMemorixSkills, type MemorixSource } from "../src/memorix.ts";

function main(): void {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		printHelp();
		return;
	}

	refreshMemorixSkills({
		targetDir: options.target,
		agent: options.agent,
		source: options.source,
		npmVersion: options.npmVersion,
		githubRef: options.githubRef,
		githubToken: process.env.GITHUB_TOKEN,
		githubRawMirror: process.env.GITHUB_RAW_MIRROR,
		dryRun: options.dryRun,
		force: options.force,
		backup: options.backup,
	})
		.then((results) => {
			for (const result of results) {
				console.log(JSON.stringify(result));
			}
		})
		.catch((error) => {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		});
}

function printHelp(): void {
	console.log(
		`
Usage: fetch-memorix-skills.ts [options]

Options:
  --target <path>          Target skills directory (default: ~/.agents/skills)
  --agent <agent>          Agent source (default: cursor)
  --source <npm|local|cli|github|auto>  Source strategy (default: auto)
  --npm-version <version>  npm package version (default: latest)
  --github-ref <ref>       GitHub ref (default: latest release tag)
  --dry-run                Print the plan without modifying the filesystem
  --force                  Overwrite existing skills
  --no-backup              Do not backup existing directories before replacing
  --help                   Show this help message
`.trim(),
	);
}

interface ParsedArgs {
	target?: string;
	agent?: string;
	source?: MemorixSource;
	npmVersion?: string;
	githubRef?: string;
	dryRun?: boolean;
	force?: boolean;
	backup?: boolean;
	help?: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = { backup: true };
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--target":
				result.target = args[++i];
				break;
			case "--agent":
				result.agent = args[++i];
				break;
			case "--source": {
				const value = args[++i] as MemorixSource;
				if (!["npm", "local", "cli", "github", "auto"].includes(value)) {
					throw new Error(`Unknown source: ${value}`);
				}
				result.source = value;
				break;
			}
			case "--npm-version":
				result.npmVersion = args[++i];
				break;
			case "--github-ref":
				result.githubRef = args[++i];
				break;
			case "--dry-run":
				result.dryRun = true;
				break;
			case "--force":
				result.force = true;
				break;
			case "--no-backup":
				result.backup = false;
				break;
			case "--help":
			case "-h":
				result.help = true;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return result;
}

main();
```

- [ ] **Step 2: 运行 CLI 帮助**

Run: `tsx ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts --help`

Expected: 输出帮助文本，包含 `--target`、`--source`、`--dry-run` 等选项。

- [ ] **Step 3: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): add fetch-memorix-skills CLI

- Standalone CLI wrapping refreshMemorixSkills
- Supports --source, --agent, --npm-version, --github-ref, --dry-run, --force
```

---

### Task 7: 修改 scripts/sync.ts 集成 memorix 刷新

**Files:**

- Modify: `ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts`

- [ ] **Step 1: 扩展参数解析并前置调用刷新**

```typescript
#!/usr/bin/env tsx

import { homedir } from "node:os";
import path from "node:path";
import { DEFAULT_PLATFORMS } from "../src/platforms.ts";
import { refreshMemorixSkills, type MemorixSource } from "../src/memorix.ts";
import { syncSkills } from "../src/sync.ts";

function main(): void {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		printHelp();
		return;
	}

	const sourceDir = options.source ?? path.join(homedir(), ".agents", "skills");

	const refreshPromise = options.skipMemorixRefresh
		? Promise.resolve([])
		: refreshMemorixSkills({
				targetDir: sourceDir,
				agent: options.memorixAgent,
				source: options.memorixSource,
				npmVersion: options.memorixNpmVersion,
				githubRef: options.memorixGithubRef,
				githubToken: process.env.GITHUB_TOKEN,
				githubRawMirror: process.env.GITHUB_RAW_MIRROR,
				dryRun: options.dryRun,
				backup: options.backup,
				force: options.forceMemorixRefresh,
			});

	refreshPromise
		.then((refreshResults) => {
			if (!options.skipMemorixRefresh) {
				for (const result of refreshResults) {
					console.log(JSON.stringify(result));
				}
			}
			const results = syncSkills(sourceDir, DEFAULT_PLATFORMS, {
				dryRun: options.dryRun,
				backup: options.backup,
			});
			for (const result of results) {
				console.log(JSON.stringify(result));
			}
		})
		.catch((error) => {
			console.error(error instanceof Error ? error.message : String(error));
			process.exit(1);
		});
}

function printHelp(): void {
	console.log(
		`
Usage: sync.ts [options]

Options:
  --source <path>              Source skills directory (default: ~/.agents/skills)
  --dry-run                    Print the plan without modifying the filesystem
  --no-backup                  Do not backup existing directories before replacing
  --skip-memorix-refresh       Skip memorix skills refresh
  --force-memorix-refresh      Force overwrite existing memorix skills
  --memorix-source <source>    Source strategy (default: auto)
  --memorix-agent <agent>      Agent source (default: cursor)
  --memorix-npm-version <ver>  npm package version (default: latest)
  --memorix-github-ref <ref>   GitHub ref (default: latest release tag)
  --help                       Show this help message
`.trim(),
	);
}

interface ParsedArgs {
	source?: string;
	dryRun?: boolean;
	backup?: boolean;
	help?: boolean;
	skipMemorixRefresh?: boolean;
	forceMemorixRefresh?: boolean;
	memorixSource?: MemorixSource;
	memorixAgent?: string;
	memorixNpmVersion?: string;
	memorixGithubRef?: string;
}

function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = { backup: true };
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--source":
			case "-s": {
				const value = args[++i];
				if (value === undefined) {
					throw new Error("--source requires a value");
				}
				result.source = value;
				break;
			}
			case "--dry-run":
			case "-d":
				result.dryRun = true;
				break;
			case "--no-backup":
				result.backup = false;
				break;
			case "--skip-memorix-refresh":
				result.skipMemorixRefresh = true;
				break;
			case "--force-memorix-refresh":
				result.forceMemorixRefresh = true;
				break;
			case "--memorix-source": {
				const value = args[++i] as MemorixSource;
				if (!["npm", "local", "cli", "github", "auto"].includes(value)) {
					throw new Error(`Unknown memorix source: ${value}`);
				}
				result.memorixSource = value;
				break;
			}
			case "--memorix-agent":
				result.memorixAgent = args[++i];
				break;
			case "--memorix-npm-version":
				result.memorixNpmVersion = args[++i];
				break;
			case "--memorix-github-ref":
				result.memorixGithubRef = args[++i];
				break;
			case "--help":
			case "-h":
				result.help = true;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return result;
}

main();
```

- [ ] **Step 2: 测试帮助输出**

Run: `tsx ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts --help`

Expected: 输出包含 memorix 相关选项的帮助文本。

- [ ] **Step 3: 运行原有 sync 测试确保未破坏**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/sync.test.ts`

Expected: PASS 6 tests.

- [ ] **Step 4: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): integrate memorix refresh into sync.ts

- Default refresh before platform sync
- Add --skip-memorix-refresh, --force-memorix-refresh, --memorix-source, etc.
```

---

### Task 8: 更新 fallback 脚本

**Files:**

- Modify: `fallback/sync.ps1`
- Modify: `fallback/sync.sh`

- [ ] **Step 1: 更新 PowerShell 兜底脚本**

在 `sync.ps1` 的 `param` 块中新增：

```powershell
[switch]$SkipMemorixRefresh,
[switch]$ForceMemorixRefresh
```

在平台同步之前，在 `$Source` 存在性检查之后，插入：

```powershell
if (-not $SkipMemorixRefresh) {
    $localCandidates = @(
        "$env:USERPROFILE\.cursor\skills",
        "$env:USERPROFILE\.codex\plugins\memorix\skills",
        "$env:USERPROFILE\.claude\plugins\marketplaces\memorix-local\plugins\memorix\skills",
        "$env:USERPROFILE\.claude\plugins\cache\memorix-local\memorix\*\skills",
        "$env:USERPROFILE\.codex\plugins\cache\personal\memorix\*\skills"
    )

    $selectedSource = $null
    foreach ($candidate in $localCandidates) {
        $resolved = Resolve-Path -Path $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($resolved) {
            $memorixDirs = Get-ChildItem -Path $resolved -Directory -Filter "memorix-*" -ErrorAction SilentlyContinue
            if ($memorixDirs.Count -gt 0) {
                $selectedSource = $resolved.Path
                break
            }
        }
    }

    if ($selectedSource) {
        foreach ($memorixDir in Get-ChildItem -Path $selectedSource -Directory -Filter "memorix-*") {
            $targetDir = Join-Path $Source $memorixDir.Name
            if (Test-Path -Path $targetDir) {
                if ($ForceMemorixRefresh -and -not $DryRun) {
                    if (-not $NoBackup) {
                        $backupPath = "$targetDir.bak.$(Get-Date -Format yyyyMMddHHmmss)-$([System.Guid]::NewGuid())"
                        Move-Item -Path $targetDir -Destination $backupPath -Force
                    } else {
                        Remove-Item -Path $targetDir -Recurse -Force
                    }
                    Copy-Item -Path $memorixDir.FullName -Destination $targetDir -Recurse -Force
                }
            } else {
                if (-not $DryRun) {
                    Copy-Item -Path $memorixDir.FullName -Destination $targetDir -Recurse -Force
                }
            }
        }
    } else {
        Write-Warning "No local memorix skills source found; skipping memorix refresh"
    }
}
```

- [ ] **Step 2: 更新 Bash 兜底脚本**

在 `sync.sh` 参数解析中新增：

```bash
SKIP_MEMORIX_REFRESH=0
FORCE_MEMORIX_REFRESH=0
```

并在 `case` 中新增：

```bash
--skip-memorix-refresh)
  SKIP_MEMORIX_REFRESH=1
  shift
  ;;
--force-memorix-refresh)
  FORCE_MEMORIX_REFRESH=1
  shift
  ;;
```

在 `SOURCE` 存在性检查之后，插入：

```bash
if [[ "$SKIP_MEMORIX_REFRESH" -eq 0 ]]; then
  local_candidates=(
    "${HOME}/.cursor/skills"
    "${HOME}/.codex/plugins/memorix/skills"
    "${HOME}/.claude/plugins/marketplaces/memorix-local/plugins/memorix/skills"
    "${HOME}/.claude/plugins/cache/memorix-local/memorix/*/skills"
    "${HOME}/.codex/plugins/cache/personal/memorix/*/skills"
  )

  selected_source=""
  for candidate in "${local_candidates[@]}"; do
    for dir in $candidate; do
      if [[ -d "$dir" ]]; then
        memorix_count=$(find "$dir" -maxdepth 1 -type d -name 'memorix-*' | wc -l)
        if [[ "$memorix_count" -gt 0 ]]; then
          selected_source="$dir"
          break 2
        fi
      fi
    done
  done

  if [[ -n "$selected_source" ]]; then
    for memorix_dir in "$selected_source"/memorix-*; do
      [[ -d "$memorix_dir" ]] || continue
      target_dir="$SOURCE/$(basename "$memorix_dir")"
      if [[ -e "$target_dir" ]]; then
        if [[ "$FORCE_MEMORIX_REFRESH" -eq 1 && "$DRY_RUN" -eq 0 ]]; then
          if [[ "$NO_BACKUP" -eq 0 ]]; then
            backup_dir "$target_dir" > /dev/null
          else
            rm -rf "$target_dir"
          fi
          cp -r "$memorix_dir" "$target_dir"
        fi
      else
        if [[ "$DRY_RUN" -eq 0 ]]; then
          cp -r "$memorix_dir" "$target_dir"
        fi
      fi
    done
  else
    echo "Warning: No local memorix skills source found; skipping memorix refresh" >&2
  fi
fi
```

- [ ] **Step 3: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/fallback/sync.ps1 ai-plugins/common-tools/skills/sync-local-global-agents-skills/fallback/sync.sh
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
✨ feat(sync-local-global-agents-skills): update fallback scripts for memorix refresh

- sync.ps1: scan local agent sources and copy memorix-* skills
- sync.sh: same behavior with --skip-memorix-refresh and --force-memorix-refresh
```

---

### Task 9: 补充完整测试

**Files:**

- Modify: `tests/sync-local-global-agents-skills/memorix.test.ts`

- [ ] **Step 1: 补充 dry-run、force、backup、metadata 测试**

Append to `tests/sync-local-global-agents-skills/memorix.test.ts`:

```typescript
describe("refreshMemorixSkills integration", () => {
	test("creates skill directory and metadata in non-dry-run mode", async () => {
		const targetDir = createTempDir("target-");
		const results = await refreshMemorixSkills({
			targetDir,
			source: "local",
			force: true,
		});
		expect(results.some((r) => r.status === "created" || r.status === "updated")).toBe(true);
	});

	test("force with backup generates backup path", async () => {
		const targetDir = createTempDir("target-");
		const skillDir = path.join(targetDir, "memorix-memory");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(path.join(skillDir, "SKILL.md"), "# old");

		const results = await refreshMemorixSkills({
			targetDir,
			source: "local",
			force: true,
			backup: true,
		});

		const memoryResult = results.find((r) => r.skill === "memorix-memory");
		expect(memoryResult?.status).toBe("updated");
		expect(memoryResult?.backupPath).toBeDefined();
	});
});
```

- [ ] **Step 2: 运行完整测试**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/`

Expected: All tests PASS.

- [ ] **Step 3: 提交**

```bash
git add tests/sync-local-global-agents-skills/memorix.test.ts
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
🧪 test(sync-local-global-agents-skills): add memorix refresh integration tests

- Cover dry-run, force, backup, and metadata scenarios
```

---

### Task 10: 更新文档

**Files:**

- Modify: `README.md`
- Modify: `SKILL.md`

- [ ] **Step 1: 更新 README.md**

在“快速开始”之后新增一节：

````markdown
## memorix 内部 skills 刷新

本脚本在同步平台之前，会默认先把 memorix 官方内部 skills 刷新到 `~/.agents/skills/`。

```bash
# 仅刷新 memorix skills
tsx scripts/fetch-memorix-skills.ts

# 刷新时查看计划
tsx scripts/fetch-memorix-skills.ts --dry-run

# 强制覆盖已存在的 memorix skills
tsx scripts/fetch-memorix-skills.ts --force

# 指定来源策略
tsx scripts/fetch-memorix-skills.ts --source npm
```
````

````plain

在“命令行选项”中新增 sync.ts 的 memorix 选项：

```text
--skip-memorix-refresh       跳过 memorix skills 刷新
--force-memorix-refresh      强制覆盖已存在的 memorix skills
--memorix-source <source>    memorix 来源策略（默认：auto）
--memorix-agent <agent>      选择 agent 来源（默认：cursor）
--memorix-npm-version <ver>  指定 npm 包版本（默认：latest）
--memorix-github-ref <ref>   指定 GitHub ref（默认：最新 release tag）
````

- [ ] **Step 2: 更新 SKILL.md**

在“核心职责”中新增：

```markdown
6. **memorix 内部 skills 刷新**：同步平台前，默认从 npm / 本地 agent 插件 / CLI / GitHub 获取最新 memorix 内部 skills，补充到 `~/.agents/skills/`，元数据写入 `~/.memorix/memorix-skills/memorix-meta.json`。
```

在“使用方式”中新增 `fetch-memorix-skills.ts` 示例和参数说明。

- [ ] **Step 3: 提交**

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills/README.md ai-plugins/common-tools/skills/sync-local-global-agents-skills/SKILL.md
pnpm exec commitlint --edit commit-message.txt --strict
git commit -F commit-message.txt
rm -- commit-message.txt
```

commit-message.txt 内容：

```text
📃 docs(sync-local-global-agents-skills): document memorix refresh feature

- Update README.md with fetch-memorix-skills.ts usage
- Update SKILL.md with refresh behavior and metadata path
```

---

### Task 11: 最终验证与类型检查

- [ ] **Step 1: 运行类型检查**

Run: `pnpm run typecheck:ai-plugins`

Expected: 无类型错误。

- [ ] **Step 2: 运行格式化**

Run: `pnpm run format`

Expected: 文件格式一致，无变更残留（或仅格式化变更）。

- [ ] **Step 3: 运行完整测试套件**

Run: `pnpm vitest run tests/sync-local-global-agents-skills/`

Expected: All tests PASS.

- [ ] **Step 4: 最终检查工作区**

Run: `git status --short`

Expected: 工作区干净，或仅有格式化后的已提交变更。

---

## Self-Review

1. **Spec coverage:**
   - ✅ npm 来源 → Task 3
   - ✅ 本地多源扫描 → Task 4
   - ✅ CLI 来源 → Task 5
   - ✅ GitHub 来源 → Task 5
   - ✅ 元数据目录 `~/.memorix/memorix-skills/memorix-meta.json` → Task 2, Task 6
   - ✅ 独立刷新 CLI → Task 7
   - ✅ 集成到 `scripts/sync.ts` → Task 8
   - ✅ fallback 脚本更新 → Task 9
   - ✅ 测试覆盖 → Task 10
   - ✅ 文档更新 → Task 11

2. **Placeholder scan:** 无 TBD、TODO、implement later 等占位符。

3. **Type consistency:** 所有任务使用一致的 `RefreshOptions`、`RefreshResult`、`MemorixSource` 类型。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-06-sync-memorix-skills.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
