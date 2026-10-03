#!/usr/bin/env pwsh
#Requires -Version 5.1
<#
.SYNOPSIS
    Install or update Memorix MCP config for local AI agent tools.
.DESCRIPTION
    Scans common MCP config files and ensures the memorix server entry uses the
    low-context `serve --mode micro` profile. Supports JSON and TOML formats.

    实现要点：**只做定点文本编辑，不做 JSON 全量解析 + 重序列化**。
    原因：
      1) ~/.claude.json 含仅大小写不同的重复键，PS 5.1 的 ConvertFrom-Json 会直接报错；
      2) PS 5.1 的 ConvertTo-Json 固定输出 4 空格缩进 + CRLF，
         会把 2 空格 / LF 的配置整文件重排（101KB 的 .claude.json 尤其明显）；
      3) Codex 的 memorix 用 `cmd /c memorix.cmd` 启动器，整体替换 args 会弄丢启动器。
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
        "$env:USERPROFILE\.qoder\mcp.json"
    );
    kiro = @(
        "$env:USERPROFILE\.kiro\settings\mcp.json"
    );
}

# Add user-provided extra paths as the custom platform.
if ($Config) {
    $configs['custom'] = $Config
}

# ---------------------------------------------------------------------------
# server 定义的键路径。
#   - JSON 平台：键路径。多数平台是 mcpServers；ZCode 是嵌套的 mcp.servers。
#   - TOML 平台：表名。Codex 是 mcp_servers（下划线，不是 mcpServers）。
# 写错会让脚本找不到已有 entry，转而在配置文件里新增一个目标程序不识别的键。
# ---------------------------------------------------------------------------
$serverPaths = @{
    codex = @('mcp_servers')
    zcode = @('mcp', 'servers')
}

# 注意：调用方必须写成 @(Get-ServerPath -Platform $x)。
# PowerShell 在 return 时会**展开单元素数组**，`return @('mcpServers')` 实际返回字符串，
# 于是 $serverPath.Count 变成 1、$serverPath[0] 变成字符 'm'，容器正则再也匹配不上。
function Get-ServerPath {
    param([string]$Platform)
    if ($serverPaths.ContainsKey($Platform)) { return $serverPaths[$Platform] }
    return @('mcpServers')
}

# Expected memorix config.
$memorixCommand = 'memorix'
$memorixMode = 'micro'
$memorixArgs = @('serve', '--mode', 'micro')

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
# 极简 JSON 文本扫描器：只用于定位 memorix entry 与其 args 数组。
# ---------------------------------------------------------------------------

# 返回与 $Text[$Start]（'{' 或 '['）配对的括号下标；找不到返回 -1。
# 会正确跳过字符串字面量内部的括号。
function Get-JsonBracketEnd {
    param([string]$Text, [int]$Start)
    $openChar = $Text[$Start]
    if ($openChar -eq '{') { $closeChar = '}' } else { $closeChar = ']' }
    $depth = 0
    $inString = $false
    $escaped = $false
    for ($i = $Start; $i -lt $Text.Length; $i++) {
        $ch = $Text[$i]
        if ($inString) {
            if ($escaped) { $escaped = $false }
            elseif ($ch -eq [char]92) { $escaped = $true }   # backslash
            elseif ($ch -eq [char]34) { $inString = $false } # double quote
            continue
        }
        if ($ch -eq [char]34) { $inString = $true; continue }
        if ($ch -eq $openChar) { $depth++ }
        elseif ($ch -eq $closeChar) {
            $depth--
            if ($depth -eq 0) { return $i }
        }
    }
    return -1
}

# 在 $Text 的 [From, To) 范围内查找 "<Name>" : 之后紧跟的第一个字符下标；找不到返回 -1。
function Find-JsonMemberValueStart {
    param([string]$Text, [int]$From, [int]$To, [string]$Name)
    if ($To -le $From) { return -1 }
    $slice = $Text.Substring($From, $To - $From)
    $m = [regex]::Match($slice, '"' + [regex]::Escape($Name) + '"\s*:\s*')
    if (-not $m.Success) { return -1 }
    return $From + $m.Index + $m.Length
}

# 按 serverPath 生成紧凑的新建 JSON 文本：{"mcp":{"servers":{"memorix":{...}}}}
function New-JsonContainerText {
    param([string[]]$ServerPath)
    $inner = '{"command":"' + $memorixCommand + '","args":["serve","--mode","' + $memorixMode + '"]}'
    for ($i = $ServerPath.Count - 1; $i -ge 0; $i--) {
        $inner = '{"' + $ServerPath[$i] + '":' + $inner + '}'
    }
    return $inner
}

# 以 UTF-8 无 BOM 写回，保持原文件的行尾与缩进（因为只改了子串）。
function Write-TextFile {
    param([string]$FilePath, [string]$Text)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($FilePath, $Text, $utf8NoBom)
}

# ---------------------------------------------------------------------------
# JSON file handling.
# ---------------------------------------------------------------------------
function Process-JsonConfig {
    param(
        [string]$Platform,
        [string]$FilePath
    )

    # @(...) 必需：见 Get-ServerPath 上方的说明（PowerShell 会展开单元素数组）。
    $serverPath = @(Get-ServerPath -Platform $Platform)

    if (-not (Test-Path -LiteralPath $FilePath)) {
        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'File not found (dry-run, would create)'
            return
        }

        $dir = Split-Path -Parent $FilePath
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            try {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            } catch {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to create directory: $_"
                return
            }
        }

        try {
            Write-TextFile -FilePath $FilePath -Text ((New-JsonContainerText -ServerPath $serverPath) + "`n")
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'created'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    try {
        $raw = [System.IO.File]::ReadAllText($FilePath)
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to read file: $_"
        return
    }

    # ---- 1. 定位 memorix entry ----
    $keyMatch = [regex]::Match($raw, '"memorix"\s*:\s*')
    if (-not $keyMatch.Success) {
        # 没有 memorix entry：在容器开头插入
        $lastKey = $serverPath[$serverPath.Count - 1]
        $containerMatches = [regex]::Matches($raw, '"' + [regex]::Escape($lastKey) + '"\s*:\s*\{')
        if ($containerMatches.Count -ne 1) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg (
                "Cannot locate '$($serverPath -join '.')' container (found $($containerMatches.Count) candidates).")
            return
        }

        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would add memorix entry (dry-run)'
            return
        }

        $braceIndex = $raw.IndexOf('{', $containerMatches[0].Index)
        # 探测容器内一级成员的缩进
        $indentMatch = [regex]::Match($raw, '(?m)^([ \t]+)"')
        if ($indentMatch.Success) { $indent = $indentMatch.Groups[1].Value } else { $indent = '  ' }
        $entry = "`n" + $indent + '"memorix": {"command": "' + $memorixCommand + '", "args": ["serve", "--mode", "' + $memorixMode + '"]}'
        $newRaw = $raw.Insert($braceIndex + 1, $entry)

        try {
            Write-TextFile -FilePath $FilePath -Text $newRaw
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    $objStart = $keyMatch.Index + $keyMatch.Length
    if ($raw[$objStart] -ne '{') {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg 'memorix entry is not a JSON object'
        return
    }
    $objEnd = Get-JsonBracketEnd -Text $raw -Start $objStart
    if ($objEnd -lt 0) {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg 'Unbalanced braces around memorix entry'
        return
    }

    # ---- 2. 定位 args 数组 ----
    $argsStart = Find-JsonMemberValueStart -Text $raw -From $objStart -To ($objEnd + 1) -Name 'args'
    if ($argsStart -lt 0 -or $raw[$argsStart] -ne '[') {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg (
            'Cannot locate the memorix args array. Run scripts/install-mcp.ts instead.')
        return
    }
    $argsEnd = Get-JsonBracketEnd -Text $raw -Start $argsStart
    if ($argsEnd -lt 0) {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg 'Unbalanced brackets in memorix args'
        return
    }
    $argsInner = $raw.Substring($argsStart + 1, $argsEnd - $argsStart - 1)

    # ---- 3. 判断是否需要改动（只看 mode；裸 serve 等价 micro）----
    $modeMatch = [regex]::Match($argsInner, '"--mode"\s*,\s*"([^"]*)"')
    if ($modeMatch.Success) {
        if ($modeMatch.Groups[1].Value -eq $memorixMode) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'ok'
            return
        }
    } elseif ($argsInner -match '"serve"') {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'ok'
        return
    }

    if ($DryRun) {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would update args (dry-run)'
        return
    }

    # ---- 4. 定点替换 mode（保留启动器前缀，如 Codex 的 ["/c", "memorix.cmd"]）----
    if ($modeMatch.Success) {
        $newInner = $argsInner.Remove($modeMatch.Groups[1].Index, $modeMatch.Groups[1].Length).Insert($modeMatch.Groups[1].Index, $memorixMode)
    } else {
        # args 里没有 --mode：在 "serve" 之后插入
        $serveMatch = [regex]::Match($argsInner, '"serve"')
        $insertAt = $serveMatch.Index + $serveMatch.Length
        $newInner = $argsInner.Insert($insertAt, ', "--mode", "' + $memorixMode + '"')
    }
    $newRaw = $raw.Substring(0, $argsStart + 1) + $newInner + $raw.Substring($argsEnd)

    try {
        Write-TextFile -FilePath $FilePath -Text $newRaw
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

    $table = (@(Get-ServerPath -Platform $Platform)) -join '.'
    $sectionHeader = "[$table.memorix]"
    $sectionPattern = '(?m)^[ \t]*\[' + [regex]::Escape("$table.memorix") + '\][ \t]*$'

    if (-not (Test-Path -LiteralPath $FilePath)) {
        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'File not found (dry-run, would create)'
            return
        }

        $dir = Split-Path -Parent $FilePath
        if ($dir -and -not (Test-Path -LiteralPath $dir)) {
            try {
                New-Item -ItemType Directory -Path $dir -Force -ErrorAction Stop | Out-Null
            } catch {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to create directory: $_"
                return
            }
        }

        $tomlContent = $sectionHeader + "`n" + 'command = "memorix"' + "`n" + 'args = ["serve", "--mode", "' + $memorixMode + '"]' + "`n"
        try {
            Write-TextFile -FilePath $FilePath -Text $tomlContent
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'created'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    try {
        $content = [System.IO.File]::ReadAllText($FilePath)
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to read file: $_"
        return
    }

    $sectionMatch = [regex]::Match($content, $sectionPattern)
    if (-not $sectionMatch.Success) {
        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would append section (dry-run)'
            return
        }
        $append = "`n" + $sectionHeader + "`n" + 'command = "memorix"' + "`n" + 'args = ["serve", "--mode", "' + $memorixMode + '"]' + "`n"
        try {
            Write-TextFile -FilePath $FilePath -Text ($content.TrimEnd() + $append)
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    # 只在该 section 的正文范围内查找 args，避免误伤其它 section
    $bodyStart = $sectionMatch.Index + $sectionMatch.Length
    $nextMatch = [regex]::Match($content.Substring($bodyStart), '(?m)^[ \t]*\[')
    if ($nextMatch.Success) { $bodyEnd = $bodyStart + $nextMatch.Index } else { $bodyEnd = $content.Length }
    $body = $content.Substring($bodyStart, $bodyEnd - $bodyStart)

    $argsMatch = [regex]::Match($body, 'args\s*=\s*\[([^\]]*)\]')
    if ($argsMatch.Success) {
        $argsInner = $argsMatch.Groups[1].Value
        $modeMatch = [regex]::Match($argsInner, '"--mode"\s*,\s*"([^"]*)"')
        if ($modeMatch.Success) {
            if ($modeMatch.Groups[1].Value -eq $memorixMode) {
                Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'ok'
                return
            }
        } elseif ($argsInner -match '"serve"') {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'ok'
            return
        }

        if ($DryRun) {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would update args (dry-run)'
            return
        }

        if ($modeMatch.Success) {
            $newInner = $argsInner.Remove($modeMatch.Groups[1].Index, $modeMatch.Groups[1].Length).Insert($modeMatch.Groups[1].Index, $memorixMode)
        } else {
            $serveMatch = [regex]::Match($argsInner, '"serve"')
            $insertAt = $serveMatch.Index + $serveMatch.Length
            $newInner = $argsInner.Insert($insertAt, ', "--mode", "' + $memorixMode + '"')
        }

        $innerStart = $bodyStart + $argsMatch.Groups[1].Index
        $newRaw = $content.Substring(0, $innerStart) + $newInner + $content.Substring($innerStart + $argsInner.Length)

        try {
            Write-TextFile -FilePath $FilePath -Text $newRaw
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
        } catch {
            Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
        }
        return
    }

    # section 存在但没有 args：在 section 头之后插入
    if ($DryRun) {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'skipped' -ErrorMsg 'Would insert args (dry-run)'
        return
    }
    $insertPos = $sectionMatch.Index + $sectionMatch.Length
    $newRaw = $content.Insert($insertPos, "`n" + 'args = ["serve", "--mode", "' + $memorixMode + '"]')
    try {
        Write-TextFile -FilePath $FilePath -Text $newRaw
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'updated'
    } catch {
        Emit-Result -Platform $Platform -ConfigFile $FilePath -Status 'error' -ErrorMsg "Failed to write file: $_"
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
