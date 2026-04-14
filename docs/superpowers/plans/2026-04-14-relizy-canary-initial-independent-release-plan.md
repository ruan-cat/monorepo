# Relizy Canary Initial Independent Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在独立 git worktree 内创建两个全新 pnpm monorepo sandbox，验证 `relizy@1.3.0-canary.a8967ef.0` 在 Windows 下不依赖 `relizy-runner` 时，是否能同时跑通 dry-run 与真实 initial independent release，并产出可复核证据。

**Architecture:** 先在仓库外创建一个隔离 worktree 作为测试总控容器，再在该 worktree 里新增两份 PowerShell 脚本：一份负责创建两个结构一致的 sandbox monorepo，另一份负责执行 A/B 环境矩阵、采集 stdout/stderr、git 状态、tags 与 changelog 产物。最终把结论与证据写入一份测试报告，明确 `init-release-base-relizy-and-bumpp` skill 中哪些约束可以删、哪些必须保留。

**Tech Stack:** PowerShell, git worktree, pnpm workspace, relizy `1.3.0-canary.a8967ef.0`, Node.js, Markdown

---

## File Structure

- `D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\new-sandboxes.ps1`
  - 在 worktree 内创建 `sandbox-a` / `sandbox-b` 两个全新 monorepo，并写入相同的 relizy 配置、package 结构和 git 历史
- `D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\run-matrix.ps1`
  - 对两个 sandbox 执行环境留痕、dry-run、真实 release、结果核验，并把 stdout/stderr 存盘
- `D:\temp\codex-worktrees\monorepo-relizy-canary-test\docs\reports\2026-04-14-relizy-canary-initial-independent-release-test.md`
  - 汇总测试背景、执行矩阵、A/B 结果、最终结论和对 skill 的影响边界
- `D:\temp\codex-worktrees\monorepo-relizy-canary-test\.tmp\relizy-canary\`
  - 忽略提交的 sandbox 工作目录与 artifacts 根目录

### Task 1: Create The Isolated Worktree And Report Skeleton

**Files:**

- Create: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\docs\reports\2026-04-14-relizy-canary-initial-independent-release-test.md`
- Modify: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\.git\info\exclude`

- [ ] **Step 1: Create the isolated worktree from `dev`**

Run:

```bash
git worktree add D:\temp\codex-worktrees\monorepo-relizy-canary-test -b test/relizy-canary-initial-independent-release dev
```

Expected:

- `Preparing worktree (new branch 'test/relizy-canary-initial-independent-release')`
- `HEAD is now at ...`

- [ ] **Step 2: Ignore sandbox and artifact directories inside the worktree**

Append these lines to `D:\temp\codex-worktrees\monorepo-relizy-canary-test\.git\info\exclude`:

```text
.tmp/relizy-canary/
artifacts/relizy-canary/
```

Verify with:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test check-ignore -v .tmp/relizy-canary
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test check-ignore -v artifacts/relizy-canary
```

Expected:

- Both commands print `.git/info/exclude`

- [ ] **Step 3: Create the initial report skeleton**

Create `D:\temp\codex-worktrees\monorepo-relizy-canary-test\docs\reports\2026-04-14-relizy-canary-initial-independent-release-test.md` with:

```md
# 2026-04-14 relizy canary initial independent release 测试报告

## 测试目标

验证 `relizy@1.3.0-canary.a8967ef.0` 在 Windows 下不经 `relizy-runner` 时，是否已经同时解决：

1. GNU 工具依赖问题
2. initial independent release 的 baseline tag 首发问题

## 测试拓扑

- worktree：`D:\temp\codex-worktrees\monorepo-relizy-canary-test`
- sandbox A：正常 Windows PATH
- sandbox B：裁剪 PATH，仅保留 `node`、`pnpm`、`git` 与 `System32`

## 执行记录

### 环境留痕

### sandbox A

### sandbox B

## 结论

## 对 skill 的影响
```

- [ ] **Step 4: Verify the worktree baseline is clean except for the new report**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test status --short
```

Expected:

- Only `docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md` appears as untracked/modified

- [ ] **Step 5: Commit the report skeleton on the worktree branch**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test add docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test commit -m "test(utils): add relizy canary test report skeleton"
```

Expected:

- A new commit on `test/relizy-canary-initial-independent-release`

### Task 2: Add The Sandbox Scaffolding Script

**Files:**

- Create: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\new-sandboxes.ps1`

- [ ] **Step 1: Write the sandbox scaffolding script**

Create `D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\new-sandboxes.ps1` with:

```powershell
param(
  [string]$Root = "D:\temp\codex-worktrees\monorepo-relizy-canary-test\.tmp\relizy-canary"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Utf8File {
  param(
    [string]$Path,
    [string]$Content
  )

  $parent = Split-Path -Parent $Path
  if ($parent) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }

  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function New-Sandbox {
  param(
    [string]$Name
  )

  $dir = Join-Path $Root $Name

  if (Test-Path $dir) {
    Remove-Item -LiteralPath $dir -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $dir "packages\alpha\src") | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $dir "packages\beta\src") | Out-Null

  Write-Utf8File -Path (Join-Path $dir "pnpm-workspace.yaml") -Content @"
packages:
  - packages/*
"@

  Write-Utf8File -Path (Join-Path $dir "package.json") -Content @"
{
  "name": "relizy-canary-$Name",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@10.21.0",
  "scripts": {
    "changelog:dry": "relizy changelog --dry-run",
    "release:dry": "relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes",
    "release:real": "relizy release --no-publish --no-provider-release --no-push --yes"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "pnpm-workspace-yaml": "^0.3.1",
    "relizy": "1.3.0-canary.a8967ef.0"
  }
}
"@

  Write-Utf8File -Path (Join-Path $dir "relizy.config.ts") -Content @"
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePnpmWorkspaceYaml } from "pnpm-workspace-yaml";
import { defineConfig } from "relizy";

function readWorkspacePackageGlobs(): string[] {
  const content = readFileSync(resolve(process.cwd(), "pnpm-workspace.yaml"), "utf8");
  return (parsePnpmWorkspaceYaml(content).toJSON().packages ?? []).filter((value) => !value.startsWith("!"));
}

export default defineConfig({
  projectName: "relizy-canary-$Name",
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "docs", section: "Documentation" },
    { type: "chore", section: "Chores" }
  ],
  templates: {
    changelogTitle: "{{newVersion}} ({{date}})"
  },
  monorepo: {
    versionMode: "independent",
    packages: readWorkspacePackageGlobs()
  },
  changelog: {
    rootChangelog: true,
    includeCommitBody: true
  },
  release: {
    changelog: true,
    commit: true,
    push: true,
    gitTag: true,
    clean: true,
    noVerify: false,
    publish: false,
    providerRelease: false,
    social: false,
    prComment: false
  }
});
"@

  Write-Utf8File -Path (Join-Path $dir "packages\alpha\package.json") -Content @"
{
  "name": "@sandbox/alpha",
  "version": "0.0.0",
  "type": "module"
}
"@

  Write-Utf8File -Path (Join-Path $dir "packages\beta\package.json") -Content @"
{
  "name": "@sandbox/beta",
  "version": "0.0.0",
  "type": "module"
}
"@

  Write-Utf8File -Path (Join-Path $dir "packages\alpha\src\index.ts") -Content @"
export const alpha = "alpha";
"@

  Write-Utf8File -Path (Join-Path $dir "packages\beta\src\index.ts") -Content @"
export const beta = "beta";
"@

  Write-Utf8File -Path (Join-Path $dir "README.md") -Content @"
# $Name
"@

  git -C $dir init
  git -C $dir config user.name "Codex Test"
  git -C $dir config user.email "codex@example.com"
  pnpm -C $dir install --ignore-scripts
  git -C $dir add .
  git -C $dir commit -m "chore: init relizy canary sandbox"

  Add-Content -Path (Join-Path $dir "packages\alpha\src\index.ts") -Value "`nexport const alphaFeature = `"first-independent-release`";"
  git -C $dir add packages/alpha/src/index.ts
  git -C $dir commit -m "feat(alpha): add first independent release trigger"

  Add-Content -Path (Join-Path $dir "README.md") -Value "`n- docs note"
  git -C $dir add README.md
  git -C $dir commit -m "docs: add root note"
}

New-Sandbox -Name "sandbox-a"
New-Sandbox -Name "sandbox-b"
```

- [ ] **Step 2: Run the scaffolding script and verify both sandboxes are created**

Run:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\new-sandboxes.ps1
```

Expected:

- `sandbox-a` and `sandbox-b` directories exist under `.tmp\relizy-canary`
- Each sandbox has a `node_modules` directory, `.git` directory, and two package directories

- [ ] **Step 3: Verify the initial git history in both sandboxes**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test\.tmp\relizy-canary\sandbox-a log --oneline --decorate -n 3
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test\.tmp\relizy-canary\sandbox-b log --oneline --decorate -n 3
```

Expected:

- Both logs show these commit subjects in order:
  - `docs: add root note`
  - `feat(alpha): add first independent release trigger`
  - `chore: init relizy canary sandbox`

- [ ] **Step 4: Commit the scaffolding script**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test add scripts/relizy-canary/new-sandboxes.ps1
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test commit -m "test(utils): add relizy canary sandbox scaffold"
```

Expected:

- A new commit containing only `new-sandboxes.ps1`

### Task 3: Add The Matrix Runner Script

**Files:**

- Create: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\run-matrix.ps1`

- [ ] **Step 1: Write the matrix runner script**

Create `D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\run-matrix.ps1` with:

```powershell
param(
  [string]$Root = "D:\temp\codex-worktrees\monorepo-relizy-canary-test\.tmp\relizy-canary",
  [string]$Artifacts = "D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-ArtifactDir {
  param([string]$Sandbox)

  $dir = Join-Path $Artifacts $Sandbox
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  return $dir
}

function Get-SanitizedPath {
  $nodeDir = Split-Path -Parent (Get-Command node).Source
  $pnpmDir = Split-Path -Parent (Get-Command pnpm).Source
  $gitDir = Split-Path -Parent (Get-Command git).Source
  $system32 = Join-Path $env:WINDIR "System32"

  return (@($system32, $nodeDir, $pnpmDir, $gitDir) | Select-Object -Unique) -join ";"
}

$powershellExe = if ($PSVersionTable.PSEdition -eq "Core") {
  Join-Path $PSHOME "pwsh.exe"
}
else {
  Join-Path $PSHOME "powershell.exe"
}

function Invoke-LoggedCommand {
  param(
    [string]$Sandbox,
    [string]$Name,
    [string]$Command,
    [hashtable]$ExtraEnv = @{}
  )

  $sandboxDir = Join-Path $Root $Sandbox
  $artifactDir = New-ArtifactDir -Sandbox $Sandbox
  $stdoutPath = Join-Path $artifactDir "$Name.stdout.log"
  $stderrPath = Join-Path $artifactDir "$Name.stderr.log"

  $previous = @{}
  foreach ($key in $ExtraEnv.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
    [Environment]::SetEnvironmentVariable($key, $ExtraEnv[$key], "Process")
  }

  try {
    $result = Start-Process -FilePath $powershellExe -ArgumentList @(
      "-NoProfile",
      "-Command",
      $Command
    ) -WorkingDirectory $sandboxDir -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -Wait -PassThru

    return $result.ExitCode
  }
  finally {
    foreach ($key in $ExtraEnv.Keys) {
      [Environment]::SetEnvironmentVariable($key, $previous[$key], "Process")
    }
  }
}

function Save-TextArtifact {
  param(
    [string]$Sandbox,
    [string]$Name,
    [string]$Command,
    [hashtable]$ExtraEnv = @{}
  )

  $exitCode = Invoke-LoggedCommand -Sandbox $Sandbox -Name $Name -Command $Command -ExtraEnv $ExtraEnv
  if ($exitCode -ne 0) {
    throw "Command '$Name' failed for $Sandbox with exit code $exitCode."
  }
}

$normalEnv = @{}
$strictEnv = @{ PATH = (Get-SanitizedPath) }

$matrix = @(
  @{ Sandbox = "sandbox-a"; Env = $normalEnv },
  @{ Sandbox = "sandbox-b"; Env = $strictEnv }
)

foreach ($entry in $matrix) {
  $sandbox = $entry.Sandbox
  $extraEnv = $entry.Env

  Save-TextArtifact -Sandbox $sandbox -Name "env-node-version" -Command "node -v" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "env-pnpm-version" -Command "pnpm -v" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "env-git-version" -Command "git --version" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "env-relizy-version" -Command "pnpm exec relizy --version" -ExtraEnv $extraEnv
  Invoke-LoggedCommand -Sandbox $sandbox -Name "env-where-git" -Command "where.exe git" -ExtraEnv $extraEnv | Out-Null
  Invoke-LoggedCommand -Sandbox $sandbox -Name "env-where-grep" -Command "where.exe grep" -ExtraEnv $extraEnv | Out-Null
  Invoke-LoggedCommand -Sandbox $sandbox -Name "env-where-head" -Command "where.exe head" -ExtraEnv $extraEnv | Out-Null
  Invoke-LoggedCommand -Sandbox $sandbox -Name "env-where-sed" -Command "where.exe sed" -ExtraEnv $extraEnv | Out-Null

  Save-TextArtifact -Sandbox $sandbox -Name "help" -Command "pnpm exec relizy --help" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "changelog-dry" -Command "pnpm exec relizy changelog --dry-run" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "release-dry" -Command "pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "release-real" -Command "pnpm exec relizy release --no-publish --no-provider-release --no-push --yes" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "git-status" -Command "git status --short" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "git-log" -Command "git log --oneline --decorate -n 5" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "git-tags" -Command "git tag --list" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "root-changelog" -Command "Get-Content -Raw CHANGELOG.md" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "alpha-package" -Command "Get-Content -Raw packages/alpha/package.json" -ExtraEnv $extraEnv
  Save-TextArtifact -Sandbox $sandbox -Name "beta-package" -Command "Get-Content -Raw packages/beta/package.json" -ExtraEnv $extraEnv
}
```

- [ ] **Step 2: Run the matrix script once and expect it to surface the first failure**

Run:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\run-matrix.ps1
```

Expected:

- If canary still has a Windows or baseline issue, the script fails with the first non-zero command
- If the script fails earlier because of the harness itself, inspect the generated `.stdout.log` / `.stderr.log` files and fix the harness before trusting any product conclusion

- [ ] **Step 3: Re-run the matrix script until both sandboxes complete the full command set**

Run:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File D:\temp\codex-worktrees\monorepo-relizy-canary-test\scripts\relizy-canary\run-matrix.ps1
```

Expected:

- `artifacts\relizy-canary\sandbox-a\` and `sandbox-b\` contain logs for every named command
- The script exits `0` only when every required command succeeds

- [ ] **Step 4: Commit the matrix runner script**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test add scripts/relizy-canary/run-matrix.ps1
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test commit -m "test(utils): add relizy canary matrix runner"
```

Expected:

- A new commit containing only `run-matrix.ps1`

### Task 4: Verify The Real Release Artifacts

**Files:**

- Verify: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\*`
- Verify: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\*`

- [ ] **Step 1: Inspect the environment traces for both sandboxes**

Run:

```bash
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\env-where-grep.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\env-where-grep.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\env-where-grep.stderr.log
```

Expected:

- sandbox A may or may not resolve `grep`
- sandbox B should not resolve `grep` from Git `usr\bin`

- [ ] **Step 2: Confirm real release produced changelog, commit, and tags in sandbox A**

Run:

```bash
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\root-changelog.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\git-log.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\git-tags.stdout.log
```

Expected:

- `CHANGELOG.md` has fresh release content
- `git log` includes a relizy-generated release commit
- `git tag --list` includes at least one `@sandbox/alpha@...` tag

- [ ] **Step 3: Confirm `beta` was not bumped unless relizy intentionally requires it**

Run:

```bash
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\alpha-package.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\beta-package.stdout.log
```

Expected:

- `alpha` version changes from `0.0.0`
- `beta` remains `0.0.0` unless the observed relizy behavior proves otherwise and the report explains why

- [ ] **Step 4: Repeat the same artifact verification for sandbox B**

Run:

```bash
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\root-changelog.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\git-log.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\git-tags.stdout.log
```

Expected:

- If sandbox B also has changelog, release commit, and `@sandbox/alpha@...` tag, the canary no longer needs runner for Windows GNU compatibility
- If sandbox B fails while sandbox A passes, keep the Windows compatibility layer in the skill

- [ ] **Step 5: Record the final worktree status**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test status --short
```

Expected:

- Only tracked script/report files are modified
- `.tmp/relizy-canary` and `artifacts/relizy-canary` stay ignored

### Task 5: Fill The Report And Capture The Skill Impact

**Files:**

- Modify: `D:\temp\codex-worktrees\monorepo-relizy-canary-test\docs\reports\2026-04-14-relizy-canary-initial-independent-release-test.md`

- [ ] **Step 1: Rebuild the report from artifact files with a single PowerShell script**

Run:

````powershell
$worktree = "D:\temp\codex-worktrees\monorepo-relizy-canary-test"
$artifacts = Join-Path $worktree "artifacts\relizy-canary"
$reportPath = Join-Path $worktree "docs\reports\2026-04-14-relizy-canary-initial-independent-release-test.md"

function Read-Log {
  param(
    [string]$Sandbox,
    [string[]]$Names
  )

  return ($Names | ForEach-Object {
    $stdout = Join-Path $artifacts (Join-Path $Sandbox "$_.stdout.log")
    $stderr = Join-Path $artifacts (Join-Path $Sandbox "$_.stderr.log")
    @(
      "### $_",
      "",
      if (Test-Path $stdout) { Get-Content -Raw $stdout } else { "<missing stdout>" },
      if (Test-Path $stderr) { Get-Content -Raw $stderr } else { "" }
    ) -join "`n"
  }) -join "`n`n"
}

$aTags = Get-Content -Raw (Join-Path $artifacts "sandbox-a\git-tags.stdout.log")
$bTags = Get-Content -Raw (Join-Path $artifacts "sandbox-b\git-tags.stdout.log")
$aAlpha = Get-Content -Raw (Join-Path $artifacts "sandbox-a\alpha-package.stdout.log")
$bAlpha = Get-Content -Raw (Join-Path $artifacts "sandbox-b\alpha-package.stdout.log")
$aHasChangelog = Test-Path (Join-Path $artifacts "sandbox-a\root-changelog.stdout.log")
$bHasChangelog = Test-Path (Join-Path $artifacts "sandbox-b\root-changelog.stdout.log")
$aPassed = $aHasChangelog -and ($aTags -match "@sandbox/alpha@") -and ($aAlpha -notmatch '"version": "0.0.0"')
$bPassed = $bHasChangelog -and ($bTags -match "@sandbox/alpha@") -and ($bAlpha -notmatch '"version": "0.0.0"')

$runnerRule = if ($aPassed -and $bPassed) { "可以删除" } else { "保留" }
$baselineRule = if ($aPassed -and $bPassed) { "可以删除" } elseif ($aPassed -and -not $bPassed) { "降级为条件化约束" } else { "保留" }
$overall = if ($aPassed -and $bPassed) { "已经" } else { "尚未" }

$aEnv = Read-Log -Sandbox "sandbox-a" -Names @(
  "env-node-version",
  "env-pnpm-version",
  "env-git-version",
  "env-relizy-version",
  "env-where-git",
  "env-where-grep",
  "env-where-head",
  "env-where-sed"
)

$bEnv = Read-Log -Sandbox "sandbox-b" -Names @(
  "env-node-version",
  "env-pnpm-version",
  "env-git-version",
  "env-relizy-version",
  "env-where-git",
  "env-where-grep",
  "env-where-head",
  "env-where-sed"
)

$aResult = Read-Log -Sandbox "sandbox-a" -Names @(
  "help",
  "changelog-dry",
  "release-dry",
  "release-real",
  "git-log",
  "git-tags",
  "alpha-package",
  "beta-package"
)

$bResult = Read-Log -Sandbox "sandbox-b" -Names @(
  "help",
  "changelog-dry",
  "release-dry",
  "release-real",
  "git-log",
  "git-tags",
  "alpha-package",
  "beta-package"
)

$report = @"
# 2026-04-14 relizy canary initial independent release 测试报告

## 测试目标

验证 `relizy@1.3.0-canary.a8967ef.0` 在 Windows 下不经 `relizy-runner` 时，是否已经同时解决：

1. GNU 工具依赖问题
2. initial independent release 的 baseline tag 首发问题

## 测试拓扑

- worktree：`D:\temp\codex-worktrees\monorepo-relizy-canary-test`
- sandbox A：正常 Windows PATH
- sandbox B：裁剪 PATH，仅保留 `node`、`pnpm`、`git` 与 `System32`

## 执行记录

### 环境留痕

#### sandbox A

```log
$aEnv
````

#### sandbox B

```log
$bEnv
```

### sandbox A

```log
$aResult
```

### sandbox B

```log
$bResult
```

## 结论

1. sandbox A：$(if ($aPassed) { "通过" } else { "失败" })。
2. sandbox B：$(if ($bPassed) { "通过" } else { "失败" })。
3. `relizy@1.3.0-canary.a8967ef.0` $overall 同时解决 Windows GNU 工具依赖与 initial independent release baseline tag 首发问题。

## 对 skill 的影响

1. `relizy-runner` 约束：$runnerRule。
2. baseline tag 手工补齐约束：$baselineRule。
3. `--yes` 约束：保留。原因是它属于无 TTY/脚本环境的交互防挂起约束，不属于本次 canary 修复范围。
   "@

[System.IO.File]::WriteAllText($reportPath, $report, [System.Text.UTF8Encoding]::new($false))

````plain

- [ ] **Step 2: Review the generated report and compare it to the raw artifacts**

Run:

```bash
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\docs\reports\2026-04-14-relizy-canary-initial-independent-release-test.md
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-a\release-real.stdout.log
Get-Content -Raw D:\temp\codex-worktrees\monorepo-relizy-canary-test\artifacts\relizy-canary\sandbox-b\release-real.stdout.log
````

Expected:

- The report conclusion matches the artifact evidence
- If the script-derived conclusion is wrong, edit the report immediately and explain the discrepancy in the conclusion section

- [ ] **Step 3: Verify the report formatting**

Run:

```bash
pnpm -C D:\temp\codex-worktrees\monorepo-relizy-canary-test exec prettier --check docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test diff --check -- docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md
```

Expected:

- Prettier passes
- `git diff --check` prints nothing

- [ ] **Step 4: Commit the completed report**

Run:

```bash
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test add docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md
git -C D:\temp\codex-worktrees\monorepo-relizy-canary-test commit -m "test(utils): record relizy canary initial release results"
```

Expected:

- A final report commit on the worktree branch
