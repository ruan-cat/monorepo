# Shared, side-effect-free normalization and serialization helpers used across later modules.
# Keep these helpers permissive for audit data, but never let them silently broaden Apply scope.
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

  $parsed = [DateTime]::MinValue
  if ([DateTime]::TryParse([string]$Value, [ref]$parsed)) {
    return $parsed
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

function Protect-SensitiveCommandLine {
  param([string]$CommandLine)

  if ([string]::IsNullOrWhiteSpace($CommandLine)) {
    return $CommandLine
  }

  $protected = $CommandLine
  $credentialNames = @("token", "access-token", "api-key", "authorization")
  foreach ($credentialName in $credentialNames) {
    $pattern = '(?i)(--{0}(?:=|\s+))("[^"]*"|''[^'']*''|\S+)' -f [regex]::Escape($credentialName)
    $protected = [regex]::Replace($protected, $pattern, '$1<redacted>')
  }

  return $protected
}

function ConvertTo-ProcessMap {
  param([object[]]$Processes)

  # A PID-keyed map gives every topology and identity check the same frozen lookup shape.
  $map = @{}
  foreach ($process in @($Processes)) {
    if ($null -eq $process -or $null -eq $process.ProcessId) {
      continue
    }
    $map[[int]$process.ProcessId] = $process
  }

  return $map
}

function Normalize-ProcessNames {
  param([string[]]$Names)

  $normalized = @()
  foreach ($name in $Names) {
    if ([string]::IsNullOrWhiteSpace($name)) {
      continue
    }

    $trimmed = $name.Trim()
    if (-not $trimmed.EndsWith(".exe", [System.StringComparison]::OrdinalIgnoreCase)) {
      $trimmed = "$trimmed.exe"
    }

    $normalized += $trimmed.ToLowerInvariant()
  }

  $uniqueNames = @($normalized | Select-Object -Unique)
  if ($uniqueNames.Count -eq 0) {
    throw "ProcessName must contain at least one executable name."
  }

  return @($uniqueNames)
}
