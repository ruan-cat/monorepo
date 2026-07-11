[CmdletBinding()]
param(
  [switch]$Apply,
  [string[]]$IncludePattern = @(),
  [string[]]$ExcludePattern = @(),
  [int]$MinAgeMinutes = 30,
  [string]$OutputPath,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Assert-RegexList {
  param(
    [string[]]$Patterns,
    [string]$Name
  )

  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) {
      continue
    }

    try {
      [void]([regex]$pattern)
    }
    catch {
      throw "$Name contains an invalid regex pattern: $pattern"
    }
  }
}

function Convert-CimDate {
  param($Value)

  if ($null -eq $Value) {
    return $null
  }

  if ($Value -is [DateTime]) {
    return $Value
  }

  try {
    return [System.Management.ManagementDateTimeConverter]::ToDateTime([string]$Value)
  }
  catch {
    return $null
  }
}

function Get-RegexMatches {
  param(
    [string]$Text,
    [string[]]$Patterns
  )

  $hits = @()
  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) {
      continue
    }

    if ($Text -match $pattern) {
      $hits += $pattern
    }
  }

  return @($hits)
}

function Get-WorkingDirectoryHint {
  param([string]$CommandLine)

  if ([string]::IsNullOrWhiteSpace($CommandLine)) {
    return $null
  }

  $patterns = @(
    '(?i)(?:--cwd|--root|--project|--dir|--workspace)\s+["'']([^"'']+)["'']',
    '(?i)(?:--cwd|--root|--project|--dir|--workspace)\s+([A-Za-z]:\\\S+)',
    '(?i)(?:cwd|workspace|projectRoot)=["'']([^"'']+)["'']',
    '(?i)(?:cwd|workspace|projectRoot)=([A-Za-z]:\\\S+)'
  )

  foreach ($pattern in $patterns) {
    $match = [regex]::Match($CommandLine, $pattern)
    if ($match.Success -and $match.Groups.Count -gt 1) {
      return $match.Groups[1].Value
    }
  }

  return $null
}

function Get-ProcessMap {
  $map = @{}
  $allProcesses = Get-CimInstance -ClassName Win32_Process

  foreach ($process in $allProcesses) {
    $map[[int]$process.ProcessId] = $process
  }

  return $map
}

function Get-ParentPidSet {
  param(
    [hashtable]$ProcessMap,
    [int]$StartPid
  )

  $set = @{}
  $currentPid = $StartPid
  $guard = 0

  while ($currentPid -gt 0 -and $guard -lt 64) {
    if ($set.ContainsKey($currentPid)) {
      break
    }

    $set[$currentPid] = $true

    if (-not $ProcessMap.ContainsKey($currentPid)) {
      break
    }

    $parentPid = [int]$ProcessMap[$currentPid].ParentProcessId
    if ($parentPid -le 0) {
      break
    }

    $currentPid = $parentPid
    $guard += 1
  }

  return $set
}

function Get-ListeningPortMap {
  $map = @{}
  $cmd = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue

  if ($null -eq $cmd) {
    return $map
  }

  try {
    $connections = Get-NetTCPConnection -State Listen -ErrorAction Stop
    foreach ($connection in $connections) {
      $ownerPid = [int]$connection.OwningProcess
      if (-not $map.ContainsKey($ownerPid)) {
        $map[$ownerPid] = @()
      }

      $map[$ownerPid] += [ordered]@{
        Protocol     = "TCP"
        LocalAddress = $connection.LocalAddress
        LocalPort    = [int]$connection.LocalPort
        State        = [string]$connection.State
      }
    }
  }
  catch {
    return $map
  }

  return $map
}

function Get-ListeningPorts {
  param(
    [hashtable]$PortMap,
    [int]$ProcessId
  )

  if ($PortMap.ContainsKey($ProcessId)) {
    return @($PortMap[$ProcessId])
  }

  return @()
}

function Get-ProcessExists {
  param([int]$ProcessId)

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  return ($null -ne $process)
}

Assert-RegexList -Patterns $IncludePattern -Name "IncludePattern"
Assert-RegexList -Patterns $ExcludePattern -Name "ExcludePattern"

if ($Apply -and $IncludePattern.Count -eq 0) {
  throw "-Apply requires at least one -IncludePattern. Refusing broad cleanup."
}

if ($Apply -and [string]::IsNullOrWhiteSpace($OutputPath)) {
  throw "-Apply requires -OutputPath so the candidate ledger can be reviewed."
}

if ($Force -and -not $Apply) {
  throw "-Force is only valid with -Apply."
}

$agentKeywordPatterns = @(
  "codex",
  "claude",
  "cursor",
  "workbuddy",
  "qoder",
  "gemini",
  "kiro",
  "zcode",
  "antigravity",
  "mcp",
  "memorix",
  "agent-team",
  "subagent",
  "agent"
)

$sampledAt = Get-Date
$processMap = Get-ProcessMap
$listeningPortMap = Get-ListeningPortMap
$protectedPids = Get-ParentPidSet -ProcessMap $processMap -StartPid $PID
$nodeProcesses = Get-CimInstance -ClassName Win32_Process -Filter "Name = 'node.exe'"
$entries = @()

foreach ($process in $nodeProcesses) {
  $pidValue = [int]$process.ProcessId
  $parentPid = [int]$process.ParentProcessId
  $commandLine = [string]$process.CommandLine
  $executablePath = [string]$process.ExecutablePath
  $creationTime = Convert-CimDate $process.CreationDate
  $ageMinutes = $null

  if ($null -ne $creationTime) {
    $ageMinutes = [math]::Round(($sampledAt - $creationTime).TotalMinutes, 2)
  }

  $parentAlive = $false
  $parentName = $null
  $parentCommandLine = $null

  if ($parentPid -gt 0 -and $processMap.ContainsKey($parentPid)) {
    $parentAlive = $true
    $parentName = [string]$processMap[$parentPid].Name
    $parentCommandLine = [string]$processMap[$parentPid].CommandLine
  }

  $workingDirectoryHint = Get-WorkingDirectoryHint -CommandLine $commandLine
  $listeningPorts = Get-ListeningPorts -PortMap $listeningPortMap -ProcessId $pidValue
  $evidenceText = @(
    $commandLine,
    $executablePath,
    $workingDirectoryHint,
    $parentName,
    $parentCommandLine
  ) -join "`n"

  $includeMatches = Get-RegexMatches -Text $evidenceText -Patterns $IncludePattern
  $excludeMatches = Get-RegexMatches -Text $evidenceText -Patterns $ExcludePattern
  $agentKeywordMatches = Get-RegexMatches -Text $evidenceText -Patterns $agentKeywordPatterns

  $safetyIssues = @()
  $riskFlags = @()

  if ($protectedPids.ContainsKey($pidValue)) {
    $safetyIssues += "self-or-parent-chain"
  }

  if ($null -eq $ageMinutes) {
    $safetyIssues += "unknown-age"
  }
  elseif ($ageMinutes -lt $MinAgeMinutes) {
    $safetyIssues += "younger-than-min-age"
  }

  if ($IncludePattern.Count -eq 0) {
    $safetyIssues += "no-include-pattern"
  }
  elseif ($includeMatches.Count -eq 0) {
    $safetyIssues += "include-pattern-not-matched"
  }

  if ($excludeMatches.Count -gt 0) {
    $safetyIssues += "exclude-pattern-matched"
  }

  if ($parentAlive) {
    $safetyIssues += "parent-process-alive"
  }

  if ($listeningPorts.Count -gt 0) {
    $riskFlags += "listening-port"
    $safetyIssues += "listening-port"
  }

  if ([string]::IsNullOrWhiteSpace($workingDirectoryHint)) {
    $riskFlags += "working-directory-unresolved"
  }

  if ($agentKeywordMatches.Count -eq 0) {
    $riskFlags += "no-agent-keyword"
  }

  $decision = "audit-only"
  if ($excludeMatches.Count -gt 0) {
    $decision = "excluded"
  }
  elseif ($safetyIssues.Count -eq 0) {
    $decision = "candidate"
  }

  $ownershipScore = 0
  if ($includeMatches.Count -gt 0) { $ownershipScore += 2 }
  if (-not $parentAlive) { $ownershipScore += 2 }
  if ($agentKeywordMatches.Count -gt 0) { $ownershipScore += 1 }
  if (-not [string]::IsNullOrWhiteSpace($workingDirectoryHint)) { $ownershipScore += 1 }
  if ($listeningPorts.Count -gt 0) { $ownershipScore += 1 }

  $entries += [ordered]@{
    Pid                  = $pidValue
    ParentPid            = $parentPid
    ParentAlive          = $parentAlive
    ParentName           = $parentName
    Name                 = [string]$process.Name
    ExecutablePath       = $executablePath
    CommandLine          = $commandLine
    CreationTime         = if ($null -ne $creationTime) { $creationTime.ToString("o") } else { $null }
    AgeMinutes           = $ageMinutes
    WorkingDirectoryHint = $workingDirectoryHint
    ListeningPorts       = @($listeningPorts)
    IncludeMatches       = @($includeMatches)
    ExcludeMatches       = @($excludeMatches)
    AgentKeywordMatches  = @($agentKeywordMatches)
    OwnershipScore       = $ownershipScore
    RiskFlags            = @($riskFlags)
    SafetyIssues         = @($safetyIssues)
    Decision             = $decision
  }
}

$candidateEntries = @($entries | Where-Object { $_.Decision -eq "candidate" })
$ledger = [ordered]@{
  Tool                 = "agent-team-node-cleanup"
  Mode                 = if ($Apply) { "apply" } else { "dry-run" }
  SampledAt            = $sampledAt.ToString("o")
  MinAgeMinutes        = $MinAgeMinutes
  IncludePattern       = @($IncludePattern)
  ExcludePattern       = @($ExcludePattern)
  ProtectedPids        = @($protectedPids.Keys | Sort-Object)
  Summary              = [ordered]@{
    NodeProcessCount = $entries.Count
    CandidateCount   = $candidateEntries.Count
    ExcludedCount    = @($entries | Where-Object { $_.Decision -eq "excluded" }).Count
    AuditOnlyCount   = @($entries | Where-Object { $_.Decision -eq "audit-only" }).Count
  }
  Processes            = @($entries)
  StopResults          = @()
  Verification         = $null
}

if ($Apply) {
  $stopResults = @()

  foreach ($entry in $candidateEntries) {
    try {
      Stop-Process -Id $entry.Pid -ErrorAction Stop
      Start-Sleep -Milliseconds 300
      if ($Force -and (Get-ProcessExists -ProcessId $entry.Pid)) {
        Stop-Process -Id $entry.Pid -Force -ErrorAction Stop
      }
      $stopResults += [ordered]@{
        Pid    = $entry.Pid
        Status = "stopped"
        Force  = [bool]$Force
        Error  = $null
      }
    }
    catch {
      $stopResults += [ordered]@{
        Pid    = $entry.Pid
        Status = "error"
        Force  = [bool]$Force
        Error  = $_.Exception.Message
      }
    }
  }

  Start-Sleep -Milliseconds 500

  $remaining = @()
  foreach ($entry in $candidateEntries) {
    if (Get-ProcessExists -ProcessId $entry.Pid) {
      $remaining += $entry.Pid
    }
  }

  $ledger.StopResults = @($stopResults)
  $ledger.Verification = [ordered]@{
    ResampledAt             = (Get-Date).ToString("o")
    StoppedCount            = @($stopResults | Where-Object { $_.Status -eq "stopped" }).Count
    ErrorCount              = @($stopResults | Where-Object { $_.Status -eq "error" }).Count
    RemainingCandidatePids  = @($remaining)
    VerificationInstruction = "If any PID remains or respawns, inspect its parent service before running another apply."
  }
}
else {
  $ledger.Verification = [ordered]@{
    ResampledAt             = $null
    RemainingCandidatePids  = @()
    VerificationInstruction = "Dry-run only. Review Processes, then rerun with -Apply only after narrowing IncludePattern and ExcludePattern."
  }
}

$json = $ledger | ConvertTo-Json -Depth 8

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  $resolvedOutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
  $outputDir = Split-Path -Parent $resolvedOutputPath

  if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  }

  Set-Content -LiteralPath $resolvedOutputPath -Value $json -Encoding UTF8
}

Write-Output $json
