param(
  [string]$Root
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDirectory = if ($PSScriptRoot) {
  $PSScriptRoot
}
elseif ($MyInvocation.MyCommand.Path) {
  Split-Path -Parent $MyInvocation.MyCommand.Path
}
else {
  (Get-Location).Path
}

if (-not $PSBoundParameters.ContainsKey("Root") -or [string]::IsNullOrWhiteSpace($Root)) {
  $worktreeRoot = (Resolve-Path (Join-Path $scriptDirectory "..\..")).Path
  $Root = Join-Path $worktreeRoot ".tmp\relizy-canary"
}

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  $parent = Split-Path -Parent $Path
  if ($parent) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }

  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$ArgumentList,
    [string]$WorkingDirectory
  )

  $originalLocation = Get-Location
  try {
    if ($WorkingDirectory) {
      Set-Location -LiteralPath $WorkingDirectory
    }

    & $FilePath @ArgumentList
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      $argsText = $ArgumentList -join " "
      throw "Command '$FilePath $argsText' failed with exit code $exitCode."
    }
  }
  finally {
    Set-Location -LiteralPath $originalLocation
  }
}

function Invoke-GitCommit {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Directory,
    [Parameter(Mandatory = $true)]
    [string]$Message,
    [Parameter(Mandatory = $true)]
    [string]$Date
  )

  $previousAuthorDate = [Environment]::GetEnvironmentVariable("GIT_AUTHOR_DATE", "Process")
  $previousCommitterDate = [Environment]::GetEnvironmentVariable("GIT_COMMITTER_DATE", "Process")
  [Environment]::SetEnvironmentVariable("GIT_AUTHOR_DATE", $Date, "Process")
  [Environment]::SetEnvironmentVariable("GIT_COMMITTER_DATE", $Date, "Process")

  try {
    Invoke-CheckedCommand -FilePath "git" -ArgumentList @("commit", "-m", $Message) -WorkingDirectory $Directory
  }
  finally {
    [Environment]::SetEnvironmentVariable("GIT_AUTHOR_DATE", $previousAuthorDate, "Process")
    [Environment]::SetEnvironmentVariable("GIT_COMMITTER_DATE", $previousCommitterDate, "Process")
  }
}

function Assert-PathExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw $Message
  }
}

function Assert-SandboxHistory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Directory
  )

  $count = & git -C $Directory rev-list --count HEAD
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to count git history for '$Directory'."
  }

  if ($count -ne 3) {
    throw "Expected exactly 3 commits in '$Directory', found $count."
  }

  $history = & git -C $Directory log --reverse --no-patch --format=%H%x09%P%x09%s HEAD
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to read git history for '$Directory'."
  }

  $commits = @()
  foreach ($line in $history) {
    $text = $line.ToString()
    if ($text -match '^commit\s+') {
      continue
    }

    if ([string]::IsNullOrWhiteSpace($text)) {
      continue
    }

    $parts = $text -split "`t", 3
    if ($parts.Count -ne 3) {
      throw "Unexpected commit record format in '$Directory': '$text'."
    }

    $commits += [pscustomobject]@{
      Sha = $parts[0]
      Parents = $parts[1]
      Subject = $parts[2]
    }
  }

  if ($commits.Count -ne 3) {
    throw "Expected exactly 3 commits in '$Directory', found $($commits.Count)."
  }

  if ($commits[0].Parents) {
    throw "Expected the root commit in '$Directory' to have no parent, got '$($commits[0].Parents)'."
  }

  if ($commits[0].Subject -ne "chore: init relizy canary sandbox") {
    throw "Unexpected root commit subject in '$Directory': '$($commits[0].Subject)'."
  }

  if ($commits[1].Subject -ne "feat(alpha): add first independent release trigger") {
    throw "Unexpected middle commit subject in '$Directory': '$($commits[1].Subject)'."
  }

  if ($commits[2].Subject -ne "docs: add root note") {
    throw "Unexpected HEAD commit subject in '$Directory': '$($commits[2].Subject)'."
  }

  if ($commits[1].Parents -notmatch [regex]::Escape($commits[0].Sha)) {
    throw "Commit '$($commits[1].Sha)' in '$Directory' does not point to the expected root parent."
  }

  if ($commits[2].Parents -notmatch [regex]::Escape($commits[1].Sha)) {
    throw "Commit '$($commits[2].Sha)' in '$Directory' does not point to the expected feature commit parent."
  }
}

function New-Sandbox {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $dir = Join-Path $Root $Name
  if (Test-Path -LiteralPath $dir) {
    Remove-Item -LiteralPath $dir -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $dir "packages\alpha\src") | Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $dir "packages\beta\src") | Out-Null

  Write-Utf8File -Path (Join-Path $dir ".gitignore") -Content @"
node_modules/
.pnpm-store/
dist/
coverage/
*.log
"@

  Write-Utf8File -Path (Join-Path $dir "pnpm-workspace.yaml") -Content @"
packages:
  - packages/*
"@

  Write-Utf8File -Path (Join-Path $dir "package.json") -Content @"
{
  "name": "relizy-canary-sandbox",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@10.21.0",
  "devDependencies": {
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
  const workspace = parsePnpmWorkspaceYaml(content).toJSON();
  return (workspace.packages ?? []).filter((value: string) => !value.startsWith("!"));
}

export default defineConfig({
  projectName: "relizy-canary-sandbox",
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
# relizy canary sandbox
"@

  Invoke-CheckedCommand -FilePath "git" -ArgumentList @("init") -WorkingDirectory $dir
  Invoke-CheckedCommand -FilePath "git" -ArgumentList @("config", "user.name", "Codex Test") -WorkingDirectory $dir
  Invoke-CheckedCommand -FilePath "git" -ArgumentList @("config", "user.email", "codex@example.com") -WorkingDirectory $dir
  Invoke-CheckedCommand -FilePath "pnpm" -ArgumentList @("install", "--ignore-scripts") -WorkingDirectory $dir
  Invoke-CheckedCommand -FilePath "git" -ArgumentList @("add", ".") -WorkingDirectory $dir
  Invoke-GitCommit -Directory $dir -Message "chore: init relizy canary sandbox" -Date "2026-04-14T09:00:00+08:00"

  Write-Utf8File -Path (Join-Path $dir "packages\alpha\src\index.ts") -Content @"
export const alpha = "alpha";

export const alphaFeature = "first-independent-release";
"@
  Invoke-CheckedCommand -FilePath "git" -ArgumentList @("add", "packages/alpha/src/index.ts") -WorkingDirectory $dir
  Invoke-GitCommit -Directory $dir -Message "feat(alpha): add first independent release trigger" -Date "2026-04-14T09:30:00+08:00"

  Write-Utf8File -Path (Join-Path $dir "README.md") -Content @"
# relizy canary sandbox

- docs note
"@
  Invoke-CheckedCommand -FilePath "git" -ArgumentList @("add", "README.md") -WorkingDirectory $dir
  Invoke-GitCommit -Directory $dir -Message "docs: add root note" -Date "2026-04-14T10:00:00+08:00"

  Assert-PathExists -Path $dir -Message "Sandbox directory '$dir' was not created."
  Assert-PathExists -Path (Join-Path $dir ".git") -Message "Sandbox '$Name' is missing its .git directory."
  Assert-PathExists -Path (Join-Path $dir "node_modules") -Message "Sandbox '$Name' is missing node_modules."
  Assert-PathExists -Path (Join-Path $dir "packages") -Message "Sandbox '$Name' is missing packages."
  Assert-PathExists -Path (Join-Path $dir "packages\alpha") -Message "Sandbox '$Name' is missing packages\\alpha."
  Assert-PathExists -Path (Join-Path $dir "packages\beta") -Message "Sandbox '$Name' is missing packages\\beta."
  Assert-PathExists -Path (Join-Path $dir ".gitignore") -Message "Sandbox '$Name' is missing .gitignore."
  Assert-PathExists -Path (Join-Path $dir "pnpm-workspace.yaml") -Message "Sandbox '$Name' is missing pnpm-workspace.yaml."
  Assert-PathExists -Path (Join-Path $dir "package.json") -Message "Sandbox '$Name' is missing package.json."
  Assert-PathExists -Path (Join-Path $dir "relizy.config.ts") -Message "Sandbox '$Name' is missing relizy.config.ts."
  Assert-PathExists -Path (Join-Path $dir "pnpm-lock.yaml") -Message "Sandbox '$Name' is missing pnpm-lock.yaml."
  Assert-PathExists -Path (Join-Path $dir "README.md") -Message "Sandbox '$Name' is missing README.md."
  Assert-PathExists -Path (Join-Path $dir "packages\alpha\package.json") -Message "Sandbox '$Name' is missing packages\\alpha\\package.json."
  Assert-PathExists -Path (Join-Path $dir "packages\alpha\src\index.ts") -Message "Sandbox '$Name' is missing packages\\alpha\\src\\index.ts."
  Assert-PathExists -Path (Join-Path $dir "packages\beta\package.json") -Message "Sandbox '$Name' is missing packages\\beta\\package.json."
  Assert-PathExists -Path (Join-Path $dir "packages\beta\src\index.ts") -Message "Sandbox '$Name' is missing packages\\beta\\src\\index.ts."
  Assert-SandboxHistory -Directory $dir
}

New-Item -ItemType Directory -Force -Path $Root | Out-Null
New-Sandbox -Name "sandbox-a"
New-Sandbox -Name "sandbox-b"
