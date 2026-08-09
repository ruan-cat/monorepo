# Converts one frozen observation into conservative decisions and a stable ledger shape.
# Missing ownership, age, or listener evidence remains non-actionable; a live parent blocks
# general cleanup outside the narrow one-shot recovery exception.
function New-CleanupAuditEntries {
  param(
    [object[]]$TargetProcesses,
    [hashtable]$ProcessMap,
    [hashtable]$ProtectedPidSet,
    [object]$ListenerObservation,
    [object]$WorkBuddyGrouping,
    [datetime]$SampledAt,
    [int]$MinimumAgeMinutes,
    [string[]]$IncludePatterns,
    [string[]]$ExcludePatterns,
    [string[]]$AgentKeywordPatterns,
    [bool]$StuckOneShotRecoveryEnabled,
    [string[]]$OneShotCommandPatterns,
    [hashtable]$CpuSamplesBefore,
    [hashtable]$CpuSamplesAfter,
    [int]$CpuSampleIntervalSeconds,
    [double]$MinimumCpuDeltaSeconds
  )

  # Pool descendants map back to their root so only the root owns the destructive pool decision.
  $workBuddyPoolByPid = @{}
  foreach ($pool in $WorkBuddyGrouping.PrewarmPools) {
    $workBuddyPoolByPid[[int]$pool.Pid] = $pool
    foreach ($descendantPid in $pool.DescendantPids) {
      $workBuddyPoolByPid[[int]$descendantPid] = $pool
    }
  }

  $entries = @()

  foreach ($process in $TargetProcesses) {
    $pidValue = [int]$process.ProcessId
    $parentPid = [int]$process.ParentProcessId
    $commandLine = [string]$process.CommandLine
    $executablePath = [string]$process.ExecutablePath
    $processFamily = Get-ProcessFamily -Name ([string]$process.Name) -CommandLine $commandLine
    $safeCommandLine = Protect-SensitiveCommandLine -CommandLine $commandLine
    $creationTime = Convert-CimDate $process.CreationDate
    $ageMinutes = $null

    if ($null -ne $creationTime) {
      $ageMinutes = [math]::Round(($SampledAt - $creationTime).TotalMinutes, 2)
    }

    $parentAlive = $false
    $parentName = $null
    $parentCommandLine = $null

    if ($parentPid -gt 0 -and $ProcessMap.ContainsKey($parentPid)) {
      $parentAlive = $true
      $parentName = [string]$ProcessMap[$parentPid].Name
      $parentCommandLine = [string]$ProcessMap[$parentPid].CommandLine
    }

    $workingDirectoryHint = Get-WorkingDirectoryHint -CommandLine $commandLine
    $listeningPorts = @(Get-ListeningPorts -PortMap $ListenerObservation.Ports -ProcessId $pidValue)
    $evidenceText = @(
      $commandLine,
      $executablePath,
      $workingDirectoryHint,
      $parentName,
      $parentCommandLine
    ) -join "`n"

    $includeMatches = Get-RegexMatches -Text $evidenceText -Patterns $IncludePatterns
    $excludeMatches = Get-RegexMatches -Text $evidenceText -Patterns $ExcludePatterns
    $agentKeywordMatches = Get-RegexMatches -Text $evidenceText -Patterns $AgentKeywordPatterns
    $agentBrowserEvidenceMatches = Get-AgentBrowserEvidenceMatches -Text $evidenceText
    $oneShotChildMatches = Get-RegexMatches -Text $commandLine -Patterns $OneShotCommandPatterns
    $oneShotParentMatches = Get-RegexMatches -Text $parentCommandLine -Patterns $OneShotCommandPatterns
    $oneShotCommandMatches = @($oneShotChildMatches | Where-Object { $oneShotParentMatches -contains $_ })
    $cpuSecondsBefore = $null
    $cpuSecondsAfter = $null
    $cpuDeltaSeconds = $null

    if ($cpuSamplesBefore.ContainsKey($pidValue)) {
      $cpuSecondsBefore = $cpuSamplesBefore[$pidValue]
    }

    if ($cpuSamplesAfter.ContainsKey($pidValue)) {
      $cpuSecondsAfter = $cpuSamplesAfter[$pidValue]
    }

    if ($null -ne $cpuSecondsBefore -and $null -ne $cpuSecondsAfter) {
      $cpuDeltaSeconds = [math]::Round(([double]$cpuSecondsAfter - [double]$cpuSecondsBefore), 2)
    }

    $safetyIssues = @()
    $riskFlags = @()

    if ($ProtectedPidSet.ContainsKey($pidValue)) {
      $safetyIssues += "self-or-parent-chain"
    }

    if ($null -eq $ageMinutes) {
      $safetyIssues += "unknown-age"
    }
    elseif ($ageMinutes -lt $MinimumAgeMinutes) {
      $safetyIssues += "younger-than-min-age"
    }

    if ($IncludePatterns.Count -eq 0) {
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

    if ([string]$ListenerObservation.Status -ne "known") {
      $riskFlags += "listener-observation-unknown"
      $safetyIssues += "listener-observation-unknown"
    }

    if ([string]::IsNullOrWhiteSpace($workingDirectoryHint)) {
      $riskFlags += "working-directory-unresolved"
    }

    if ($agentKeywordMatches.Count -eq 0) {
      $riskFlags += "no-agent-keyword"
    }

    if ($processFamily -in @("agent-browser-runtime", "browser-runtime")) {
      $hasBrowserOwnershipEvidence = (
        $agentBrowserEvidenceMatches.Count -gt 0 -and
        ($includeMatches.Count -gt 0 -or -not [string]::IsNullOrWhiteSpace($workingDirectoryHint))
      )

      if (-not $hasBrowserOwnershipEvidence) {
        $riskFlags += "browser-ownership-unproven"
        $safetyIssues += "browser-ownership-unproven"
      }
    }

    $workBuddyPool = if ($workBuddyPoolByPid.ContainsKey($pidValue)) { $workBuddyPoolByPid[$pidValue] } else { $null }
    if ($processFamily -like "workbuddy-*" -and $processFamily -notin @("workbuddy-prewarm-pool", "workbuddy-prewarm-pool-unverified")) {
      $safetyIssues += "workbuddy-core-or-unresolved"
    }
    if ($null -ne $workBuddyPool -and $pidValue -ne [int]$workBuddyPool.Pid) {
      $safetyIssues += "workbuddy-pool-child-managed-by-root"
    }
    if ($processFamily -in @("workbuddy-shell-snapshot", "bash-shell")) {
      $safetyIssues += "shell-snapshot-audit-only"
    }

    # A live cmd.exe parent is expected only for narrow one-shot recovery; every other safety issue remains fatal.
    $recoverySafetyIssues = @($safetyIssues | Where-Object { $_ -ne "parent-process-alive" })
    $isStuckOneShotCandidate = (
      $StuckOneShotRecoveryEnabled -and
      ([string]$process.Name -ieq "node.exe") -and
      $parentAlive -and
      ([string]$parentName -ieq "cmd.exe") -and
      $oneShotCommandMatches.Count -gt 0 -and
      $null -ne $cpuDeltaSeconds -and
      $cpuDeltaSeconds -ge $MinimumCpuDeltaSeconds -and
      $recoverySafetyIssues.Count -eq 0
    )

    $decision = "audit-only"
    if ($excludeMatches.Count -gt 0) {
      $decision = "excluded"
    }
    elseif ($isStuckOneShotCandidate) {
      $decision = "candidate-stuck-one-shot"
    }
    elseif ($safetyIssues.Count -eq 0) {
      $decision = "candidate"
    }

    if ($null -ne $workBuddyPool) {
      if ($pidValue -eq [int]$workBuddyPool.Pid) {
        $decision = [string]$workBuddyPool.Decision
      }
      else {
        $decision = "audit-only"
      }
    }
    elseif ($processFamily -like "workbuddy-*" -or $processFamily -in @("workbuddy-shell-snapshot", "bash-shell")) {
      $decision = "audit-only"
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
      ProcessFamily        = $processFamily
      ExecutablePath       = $executablePath
      CommandLine          = $safeCommandLine
      CreationTime         = if ($null -ne $creationTime) { $creationTime.ToString("o") } else { $null }
      AgeMinutes           = $ageMinutes
      WorkingDirectoryHint = $workingDirectoryHint
      ListeningPorts       = @($listeningPorts)
      IncludeMatches       = @($includeMatches)
      ExcludeMatches       = @($excludeMatches)
      AgentKeywordMatches  = @($agentKeywordMatches)
      AgentBrowserEvidence = @($agentBrowserEvidenceMatches)
      WorkBuddy            = [ordered]@{
        Role         = if ($processFamily -like "workbuddy-*") { $processFamily -replace '^workbuddy-', '' } else { $null }
        PoolId       = if ($null -ne $workBuddyPool) { $workBuddyPool.PoolId } else { $null }
        PoolPid      = if ($null -ne $workBuddyPool) { $workBuddyPool.Pid } else { $null }
        Confidence   = if ($null -ne $workBuddyPool) { $workBuddyPool.Confidence } else { $null }
        SessionState = if ($null -ne $workBuddyPool) { $workBuddyPool.SessionState } else { $null }
      }
      StuckOneShotRecovery = [ordered]@{
        Enabled                = [bool]$StuckOneShotRecoveryEnabled
        OneShotCommandMatches  = @($oneShotCommandMatches)
        CpuSecondsBefore       = $cpuSecondsBefore
        CpuSecondsAfter        = $cpuSecondsAfter
        CpuDeltaSeconds        = $cpuDeltaSeconds
        CpuSampleIntervalSeconds = if ($StuckOneShotRecoveryEnabled) { $CpuSampleIntervalSeconds } else { $null }
        MinCpuDeltaSeconds     = if ($StuckOneShotRecoveryEnabled) { $MinimumCpuDeltaSeconds } else { $null }
        DirectParentCmd        = ([string]$parentName -ieq "cmd.exe")
      }
      OwnershipScore       = $ownershipScore
      RiskFlags            = @($riskFlags)
      SafetyIssues         = @($safetyIssues)
      Decision             = $decision
    }
  }

  # Preserve arrays even for one item because downstream Count and JSON contracts depend on shape.
  $candidateEntries = @($entries | Where-Object { $_.Decision -in @("candidate", "candidate-stuck-one-shot") })
  $stuckOneShotCandidateEntries = @($entries | Where-Object { $_.Decision -eq "candidate-stuck-one-shot" })

  return [pscustomobject][ordered]@{
    Entries                      = @($entries)
    CandidateEntries             = @($candidateEntries)
    StuckOneShotCandidateEntries = @($stuckOneShotCandidateEntries)
  }
}

function New-CleanupLedger {
  param(
    [object]$AuditResult,
    [object[]]$WorkBuddyCandidatePools,
    [object]$ListenerObservation,
    [object]$WorkBuddyGrouping,
    [hashtable]$ProtectedPidSet,
    [datetime]$SampledAt,
    [string[]]$TargetProcessNames,
    [int]$MinimumAgeMinutes,
    [string[]]$IncludePatterns,
    [string[]]$ExcludePatterns,
    [bool]$ApplyRequested,
    [bool]$StuckOneShotRecoveryEnabled,
    [string[]]$OneShotCommandPatterns,
    [int]$CpuSampleIntervalSeconds,
    [double]$MinimumCpuDeltaSeconds
  )

  $entries = @($AuditResult.Entries)
  $candidateEntries = @($AuditResult.CandidateEntries)
  $stuckOneShotCandidateEntries = @($AuditResult.StuckOneShotCandidateEntries)
  $ledger = [ordered]@{
    Tool                 = "agent-team-node-cleanup"
    Mode                 = if ($ApplyRequested) { "apply" } else { "dry-run" }
    SampledAt            = $SampledAt.ToString("o")
    ProcessName          = @($TargetProcessNames)
    MinAgeMinutes        = $MinimumAgeMinutes
    IncludePattern       = @($IncludePatterns)
    ExcludePattern       = @($ExcludePatterns)
    ListenerObservation  = [ordered]@{
      Status = [string]$ListenerObservation.Status
      Reason = $ListenerObservation.Reason
    }
    StuckOneShotRecovery = [ordered]@{
      Enabled                  = [bool]$StuckOneShotRecoveryEnabled
      OneShotCommandPattern    = @($OneShotCommandPatterns)
      CpuSampleIntervalSeconds = if ($StuckOneShotRecoveryEnabled) { $CpuSampleIntervalSeconds } else { $null }
      MinCpuDeltaSeconds       = if ($StuckOneShotRecoveryEnabled) { $MinimumCpuDeltaSeconds } else { $null }
    }
    ProtectedPids        = @($ProtectedPidSet.Keys | Sort-Object)
    WorkBuddyGrouping    = $WorkBuddyGrouping
    Summary              = [ordered]@{
      NodeProcessCount   = @($entries | Where-Object { $_.Name -ieq "node.exe" }).Count
      TargetProcessCount = $entries.Count
      ProcessNameCounts  = (Get-ProcessNameCounts -Entries $entries)
      CandidateCount     = $candidateEntries.Count + $WorkBuddyCandidatePools.Count
      WorkBuddyPoolCandidateCount = $WorkBuddyCandidatePools.Count
      StuckOneShotCandidateCount = $stuckOneShotCandidateEntries.Count
      ExcludedCount      = @($entries | Where-Object { $_.Decision -eq "excluded" }).Count
      AuditOnlyCount     = @($entries | Where-Object { $_.Decision -eq "audit-only" }).Count
    }
    Processes            = @($entries)
    StopResults          = @()
    Verification         = $null
  }

  return $ledger
}
