# sync-local-global-agents-skills 实现计划

> **For agentic workers:** 已实现完毕。本计划记录最终落地结构，供后续归档或复盘参考。

**Goal:** 在 `ai-plugins/common-tools/skills/sync-local-global-agents-skills` 内创建一个 TypeScript 同步脚本，把 `~/.agents/skills` 作为唯一真理数据源，通过目录级符号链接分发到 WorkBuddy、QoderWork、Kimi Work 等本地 agent 平台；同时提供 PowerShell/Bash 兜底脚本；并在 `tests/sync-local-global-agents-skills/` 内配套 vitest 测试。

**Architecture:** 脚本核心拆分为平台注册表（`src/platforms.ts`）、可测试的同步函数（`src/sync.ts`）、CLI 入口（`scripts/sync.ts`）三层；Windows 优先原生目录 symlink（`lrwxrwxrwx`），权限不足时 fallback 到 junction；兜底脚本与主脚本逻辑等价但零依赖。

**Tech Stack:** TypeScript / Node.js 22 / tsx / Vitest / PowerShell / Bash

---

## 文件结构

```text
ai-plugins/common-tools/skills/sync-local-global-agents-skills/
  SKILL.md                              # 技能入口与使用说明
  README.md                             # 脚本使用说明
  scripts/
    sync.ts                             # CLI 入口（tsx）
  src/
    platforms.ts                        # 硬编码平台注册表
    sync.ts                             # 核心 syncSkills()
  fallback/
    sync.ps1                            # Windows PowerShell 兜底
    sync.sh                             # Bash 兜底

tests/sync-local-global-agents-skills/
  vitest.config.ts                      # 测试配置（environment: node）
  tsconfig.json                         # 测试 tsconfig
  sync.test.ts                          # 单元测试
```

---

## Task 1: 创建测试目录与 vitest 配置

**Files:** `tests/sync-local-global-agents-skills/vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["**/*.test.ts"],
	},
});
```

---

## Task 2: 创建测试 tsconfig

**Files:** `tests/sync-local-global-agents-skills/tsconfig.json`

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"moduleResolution": "bundler",
		"allowImportingTsExtensions": true
	},
	"include": ["./**/*.ts", "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/**/*.ts"],
	"exclude": ["**/node_modules", "**/dist"]
}
```

验证：

```bash
npx tsc --noEmit -p tests/sync-local-global-agents-skills/tsconfig.json
```

---

## Task 3: 编写同步函数测试

**Files:** `tests/sync-local-global-agents-skills/sync.test.ts`

```ts
import {
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import type { AgentPlatform } from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/platforms.ts";
import { syncSkills } from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/sync.ts";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
	const dir = mkdtempSync(path.join(tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

function createPlatform(baseDir: string, name: string): AgentPlatform {
	return {
		name,
		skillsDir: path.join(baseDir, name, "skills"),
	};
}

afterEach(() => {
	for (const dir of tempDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	tempDirs.length = 0;
});

describe("syncSkills", () => {
	test("creates directory symlinks for all platforms", () => {
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		const results = syncSkills(sourceDir, platforms);

		expect(results).toHaveLength(1);
		expect(results[0].status).toBe("created");
		expect(existsSync(platforms[0].skillsDir)).toBe(true);
		expect(lstatSync(platforms[0].skillsDir).isSymbolicLink()).toBe(true);
		expect(readlinkSync(platforms[0].skillsDir)).toBe(sourceDir);
	});

	test("is idempotent when links already correct", () => {
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		syncSkills(sourceDir, platforms);
		const results = syncSkills(sourceDir, platforms);

		expect(results[0].status).toBe("skipped");
	});

	test("backs up and replaces an existing directory", () => {
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];
		mkdirSync(platforms[0].skillsDir, { recursive: true });
		writeFileSync(path.join(platforms[0].skillsDir, "old.txt"), "old");

		const results = syncSkills(sourceDir, platforms);

		expect(results[0].status).toBe("replaced");
		expect(results[0].previousType).toBe("directory");
		expect(results[0].backupPath).toBeDefined();
		expect(existsSync(results[0].backupPath!)).toBe(true);
		expect(readlinkSync(platforms[0].skillsDir)).toBe(sourceDir);
	});

	test("replaces an incorrect symlink without backup", () => {
		const sourceDir = createTempDir("source-");
		const otherDir = createTempDir("other-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];
		mkdirSync(path.dirname(platforms[0].skillsDir), { recursive: true });
		try {
			symlinkSync(otherDir, platforms[0].skillsDir, "dir");
		} catch {
			symlinkSync(otherDir, platforms[0].skillsDir, "junction");
		}

		const results = syncSkills(sourceDir, platforms);

		expect(results[0].status).toBe("replaced");
		expect(results[0].previousType).toBe("symlink");
		expect(readlinkSync(platforms[0].skillsDir)).toBe(sourceDir);
	});

	test("dryRun does not modify filesystem", () => {
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		const results = syncSkills(sourceDir, platforms, { dryRun: true });

		expect(results[0].status).toBe("created");
		expect(existsSync(platforms[0].skillsDir)).toBe(false);
	});

	test("throws when source directory does not exist", () => {
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		expect(() => syncSkills("/nonexistent/source", platforms)).toThrow("Source directory does not exist");
	});
});
```

---

## Task 4: 创建平台注册表

**Files:** `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/platforms.ts`

```ts
import { homedir } from "node:os";
import path from "node:path";

/** 本地 agent 平台定义 */
export interface AgentPlatform {
	/** 平台显示名称 */
	name: string;
	/** 该平台 skills 目录的绝对路径 */
	skillsDir: string;
}

/** 默认同步的本地 agent 平台列表（硬编码） */
export const DEFAULT_PLATFORMS: AgentPlatform[] = [
	{
		name: "WorkBuddy",
		skillsDir: path.join(homedir(), ".workbuddy", "skills"),
	},
	{
		name: "QoderWork",
		skillsDir: path.join(homedir(), ".qoderworkcn", "skills"),
	},
	{
		name: "Kimi Work",
		skillsDir: path.join(homedir(), "AppData", "Roaming", "kimi-desktop", "daimon-share", "daimon", "skills"),
	},
];
```

---

## Task 5: 实现同步核心

**Files:** `ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/sync.ts`

```ts
import { existsSync, lstatSync, mkdirSync, readlinkSync, renameSync, rmSync, symlinkSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentPlatform } from "./platforms.ts";

/** 同步选项 */
export interface SyncOptions {
	/** 只输出计划，不修改文件系统 */
	dryRun?: boolean;
	/** 替换真实目录前是否备份，默认 true */
	backup?: boolean;
}

/** 单个平台的同步结果 */
export interface SyncResult {
	/** 平台名称 */
	platform: string;
	/** 目标 skills 目录 */
	skillsDir: string;
	/** 处理状态 */
	status: "skipped" | "created" | "replaced" | "error";
	/** 被替换前的类型 */
	previousType?: "directory" | "symlink" | "file";
	/** 备份路径（仅 previousType=directory 且 backup=true） */
	backupPath?: string;
	/** 错误信息 */
	error?: string;
}

/**
 * 将 sourceDir 作为目录级符号链接同步到多个平台的 skills 目录。
 *
 * @param sourceDir - 源 skills 目录绝对路径
 * @param platforms - 目标平台列表
 * @param options - 同步选项
 * @returns 每个平台的处理结果
 */
export function syncSkills(sourceDir: string, platforms: AgentPlatform[], options: SyncOptions = {}): SyncResult[] {
	const { dryRun = false, backup = true } = options;

	if (!existsSync(sourceDir)) {
		throw new Error(`Source directory does not exist: ${sourceDir}`);
	}

	const sourceStat = lstatSync(sourceDir);
	if (!sourceStat.isDirectory()) {
		throw new Error(`Source path is not a directory: ${sourceDir}`);
	}

	return platforms.map((platform) => syncPlatform(sourceDir, platform, { dryRun, backup }));
}

function syncPlatform(
	sourceDir: string,
	platform: AgentPlatform,
	options: { dryRun: boolean; backup: boolean },
): SyncResult {
	const result: SyncResult = {
		platform: platform.name,
		skillsDir: platform.skillsDir,
		status: "skipped",
	};

	try {
		const parentDir = dirname(platform.skillsDir);

		if (!existsSync(parentDir)) {
			if (!options.dryRun) {
				mkdirSync(parentDir, { recursive: true });
			}
		}

		if (!existsSync(platform.skillsDir)) {
			if (!options.dryRun) {
				createDirLink(sourceDir, platform.skillsDir);
			}
			result.status = "created";
			return result;
		}

		const stat = lstatSync(platform.skillsDir);

		if (stat.isSymbolicLink()) {
			const target = readlinkSync(platform.skillsDir);
			if (target === sourceDir) {
				result.status = "skipped";
				return result;
			}
			result.previousType = "symlink";
			if (!options.dryRun) {
				rmSync(platform.skillsDir);
				createDirLink(sourceDir, platform.skillsDir);
			}
			result.status = "replaced";
			return result;
		}

		if (stat.isDirectory()) {
			result.previousType = "directory";
			if (!options.dryRun) {
				if (options.backup) {
					const backupPath = `${platform.skillsDir}.bak.${Date.now()}-${randomUUID()}`;
					renameSync(platform.skillsDir, backupPath);
					result.backupPath = backupPath;
				} else {
					rmSync(platform.skillsDir, { recursive: true, force: true });
				}
				createDirLink(sourceDir, platform.skillsDir);
			}
			result.status = "replaced";
			return result;
		}

		result.previousType = "file";
		if (!options.dryRun) {
			rmSync(platform.skillsDir);
			createDirLink(sourceDir, platform.skillsDir);
		}
		result.status = "replaced";
		return result;
	} catch (error) {
		result.status = "error";
		result.error = error instanceof Error ? error.message : String(error);
		return result;
	}
}

/**
 * 创建目录级符号链接。
 * Windows 优先使用原生目录 symlink（lrwxrwxrwx 形式），
 * 权限不足时 fallback 到 junction。
 */
function createDirLink(target: string, linkPath: string): void {
	if (process.platform === "win32") {
		try {
			symlinkSync(target, linkPath, "dir");
			return;
		} catch (error) {
			if (isPermissionError(error)) {
				symlinkSync(target, linkPath, "junction");
				return;
			}
			throw error;
		}
	}

	symlinkSync(target, linkPath, "dir");
}

function isPermissionError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	const code = (error as NodeJS.ErrnoException).code;
	return code === "EPERM" || code === "EACCES";
}
```

---

## Task 6: 创建 CLI 入口

**Files:** `ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts`

```ts
#!/usr/bin/env tsx

import { homedir } from "node:os";
import path from "node:path";
import { DEFAULT_PLATFORMS } from "../src/platforms.ts";
import { syncSkills } from "../src/sync.ts";

function main(): void {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		printHelp();
		return;
	}

	const sourceDir = options.source ?? path.join(homedir(), ".agents", "skills");

	const results = syncSkills(sourceDir, DEFAULT_PLATFORMS, {
		dryRun: options.dryRun,
		backup: options.backup,
	});

	for (const result of results) {
		console.log(JSON.stringify(result));
	}
}

function printHelp(): void {
	console.log(
		`
Usage: sync.ts [options]

Options:
  --source <path>   Source skills directory (default: ~/.agents/skills)
  --dry-run         Print the plan without modifying the filesystem
  --no-backup       Do not backup existing directories before replacing
  --help            Show this help message
`.trim(),
	);
}

interface ParsedArgs {
	source?: string;
	dryRun?: boolean;
	backup?: boolean;
	help?: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = {};
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

验证：

```bash
tsx scripts/sync.ts --help
```

---

## Task 7: 创建 PowerShell 兜底脚本

**Files:** `ai-plugins/common-tools/skills/sync-local-global-agents-skills/fallback/sync.ps1`

```powershell
# 本地 agent skills 同步脚本（PowerShell 兜底）
# 优先创建原生目录符号链接，权限不足时 fallback 到 junction。

$sourceDir = Join-Path $env:USERPROFILE ".agents" "skills"

$platforms = @(
  @{ Name = "WorkBuddy"; SkillsDir = Join-Path $env:USERPROFILE ".workbuddy" "skills" },
  @{ Name = "QoderWork"; SkillsDir = Join-Path $env:USERPROFILE ".qoderworkcn" "skills" },
  @{ Name = "Kimi Work"; SkillsDir = Join-Path $env:USERPROFILE "AppData" "Roaming" "kimi-desktop" "daimon-share" "daimon" "skills" }
)

function Test-IsReparsePoint($path) {
  if (!(Test-Path $path)) {
    return $false
  }
  $item = Get-Item $path
  return ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq [System.IO.FileAttributes]::ReparsePoint
}

function Get-LinkTarget($path) {
  $item = Get-Item $path
  return $item.Target
}

foreach ($platform in $platforms) {
  $name = $platform.Name
  $dir = $platform.SkillsDir
  $parent = Split-Path -Parent $dir

  if (!(Test-Path $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  if (Test-Path $dir) {
    if (Test-IsReparsePoint $dir) {
      $target = Get-LinkTarget $dir
      if ($target -eq $sourceDir) {
        Write-Host "[$name] skipped"
        continue
      }
      Remove-Item $dir -Force
    } else {
      $backupName = "$dir.bak.$(Get-Date -Format 'yyyyMMddHHmmssfff')"
      Rename-Item $dir $backupName
    }
  }

  try {
    New-Item -ItemType SymbolicLink -Path $dir -Target $sourceDir -ErrorAction Stop | Out-Null
    Write-Host "[$name] created"
  } catch {
    New-Item -ItemType Junction -Path $dir -Target $sourceDir | Out-Null
    Write-Host "[$name] created (junction fallback)"
  }
}
```

---

## Task 8: 创建 Bash 兜底脚本

**Files:** `ai-plugins/common-tools/skills/sync-local-global-agents-skills/fallback/sync.sh`

```bash
#!/usr/bin/env bash

# 本地 agent skills 同步脚本（Bash 兜底）
# 将 ~/.agents/skills 作为目录级软链接分发到 WorkBuddy、QoderWork、Kimi Work 平台。

set -euo pipefail

SOURCE="${HOME}/.agents/skills"
DRY_RUN=0
NO_BACKUP=0

usage() {
  cat <<EOF
Usage: sync.sh [options]

Options:
  -s, --source <path>   Source skills directory (default: ~/.agents/skills)
  -d, --dry-run         Print the plan without modifying the filesystem
  -n, --no-backup       Do not backup existing directories before replacing
  -h, --help            Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--source)
      SOURCE="$2"
      shift 2
      ;;
    -d|--dry-run)
      DRY_RUN=1
      shift
      ;;
    -n|--no-backup)
      NO_BACKUP=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "$SOURCE" ]]; then
  echo "Source directory does not exist: $SOURCE" >&2
  exit 1
fi

HOME_WIN="${USERPROFILE:-$HOME}"

platforms=(
  "WorkBuddy:${HOME_WIN}/.workbuddy/skills"
  "QoderWork:${HOME_WIN}/.qoderworkcn/skills"
  "Kimi Work:${HOME_WIN}/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills"
)

backup_dir() {
  local src="$1"
  local suffix
  suffix="$(date +%Y%m%d%H%M%S)-$(uuidgen 2>/dev/null || echo $$)"
  local dest="${src}.bak.${suffix}"
  mv "$src" "$dest"
  echo "$dest"
}

for entry in "${platforms[@]}"; do
  name="${entry%%:*}"
  skills_dir="${entry#*:}"
  status="skipped"
  previous_type=""
  backup_path=""
  error=""

  parent="$(dirname "$skills_dir")"
  if [[ ! -d "$parent" ]]; then
    if [[ "$DRY_RUN" -eq 0 ]]; then
      mkdir -p "$parent"
    fi
  fi

  if [[ ! -e "$skills_dir" ]]; then
    if [[ "$DRY_RUN" -eq 0 ]]; then
      ln -s "$SOURCE" "$skills_dir"
    fi
    status="created"
  elif [[ -L "$skills_dir" ]]; then
    current_target="$(readlink "$skills_dir")"
    if [[ "$current_target" == "$SOURCE" ]]; then
      status="skipped"
    else
      previous_type="symlink"
      if [[ "$DRY_RUN" -eq 0 ]]; then
        rm "$skills_dir"
        ln -s "$SOURCE" "$skills_dir"
      fi
      status="replaced"
    fi
  elif [[ -d "$skills_dir" ]]; then
    previous_type="directory"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      if [[ "$NO_BACKUP" -eq 0 ]]; then
        backup_path="$(backup_dir "$skills_dir")"
      else
        rm -rf "$skills_dir"
      fi
      ln -s "$SOURCE" "$skills_dir"
    fi
    status="replaced"
  else
    previous_type="file"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      rm "$skills_dir"
      ln -s "$SOURCE" "$skills_dir"
    fi
    status="replaced"
  fi

  printf '{"platform":"%s","skillsDir":"%s","status":"%s","previousType":"%s","backupPath":"%s","error":"%s"}\n' \
    "$name" "$skills_dir" "$status" "$previous_type" "$backup_path" "$error"
done
```

---

## Task 9: 创建 Skill 说明文档

**Files:** `ai-plugins/common-tools/skills/sync-local-global-agents-skills/SKILL.md`

内容已落地，包含：

- YAML frontmatter（name/description/metadata.version）
- 使用场景与核心职责
- 已支持平台列表（硬编码）
- 主脚本与兜底脚本用法
- 符号链接策略与同步行为

---

## Task 10: 验证

运行以下命令：

```bash
# 测试
pnpm vitest run --project sync-local-global-agents-skills

# 类型检查
npx tsc --noEmit -p tests/sync-local-global-agents-skills/tsconfig.json

# 格式检查
pnpm exec prettier --check ai-plugins/common-tools/skills/sync-local-global-agents-skills tests/sync-local-global-agents-skills
```

Expected: 6 个测试全部通过；无类型错误；Prettier 全部通过。

---

## Task 11: 提交变更

```bash
git add ai-plugins/common-tools/skills/sync-local-global-agents-skills tests/sync-local-global-agents-skills
git commit -m "feat: add sync-local-global-agents-skills script and skill"
```

---

## 自检

- [x] Spec coverage: 平台硬编码、目录级符号链接、Windows 原生 symlink fallback junction、自动备份、幂等、兜底脚本、vitest 测试均对应到任务。
- [x] Placeholder scan: 无 TBD/TODO/实现后补等占位符。
- [x] Type consistency: `SyncResult` / `SyncOptions` / `AgentPlatform` 接口在 platforms.ts、sync.ts、test.ts 中一致。
- [x] 文件位置：所有代码与文档均位于 `ai-plugins/common-tools/skills/sync-local-global-agents-skills/` 下；错误位置已删除。
