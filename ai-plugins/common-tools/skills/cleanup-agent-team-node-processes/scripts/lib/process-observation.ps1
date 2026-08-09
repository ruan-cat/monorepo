# Supports three observation phases in live and fixture-backed modes: initial classification,
# pre-stop identity revalidation, and post-stop verification.
function Read-ProcessObservation {
  param([string]$SnapshotPath)

  if ([string]::IsNullOrWhiteSpace($SnapshotPath)) {
    $liveProcesses = @(Get-CimInstance -ClassName Win32_Process)
    return [ordered]@{
      IsSnapshot             = $false
      ProcessMap             = ConvertTo-ProcessMap -Processes $liveProcesses
      RevalidationProcessMap = $null
      ResampledProcessMap    = $null
      ListenerStatus         = $null
      ListenerReason         = $null
    }
  }

  if (-not (Test-Path -LiteralPath $SnapshotPath -PathType Leaf)) {
    throw "Process snapshot does not exist: $SnapshotPath"
  }

  $snapshot = Get-Content -Raw -Encoding UTF8 -LiteralPath $SnapshotPath | ConvertFrom-Json
  $propertyNames = @($snapshot.PSObject.Properties.Name)
  if ($propertyNames -notcontains "Processes") {
    $legacyProcesses = @($snapshot)
    $legacyMap = ConvertTo-ProcessMap -Processes $legacyProcesses
    return [ordered]@{
      IsSnapshot             = $true
      ProcessMap             = $legacyMap
      RevalidationProcessMap = $legacyMap
      ResampledProcessMap    = $legacyMap
      ListenerStatus         = "known"
      ListenerReason         = $null
    }
  }

  # Array wrappers preserve zero/one/many fixture shapes; PowerShell otherwise scalarizes one item.
  $processes = @($snapshot.Processes)
  $revalidationProcesses = if ($propertyNames -contains "RevalidationProcesses") {
    @($snapshot.RevalidationProcesses)
  }
  else {
    $processes
  }
  $resampledProcesses = if ($propertyNames -contains "ResampledProcesses") {
    @($snapshot.ResampledProcesses)
  }
  else {
    $processes
  }

  $listenerStatus = "known"
  $listenerReason = $null
  if ($propertyNames -contains "ListenerObservation" -and $null -ne $snapshot.ListenerObservation) {
    if ($snapshot.ListenerObservation -is [string]) {
      $listenerStatus = ([string]$snapshot.ListenerObservation).ToLowerInvariant()
    }
    else {
      $listenerStatus = ([string]$snapshot.ListenerObservation.Status).ToLowerInvariant()
      $listenerReason = [string]$snapshot.ListenerObservation.Reason
    }
  }
  if ($listenerStatus -notin @("known", "unknown")) {
    throw "Process snapshot ListenerObservation.Status must be 'known' or 'unknown'."
  }

  return [ordered]@{
    IsSnapshot             = $true
    ProcessMap             = ConvertTo-ProcessMap -Processes $processes
    RevalidationProcessMap = ConvertTo-ProcessMap -Processes $revalidationProcesses
    ResampledProcessMap    = ConvertTo-ProcessMap -Processes $resampledProcesses
    ListenerStatus         = $listenerStatus
    ListenerReason         = if ([string]::IsNullOrWhiteSpace($listenerReason)) { $null } else { $listenerReason }
  }
}

function Get-ProcessMap {
  $allProcesses = @(Get-CimInstance -ClassName Win32_Process)
  return ConvertTo-ProcessMap -Processes $allProcesses
}

function Get-TargetProcesses {
  param(
    [hashtable]$ProcessMap,
    [string[]]$ProcessNames
  )

  $nameSet = @{}
  foreach ($name in $ProcessNames) {
    $nameSet[$name] = $true
  }

  return @(
    $ProcessMap.Values |
      Where-Object { $nameSet.ContainsKey(([string]$_.Name).ToLowerInvariant()) } |
      Sort-Object ProcessId
  )
}

function Get-ProcessNameCounts {
  param([object[]]$Entries)

  $counts = [ordered]@{}
  foreach ($entry in $Entries) {
    $name = [string]$entry.Name
    if (-not $counts.Contains($name)) {
      $counts[$name] = 0
    }

    $counts[$name] += 1
  }

  return $counts
}

function Get-ListeningPortObservation {
  param(
    [hashtable]$ProcessMap,
    [switch]$UseSnapshot,
    [string]$SnapshotStatus,
    [string]$SnapshotReason
  )

  $map = @{}
  if ($UseSnapshot) {
    if ($SnapshotStatus -eq "unknown") {
      return [ordered]@{
        Status = "unknown"
        Reason = if ([string]::IsNullOrWhiteSpace($SnapshotReason)) { "fixture-specified" } else { $SnapshotReason }
        Ports  = $map
      }
    }

    foreach ($process in $ProcessMap.Values) {
      if ($null -ne $process.ListeningPorts) {
        $ports = @($process.ListeningPorts)
        $map[[int]$process.ProcessId] = $ports
      }
    }

    return [ordered]@{ Status = "known"; Reason = $null; Ports = $map }
  }

  $cmd = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue

  if ($null -eq $cmd) {
    return [ordered]@{ Status = "unknown"; Reason = "command-unavailable"; Ports = $map }
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
    return [ordered]@{ Status = "unknown"; Reason = "query-failed"; Ports = $map }
  }

  return [ordered]@{ Status = "known"; Reason = $null; Ports = $map }
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
  param(
    [int]$ProcessId,
    [hashtable]$ProcessMap
  )

  if ($null -ne $ProcessMap) {
    return $ProcessMap.ContainsKey($ProcessId)
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  return ($null -ne $process)
}

function Get-ProcessCpuSeconds {
  param([int]$ProcessId)

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($null -eq $process -or $null -eq $process.CPU) {
    return $null
  }

  return [math]::Round([double]$process.CPU, 2)
}

function Get-ProcessCpuSamples {
  param([object[]]$Processes)

  $samples = @{}
  foreach ($process in $Processes) {
    if ([string]$process.Name -ieq "node.exe") {
      $samples[[int]$process.ProcessId] = Get-ProcessCpuSeconds -ProcessId ([int]$process.ProcessId)
    }
  }

  return $samples
}

function Test-LiveProcessIdentity {
  param(
    [int]$ProcessId,
    [string]$ExpectedName,
    [string]$ExpectedCreationTime,
    [hashtable]$ProcessMap
  )

  # PID alone is unsafe after a delay because Windows may reuse it; name and creation time bind the
  # action to the process instance that appeared in the frozen audit snapshot.
  if ($null -ne $ProcessMap) {
    $live = if ($ProcessMap.ContainsKey($ProcessId)) { $ProcessMap[$ProcessId] } else { $null }
  }
  else {
    try {
      $live = Get-CimInstance -ClassName Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
    }
    catch {
      return $false
    }
  }

  if ($null -eq $live -or [string]$live.Name -ine $ExpectedName) {
    return $false
  }

  $liveCreationTime = Convert-CimDate $live.CreationDate
  $expected = Convert-CimDate $ExpectedCreationTime
  return ($null -ne $liveCreationTime -and $null -ne $expected -and $liveCreationTime -eq $expected)
}
