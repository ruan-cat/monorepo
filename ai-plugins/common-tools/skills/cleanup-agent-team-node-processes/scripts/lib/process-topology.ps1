# Classifies process roles and derives relationships from a caller-supplied process map.
# Traversal never refreshes state mid-pass, so all decisions share one topology snapshot.
function Get-ProcessFamily {
  param(
    [string]$Name,
    [string]$CommandLine
  )

  $lowerName = if ($null -ne $Name) { $Name.ToLowerInvariant() } else { "" }
  $lowerCommandLine = if ($null -ne $CommandLine) { $CommandLine.ToLowerInvariant() } else { "" }

  if ($lowerName -eq "node.exe") {
    if ($lowerCommandLine -match "agent-browser|agent_browser") {
      return "agent-browser-node"
    }

    return "node-runtime"
  }

  if ($lowerName -eq "workbuddy.exe") {
    if ($lowerCommandLine -match "daemon-app-server-entry\.js") { return "workbuddy-daemon" }
    if ($lowerCommandLine -match "sidecar-entry\.js") { return "workbuddy-sidecar" }
    if ($lowerCommandLine -match "codebuddy.*--serve.*--mcp-config") { return "workbuddy-mcp-server" }
    if ($lowerCommandLine -match "codebuddy.*--prewarm.*--prewarm-id") { return "workbuddy-prewarm-pool" }
    if ($lowerCommandLine -match "--prewarm-id") { return "workbuddy-prewarm-pool-unverified" }
    if ($lowerCommandLine -match "crashpad-handler") { return "workbuddy-crashpad" }
    if ($lowerCommandLine -match "type=renderer") { return "workbuddy-renderer" }
    if ($lowerCommandLine -match "type=gpu-process") { return "workbuddy-gpu" }
    if ($lowerCommandLine -match "type=utility") { return "workbuddy-utility" }
    if ([string]::IsNullOrWhiteSpace($lowerCommandLine)) { return "workbuddy-unknown" }
    return "workbuddy-ui"
  }

  if ($lowerName -eq "npx.exe") {
    return "package-runner"
  }

  if ($lowerName -in @("cmd.exe", "powershell.exe", "pwsh.exe", "conhost.exe")) {
    return "windows-command-wrapper"
  }

  if ($lowerName -eq "agent-browser.exe" -or $lowerName -eq "agent-browser-cli.exe") {
    return "agent-browser-cli"
  }

  if ($lowerName -eq "agent-browser-win32-x64.exe") {
    return "agent-browser-runtime"
  }

  if ($lowerName -eq "bash.exe") {
    if ($lowerCommandLine -match "(?:\.workbuddy|workbuddydata).*[\\/]shell-snapshots[\\/]") {
      return "workbuddy-shell-snapshot"
    }

    return "bash-shell"
  }

  if ($lowerName -in @("chrome.exe", "msedge.exe", "chromium.exe")) {
    if ($lowerCommandLine -match "agent-browser|agent_browser|playwright|remote-debugging-port") {
      return "agent-browser-runtime"
    }

    return "browser-runtime"
  }

  return "target-process"
}

function Get-AgentBrowserEvidenceMatches {
  param([string]$Text)

  $evidencePatterns = @(
    "agent-browser",
    "agent_browser",
    "playwright",
    "remote-debugging-port",
    "user-data-dir",
    "browser-profile",
    "restore-state",
    "codex",
    "session",
    "runid",
    "run-id",
    "workspace"
  )

  return @(Get-RegexMatches -Text $Text -Patterns $evidencePatterns)
}

function Get-ParentPidSet {
  param(
    [hashtable]$ProcessMap,
    [int]$StartPid
  )

  $set = @{}
  $currentPid = $StartPid
  $guard = 0

  # The visited set handles malformed cycles; the depth cap bounds corrupt fixture data.
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

function Get-DescendantRecords {
  param(
    [hashtable]$ProcessMap,
    [int]$RootPid
  )

  $records = @()
  # Breadth-first traversal records stable depth values later used to construct a safe stop order.
  $queue = New-Object System.Collections.Queue
  $queue.Enqueue([ordered]@{ Pid = $RootPid; Depth = 0 })
  $seen = @{ $RootPid = $true }

  while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    foreach ($process in $ProcessMap.Values) {
      $pidValue = [int]$process.ProcessId
      if ([int]$process.ParentProcessId -ne [int]$current.Pid -or $seen.ContainsKey($pidValue)) {
        continue
      }

      $depth = [int]$current.Depth + 1
      $seen[$pidValue] = $true
      $records += [ordered]@{
        Pid     = $pidValue
        Depth   = $depth
        Process = $process
      }
      $queue.Enqueue([ordered]@{ Pid = $pidValue; Depth = $depth })
    }
  }

  return @($records)
}

function Get-DirectChildProcesses {
  param(
    [hashtable]$ProcessMap,
    [int]$ParentPid
  )

  return @(
    $ProcessMap.Values |
      Where-Object { [int]$_.ParentProcessId -eq $ParentPid } |
      Sort-Object ProcessId
  )
}
