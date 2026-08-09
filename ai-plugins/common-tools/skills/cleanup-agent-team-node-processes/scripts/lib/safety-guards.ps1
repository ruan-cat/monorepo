# Rejects ambiguous destructive scopes before observation or execution begins. These checks are
# fail-closed: a generic process/agent keyword is audit evidence, never sufficient ownership.
function Normalize-ApplyScopePattern {
  param([string]$Pattern)

  $value = $Pattern.Trim().ToLowerInvariant()
  $value = $value -replace '^\(\?i\)', ''
  $value = $value -replace '\\\.', '.'
  $value = $value -replace '\\b', ''
  $value = $value -replace '^\^', ''
  $value = $value -replace '\$$', ''

  $previous = $null
  while ($previous -ne $value) {
    $previous = $value
    $value = $value -replace '^\(\?:', ''
    $value = $value -replace '^\(', ''
    $value = $value -replace '\)$', ''
    $value = $value -replace '^\.\*', ''
    $value = $value -replace '\.\*$', ''
    $value = $value -replace '^\.\+', ''
    $value = $value -replace '\.\+$', ''
    $value = $value -replace '^\[.*?\]', ''
    $value = $value -replace '\[.*?\]$', ''
  }

  return $value
}

function Assert-ApplyScope {
  param(
    [string[]]$Patterns,
    [string[]]$TargetProcessNames
  )

  # Normalized regexes are compared with broad terms so cosmetic anchors cannot bypass scope.
  $broadPatterns = @(
    "node",
    "node.exe",
    "npx",
    "npx.exe",
    "cmd",
    "cmd.exe",
    "chrome",
    "chrome.exe",
    "msedge",
    "msedge.exe",
    "chromium",
    "chromium.exe",
    "agent",
    "agent-team",
    "agent-browser",
    "agent_browser",
    "playwright",
    "remote-debugging-port",
    "codex",
    "claude",
    "cursor",
    "mcp",
    "memorix"
  )

  foreach ($name in $TargetProcessNames) {
    $broadPatterns += $name
    $broadPatterns += ($name -replace "\.exe$", "")
  }

  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) {
      continue
    }

    $simplified = Normalize-ApplyScopePattern -Pattern $pattern

    if ([string]::IsNullOrWhiteSpace($simplified) -or $simplified -eq ".") {
      throw "-Apply requires a task-specific -IncludePattern. Refusing broad cleanup by wildcard regex: $pattern"
    }

    if ($broadPatterns -contains $simplified) {
      throw "-Apply requires a task-specific -IncludePattern. Refusing broad cleanup by process name or generic agent keyword: $pattern"
    }

    $alternatives = @($simplified -split "\|")
    foreach ($alternative in $alternatives) {
      $normalizedAlternative = Normalize-ApplyScopePattern -Pattern $alternative
      if ($broadPatterns -contains $normalizedAlternative) {
        throw "-Apply requires a task-specific -IncludePattern. Refusing broad cleanup by process name or generic agent keyword: $pattern"
      }
    }
  }
}

function Assert-OneShotCommandScope {
  param(
    [string[]]$Patterns,
    [string[]]$TargetProcessNames
  )

  Assert-ApplyScope -Patterns $Patterns -TargetProcessNames $TargetProcessNames

  foreach ($pattern in $Patterns) {
    if ($pattern -notmatch "\\s|\s") {
      throw "-EnableStuckOneShotRecovery requires each -OneShotCommandPattern to match a command argument, not only an executable name: $pattern"
    }
  }
}

function Assert-TemporaryOutputPath {
  param([string]$Path)

  # Apply ledgers may contain process metadata, so persistence is restricted to the OS temp tree.
  $resolvedPath = [IO.Path]::GetFullPath(
    $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
  )
  $tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
  if (-not $resolvedPath.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "-Apply requires -OutputPath inside the operating system temporary directory. Refusing non-temporary path: $resolvedPath"
  }

  return $resolvedPath
}
