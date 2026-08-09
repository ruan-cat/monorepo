# Infers WorkBuddy ownership from explicit evidence or constrained topology and freezes stop plans.
# This module classifies process trees but never stops them.
function Get-WorkBuddyPoolId {
  param([string]$CommandLine)

  if ([string]::IsNullOrWhiteSpace($CommandLine)) {
    return $null
  }

  $match = [regex]::Match($CommandLine, '(?i)--prewarm-id(?:=|\s+)["'']?([A-Za-z0-9][A-Za-z0-9._-]*)')
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  return $null
}

function Get-WorkBuddyTopologyInference {
  param([hashtable]$ProcessMap)

  # Fallback recognition requires the complete daemon -> sidecar -> MCP topology plus a sibling pool.
  $coreByPid = @{}
  $poolByPid = @{}
  foreach ($daemonCandidate in @($ProcessMap.Values | Sort-Object ProcessId)) {
    if ([string]$daemonCandidate.Name -ine "WorkBuddy.exe") {
      continue
    }
    if ((Get-ProcessFamily -Name ([string]$daemonCandidate.Name) -CommandLine ([string]$daemonCandidate.CommandLine)) -ne "workbuddy-unknown") {
      continue
    }

    $daemonPid = [int]$daemonCandidate.ProcessId
    $daemonChildren = @(Get-DirectChildProcesses -ProcessMap $ProcessMap -ParentPid $daemonPid)
    $daemonServiceBranches = @($daemonChildren | Where-Object { [string]$_.Name -ine "WorkBuddy.exe" })
    if ($daemonServiceBranches.Count -eq 0) {
      continue
    }
    foreach ($sidecarCandidate in @($daemonChildren | Where-Object { [string]$_.Name -ieq "WorkBuddy.exe" })) {
      if ((Get-ProcessFamily -Name ([string]$sidecarCandidate.Name) -CommandLine ([string]$sidecarCandidate.CommandLine)) -ne "workbuddy-unknown") {
        continue
      }

      $sidecarPid = [int]$sidecarCandidate.ProcessId
      $sidecarChildren = @(Get-DirectChildProcesses -ProcessMap $ProcessMap -ParentPid $sidecarPid)
      foreach ($mcpCandidate in @($sidecarChildren | Where-Object { [string]$_.Name -ieq "WorkBuddy.exe" })) {
        if ((Get-ProcessFamily -Name ([string]$mcpCandidate.Name) -CommandLine ([string]$mcpCandidate.CommandLine)) -ne "workbuddy-unknown") {
          continue
        }

        $mcpPid = [int]$mcpCandidate.ProcessId
        $mcpChildren = @(Get-DirectChildProcesses -ProcessMap $ProcessMap -ParentPid $mcpPid)
        $nonWorkBuddyMcpChildren = @($mcpChildren | Where-Object { [string]$_.Name -ine "WorkBuddy.exe" })
        $poolSiblings = @(
          $daemonChildren |
            Where-Object {
              [string]$_.Name -ieq "WorkBuddy.exe" -and
              [int]$_.ProcessId -ne $sidecarPid -and
              (Get-ProcessFamily -Name ([string]$_.Name) -CommandLine ([string]$_.CommandLine)) -eq "workbuddy-unknown"
            }
        )
        if ($nonWorkBuddyMcpChildren.Count -eq 0 -or $poolSiblings.Count -eq 0) {
          continue
        }

        $evidence = "workbuddy-three-hop-mcp-topology;daemon=$daemonPid;sidecar=$sidecarPid;mcp-server=$mcpPid;daemon-service-branches=$($daemonServiceBranches.Count)"
        foreach ($core in @(
          [ordered]@{ Pid = $daemonPid; Process = $daemonCandidate; Role = "daemon" },
          [ordered]@{ Pid = $sidecarPid; Process = $sidecarCandidate; Role = "sidecar" },
          [ordered]@{ Pid = $mcpPid; Process = $mcpCandidate; Role = "mcp-server" }
        )) {
          if (-not $coreByPid.ContainsKey([int]$core.Pid)) {
            $coreByPid[[int]$core.Pid] = [ordered]@{
              Pid               = [int]$core.Pid
              ParentPid         = [int]$core.Process.ParentProcessId
              Role              = [string]$core.Role
              Confidence        = "medium"
              RecognitionMethod = "topology-inferred"
              Protected         = $true
              Evidence          = @($evidence)
            }
          }
        }

        foreach ($poolSibling in $poolSiblings) {
          $poolPid = [int]$poolSibling.ProcessId
          if (-not $poolByPid.ContainsKey($poolPid)) {
            $poolByPid[$poolPid] = [ordered]@{
              Process           = $poolSibling
              Confidence        = "medium"
              RecognitionMethod = "topology-inferred"
              Evidence          = @($evidence, "pool-sibling=$poolPid")
            }
          }
        }
      }
    }
  }

  return [ordered]@{
    CoreProcesses = @($coreByPid.Values | Sort-Object Pid)
    PoolRoots      = @($poolByPid.Values | Sort-Object { [int]$_.Process.ProcessId })
  }
}

function Build-WorkBuddyGrouping {
  param(
    [hashtable]$ProcessMap,
    $ListenerObservation,
    [hashtable]$ProtectedPidSet,
    [DateTime]$SampledAt,
    [int]$MinimumAgeMinutes,
    [string]$SelectedPoolId,
    [int]$SelectedPoolPid,
    [bool]$NotCurrentConfirmed,
    [bool]$IdleConfirmed
  )

  $coreProcesses = @()
  $poolRoots = @()
  $coreByPid = @{}
  $poolRootPidSet = @{}

  foreach ($process in @($ProcessMap.Values | Sort-Object ProcessId)) {
    $family = Get-ProcessFamily -Name ([string]$process.Name) -CommandLine ([string]$process.CommandLine)
    $pidValue = [int]$process.ProcessId
    $safeCommandLine = Protect-SensitiveCommandLine -CommandLine ([string]$process.CommandLine)

    if ($family -in @("workbuddy-daemon", "workbuddy-sidecar", "workbuddy-mcp-server")) {
      $coreEntry = [ordered]@{
        Pid        = $pidValue
        ParentPid  = [int]$process.ParentProcessId
        Role       = $family -replace '^workbuddy-', ''
        Confidence = "high"
        RecognitionMethod = "command-line-explicit"
        Protected  = $true
        Evidence   = @($safeCommandLine)
      }
      $coreProcesses += $coreEntry
      $coreByPid[$pidValue] = $coreEntry
    }
    elseif ($family -in @("workbuddy-prewarm-pool", "workbuddy-prewarm-pool-unverified")) {
      $poolRootPidSet[$pidValue] = $true
      $poolRoots += [ordered]@{
        Process           = $process
        Confidence        = if ($family -eq "workbuddy-prewarm-pool") { "high" } else { "low" }
        RecognitionMethod = if ($family -eq "workbuddy-prewarm-pool") { "command-line-explicit" } else { "command-line-partial" }
        Evidence          = @($safeCommandLine)
      }
    }
  }

  $topologyInference = Get-WorkBuddyTopologyInference -ProcessMap $ProcessMap
  foreach ($coreEntry in $topologyInference.CoreProcesses) {
    $pidValue = [int]$coreEntry.Pid
    if (-not $coreByPid.ContainsKey($pidValue) -and -not $poolRootPidSet.ContainsKey($pidValue)) {
      $coreProcesses += $coreEntry
      $coreByPid[$pidValue] = $coreEntry
    }
  }
  foreach ($poolRootRecord in $topologyInference.PoolRoots) {
    $pidValue = [int]$poolRootRecord.Process.ProcessId
    if (-not $coreByPid.ContainsKey($pidValue) -and -not $poolRootPidSet.ContainsKey($pidValue)) {
      $poolRoots += $poolRootRecord
      $poolRootPidSet[$pidValue] = $true
    }
  }

  $unresolvedProcesses = @()
  foreach ($process in @($ProcessMap.Values | Sort-Object ProcessId)) {
    $pidValue = [int]$process.ProcessId
    $family = Get-ProcessFamily -Name ([string]$process.Name) -CommandLine ([string]$process.CommandLine)
    if ($family -eq "workbuddy-unknown" -and -not $coreByPid.ContainsKey($pidValue) -and -not $poolRootPidSet.ContainsKey($pidValue)) {
      $unresolvedProcesses += [ordered]@{
        Pid        = $pidValue
        ParentPid  = [int]$process.ParentProcessId
        Name       = [string]$process.Name
        Role       = "unknown"
        Confidence = "unknown"
        Reasons    = @("command-line-or-path-unavailable")
      }
    }
  }

  $pools = @()
  foreach ($poolRootRecord in @($poolRoots | Sort-Object { [int]$_.Process.ProcessId })) {
    $poolRoot = $poolRootRecord.Process
    $rootPid = [int]$poolRoot.ProcessId
    $poolId = Get-WorkBuddyPoolId -CommandLine ([string]$poolRoot.CommandLine)
    $ancestors = Get-ParentPidSet -ProcessMap $ProcessMap -StartPid $rootPid
    [void]$ancestors.Remove($rootPid)
    $daemonAncestors = @(
      $ancestors.Keys |
        Where-Object {
          $coreByPid.ContainsKey([int]$_) -and $coreByPid[[int]$_].Role -eq "daemon"
        }
    )
    $descendants = @(Get-DescendantRecords -ProcessMap $ProcessMap -RootPid $rootPid)
    $subtreePids = @($rootPid) + @($descendants | ForEach-Object { [int]$_.Pid })
    $confidence = [string]$poolRootRecord.Confidence
    $recognitionMethod = [string]$poolRootRecord.RecognitionMethod
    $protectionReasons = @()

    if ($confidence -eq "low") {
      $protectionReasons += "confidence-not-high"
    }
    if ($daemonAncestors.Count -eq 0) {
      $protectionReasons += "daemon-ancestor-unproven"
    }
    $intersectsProtectedChain = $false
    foreach ($subtreePid in $subtreePids) {
      if ($ProtectedPidSet.ContainsKey([int]$subtreePid)) {
        $intersectsProtectedChain = $true
        break
      }
    }
    if ($intersectsProtectedChain) {
      $protectionReasons += "protected-current-session-chain"
    }

    if ([string]$ListenerObservation.Status -ne "known") {
      $protectionReasons += "listener-observation-unknown"
    }

    $listenerPids = @()
    foreach ($subtreePid in $subtreePids) {
      $subtreeListeningPorts = @(Get-ListeningPorts -PortMap $ListenerObservation.Ports -ProcessId $subtreePid)
      if ($subtreeListeningPorts.Count -gt 0) {
        $listenerPids += $subtreePid
      }
    }
    if ($listenerPids.Count -gt 0) {
      $protectionReasons += "subtree-listening-port"
    }

    foreach ($record in $descendants) {
      if ([string]$record.Process.Name -ine "WorkBuddy.exe") {
        continue
      }

      $descendantPid = [int]$record.Pid
      $role = if ($coreByPid.ContainsKey($descendantPid)) {
        [string]$coreByPid[$descendantPid].Role
      }
      elseif ($poolRootPidSet.ContainsKey($descendantPid)) {
        "prewarm-pool"
      }
      else {
        (Get-ProcessFamily -Name ([string]$record.Process.Name) -CommandLine ([string]$record.Process.CommandLine)) -replace '^workbuddy-', ''
      }
      if ($role -like "prewarm-pool*") {
        $role = "prewarm-pool"
      }
      $protectionReasons += "subtree-protected-workbuddy-role:$descendantPid`:$role"
    }

    foreach ($record in @([ordered]@{ Pid = $rootPid; Process = $poolRoot }) + $descendants) {
      $creationTime = Convert-CimDate $record.Process.CreationDate
      if ($null -eq $creationTime) {
        $protectionReasons += "subtree-unknown-age"
        break
      }
      if (($SampledAt - $creationTime).TotalMinutes -lt $MinimumAgeMinutes) {
        $protectionReasons += "subtree-younger-than-min-age"
        break
      }
    }

    $selectedBy = if (-not [string]::IsNullOrWhiteSpace($SelectedPoolId) -and $poolId -eq $SelectedPoolId) {
      "id"
    }
    elseif ($SelectedPoolPid -gt 0 -and $rootPid -eq $SelectedPoolPid) {
      "pid"
    }
    else {
      $null
    }
    $selected = $null -ne $selectedBy
    # Medium-confidence topology is actionable only by exact PID, never by an inferred broad identity.
    $mediumTopologyPidEligible = (
      $confidence -eq "medium" -and
      $recognitionMethod -eq "topology-inferred" -and
      $selectedBy -eq "pid"
    )
    $confidenceEligibleForApply = $confidence -eq "high" -or $mediumTopologyPidEligible
    $sessionState = if ($protectionReasons -contains "protected-current-session-chain") {
      "current"
    }
    elseif ($selected -and $NotCurrentConfirmed) {
      "not-current"
    }
    else {
      "unknown"
    }
    $decision = "needs-confirmation"
    if ($protectionReasons.Count -gt 0) {
      $decision = "blocked"
    }
    elseif ($selected -and $NotCurrentConfirmed -and $IdleConfirmed -and $confidenceEligibleForApply) {
      $decision = "candidate-workbuddy-pool-explicit"
    }

    # Root-first reduces respawn risk; deepest-first descendants then drain the frozen subtree.
    $stopPlan = @()
    if ($decision -eq "candidate-workbuddy-pool-explicit") {
      $rootCreationTime = Convert-CimDate $poolRoot.CreationDate
      $stopPlan += [ordered]@{
        Pid          = $rootPid
        Name         = [string]$poolRoot.Name
        CreationTime = if ($null -ne $rootCreationTime) { $rootCreationTime.ToString("o") } else { $null }
        Depth        = 0
        Order        = "pool-root-first"
      }
      foreach ($record in @($descendants | Sort-Object @{ Expression = { [int]$_.Depth }; Descending = $true }, @{ Expression = { [int]$_.Pid }; Descending = $true })) {
        $creationTime = Convert-CimDate $record.Process.CreationDate
        $stopPlan += [ordered]@{
          Pid          = [int]$record.Pid
          Name         = [string]$record.Process.Name
          CreationTime = if ($null -ne $creationTime) { $creationTime.ToString("o") } else { $null }
          Depth        = [int]$record.Depth
          Order        = "leaf-to-root"
        }
      }
    }

    $identificationEvidence = @($poolRootRecord.Evidence) + @("daemon-ancestor-pids=$($daemonAncestors -join ',')")

    $pools += [ordered]@{
      Pid                    = $rootPid
      PoolId                 = $poolId
      ParentPid              = [int]$poolRoot.ParentProcessId
      Confidence             = $confidence
      RecognitionMethod      = $recognitionMethod
      SessionState           = $sessionState
      Selected               = $selected
      SelectedBy             = $selectedBy
      ExplicitNotCurrentConfirmed = $NotCurrentConfirmed
      ExplicitIdleConfirmed  = $IdleConfirmed
      DescendantPids         = @($descendants | ForEach-Object { [int]$_.Pid })
      ListenerPids           = @($listenerPids)
      IdentificationEvidence = @($identificationEvidence)
      ProtectionReasons      = @($protectionReasons | Select-Object -Unique)
      Decision               = $decision
      StopPlan               = @($stopPlan)
    }
  }

  $currentPools = @($pools | Where-Object { $_.SessionState -eq "current" })
  return [ordered]@{
    CoreProcesses        = @($coreProcesses)
    PrewarmPoolCount     = $pools.Count
    PrewarmPools         = @($pools)
    CurrentSessionPoolId = if ($currentPools.Count -eq 1) { $currentPools[0].PoolId } else { $null }
    UnresolvedProcesses  = @($unresolvedProcesses)
  }
}
