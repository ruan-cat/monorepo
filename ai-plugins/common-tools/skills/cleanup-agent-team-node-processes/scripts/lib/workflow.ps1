# Orchestrates gating, frozen observation, conservative classification, bounded execution, and verification.
# Every Apply needs explicit scope; WorkBuddy Apply additionally requires its selector and dual confirmations.
function Invoke-AgentTeamNodeCleanup {
  param(
    [switch]$Apply,
    [string[]]$IncludePattern,
    [string[]]$ExcludePattern,
    [string[]]$ProcessName,
    [int]$MinAgeMinutes,
    [string]$OutputPath,
    [switch]$Force,
    [switch]$EnableStuckOneShotRecovery,
    [string[]]$OneShotCommandPattern,
    [int]$CpuSampleIntervalSeconds,
    [double]$MinCpuDeltaSeconds,
    [string]$WorkBuddyPoolId,
    [int]$WorkBuddyPoolPid,
    [switch]$ConfirmWorkBuddyPoolNotCurrent,
    [switch]$ConfirmWorkBuddyPoolIdle,
    [int[]]$ProtectedProcessId,
    [string]$ProcessSnapshotPath,
    [string]$EntryScriptPath,
    [int]$CurrentProcessId,
    [System.Management.Automation.PSCmdlet]$CommandContext,
    [bool]$WhatIfPreferenceValue
  )

  [void]$EntryScriptPath
  Assert-RegexList -Patterns $IncludePattern -Name "IncludePattern"
  Assert-RegexList -Patterns $ExcludePattern -Name "ExcludePattern"
  $targetProcessNames = Normalize-ProcessNames -Names $ProcessName
  $workBuddySelectorCount = 0
  if (-not [string]::IsNullOrWhiteSpace($WorkBuddyPoolId)) { $workBuddySelectorCount += 1 }
  if ($WorkBuddyPoolPid -gt 0) { $workBuddySelectorCount += 1 }
  $workBuddyMode = (
    $workBuddySelectorCount -gt 0 -or
    $ConfirmWorkBuddyPoolNotCurrent -or
    $ConfirmWorkBuddyPoolIdle
  )

  # Confirmation flags require one exact selector; they are assertions, not broad discovery hints.
  if ($workBuddySelectorCount -gt 1) {
    throw "Specify exactly one WorkBuddy pool selector: -WorkBuddyPoolId or -WorkBuddyPoolPid, not both."
  }
  if ($ConfirmWorkBuddyPoolIdle -and $workBuddySelectorCount -ne 1) {
    throw "-ConfirmWorkBuddyPoolIdle requires exactly one WorkBuddy pool selector (-WorkBuddyPoolId or -WorkBuddyPoolPid)."
  }
  if ($ConfirmWorkBuddyPoolNotCurrent -and $workBuddySelectorCount -ne 1) {
    throw "-ConfirmWorkBuddyPoolNotCurrent requires exactly one WorkBuddy pool selector (-WorkBuddyPoolId or -WorkBuddyPoolPid)."
  }
  if ($Apply -and -not $workBuddyMode -and $IncludePattern.Count -eq 0) {
    throw "-Apply requires at least one -IncludePattern. Refusing broad cleanup."
  }
  if ($Apply -and $workBuddyMode -and $workBuddySelectorCount -ne 1) {
    throw "WorkBuddy -Apply requires exactly one pool selector (-WorkBuddyPoolId or -WorkBuddyPoolPid)."
  }
  if ($Apply -and $workBuddyMode -and (-not $ConfirmWorkBuddyPoolNotCurrent -or -not $ConfirmWorkBuddyPoolIdle)) {
    throw "WorkBuddy -Apply requires both -ConfirmWorkBuddyPoolNotCurrent and -ConfirmWorkBuddyPoolIdle after independent verification."
  }
  if (-not $Apply -and -not [string]::IsNullOrWhiteSpace($OutputPath)) {
    throw "-OutputPath is only valid with -Apply. Dry-run output is written to stdout only."
  }
  if ($Apply -and [string]::IsNullOrWhiteSpace($OutputPath)) {
    throw "-Apply requires -OutputPath so the candidate ledger can be reviewed."
  }
  if ($Apply) {
    [void](Assert-TemporaryOutputPath -Path $OutputPath)
  }
  if ($Apply -and -not [string]::IsNullOrWhiteSpace($ProcessSnapshotPath) -and -not $WhatIfPreferenceValue) {
    throw "-ProcessSnapshotPath is audit/test input and cannot be used for destructive -Apply. Use -WhatIf for a simulated gate check."
  }
  if ($Force -and -not $Apply) {
    throw "-Force is only valid with -Apply."
  }
  if ($Force -and $workBuddyMode) {
    throw "-Force is not supported for WorkBuddy pool cleanup. Re-audit the pool instead."
  }
  if ($EnableStuckOneShotRecovery -and -not $Apply) {
    throw "-EnableStuckOneShotRecovery is only valid with -Apply. First save a normal dry-run ledger, then use this narrow recovery path with explicit evidence."
  }
  if ($EnableStuckOneShotRecovery -and $OneShotCommandPattern.Count -eq 0) {
    throw "-EnableStuckOneShotRecovery requires at least one exact -OneShotCommandPattern."
  }
  if ($Apply -and -not $workBuddyMode) {
    Assert-ApplyScope -Patterns $IncludePattern -TargetProcessNames $targetProcessNames
  }
  if ($EnableStuckOneShotRecovery) {
    Assert-OneShotCommandScope -Patterns $OneShotCommandPattern -TargetProcessNames $targetProcessNames
  }

  $agentKeywordPatterns = @(
    "codex", "claude", "cursor", "workbuddy", "qoder", "gemini", "kiro", "zcode",
    "antigravity", "mcp", "memorix", "agent-team", "agent-browser", "agent_browser",
    "playwright", "user-data-dir", "browser-profile", "restore-state",
    "remote-debugging-port", "subagent", "agent"
  )

  # Classification freezes process metadata and topology; listener and optional CPU evidence
  # are sampled separately.
  $sampledAt = Get-Date
  $processObservation = Read-ProcessObservation -SnapshotPath $ProcessSnapshotPath
  $processMap = $processObservation.ProcessMap
  $listenerObservation = Get-ListeningPortObservation `
    -ProcessMap $processMap `
    -UseSnapshot:$processObservation.IsSnapshot `
    -SnapshotStatus $processObservation.ListenerStatus `
    -SnapshotReason $processObservation.ListenerReason
  $protectedPids = Get-ParentPidSet -ProcessMap $processMap -StartPid $CurrentProcessId
  foreach ($protectedProcessIdValue in $ProtectedProcessId) {
    $additionalProtected = Get-ParentPidSet -ProcessMap $processMap -StartPid $protectedProcessIdValue
    foreach ($protectedPidValue in $additionalProtected.Keys) {
      $protectedPids[[int]$protectedPidValue] = $true
    }
  }
  $targetProcesses = Get-TargetProcesses -ProcessMap $processMap -ProcessNames $targetProcessNames
  $cpuSamplesBefore = @{}
  $cpuSamplesAfter = @{}
  if ($EnableStuckOneShotRecovery) {
    $cpuSamplesBefore = Get-ProcessCpuSamples -Processes $targetProcesses
    Start-Sleep -Seconds $CpuSampleIntervalSeconds
    $cpuSamplesAfter = Get-ProcessCpuSamples -Processes $targetProcesses
  }

  $workBuddyGrouping = Build-WorkBuddyGrouping `
    -ProcessMap $processMap `
    -ListenerObservation $listenerObservation `
    -ProtectedPidSet $protectedPids `
    -SampledAt $sampledAt `
    -MinimumAgeMinutes $MinAgeMinutes `
    -SelectedPoolId $WorkBuddyPoolId `
    -SelectedPoolPid $WorkBuddyPoolPid `
    -NotCurrentConfirmed ([bool]$ConfirmWorkBuddyPoolNotCurrent) `
    -IdleConfirmed ([bool]$ConfirmWorkBuddyPoolIdle)

  # Selector syntax proves no ownership; uniqueness is checked again after topology analysis.
  if ($workBuddySelectorCount -eq 1) {
    $selectedWorkBuddyPools = @($workBuddyGrouping.PrewarmPools | Where-Object { $_.Selected })
    if ($selectedWorkBuddyPools.Count -ne 1) {
      throw "WorkBuddy pool selector must uniquely match one prewarm pool; matched $($selectedWorkBuddyPools.Count)."
    }

    if ($Apply -and $selectedWorkBuddyPools[0].Decision -ne "candidate-workbuddy-pool-explicit") {
      $selectedPool = $selectedWorkBuddyPools[0]
      $reasonText = @($selectedPool.ProtectionReasons) -join ","
      $mediumTopologyPidEligible = (
        $selectedPool.Confidence -eq "medium" -and
        $selectedPool.RecognitionMethod -eq "topology-inferred" -and
        $selectedPool.SelectedBy -eq "pid"
      )
      if ($selectedPool.Confidence -ne "high" -and -not $mediumTopologyPidEligible) {
        throw "Selected WorkBuddy pool confidence or selector is not eligible for Apply. Medium topology pools require an exact -WorkBuddyPoolPid. Reasons: $reasonText"
      }
      if ($selectedPool.SessionState -eq "current" -or $reasonText -match "protected") {
        throw "Selected WorkBuddy pool belongs to a protected current session chain. Apply is blocked. Reasons: $reasonText"
      }
      throw "Selected WorkBuddy pool is blocked and cannot be applied. Reasons: $reasonText"
    }
  }

  $auditParameters = @{
    TargetProcesses              = $targetProcesses
    ProcessMap                   = $processMap
    ProtectedPidSet              = $protectedPids
    ListenerObservation          = $listenerObservation
    WorkBuddyGrouping            = $workBuddyGrouping
    SampledAt                    = $sampledAt
    MinimumAgeMinutes            = $MinAgeMinutes
    IncludePatterns              = $IncludePattern
    ExcludePatterns              = $ExcludePattern
    AgentKeywordPatterns         = $agentKeywordPatterns
    StuckOneShotRecoveryEnabled  = [bool]$EnableStuckOneShotRecovery
    OneShotCommandPatterns       = $OneShotCommandPattern
    CpuSamplesBefore             = $cpuSamplesBefore
    CpuSamplesAfter              = $cpuSamplesAfter
    CpuSampleIntervalSeconds     = $CpuSampleIntervalSeconds
    MinimumCpuDeltaSeconds       = $MinCpuDeltaSeconds
  }
  $auditResult = New-CleanupAuditEntries @auditParameters
  $candidateEntries = @($auditResult.CandidateEntries)
  $workBuddyCandidatePools = @(
    $workBuddyGrouping.PrewarmPools |
      Where-Object { $_.Decision -eq "candidate-workbuddy-pool-explicit" }
  )
  $ledgerParameters = @{
    AuditResult                     = $auditResult
    WorkBuddyCandidatePools         = $workBuddyCandidatePools
    ListenerObservation             = $listenerObservation
    WorkBuddyGrouping               = $workBuddyGrouping
    ProtectedPidSet                 = $protectedPids
    SampledAt                       = $sampledAt
    TargetProcessNames              = $targetProcessNames
    MinimumAgeMinutes               = $MinAgeMinutes
    IncludePatterns                 = $IncludePattern
    ExcludePatterns                 = $ExcludePattern
    ApplyRequested                  = [bool]$Apply
    StuckOneShotRecoveryEnabled     = [bool]$EnableStuckOneShotRecovery
    OneShotCommandPatterns          = $OneShotCommandPattern
    CpuSampleIntervalSeconds        = $CpuSampleIntervalSeconds
    MinimumCpuDeltaSeconds          = $MinCpuDeltaSeconds
  }
  $ledger = New-CleanupLedger @ledgerParameters

  # Verification may report new PIDs, but execution consumes only frozen candidates and plans.
  if ($Apply -and $workBuddyMode) {
    $selectedPool = @($workBuddyGrouping.PrewarmPools | Where-Object { $_.Selected })[0]
    $executionResult = Invoke-WorkBuddyCleanupPlan `
      -SelectedPool $selectedPool `
      -ProcessObservation $processObservation `
      -RevalidationProcessMap $processObservation.RevalidationProcessMap `
      -CommandContext $CommandContext `
      -WhatIfPreferenceValue $WhatIfPreferenceValue
    $verificationResult = Complete-CleanupVerification `
      -Mode "workbuddy" `
      -StopResults @($executionResult.StopResults) `
      -CandidateEntries $candidateEntries `
      -SelectedPool $selectedPool `
      -ProcessObservation $processObservation `
      -InitialWorkBuddyGrouping $workBuddyGrouping `
      -ProtectedPidSet $protectedPids `
      -MinimumAgeMinutes $MinAgeMinutes
    $ledger.StopResults = @($executionResult.StopResults)
    $ledger.Verification = [ordered]@{
      ResampledAt             = (Get-Date).ToString("o")
      StoppedCount            = @($executionResult.StopResults | Where-Object Status -eq "stop-requested").Count
      ErrorCount              = @($executionResult.StopResults | Where-Object Status -eq "error").Count
      RemainingCandidatePids  = @($verificationResult.RemainingCandidatePids)
      RespawnedProcessPids    = @($verificationResult.RespawnedProcessPids)
      VerificationInstruction = "WorkBuddy cleanup is bounded to the frozen pool snapshot. New respawns are reported and are never chased in the same batch."
    }
  }
  elseif ($Apply) {
    $executionResult = Invoke-GeneralCleanupPlan `
      -CandidateEntries $candidateEntries `
      -Force ([bool]$Force) `
      -ProcessMap $processObservation.RevalidationProcessMap `
      -CommandContext $CommandContext `
      -WhatIfPreferenceValue $WhatIfPreferenceValue
    $verificationResult = Complete-CleanupVerification `
      -Mode "general" `
      -StopResults @($executionResult.StopResults) `
      -CandidateEntries $candidateEntries `
      -ProcessObservation $processObservation `
      -InitialWorkBuddyGrouping $workBuddyGrouping `
      -ProtectedPidSet $protectedPids `
      -MinimumAgeMinutes $MinAgeMinutes
    $ledger.StopResults = @($executionResult.StopResults)
    $ledger.Verification = [ordered]@{
      ResampledAt             = (Get-Date).ToString("o")
      StoppedCount            = @($executionResult.StopResults | Where-Object Status -eq "stopped").Count
      ErrorCount              = @($executionResult.StopResults | Where-Object Status -eq "error").Count
      RemainingCandidatePids  = @($verificationResult.RemainingCandidatePids)
      RespawnedProcessPids    = @($verificationResult.RespawnedProcessPids)
      VerificationInstruction = "If any PID remains or respawns, inspect its parent service before running another apply. Stuck one-shot recovery only stops the Node child; review a remaining cmd.exe wrapper manually."
    }
  }
  else {
    $ledger.Verification = [ordered]@{
      ResampledAt             = $null
      RemainingCandidatePids  = @()
      RespawnedProcessPids    = @()
      VerificationInstruction = "Dry-run only. Review Processes, then rerun with -Apply only after narrowing IncludePattern and ExcludePattern."
    }
  }

  $json = $ledger | ConvertTo-Json -Depth 8
  if ($Apply -and -not [string]::IsNullOrWhiteSpace($OutputPath)) {
    $resolvedOutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    $outputDir = Split-Path -Parent $resolvedOutputPath
    if (-not [string]::IsNullOrWhiteSpace($outputDir) -and -not (Test-Path -LiteralPath $outputDir)) {
      New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    Set-Content -LiteralPath $resolvedOutputPath -Value $json -Encoding UTF8 -WhatIf:$false
  }

  [Console]::Out.Write($json)
}
