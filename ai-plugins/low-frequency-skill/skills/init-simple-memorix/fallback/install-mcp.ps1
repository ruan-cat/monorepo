#!/usr/bin/env pwsh
#Requires -Version 5.1
<#
.SYNOPSIS
    Install or update Memorix MCP config for local AI agent tools.
.DESCRIPTION
    Scans common MCP config files and ensures memorix args are ["serve", "--mode", "full"].
    Supports JSON and TOML formats.
.PARAMETER DryRun
    Preview mode; do not write files.
.PARAMETER Config
    Extra config file path. Can be specified multiple times.
.PARAMETER Help
    Show help.
.EXAMPLE
    .\install-mcp.ps1
    .\install-mcp.ps1 -DryRun
    .\install-mcp.ps1 -Config "C:\custom\mcp.json"
#>

param(
    [switch]$DryRun,
    [string[]]$Config,
    [switch]$Help
)

if ($Help) {
    $helpText = @"
Usage: .\install-mcp.ps1 [-DryRun] [-Config <path>] [-Help]

Options:
  -DryRun    Preview changes without writing files.
  -Config    Additional config file path(s). Can be specified multiple times.
  -Help      Show this help message.

Supported platforms: codex, claude, cursor, workbuddy, zcode, qoder, kiro
"@
    $helpText | Write-Output
    exit 0
}

# ---------------------------------------------------------------------------
# Config definitions: platform => path array based on $env:USERPROFILE.
# ---------------------------------------------------------------------------
$configs = @{
    codex = @(
        "$env:USERPROFILE\.codex\config.toml",
        "$env:USERPROFILE\.codex\config-2026-6-13-bg.toml"
    );
    claude = @(
        "$env:USERPROFILE\.claude.json"
    );
    cursor = @(
        "$env:USERPROFILE\.cursor\mcp.json"
    );
    workbuddy = @(
        "$env:USERPROFILE\.workbuddy\mcp.json",
        "$env:USERPROFILE\.workbuddy\.mcp.json"
    );
    zcode = @(
        "$env:USERPROFILE\.zcode\cli\config.json"
    );
    qoder = @(
        "$env:USERPROFILE\AppData\Roaming\Qoder\SharedClientCache\mcp.json"
    );
    kiro = @(
        "$env:USERPROFILE\.kiro\settings\mcp.json"
    );
}

# Add user-provided extra paths as the custom platform.
if ($Config) {
    $configs['custom'] = $Config
}

# Expected memorix config.
$memorixCommand = 'memorix'
$memorixArgs = @('serve', '--mode', 'full')

# ---------------------------------------------------------------------------
# Helper: output one compact JSON line.
# ---------------------------------------------------------------------------
function Emit-Result {
    param(
        [string]$Platform,
        [string]$ConfigFile,
        [string]$Status,   # created | updated | skipped | error
        [string]$ErrorMsg = ''
    )
    $obj = [ordered]@{
        platform   = $Platform
        configFile = $ConfigFile
        status     = $Status
    }
    if ($ErrorMsg) { $obj.error = $ErrorMsg }
    $obj | ConvertTo-Json -Compress | Write-Output
}

# ---------------------------------------------------------------------------
# JSON file handling.
# ---------------------------------------------------------------------------
function Process-JsonConfig {
    param(
        [string]$Platform,
        [string]$FilePath
    )

    if (-not (Test-Path -LiteralPath $FilePath)) {
        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'File not found (dry-run, would create)'
            return
        }

        # Create directory.
        $dir = Split-Path -Parent $FilePath
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            try {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            } catch {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to create directory: $_"
                return
            }
        }

        # Create a new file with memorix config.
        $newConfig = [ordered]@{
            mcpServers = [ordered]@{
                memorix = [ordered]@{
                    command = $memorixCommand
                    args    = $memorixArgs
                }
            }
        }
        try {
            $newConfig | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $FilePath -Encoding UTF8 -ErrorAction Stop
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'created'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    # Read and update existing file.
    try {
        $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
        $json = $content | ConvertFrom-Json -ErrorAction Stop
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to parse JSON: $_"
        return
    }

    # Ensure mcpServers.memorix exists.
    if (-not $json.mcpServers) {
        $json | Add-Member -NotePropertyName 'mcpServers' -NotePropertyValue ([PSCustomObject]@{}) -Force
    }
    if (-not $json.mcpServers.memorix) {
        $json.mcpServers | Add-Member -NotePropertyName 'memorix' -NotePropertyValue ([PSCustomObject]@{}) -Force
    }

    # Check whether an update is needed.
    $needsUpdate = $false
    $existingCmd = $json.mcpServers.memorix.command
    $existingArgs = $json.mcpServers.memorix.args

    if ($existingCmd -ne $memorixCommand) {
        $needsUpdate = $true
    }
    if (($existingArgs -join ',') -ne ($memorixArgs -join ',')) {
        $needsUpdate = $true
    }

    if (-not $needsUpdate) {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped'
        return
    }

    if ($DryRun) {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would update args (dry-run)'
        return
    }

    # Update config.
    $json.mcpServers.memorix.command = $memorixCommand
    $json.mcpServers.memorix.args = $memorixArgs

    try {
        $json | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $FilePath -Encoding UTF8 -ErrorAction Stop
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
    }
}

# ---------------------------------------------------------------------------
# TOML file handling for Codex.
# ---------------------------------------------------------------------------
function Process-TomlConfig {
    param(
        [string]$Platform,
        [string]$FilePath
    )

    if (-not (Test-Path -LiteralPath $FilePath)) {
        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'File not found (dry-run, would create)'
            return
        }

        # Create directory.
        $dir = Split-Path -Parent $FilePath
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            try {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            } catch {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to create directory: $_"
                return
            }
        }

        # Create a new TOML file.
        $tomlContent = @"
[mcpServers.memorix]
command = "memorix"
args = ["serve", "--mode", "full"]
"@
        try {
            Set-Content -LiteralPath $FilePath -Value $tomlContent -Encoding UTF8 -ErrorAction Stop
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'created'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    # Read existing content.
    try {
        $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to read file: $_"
        return
    }

    # Check whether [mcpServers.memorix] already exists.
    $sectionPattern = '(?ms)^\s*\[mcpServers\.memorix\]\s*$'
    $hasSection = $content -match $sectionPattern

    if ($hasSection) {
        # Existing section: replace args.
        $argsPattern = '(?ms)(\[mcpServers\.memorix\].*?args\s*=\s*)\[[^\]]*\]'
        $replacement = "`${1}[`"serve`", `"--mode`", `"full`"]"

        $newContent = $content -replace $argsPattern, $replacement

        # If args was not matched, insert it after the section header.
        if ($newContent -eq $content) {
            # Insert args after the section line.
            $sectionLinePattern = '(^\s*\[mcpServers\.memorix\]\s*$)'
            $newContent = $content -replace $sectionLinePattern, "`$1`nargs = [`"serve`", `"--mode`", `"full`"]"
        }

        if ($newContent -eq $content) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped'
            return
        }

        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would update args (dry-run)'
            return
        }

        try {
            Set-Content -LiteralPath $FilePath -Value $newContent -Encoding UTF8 -ErrorAction Stop
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
    } else {
        # No section: append to the end.
        $appendContent = @"

[mcpServers.memorix]
command = "memorix"
args = ["serve", "--mode", "full"]
"@
        $newContent = $content.TrimEnd() + $appendContent

        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would append section (dry-run)'
            return
        }

        try {
            Set-Content -LiteralPath $FilePath -Value $newContent -Encoding UTF8 -ErrorAction Stop
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
    }
}

# ---------------------------------------------------------------------------
# Main loop: process every configured path.
# ---------------------------------------------------------------------------
foreach ($platform in $configs.Keys) {
    foreach ($filePath in $configs[$platform]) {
        if ($filePath -match '\.toml$') {
            Process-TomlConfig -Platform $platform -FilePath $filePath
        } else {
            Process-JsonConfig -Platform $platform -FilePath $filePath
        }
    }
}
