param(
  [string]$Root,
  [string]$ArtifactsRoot
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

$worktreeRoot = (Resolve-Path (Join-Path $scriptDirectory "..\..")).Path

if (-not $PSBoundParameters.ContainsKey("Root") -or [string]::IsNullOrWhiteSpace($Root)) {
  $Root = Join-Path $worktreeRoot ".tmp\relizy-canary"
}

if (-not $PSBoundParameters.ContainsKey("ArtifactsRoot") -or [string]::IsNullOrWhiteSpace($ArtifactsRoot)) {
  $ArtifactsRoot = Join-Path $worktreeRoot "artifacts\relizy-canary"
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Content
  )

  $parent = Split-Path -Parent $Path
  if ($parent) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }

  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Read-CommandText {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$ArgumentList
  )

  $parts = foreach ($argument in $ArgumentList) {
    if ($null -eq $argument) {
      '""'
      continue
    }

    $value = [string]$argument
    if ($value -match '[\s"`]') {
      '"' + ($value -replace '"', '\"') + '"'
    }
    else {
      $value
    }
  }

  return $parts -join " "
}

function Save-TextCapture {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [AllowNull()]
    [AllowEmptyString()]
    [string]$Content
  )

  if ($null -eq $Content) {
    $Content = ""
  }

  Write-Utf8File -Path $Path -Content $Content
}

function Append-Utf8Lines {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string[]]$Lines
  )

  $content = ""
  if (Test-Path -LiteralPath $Path) {
    $content = [System.IO.File]::ReadAllText($Path, $utf8NoBom)
  }

  if ($content.Length -gt 0 -and -not $content.EndsWith([Environment]::NewLine)) {
    $content += [Environment]::NewLine
  }

  $content += ($Lines -join [Environment]::NewLine)
  if (-not $content.EndsWith([Environment]::NewLine)) {
    $content += [Environment]::NewLine
  }

  Write-Utf8File -Path $Path -Content $content
}

function Get-UniquePathEntries {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Entries
  )

  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  $result = [System.Collections.Generic.List[string]]::new()

  foreach ($entry in $Entries) {
    if ([string]::IsNullOrWhiteSpace($entry)) {
      continue
    }

    if (-not (Test-Path -LiteralPath $entry)) {
      continue
    }

    if ($seen.Add($entry)) {
      $result.Add($entry)
    }
  }

  return $result.ToArray()
}

function Get-SanitizedPath {
  $nodeCommand = Get-Command node.exe -ErrorAction Stop
  $pnpmCommand = Get-Command pnpm.cmd -ErrorAction Stop
  $gitCommand = Get-Command git.exe -ErrorAction Stop

  $entries = @(
    (Split-Path -Parent $nodeCommand.Source),
    (Split-Path -Parent $pnpmCommand.Source),
    (Split-Path -Parent $gitCommand.Source),
    $env:SystemRoot,
    (Join-Path $env:SystemRoot "System32"),
    (Join-Path $env:SystemRoot "System32\Wbem"),
    (Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0"),
    (Join-Path $env:SystemRoot "System32\OpenSSH")
  )

  return (Get-UniquePathEntries -Entries $entries) -join ";"
}

function Invoke-CapturedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SandboxName,
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory,
    [Parameter(Mandatory = $true)]
    [string]$ArtifactDirectory,
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$ArgumentList,
    [hashtable]$EnvironmentOverrides = @{},
    [switch]$AllowFailure
  )

  $stdoutPath = Join-Path $ArtifactDirectory "$Name.stdout.log"
  $stderrPath = Join-Path $ArtifactDirectory "$Name.stderr.log"
  $metaPath = Join-Path $ArtifactDirectory "$Name.meta.txt"

  $commandText = "$FilePath $(Read-CommandText -ArgumentList $ArgumentList)".Trim()
  $metadataLines = [System.Collections.Generic.List[string]]::new()
  $metadataLines.Add("sandbox=$SandboxName")
  $metadataLines.Add("cwd=$WorkingDirectory")
  $metadataLines.Add("command=$commandText")
  $metadataLines.Add("started_at=$(Get-Date -Format o)")

  foreach ($entry in $EnvironmentOverrides.GetEnumerator() | Sort-Object Name) {
    $metadataLines.Add("env.$($entry.Key)=$($entry.Value)")
  }

  Write-Utf8File -Path $metaPath -Content (($metadataLines -join [Environment]::NewLine) + [Environment]::NewLine)

  $stdoutParent = Split-Path -Parent $stdoutPath
  $stderrParent = Split-Path -Parent $stderrPath
  if ($stdoutParent) {
    New-Item -ItemType Directory -Force -Path $stdoutParent | Out-Null
  }
  if ($stderrParent) {
    New-Item -ItemType Directory -Force -Path $stderrParent | Out-Null
  }

  $previousEnvironment = @{}
  foreach ($entry in $EnvironmentOverrides.GetEnumerator()) {
    $previousEnvironment[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, "Process")
    [Environment]::SetEnvironmentVariable($entry.Key, [string]$entry.Value, "Process")
  }

  try {
    $process = Start-Process `
      -FilePath $FilePath `
      -ArgumentList $ArgumentList `
      -WorkingDirectory $WorkingDirectory `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath `
      -Wait `
      -PassThru `
      -NoNewWindow

    $exitCode = $process.ExitCode
  }
  finally {
    foreach ($entry in $previousEnvironment.GetEnumerator()) {
      [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
    }
  }

  if (-not (Test-Path -LiteralPath $stdoutPath)) {
    Write-Utf8File -Path $stdoutPath -Content ""
  }
  if (-not (Test-Path -LiteralPath $stderrPath)) {
    Write-Utf8File -Path $stderrPath -Content ""
  }

  Append-Utf8Lines -Path $metaPath -Lines @(
    "finished_at=$(Get-Date -Format o)",
    "exit_code=$exitCode"
  )

  if (-not $AllowFailure -and $exitCode -ne 0) {
    throw "Command '$commandText' failed in '$SandboxName' with exit code $exitCode."
  }

  return [pscustomobject]@{
    Sandbox = $SandboxName
    Name = $Name
    Command = $commandText
    ExitCode = $exitCode
    StdoutPath = $stdoutPath
    StderrPath = $stderrPath
    MetaPath = $metaPath
  }
}

function Copy-ArtifactFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [Parameter(Mandatory = $true)]
    [string]$TargetPath
  )

  if (Test-Path -LiteralPath $SourcePath) {
    $targetParent = Split-Path -Parent $TargetPath
    if ($targetParent) {
      New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
    }

    Copy-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
    return [pscustomobject]@{
      Source = $SourcePath
      Target = $TargetPath
      Success = $true
      Detail = "copied"
    }
  }

  Write-Utf8File -Path $TargetPath -Content "missing: $SourcePath`n"
  return [pscustomobject]@{
    Source = $SourcePath
    Target = $TargetPath
    Success = $false
    Detail = "missing"
  }
}

function Test-SandboxExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SandboxRoot
  )

  $requiredPaths = @(
    $SandboxRoot,
    (Join-Path $SandboxRoot ".git"),
    (Join-Path $SandboxRoot "package.json"),
    (Join-Path $SandboxRoot "packages\alpha\package.json"),
    (Join-Path $SandboxRoot "packages\beta\package.json"),
    (Join-Path $SandboxRoot "node_modules")
  )

  foreach ($path in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $path)) {
      return $false
    }
  }

  return $true
}

function Invoke-SandboxMatrix {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SandboxName,
    [Parameter(Mandatory = $true)]
    [string]$SandboxRoot,
    [Parameter(Mandatory = $true)]
    [string]$SandboxArtifactsRoot,
    [Parameter(Mandatory = $true)]
    [hashtable]$EnvironmentOverrides
  )

  New-Item -ItemType Directory -Force -Path $SandboxArtifactsRoot | Out-Null

  $commands = @(
    @{
      Name = "00-environment-node-version"
      FilePath = "node"
      ArgumentList = @("--version")
    },
    @{
      Name = "01-environment-pnpm-version"
      FilePath = "pnpm"
      ArgumentList = @("--version")
    },
    @{
      Name = "02-environment-git-version"
      FilePath = "git"
      ArgumentList = @("--version")
    },
    @{
      Name = "03-environment-relizy-version"
      FilePath = "pnpm"
      ArgumentList = @("exec", "relizy", "--version")
    },
    @{
      Name = "04-where-node"
      FilePath = "where.exe"
      ArgumentList = @("node")
      AllowFailure = $true
    },
    @{
      Name = "05-where-pnpm"
      FilePath = "where.exe"
      ArgumentList = @("pnpm")
      AllowFailure = $true
    },
    @{
      Name = "06-where-git"
      FilePath = "where.exe"
      ArgumentList = @("git")
      AllowFailure = $true
    },
    @{
      Name = "07-where-relizy"
      FilePath = "where.exe"
      ArgumentList = @("relizy")
      AllowFailure = $true
    },
    @{
      Name = "08-where-bash"
      FilePath = "where.exe"
      ArgumentList = @("bash")
      AllowFailure = $true
    },
    @{
      Name = "09-where-sh"
      FilePath = "where.exe"
      ArgumentList = @("sh")
      AllowFailure = $true
    },
    @{
      Name = "10-where-sed"
      FilePath = "where.exe"
      ArgumentList = @("sed")
      AllowFailure = $true
    },
    @{
      Name = "11-where-grep"
      FilePath = "where.exe"
      ArgumentList = @("grep")
      AllowFailure = $true
    },
    @{
      Name = "12-relizy-help"
      FilePath = "pnpm"
      ArgumentList = @("exec", "relizy", "--help")
    },
    @{
      Name = "13-relizy-changelog-dry-run"
      FilePath = "pnpm"
      ArgumentList = @("exec", "relizy", "changelog", "--dry-run")
      AllowFailure = $true
    },
    @{
      Name = "14-relizy-release-dry-run"
      FilePath = "pnpm"
      ArgumentList = @("exec", "relizy", "release", "--dry-run")
      AllowFailure = $true
    },
    @{
      Name = "15-relizy-release-real"
      FilePath = "pnpm"
      ArgumentList = @("exec", "relizy", "release")
      AllowFailure = $true
    },
    @{
      Name = "16-git-status"
      FilePath = "git"
      ArgumentList = @("status", "--short", "--branch")
      AllowFailure = $true
    },
    @{
      Name = "17-git-log"
      FilePath = "git"
      ArgumentList = @("log", "--decorate", "--graph", "--oneline", "--max-count=20")
      AllowFailure = $true
    },
    @{
      Name = "18-git-tags"
      FilePath = "git"
      ArgumentList = @("tag", "--list")
      AllowFailure = $true
    }
  )

  $results = [System.Collections.Generic.List[object]]::new()
  foreach ($command in $commands) {
    $result = Invoke-CapturedCommand `
      -SandboxName $SandboxName `
      -WorkingDirectory $SandboxRoot `
      -ArtifactDirectory $SandboxArtifactsRoot `
      -Name ($command["Name"]) `
      -FilePath ($command["FilePath"]) `
      -ArgumentList ($command["ArgumentList"]) `
      -EnvironmentOverrides $EnvironmentOverrides `
      -AllowFailure:([bool]($command.ContainsKey("AllowFailure") -and $command["AllowFailure"]))

    $results.Add($result)
  }

  $copiedArtifacts = @(
    (Copy-ArtifactFile -SourcePath (Join-Path $SandboxRoot "CHANGELOG.md") -TargetPath (Join-Path $SandboxArtifactsRoot "20-root-CHANGELOG.md")),
    (Copy-ArtifactFile -SourcePath (Join-Path $SandboxRoot "packages\alpha\package.json") -TargetPath (Join-Path $SandboxArtifactsRoot "21-packages-alpha-package.json")),
    (Copy-ArtifactFile -SourcePath (Join-Path $SandboxRoot "packages\beta\package.json") -TargetPath (Join-Path $SandboxArtifactsRoot "22-packages-beta-package.json"))
  )

  return [pscustomobject]@{
    CommandResults = $results
    CopiedArtifacts = $copiedArtifacts
  }
}

if (-not (Test-SandboxExists -SandboxRoot (Join-Path $Root "sandbox-a")) -or -not (Test-SandboxExists -SandboxRoot (Join-Path $Root "sandbox-b"))) {
  throw "Sandboxes are missing or incomplete under '$Root'. Run new-sandboxes.ps1 first."
}

New-Item -ItemType Directory -Force -Path $ArtifactsRoot | Out-Null

$sanitizedPath = Get-SanitizedPath
$matrixSummary = [System.Collections.Generic.List[object]]::new()
$copiedArtifactSummary = [System.Collections.Generic.List[object]]::new()

$sandboxSettings = @(
  @{
    Name = "sandbox-a"
    Root = (Join-Path $Root "sandbox-a")
    Artifacts = (Join-Path $ArtifactsRoot "sandbox-a")
    Environment = @{
      PATH = $env:PATH
    }
  },
  @{
    Name = "sandbox-b"
    Root = (Join-Path $Root "sandbox-b")
    Artifacts = (Join-Path $ArtifactsRoot "sandbox-b")
    Environment = @{
      PATH = $sanitizedPath
    }
  }
)

foreach ($sandbox in $sandboxSettings) {
  Write-Utf8File -Path (Join-Path $sandbox.Artifacts "00-path.txt") -Content ($sandbox.Environment.PATH + [Environment]::NewLine)
  $sandboxRun = Invoke-SandboxMatrix `
    -SandboxName $sandbox.Name `
    -SandboxRoot $sandbox.Root `
    -SandboxArtifactsRoot $sandbox.Artifacts `
    -EnvironmentOverrides $sandbox.Environment

  foreach ($result in $sandboxRun.CommandResults) {
    $matrixSummary.Add($result)
  }

  foreach ($artifact in $sandboxRun.CopiedArtifacts) {
    $copiedArtifactSummary.Add([pscustomobject]@{
      Sandbox = $sandbox.Name
      Source = $artifact.Source
      Target = $artifact.Target
      Success = $artifact.Success
      Detail = $artifact.Detail
    })
  }
}

$summaryLines = [System.Collections.Generic.List[string]]::new()
$summaryLines.Add("root=$Root")
$summaryLines.Add("artifacts_root=$ArtifactsRoot")
$summaryLines.Add("generated_at=$(Get-Date -Format o)")
$summaryLines.Add("")

foreach ($sandbox in $sandboxSettings) {
  $summaryLines.Add("[$($sandbox.Name)]")
  $sandboxResults = $matrixSummary | Where-Object { $_.Sandbox -eq $sandbox.Name }
  foreach ($result in $sandboxResults) {
    $summaryLines.Add("$($result.Name) exit=$($result.ExitCode)")
  }
  foreach ($artifact in ($copiedArtifactSummary | Where-Object { $_.Sandbox -eq $sandbox.Name })) {
    $summaryLines.Add("copy target=$($artifact.Target) success=$($artifact.Success) detail=$($artifact.Detail)")
  }
  $summaryLines.Add("")
}

Write-Utf8File -Path (Join-Path $ArtifactsRoot "summary.txt") -Content (($summaryLines -join [Environment]::NewLine) + [Environment]::NewLine)
