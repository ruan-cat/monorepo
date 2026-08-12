#requires -Version 5.1
<##
.SYNOPSIS
    从两个 ai-plugins Skill tree 全量生成并校验 skill-registry.json。

.DESCRIPTION
    默认执行只读 Check；只有显式 -Apply 才写入 registry。生成结果是稳定的
    UTF-8（无 BOM）、LF、两空格缩进 JSON，不包含时间戳、分支或 commit SHA。
#>
[CmdletBinding()]
param(
    [switch]$Check,
    [switch]$Apply
)

$ErrorActionPreference = "Stop"

function Fail {
    param([string]$Message)
    Write-Host ("[ERROR] " + $Message) -ForegroundColor Red
    exit 1
}

function Info { Write-Host ("[INFO]  " + ($args -join " ")) }
function Ok { Write-Host ("[OK]    " + ($args -join " ")) -ForegroundColor Green }

if ($Check -and $Apply) { Fail "不能同时指定 -Check 与 -Apply" }
$DoApply = [bool]$Apply

# 从 scripts/ 向上定位包含 pnpm-workspace.yaml 或 .git 的仓库根。
$Root = $null
$dir = Split-Path -Parent $PSScriptRoot
for ($i = 0; $i -lt 15; $i++) {
    if ((Test-Path (Join-Path $dir "pnpm-workspace.yaml")) -or (Test-Path (Join-Path $dir ".git"))) {
        $Root = (Resolve-Path $dir).Path
        break
    }
    $parent = Split-Path -Parent $dir
    if ($parent -eq $dir) { break }
    $dir = $parent
}
if (-not $Root) { Fail "无法定位仓库根目录" }

$RegistryRel = "ai-plugins/skill-registry.json"
$RegistryPath = Join-Path $Root $RegistryRel
$Roots = @(
    [ordered]@{ Plugin = "common-tools"; Relative = "ai-plugins/common-tools/skills" },
    [ordered]@{ Plugin = "dev-skills"; Relative = "ai-plugins/dev-skills/skills" }
)

function Unquote-YamlScalar {
    param([string]$Value)
    $v = $Value.Trim()
    if ($v.Length -ge 2) {
        $first = $v.Substring(0, 1)
        $last = $v.Substring($v.Length - 1, 1)
        if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
            $v = $v.Substring(1, $v.Length - 2)
            if ($first -eq '"') { $v = $v -replace '\\"', '"' }
            else { $v = $v -replace "''", "'" }
        }
    }
    return $v
}

function Get-Frontmatter {
    param([string]$Path)
    $text = [System.IO.File]::ReadAllText($Path)
    $lines = @($text -split "`r?`n")
    if ($lines.Count -lt 3 -or $lines[0] -ne "---") {
        Fail ("SKILL.md 缺少 YAML frontmatter: " + $Path)
    }
    $close = -1
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -eq "---") { $close = $i; break }
    }
    if ($close -lt 0) { Fail ("SKILL.md frontmatter 未闭合: " + $Path) }

    $name = $null
    $description = $null
    $version = $null
    $descriptionMode = $null
    $descriptionLines = New-Object System.Collections.Generic.List[string]

    for ($i = 1; $i -lt $close; $i++) {
        $line = $lines[$i]
        if ($descriptionMode) {
            if ($line -match '^\s{2,}' -or [string]::IsNullOrWhiteSpace($line)) {
                $descriptionLines.Add(($line -replace '^\s{2}', ''))
                continue
            }
            $descriptionMode = $null
        }
        if ($line -match '^name:\s*(.*?)\s*$') {
            $name = Unquote-YamlScalar $Matches[1]
            continue
        }
        if ($line -match '^description:\s*(.*?)\s*$') {
            $raw = $Matches[1]
            if ($raw -match '^[>|][+-]?\s*$') {
                $descriptionMode = $raw.Substring(0, 1)
                continue
            }
            $description = Unquote-YamlScalar $raw
            continue
        }
        if ($line -match '^\s+version:\s*"?([^"\s]+)"?\s*$') {
            $version = $Matches[1]
            continue
        }
    }

    if ($descriptionMode -or $descriptionLines.Count -gt 0) {
        if ($descriptionMode -eq '|') {
            $description = ($descriptionLines.ToArray() -join "`n").Trim()
        } else {
            $parts = New-Object System.Collections.Generic.List[string]
            $blank = $false
            foreach ($part in $descriptionLines) {
                if ([string]::IsNullOrWhiteSpace($part)) { $blank = $true; continue }
                if ($blank -and $parts.Count -gt 0) { $parts.Add("`n") }
                $parts.Add($part.Trim())
                $blank = $false
            }
            $description = ($parts.ToArray() -join " ").Trim()
        }
    }

    if ([string]::IsNullOrWhiteSpace($name)) { Fail ("Skill 缺少 name: " + $Path) }
    if ([string]::IsNullOrWhiteSpace($description)) { Fail ("Skill 缺少 description: " + $Path) }
    if ([string]::IsNullOrWhiteSpace($version)) { Fail ("Skill 缺少 metadata.version: " + $Path) }
    if ($version -notmatch '^\d+\.\d+\.\d+$') { Fail ("Skill metadata.version 非法: " + $Path + " = " + $version) }
    return [ordered]@{ Name = $name; Description = $description; Version = $version }
}

function Get-Skills {
    $entries = New-Object System.Collections.Generic.List[object]
    $seen = @{}
    foreach ($rootInfo in $Roots) {
        $rootPath = Join-Path $Root $rootInfo.Relative
        if (-not (Test-Path -LiteralPath $rootPath -PathType Container)) { Fail ("Skill root 不存在: " + $rootInfo.Relative) }
        $dirs = @(Get-ChildItem -LiteralPath $rootPath -Directory | Sort-Object -Property Name)
        foreach ($dirInfo in $dirs) {
            $id = $dirInfo.Name
            if ($id -notmatch '^[a-z0-9][a-z0-9-]*$') { Fail ("Skill 目录名非法: " + $rootInfo.Relative + "/" + $id) }
            if ($seen.ContainsKey($id)) { Fail ("Duplicate skill id " + $id + " found in " + $seen[$id] + " and " + $rootInfo.Plugin + ".") }
            $skillPath = Join-Path $dirInfo.FullName "SKILL.md"
            if (-not (Test-Path -LiteralPath $skillPath -PathType Leaf)) { Fail ("Skill 缺少 SKILL.md: " + $skillPath) }
            $fm = Get-Frontmatter $skillPath
            $entry = ($rootInfo.Relative + "/" + $id + "/SKILL.md") -replace '\\', '/'
            $entryFullPath = Join-Path $Root ($entry -replace '/', [IO.Path]::DirectorySeparatorChar)
            if (-not (Test-Path -LiteralPath $entryFullPath -PathType Leaf)) { Fail ("Registry entry 不存在: " + $entry) }
            $seen[$id] = $rootInfo.Plugin
            $entries.Add([ordered]@{
                id = $id
                plugin = $rootInfo.Plugin
                name = $fm.Name
                description = $fm.Description
                version = $fm.Version
                entry = $entry
            })
        }
    }
    return @($entries | Sort-Object -Property @{ Expression = { $_['id'] }; Ascending = $true })
}

function ConvertTo-CanonicalJson {
    param([object]$Object)
    $json = $Object | ConvertTo-Json -Depth 20
    $json = [regex]::Replace($json, "`r`n|`r|`n", "`n")
    # ConvertTo-Json 在 Windows PowerShell 5.1 对数组项使用不规则缩进；按 JSON
    # 结构重新计算深度，避免依赖不同 runtime 的缩进实现。
    $normalizedLines = New-Object System.Collections.Generic.List[string]
    $depth = 0
    foreach ($line in @($json -split "`n")) {
        $trimmed = $line.TrimStart()
        $startsWithClosing = $trimmed.StartsWith('}') -or $trimmed.StartsWith(']')
        if ($startsWithClosing) { $depth-- }
        if ($depth -lt 0) { $depth = 0 }
        $trimmed = $trimmed -replace '":\s{2,}', '": '
        $normalizedLines.Add(('  ' * $depth) + $trimmed)
        $inString = $false
        $scanStart = if ($startsWithClosing) { 1 } else { 0 }
        for ($i = $scanStart; $i -lt $trimmed.Length; $i++) {
            $ch = $trimmed[$i]
            if ($inString) {
                if ($ch -eq '\' -and ($i + 1) -lt $trimmed.Length) { $i++ }
                elseif ($ch -eq '"') { $inString = $false }
            } else {
                if ($ch -eq '"') { $inString = $true }
                elseif ($ch -eq '{' -or $ch -eq '[') { $depth++ }
                elseif ($ch -eq '}' -or $ch -eq ']') { $depth-- }
            }
        }
        if ($depth -lt 0) { $depth = 0 }
    }
    $json = ($normalizedLines.ToArray() -join "`n")
    return ($json.TrimEnd("`n") + "`n")
}

$entries = Get-Skills
$registry = [ordered]@{
    schemaVersion = "1"
    roots = @($Roots | ForEach-Object { $_.Relative })
    skills = @($entries)
}
$expected = ConvertTo-CanonicalJson $registry
$commonCount = @($entries | Where-Object { $_.plugin -eq "common-tools" }).Count
$devCount = @($entries | Where-Object { $_.plugin -eq "dev-skills" }).Count
Info ("common-tools skills: " + $commonCount)
Info ("dev-skills skills: " + $devCount)
Info ("total skills: " + @($entries).Count)

if ($DoApply) {
    $parent = Split-Path -Parent $RegistryPath
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    $tmp = $RegistryPath + "." + $PID + ".tmp"
    try {
        [System.IO.File]::WriteAllText($tmp, $expected, (New-Object System.Text.UTF8Encoding($false)))
        Move-Item -LiteralPath $tmp -Destination $RegistryPath -Force
    } finally {
        if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force }
    }
    $actual = [System.IO.File]::ReadAllText($RegistryPath)
    if ($actual -cne $expected) { Fail "写入后的 skill-registry.json 与 canonical output 不一致" }
    Ok "skill-registry.json 已生成（canonical UTF-8/LF）"
    exit 0
}

if (-not (Test-Path -LiteralPath $RegistryPath -PathType Leaf)) {
    Fail "skill-registry.json 不存在。Run: powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1 -Apply"
}
$actual = [System.IO.File]::ReadAllText($RegistryPath)
if ($actual -cne $expected) {
    Fail "skill-registry.json 已过期或不是 canonical output。Run: powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1 -Apply"
}
Ok "skill-registry.json is current"
exit 0
