# Entry point: validates user-facing parameters, loads the cleanup pipeline in dependency order,
# then forwards one assembled parameter set to the workflow. Destructive behavior remains gated
# inside the workflow and execution modules rather than being inferred during module loading.
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]
param(
  [switch]$Apply,
  [string[]]$IncludePattern = @(),
  [string[]]$ExcludePattern = @(),
  [ValidateNotNullOrEmpty()]
  [string[]]$ProcessName = @(
    "node.exe",
    "npx.exe",
    "cmd.exe",
    "powershell.exe",
    "pwsh.exe",
    "conhost.exe",
    "chrome.exe",
    "msedge.exe",
    "chromium.exe",
    "agent-browser.exe",
    "agent-browser-cli.exe",
    "WorkBuddy.exe",
    "agent-browser-win32-x64.exe",
    "bash.exe"
  ),
  [int]$MinAgeMinutes = 30,
  [string]$OutputPath,
  [switch]$Force,
  [switch]$EnableStuckOneShotRecovery,
  [string[]]$OneShotCommandPattern = @(),
  [ValidateRange(1, 60)]
  [int]$CpuSampleIntervalSeconds = 5,
  [ValidateRange(0.1, 600)]
  [double]$MinCpuDeltaSeconds = 3,
  [string]$WorkBuddyPoolId,
  [int]$WorkBuddyPoolPid,
  [switch]$ConfirmWorkBuddyPoolNotCurrent,
  [switch]$ConfirmWorkBuddyPoolIdle,
  [int[]]$ProtectedProcessId = @(),
  [string]$ProcessSnapshotPath
)

$ErrorActionPreference = "Stop"

$moduleNames = @(
  "common.ps1",
  "process-observation.ps1",
  "process-topology.ps1",
  "workbuddy-analysis.ps1",
  "safety-guards.ps1",
  "candidate-analysis.ps1",
  "cleanup-execution.ps1",
  "workflow.ps1"
)
$moduleDirectory = Join-Path -Path $PSScriptRoot -ChildPath "lib"

# Dot-sourcing is intentionally ordered: later modules rely on functions defined by earlier ones.
foreach ($moduleName in $moduleNames) {
  $relativeModulePath = "lib/$moduleName"
  $modulePath = Join-Path -Path $moduleDirectory -ChildPath $moduleName
  if (-not (Test-Path -LiteralPath $modulePath)) {
    throw "Required cleanup module is missing: $relativeModulePath"
  }
  . $modulePath
}

$workflowParameters = @{
  Apply                           = $Apply
  IncludePattern                  = $IncludePattern
  ExcludePattern                  = $ExcludePattern
  ProcessName                     = $ProcessName
  MinAgeMinutes                   = $MinAgeMinutes
  OutputPath                      = $OutputPath
  Force                           = $Force
  EnableStuckOneShotRecovery      = $EnableStuckOneShotRecovery
  OneShotCommandPattern           = $OneShotCommandPattern
  CpuSampleIntervalSeconds        = $CpuSampleIntervalSeconds
  MinCpuDeltaSeconds              = $MinCpuDeltaSeconds
  WorkBuddyPoolId                 = $WorkBuddyPoolId
  WorkBuddyPoolPid                = $WorkBuddyPoolPid
  ConfirmWorkBuddyPoolNotCurrent  = $ConfirmWorkBuddyPoolNotCurrent
  ConfirmWorkBuddyPoolIdle        = $ConfirmWorkBuddyPoolIdle
  ProtectedProcessId              = $ProtectedProcessId
  ProcessSnapshotPath             = $ProcessSnapshotPath
  EntryScriptPath                 = $PSCommandPath
  CurrentProcessId                = $PID
  CommandContext                  = $PSCmdlet
  WhatIfPreferenceValue           = [bool]$WhatIfPreference
}

Invoke-AgentTeamNodeCleanup @workflowParameters
