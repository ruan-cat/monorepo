#!/usr/bin/env pwsh
#Requires -Version 5.1
<#
.SYNOPSIS
    安装/更新 Memorix MCP 配置到本地 AI Agent 工具。
.DESCRIPTION
    扫描常见 MCP 配置文件位置，确保 memorix 的 args 为 ["serve", "--mode", "full"]。
    支持 JSON 和 TOML 格式。
.PARAMETER DryRun
    预览模式，不实际写入文件。
.PARAMETER Config
    额外的配置文件路径（可多次指定）。
.PARAMETER Help
    显示帮助信息。
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
    @"
Usage: .\install-mcp.ps1 [-DryRun] [-Config <path>] [-Help]

Options:
  -DryRun    Preview changes without writing files.
  -Config    Additional config file path(s). Can be specified multiple times.
  -Help      Show this help message.

Supported platforms: codex, claude, cursor, workbuddy, zcode, qoder, kiro
"@ | Write-Output
    exit 0
}

# ---------------------------------------------------------------------------
# 配置文件定义：platform => 路径数组（基于 $env:USERPROFILE）
# ---------------------------------------------------------------------------
$configs = @{
    codex = @(
        "$env:USERPROFILE\.codex\config.toml",
        "$env:USERPROFILE\.codex\config-2026-6-13-bg.toml"
    )
    claude = @(
        "$env:USERPROFILE\.claude.json"
    )
    cursor = @(
        "$env:USERPROFILE\.cursor\mcp.json"
    )
    workbuddy = @(
        "$env:USERPROFILE\.workbuddy\mcp.json",
        "$env:USERPROFILE\.workbuddy\.mcp.json"
    )
    zcode = @(
        "$env:USERPROFILE\.zcode\cli\config.json"
    )
    qoder = @(
        "$env:USERPROFILE\AppData\Roaming\Qoder\SharedClientCache\mcp.json"
    )
    kiro = @(
        "$env:USERPROFILE\.kiro\settings\mcp.json"
    )
}

# 加入用户传入的额外路径（统一放到 custom platform）
if ($Config) {
    $configs['custom'] = $Config
}

# 期望的 memorix 配置块
$memorixCommand = 'memorix'
$memorixArgs = @('serve', '--mode', 'full')

# ---------------------------------------------------------------------------
# Helper：输出结构化 JSON 行
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
# JSON 文件处理
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

        # 创建目录
        $dir = Split-Path -Parent $FilePath
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            try {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            } catch {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to create directory: $_"
                return
            }
        }

        # 创建新文件并写入 memorix 配置
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

    # 文件存在，读取并更新
    try {
        $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
        $json = $content | ConvertFrom-Json -ErrorAction Stop
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to parse JSON: $_"
        return
    }

    # 确保 mcpServers.memorix 存在
    if (-not $json.mcpServers) {
        $json | Add-Member -NotePropertyName 'mcpServers' -NotePropertyValue ([PSCustomObject]@{}) -Force
    }
    if (-not $json.mcpServers.memorix) {
        $json.mcpServers | Add-Member -NotePropertyName 'memorix' -NotePropertyValue ([PSCustomObject]@{}) -Force
    }

    # 检查是否需要更新
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

    # 更新配置
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
# TOML 文件处理（仅 Codex）
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

        # 创建目录
        $dir = Split-Path -Parent $FilePath
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            try {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            } catch {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to create directory: $_"
                return
            }
        }

        # 创建新 TOML 文件
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

    # 文件存在，读取内容
    try {
        $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to read file: $_"
        return
    }

    # 检查是否已有 [mcpServers.memorix] 部分
    $sectionPattern = '(?ms)^\s*\[mcpServers\.memorix\]\s*$'
    $hasSection = $content -match $sectionPattern

    if ($hasSection) {
        # 已有 section，尝试替换 args
        $argsPattern = '(?ms)(\[mcpServers\.memorix\].*?args\s*=\s*)\[[^\]]*\]'
        $replacement = "`${1}[`"serve`", `"--mode`", `"full`"]"

        $newContent = $content -replace $argsPattern, $replacement

        # 如果没有匹配到 args，则在 section 后面追加
        if ($newContent -eq $content) {
            # 在 section 行后插入 args
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
        # 没有 section，追加到文件末尾
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
# 主逻辑：遍历所有配置
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
