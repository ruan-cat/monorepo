# Executes only frozen targets, then verifies the bounded result without discovering new targets.
# Each initial stop request follows a PID, name, and creation-time identity check;
# Force only retries the same PID after a short wait.
function Invoke-WorkBuddyCleanupPlan {
  param(
    [object]$SelectedPool,
    [object]$ProcessObservation,
    [hashtable]$RevalidationProcessMap,
    [System.Management.Automation.PSCmdlet]$CommandContext,
    [bool]$WhatIfPreferenceValue
  )

  $stopResults = @()
  $rootCanContinue = $true

  # Root failure halts the plan because descendant ownership is no longer safe to assume.
  foreach ($planEntry in $SelectedPool.StopPlan) {
    $isRoot = ([int]$planEntry.Pid -eq [int]$SelectedPool.Pid)
    if (-not $rootCanContinue) {
      break
    }

    if (-not (Get-ProcessExists -ProcessId ([int]$planEntry.Pid) -ProcessMap $RevalidationProcessMap)) {
      $stopResults += [ordered]@{
        Pid          = [int]$planEntry.Pid
        Name         = [string]$planEntry.Name
        CreationTime = [string]$planEntry.CreationTime
        Depth        = [int]$planEntry.Depth
        Status       = "already-exited"
        Error        = $null
      }
      if ($isRoot) {
        Start-Sleep -Seconds 2
      }
      continue
    }

    if (-not (Test-LiveProcessIdentity `
      -ProcessId ([int]$planEntry.Pid) `
      -ExpectedName ([string]$planEntry.Name) `
      -ExpectedCreationTime ([string]$planEntry.CreationTime) `
      -ProcessMap $RevalidationProcessMap)) {
      $stopResults += [ordered]@{
        Pid          = [int]$planEntry.Pid
        Name         = [string]$planEntry.Name
        CreationTime = [string]$planEntry.CreationTime
        Depth        = [int]$planEntry.Depth
        Status       = "skipped-pid-reused"
        Error        = "PID, name, or CreationTime no longer matches the frozen snapshot."
      }
      if ($isRoot) { $rootCanContinue = $false }
      continue
    }

    # Fixture WhatIf validates gates without authorizing synthetic PIDs through ShouldProcess.
    $isFixtureWhatIf = $ProcessObservation.IsSnapshot -and $WhatIfPreferenceValue
    $shouldStop = -not $isFixtureWhatIf -and $CommandContext.ShouldProcess(
      "PID $($planEntry.Pid)",
      "Stop selected WorkBuddy pool process"
    )
    if (-not $shouldStop) {
      $stopResults += [ordered]@{
        Pid          = [int]$planEntry.Pid
        Name         = [string]$planEntry.Name
        CreationTime = [string]$planEntry.CreationTime
        Depth        = [int]$planEntry.Depth
        Status       = "what-if"
        Error        = $null
      }
      continue
    }

    try {
      Stop-Process -Id ([int]$planEntry.Pid) -ErrorAction Stop
      $stopResults += [ordered]@{
        Pid          = [int]$planEntry.Pid
        Name         = [string]$planEntry.Name
        CreationTime = [string]$planEntry.CreationTime
        Depth        = [int]$planEntry.Depth
        Status       = "stop-requested"
        Error        = $null
      }
      if ($isRoot) {
        Start-Sleep -Seconds 2
      }
    }
    catch {
      $stopResults += [ordered]@{
        Pid          = [int]$planEntry.Pid
        Name         = [string]$planEntry.Name
        CreationTime = [string]$planEntry.CreationTime
        Depth        = [int]$planEntry.Depth
        Status       = "error"
        Error        = $_.Exception.Message
      }
      if ($isRoot) { $rootCanContinue = $false }
    }
  }

  return [pscustomobject][ordered]@{
    StopResults        = @($stopResults)
    FrozenStopPlanPids = @($SelectedPool.StopPlan | ForEach-Object { [int]$_.Pid })
  }
}

function Invoke-GeneralCleanupPlan {
  param(
    [object[]]$CandidateEntries,
    [bool]$Force,
    [hashtable]$ProcessMap,
    [System.Management.Automation.PSCmdlet]$CommandContext,
    [bool]$WhatIfPreferenceValue
  )

  $stopResults = @()

  foreach ($entry in $CandidateEntries) {
    if ($WhatIfPreferenceValue) {
      $stopResults += [ordered]@{
        Pid                        = $entry.Pid
        Status                     = "what-if"
        Force                      = [bool]$Force
        Decision                   = $entry.Decision
        ParentProcessStopAttempted = $false
        Error                      = $null
      }
      continue
    }

    if (-not (Test-LiveProcessIdentity `
      -ProcessId ([int]$entry.Pid) `
      -ExpectedName ([string]$entry.Name) `
      -ExpectedCreationTime ([string]$entry.CreationTime) `
      -ProcessMap $ProcessMap)) {
      $stopResults += [ordered]@{
        Pid                        = $entry.Pid
        Status                     = "skipped-pid-reused"
        Force                      = [bool]$Force
        Decision                   = $entry.Decision
        ParentProcessStopAttempted = $false
        Error                      = "PID, name, or CreationTime no longer matches the frozen snapshot."
      }
      continue
    }

    $shouldStop = $CommandContext.ShouldProcess(
      "PID $($entry.Pid)",
      "Stop selected agent process"
    )
    if (-not $shouldStop) {
      $stopResults += [ordered]@{
        Pid                        = $entry.Pid
        Status                     = "what-if"
        Force                      = [bool]$Force
        Decision                   = $entry.Decision
        ParentProcessStopAttempted = $false
        Error                      = $null
      }
      continue
    }

    try {
      Stop-Process -Id $entry.Pid -ErrorAction Stop
      Start-Sleep -Milliseconds 300
      if ($Force -and (Get-ProcessExists -ProcessId $entry.Pid)) {
        Stop-Process -Id $entry.Pid -Force -ErrorAction Stop
      }
      $stopResults += [ordered]@{
        Pid                        = $entry.Pid
        Status                     = "stopped"
        Force                      = [bool]$Force
        Decision                   = $entry.Decision
        ParentProcessStopAttempted = $false
        Error                      = $null
      }
    }
    catch {
      $stopResults += [ordered]@{
        Pid                        = $entry.Pid
        Status                     = "error"
        Force                      = [bool]$Force
        Decision                   = $entry.Decision
        ParentProcessStopAttempted = $false
        Error                      = $_.Exception.Message
      }
    }
  }

  return [pscustomobject][ordered]@{
    StopResults = @($stopResults)
  }
}

function Complete-CleanupVerification {
  param(
    [ValidateSet("dry-run", "general", "workbuddy")]
    [string]$Mode,
    [object[]]$StopResults,
    [object[]]$CandidateEntries,
    [object]$SelectedPool,
    [object]$ProcessObservation,
    [object]$InitialWorkBuddyGrouping,
    [hashtable]$ProtectedPidSet,
    [int]$MinimumAgeMinutes
  )

  $remainingCandidatePids = @()
  $respawnedProcessPids = @()

  if ($Mode -eq "dry-run") {
    return [pscustomobject][ordered]@{
      RemainingCandidatePids = @()
      RespawnedProcessPids    = @()
    }
  }

  if ($Mode -eq "general") {
    Start-Sleep -Milliseconds 500
    foreach ($entry in $CandidateEntries) {
      $exists = if ($ProcessObservation.IsSnapshot) {
        Get-ProcessExists -ProcessId $entry.Pid -ProcessMap $ProcessObservation.ResampledProcessMap
      }
      else {
        Get-ProcessExists -ProcessId $entry.Pid
      }
      if ($exists) {
        $remainingCandidatePids += [int]$entry.Pid
      }
    }

    return [pscustomobject][ordered]@{
      RemainingCandidatePids = @($remainingCandidatePids)
      RespawnedProcessPids    = @()
    }
  }

  # A separate resample reports respawns instead of chasing them, preserving the original batch.
  $verificationProcessMap = if ($ProcessObservation.IsSnapshot) {
    $ProcessObservation.ResampledProcessMap
  }
  else {
    Get-ProcessMap
  }
  foreach ($planEntry in $SelectedPool.StopPlan) {
    if (Test-LiveProcessIdentity `
      -ProcessId ([int]$planEntry.Pid) `
      -ExpectedName ([string]$planEntry.Name) `
      -ExpectedCreationTime ([string]$planEntry.CreationTime) `
      -ProcessMap $verificationProcessMap) {
      $remainingCandidatePids += [int]$planEntry.Pid
    }
  }

  $resampledListenerObservation = Get-ListeningPortObservation `
    -ProcessMap $verificationProcessMap `
    -UseSnapshot:$ProcessObservation.IsSnapshot `
    -SnapshotStatus $ProcessObservation.ListenerStatus `
    -SnapshotReason $ProcessObservation.ListenerReason
  $resampledGrouping = Build-WorkBuddyGrouping `
    -ProcessMap $verificationProcessMap `
    -ListenerObservation $resampledListenerObservation `
    -ProtectedPidSet $ProtectedPidSet `
    -SampledAt (Get-Date) `
    -MinimumAgeMinutes $MinimumAgeMinutes `
    -SelectedPoolId $SelectedPool.PoolId `
    -SelectedPoolPid 0 `
    -NotCurrentConfirmed $false `
    -IdleConfirmed $false
  $initialPoolPids = @($InitialWorkBuddyGrouping.PrewarmPools | ForEach-Object { [int]$_.Pid })
  $respawnedPools = @($resampledGrouping.PrewarmPools | Where-Object {
    $matchesPoolId = (
      -not [string]::IsNullOrWhiteSpace([string]$SelectedPool.PoolId) -and
      $_.PoolId -eq $SelectedPool.PoolId
    )
    $matchesTopologyFingerprint = (
      [string]::IsNullOrWhiteSpace([string]$SelectedPool.PoolId) -and
      $SelectedPool.Confidence -eq "medium" -and
      $SelectedPool.RecognitionMethod -eq "topology-inferred" -and
      $_.Confidence -eq "medium" -and
      $_.RecognitionMethod -eq "topology-inferred" -and
      [int]$_.ParentPid -eq [int]$SelectedPool.ParentPid -and
      $initialPoolPids -notcontains [int]$_.Pid
    )
    $matchesPoolId -or $matchesTopologyFingerprint
  })
  foreach ($pool in $respawnedPools) {
    $respawnedProcessPids += [int]$pool.Pid
    $respawnedProcessPids += @($pool.DescendantPids | ForEach-Object { [int]$_ })
  }
  $respawnedProcessPids = @(
    $respawnedProcessPids |
      Where-Object { $SelectedPool.StopPlan.Pid -notcontains $_ } |
      Select-Object -Unique
  )

  return [pscustomobject][ordered]@{
    RemainingCandidatePids = @($remainingCandidatePids)
    RespawnedProcessPids    = @($respawnedProcessPids)
  }
}
