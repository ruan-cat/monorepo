#requires -Version 5.1
<#
.SYNOPSIS
    ai-plugins 多插件发布脚本：统一升级插件版本、技能 metadata.version 并同步 CHANGELOG。

.DESCRIPTION
    默认 DryRun 只输出计划，不写任何文件；只有显式 -Apply 才写文件。
    只允许操作白名单文件：
      - 6 份 plugin.json（common-tools / dev-skills x Claude / Cursor / Codex）
      - 2 份 marketplace.json（根级 .claude-plugin / .cursor-plugin，含版本字段）
      - 1 份 Codex marketplace.json（.agents/plugins，无版本字段，仅校验）
      - 2 份 CHANGELOG.md（common-tools / dev-skills）
      - 2 份插件 README.md（新增技能时的阻断校验，只读）
      - -Skill / -NewSkill 显式指定的 SKILL.md
    仓库根目录自动定位（向上查找 pnpm-workspace.yaml 或 .git）。
    不引入任何第三方依赖，仅使用 PowerShell 内置能力。
    任何校验失败立即以非零退出码终止，不写任何文件。

.PARAMETER Version
    新插件主版本号，格式 MAJOR.MINOR.PATCH，如 8.3.3。必填（配合 -Skill / -NewSkill / -Summary 使用时）。

.PARAMETER Skill
    需要升级 metadata.version 的技能名（逗号分隔或重复传入）。省略时由脚本从
    git diff HEAD 与未跟踪文件自动发现最近修改的 skill，发现不到即失败。
    仅允许升级显式列出或确实修改过的技能，禁止默认升级未修改技能。

.PARAMETER ChangeType
    added / major / minor / patch，默认 patch。
    - 决定技能 metadata.version 的增量步长（major: 1.0.0，minor: x.(y+1).0，patch: x.y.(z+1)）
    - 决定 CHANGELOG 条目分类标题（added -> ### Added，其余 -> ### Changed）

.PARAMETER Summary
    CHANGELOG 追加的摘要 bullet 文本（可选）。需要 -Version。

.PARAMETER Date
    CHANGELOG 条目日期，格式 YYYY-MM-DD，默认今天。

.PARAMETER NewSkill
    新增的技能名（逗号分隔或重复传入）。触发 README 阻断验收：对应插件 README.md 必须包含该技能名，否则直接失败。
    新技能缺少 metadata.version 时初始化为 0.1.0。

.PARAMETER DryRun
    默认模式：只打印计划与校验结果，不写文件。

.PARAMETER Apply
    显式写文件。与 -DryRun 互斥。

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\release-ai-plugins.ps1 `
        -Version 8.3.3 -Skill use-pnpm -ChangeType patch -Summary "补充 xxx 说明" -Apply

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\release-ai-plugins.ps1 `
        -Version 8.4.0 -NewSkill my-new-skill -ChangeType added -Summary "新增 my-new-skill 技能" -Apply
#>
[CmdletBinding()]
param(
    [string]$Version,
    [string[]]$Skill,
    [ValidateSet("added", "major", "minor", "patch")]
    [string]$ChangeType = "patch",
    [string]$Summary,
    [string]$Date = (Get-Date -Format "yyyy-MM-dd"),
    [string[]]$NewSkill,
    [switch]$DryRun,
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
function Warn { Write-Host ("[WARN]  " + ($args -join " ")) -ForegroundColor Yellow }

# ============ 仓库根目录自动定位 ============
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
if (-not $Root) { Fail "无法定位仓库根目录（向上查找 pnpm-workspace.yaml 或 .git 失败）" }
Info ("仓库根目录: " + $Root)

if ($DryRun -and $Apply) { Fail "不能同时指定 -DryRun 与 -Apply（默认即为 DryRun，只有 -Apply 才写文件）" }
$DoWrite = [bool]$Apply

if ($Version -and $Version -notmatch '^\d+\.\d+\.\d+$') { Fail ("版本号格式错误: " + $Version + "（应为 MAJOR.MINOR.PATCH，如 8.3.3）") }
if ($Date -notmatch '^\d{4}-\d{2}-\d{2}$') { Fail ("日期格式错误: " + $Date + "（应为 YYYY-MM-DD）") }

# ============ 白名单 ============
$PluginJson = @(
    "ai-plugins/common-tools/.claude-plugin/plugin.json",
    "ai-plugins/common-tools/.cursor-plugin/plugin.json",
    "ai-plugins/common-tools/.codex-plugin/plugin.json",
    "ai-plugins/dev-skills/.claude-plugin/plugin.json",
    "ai-plugins/dev-skills/.cursor-plugin/plugin.json",
    "ai-plugins/dev-skills/.codex-plugin/plugin.json"
)
$MarketplaceJson = @(
    ".claude-plugin/marketplace.json",
    ".cursor-plugin/marketplace.json",
    ".agents/plugins/marketplace.json"
)
$Changelogs = @(
    "ai-plugins/common-tools/CHANGELOG.md",
    "ai-plugins/dev-skills/CHANGELOG.md"
)
$PluginReadmes = @(
    "ai-plugins/common-tools/README.md",
    "ai-plugins/dev-skills/README.md"
)
$ReleaseDocs = @(
    "ai-plugins/docs/README.md",
    "ai-plugins/docs/use-vercel-skills-install.md",
    ".claude-plugin/README.md",
    ".cursor-plugin/README.md",
    ".agents/plugins/README.md",
    "README.md"
)
$SkillTrees = @(
    "ai-plugins/common-tools/skills",
    "ai-plugins/dev-skills/skills"
)

function Get-RepoPath {
    param([string]$Rel)
    return (Join-Path $Root $Rel)
}
foreach ($f in ($PluginJson + $MarketplaceJson + $PluginReadmes + $ReleaseDocs)) {
    if (-not (Test-Path -LiteralPath (Get-RepoPath $f))) { Fail ("白名单文件缺失: " + $f) }
}

# ============ 解析技能参数（含自动发现） ============
$SkillList = @($Skill | Where-Object { $_ } | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$NewSkillList = @($NewSkill | Where-Object { $_ } | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

function Get-ModifiedSkillNames {
    $names = @()
    $isGit = (& git -C $Root rev-parse --is-inside-work-tree 2>$null)
    if ($isGit -ne "true") { return $names }
    $tracked = @(& git -C $Root diff HEAD --name-only -- ai-plugins/common-tools/skills ai-plugins/dev-skills/skills 2>$null)
    $untracked = @(& git -C $Root ls-files --others --exclude-standard -- ai-plugins/common-tools/skills ai-plugins/dev-skills/skills 2>$null)
    foreach ($line in ($tracked + $untracked)) {
        if ($line -match '^ai-plugins/(common-tools|dev-skills)/skills/([^/]+)/') {
            $name = $Matches[2]
            if ($name -and ($names -notcontains $name)) { $names += $name }
        }
    }
    return $names
}

# 动作检查
if ($SkillList.Count -eq 0 -and $NewSkillList.Count -eq 0) {
    $SkillList = @(Get-ModifiedSkillNames)
    if ($SkillList.Count -gt 0) {
        Warn ("未指定 -Skill，自动发现最近修改的 skill: " + ($SkillList -join "、"))
    }
}
if (-not $Version -and $SkillList.Count -eq 0 -and $NewSkillList.Count -eq 0 -and -not $Summary) {
    Fail "没有可执行动作：请至少提供 -Version / -Skill / -NewSkill / -Summary 之一"
}
if (($SkillList.Count -gt 0 -or $NewSkillList.Count -gt 0 -or $Summary) -and -not $Version) {
    Fail "技能升级与 CHANGELOG 均需要 -Version：CHANGELOG 条目必须包含版本号与日期，请显式指定新版本号"
}

foreach ($name in ($SkillList + $NewSkillList)) {
    if (-not $name) { Fail "技能名不能为空（-Skill / -NewSkill 以逗号分隔或重复传入多个技能）" }
    if ($name -notmatch '^[a-z0-9][a-z0-9-]*$') { Fail ("非法技能名: " + $name) }
}

# 显式传入的 -Skill 若在 git 中无修改证据直接阻断，避免误升级未修改技能。
$modifiedNames = @(Get-ModifiedSkillNames)
foreach ($name in $SkillList) {
    if ($NewSkillList -notcontains $name -and ($modifiedNames -notcontains $name)) {
        Fail ("-Skill " + $name + " 在 git 中未发现修改证据（git diff HEAD 与未跟踪文件）；如确实是新增技能请使用 -NewSkill")
    }
}

function Resolve-SkillFile {
    param([string]$Name)
    foreach ($tree in $SkillTrees) {
        $p = Join-Path (Get-RepoPath $tree) ($Name + "/SKILL.md")
        if (Test-Path -LiteralPath $p) { return $p }
    }
    Fail ("技能不存在: " + $Name + "（已扫描 ai-plugins/common-tools/skills 与 ai-plugins/dev-skills/skills）")
}

function Get-SkillPluginLabel {
    param([string]$Path)
    if ($Path -match 'ai-plugins\\common-tools\\skills\\') { return "common-tools" }
    if ($Path -match 'ai-plugins/common-tools/skills/') { return "common-tools" }
    return "dev-skills"
}

function Get-SkillFrontmatter {
    param([string]$Path)
    $text = [System.IO.File]::ReadAllText($Path)
    $fmMatch = [regex]::Match($text, '(?s)^(---\r?\n.*?\r?\n---)')
    if (-not $fmMatch.Success) { Fail ("SKILL.md 缺少 YAML frontmatter: " + $Path) }
    $fm = $fmMatch.Groups[1].Value
    $body = $text.Substring($fmMatch.Length)
    $lines = @($fm -split "`r?`n")
    $metaIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^metadata:\s*$') { $metaIdx = $i; break }
    }
    $verIdx = -1
    $old = $null
    if ($metaIdx -ge 0) {
        $end = [Math]::Min($lines.Count, $metaIdx + 5)
        for ($j = $metaIdx + 1; $j -lt $end; $j++) {
            $vm = [regex]::Match($lines[$j], '^(\s+)version:\s*"?([\d.]+)"?\s*$')
            if ($vm.Success) { $verIdx = $j; $old = $vm.Groups[2].Value; break }
        }
    }
    return @{ Lines = $lines; MetaIdx = $metaIdx; VerIdx = $verIdx; Old = $old; Body = $body }
}

function Bump-Version {
    param([string]$V, [string]$Type)
    $m = [regex]::Match($V, '^(\d+)\.(\d+)\.(\d+)$')
    if (-not $m.Success) { Fail ("技能版本号格式错误: " + $V) }
    $maj = [int]$m.Groups[1].Value
    $min = [int]$m.Groups[2].Value
    $pat = [int]$m.Groups[3].Value
    switch ($Type) {
        "major" { return (($maj + 1).ToString() + ".0.0") }
        "minor" { return ($maj.ToString() + "." + ($min + 1).ToString() + ".0") }
        default { return ($maj.ToString() + "." + $min.ToString() + "." + ($pat + 1).ToString()) }
    }
}

function Set-SkillVersionText {
    param([object]$Info, [string]$NewVersion)
    $lines = @($Info.Lines)
    if ($Info.MetaIdx -lt 0) {
        $closeIdx = $lines.Count - 1
        if ($lines[$closeIdx] -ne '---') { Fail ("frontmatter 结构异常：末行不是 ---，路径待排查") }
        $lines = @($lines[0..($closeIdx - 1)]) + @('metadata:', ('  version: "' + $NewVersion + '"')) + @($lines[$closeIdx..($lines.Count - 1)])
    } elseif ($Info.VerIdx -lt 0) {
        $lines = @($lines[0..$Info.MetaIdx]) + @(('  version: "' + $NewVersion + '"')) + @($lines[($Info.MetaIdx + 1)..($lines.Count - 1)])
    } else {
        $vm = [regex]::Match($lines[$Info.VerIdx], '^(\s*version:\s*"?)[\d.]+("?\s*)$')
        if (-not $vm.Success) { Fail ("version 行格式异常: " + $lines[$Info.VerIdx]) }
        $lines[$Info.VerIdx] = $vm.Groups[1].Value + $NewVersion + $vm.Groups[2].Value
    }
    $fm = ($lines -join "`n")
    return ($fm + $Info.Body)
}

# ============ 技能升级计划 ============
$SkillChanges = New-Object System.Collections.Generic.List[object]
$seen = @{}
foreach ($name in ($SkillList + $NewSkillList)) {
    if ($seen.ContainsKey($name)) { continue }
    $seen[$name] = $true
    $isNew = ($NewSkillList -contains $name)
    $path = Resolve-SkillFile $name
    $info = Get-SkillFrontmatter $path
    if (-not $info.Old) {
        if ($isNew) {
            $newVersion = "0.1.0"
            Info ("新增技能 " + $name + "：缺少 metadata.version，初始化为 0.1.0")
        } else {
            Fail ("技能缺少 metadata.version: " + $name + "（如为新增技能请使用 -NewSkill）")
        }
    } else {
        $type = $ChangeType
        if ($type -eq "added") { $type = "patch" }
        if ($isNew) { $type = "patch" }
        $newVersion = Bump-Version $info.Old $type
    }
    $newText = Set-SkillVersionText $info $newVersion
    $plugin = Get-SkillPluginLabel $path
    $SkillChanges.Add(@{ Name = $name; Plugin = $plugin; Old = $info.Old; New = $newVersion; Path = $path; NewText = $newText })
}

# ============ JSON 更新计划 ============
function ConvertTo-JsonTabs {
    param([object]$Obj)
    $text = $Obj | ConvertTo-Json -Depth 20
    # PS 5.1 ConvertTo-Json 使用 CRLF 行尾、冒号后双空格；统一为 LF 与单空格，避免 git diff --check 报 trailing whitespace
    $text = [regex]::Replace($text, '": {2,}(?=["{\[\d\-tfn])', '": ')
    $out = New-Object System.Collections.Generic.List[string]
    $depth = 0
    foreach ($line in @($text -split "`r?`n")) {
        $trimmed = $line.TrimStart()
        if ($trimmed.Length -eq 0) { continue }
        $out.Add(("`t" * $depth) + $trimmed)
        $inStr = $false
        for ($i = 0; $i -lt $trimmed.Length; $i++) {
            $ch = $trimmed[$i]
            if ($inStr) {
                if ($ch -eq '\' -and ($i + 1) -lt $trimmed.Length) { $i++ }
                elseif ($ch -eq '"') { $inStr = $false }
            } else {
                if ($ch -eq '"') { $inStr = $true }
                elseif ($ch -eq '{' -or $ch -eq '[') { $depth++ }
                elseif ($ch -eq '}' -or $ch -eq ']') { $depth-- }
            }
        }
    }
    return (($out.ToArray() -join "`n") + "`n")
}

function Update-JsonFile {
    param([string]$Rel, [string]$NewVersion)
    $json = [System.IO.File]::ReadAllText((Get-RepoPath $Rel)) | ConvertFrom-Json
    $json.version = $NewVersion
    return (ConvertTo-JsonTabs $json)
}

function Update-Marketplace {
    param([string]$Rel, [string]$NewVersion)
    $json = [System.IO.File]::ReadAllText((Get-RepoPath $Rel)) | ConvertFrom-Json
    $json.metadata.version = $NewVersion
    foreach ($p in @($json.plugins)) { $p.version = $NewVersion }
    return (ConvertTo-JsonTabs $json)
}

$JsonPlans = New-Object System.Collections.Generic.List[object]
if ($Version) {
    foreach ($rel in $PluginJson) {
        $JsonPlans.Add(@{ Rel = $rel; Action = ("version -> " + $Version); Content = (Update-JsonFile $rel $Version) })
    }
    foreach ($rel in @(".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json")) {
        $JsonPlans.Add(@{ Rel = $rel; Action = ("metadata.version + plugins[*].version -> " + $Version); Content = (Update-Marketplace $rel $Version) })
    }
}

# ============ README 阻断校验（新增技能） ============
foreach ($name in $NewSkillList) {
    $plugin = "dev-skills"
    foreach ($sc in $SkillChanges) { if ($sc.Name -eq $name) { $plugin = $sc.Plugin } }
    $readmeRel = if ($plugin -eq "common-tools") { "ai-plugins/common-tools/README.md" } else { "ai-plugins/dev-skills/README.md" }
    $content = [System.IO.File]::ReadAllText((Get-RepoPath $readmeRel))
    if ($content -notmatch [regex]::Escape($name)) {
        Fail ("新增技能必须更新对应插件 README：阻断验收失败 - " + $readmeRel + " 未包含技能名 " + $name)
    }
    Ok ("README 阻断验收通过: " + $readmeRel + " 包含 " + $name)
}

# ============ 安装文档与旧路径阻断校验 ============
foreach ($rel in $ReleaseDocs) {
    $content = [System.IO.File]::ReadAllText((Get-RepoPath $rel))
    if ($content -match 'claude-code-marketplace/') {
        Fail ("安装文档包含禁用旧路径 claude-code-marketplace/: " + $rel)
    }
    if ($content -notmatch 'ai-plugins/') {
        Fail ("安装文档未发现 ai-plugins/... 正式路径: " + $rel)
    }
    Ok ("安装文档校验通过: " + $rel)
}

# ============ CHANGELOG 计划 ============
function New-ChangelogSection {
    param([string]$PluginLabel, [object[]]$SkillChanges, [string]$Summary, [string]$NewVersion, [string]$NewDate, [string]$ChangeType)
    if ($ChangeType -eq "added") { $heading = '### Added' } else { $heading = '### Changed' }
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('## [' + $NewVersion + '] - ' + $NewDate)
    $lines.Add('')
    $lines.Add($heading)
    $lines.Add('')
    $hasSkill = $false
    foreach ($sc in $SkillChanges) {
        if ($sc.Plugin -eq $PluginLabel) {
            if ($sc.Old) {
                $lines.Add('- **' + $sc.Name + '**：`metadata.version` `' + $sc.Old + '` -> `' + $sc.New + '`。')
            } else {
                $lines.Add('- **' + $sc.Name + '**：新增技能，`metadata.version` 初始化为 `' + $sc.New + '`。')
            }
            $hasSkill = $true
        }
    }
    if (-not $hasSkill) {
        $lines.Add('`' + $PluginLabel + '` 技能树本身无内容变更，插件主版本随发布链路同步至 `' + $NewVersion + '`。')
    }
    # Summary 只在「本插件有技能变化」或「全仓库无任何技能变化」时写入，避免与「无内容变更」表述矛盾
    $anySkillChange = @($SkillChanges).Count -gt 0
    if ($Summary -and ($hasSkill -or -not $anySkillChange)) { $lines.Add('- ' + $Summary) }
    $lines.Add('- 根级 Claude / Cursor marketplace 与 `common-tools` / `dev-skills` 的六份三平台 `plugin.json` 版本统一提升至 `' + $NewVersion + '`。')
    return (($lines.ToArray() -join "`n") + "`n")
}

function Add-ChangelogSection {
    param([string]$Rel, [string]$Section, [string]$NewVersion, [string]$NewDate)
    $path = Get-RepoPath $Rel
    if (-not (Test-Path -LiteralPath $path)) {
        return ("# Changelog`n`n" + $Section)
    }
    $text = [System.IO.File]::ReadAllText($path)
    if ($text -match [regex]::Escape('## [' + $NewVersion + '] - ' + $NewDate)) {
        Fail ("CHANGELOG 已存在版本条目 [" + $NewVersion + "] - " + $NewDate + ": " + $Rel)
    }
    $lines = @($text -split "`n")
    # 新版本节插入到 [Unreleased] 之后、第一个已发布版本节之前；没有已发布节则追加到文件末尾
    $insertIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^## \[' -and $lines[$i] -notmatch '^## \[Unreleased\]') { $insertIdx = $i; break }
    }
    if ($insertIdx -lt 0) {
        return (($text.TrimEnd("`n", "`r")) + "`n`n" + $Section)
    }
    $head = ($lines[0..($insertIdx - 1)] -join "`n")
    $tail = ($lines[$insertIdx..($lines.Count - 1)] -join "`n")
    return ($head + "`n" + $Section + "`n" + $tail)
}

$ChangelogPlans = New-Object System.Collections.Generic.List[object]
$skillArr = @($SkillChanges.ToArray())
if ($Version) {
    foreach ($rel in $Changelogs) {
        $pluginLabel = if ($rel -match 'common-tools') { "common-tools" } else { "dev-skills" }
        $section = New-ChangelogSection $pluginLabel $skillArr $Summary $Version $Date $ChangeType
        $content = Add-ChangelogSection $rel $section $Version $Date
        $ChangelogPlans.Add(@{ Rel = $rel; Action = ("CHANGELOG 顶部追加 [" + $Version + "] 条目"); Content = $content })
    }
}

# ============ 校验函数 ============
function Assert-JsonContent {
    param([string]$Content, [string]$Rel, [string]$ExpectedVersion)
    try {
        $json = $Content | ConvertFrom-Json
    } catch {
        Fail ("JSON 解析失败: " + $Rel + " -> " + $_.Exception.Message)
    }
    if ($ExpectedVersion) {
        if ($json.version -ne $ExpectedVersion) { Fail ("plugin.json 版本不一致: " + $Rel + " = " + $json.version) }
    }
    return $json
}

function Assert-MarketplaceContent {
    param([string]$Content, [string]$Rel, [string]$ExpectedVersion)
    try {
        $json = $Content | ConvertFrom-Json
    } catch {
        Fail ("JSON 解析失败: " + $Rel + " -> " + $_.Exception.Message)
    }
    if ($json.metadata.version -ne $ExpectedVersion) {
        Fail ("marketplace metadata.version 不一致: " + $Rel + " = " + $json.metadata.version)
    }
    foreach ($p in @($json.plugins)) {
        if ($p.version -ne $ExpectedVersion) { Fail ("marketplace 插件条目版本不一致: " + $Rel + " / " + $p.name) }
    }
    return $json
}

function Assert-CodexMarketplaceFile {
    param([string]$Rel)
    $path = Get-RepoPath $Rel
    try {
        $json = [System.IO.File]::ReadAllText($path) | ConvertFrom-Json
    } catch {
        Fail ("JSON 解析失败: " + $Rel + " -> " + $_.Exception.Message)
    }
    if (@($json.PSObject.Properties.Name) -contains "version") { Fail ("Codex marketplace 不应包含 version 字段: " + $Rel) }
    $plugs = @($json.plugins)
    if ($plugs.Count -ne 2) { Fail ("Codex marketplace 应恰好包含 2 个插件条目: " + $Rel) }
    $expectedNames = @("common-tools", "dev-skills")
    $seenNames = @{}
    foreach ($p in $plugs) {
        if ($p.name -notin $expectedNames -or $seenNames.ContainsKey($p.name)) { Fail ("Codex 插件 name 非法或重复: " + $p.name) }
        $seenNames[$p.name] = $true
        if ($p.source.source -ne "local") { Fail ("Codex 插件 " + $p.name + " source.source 应为 local") }
        $expectedPath = "./ai-plugins/" + $p.name
        if ($p.source.path -ne $expectedPath) {
            Fail ("Codex 插件 " + $p.name + " source.path 错误: " + $p.source.path + "（期望 " + $expectedPath + "）")
        }
        if ($p.policy.installation -ne "AVAILABLE" -or $p.policy.authentication -ne "ON_INSTALL") {
            Fail ("Codex 插件 " + $p.name + " policy 必须为 AVAILABLE / ON_INSTALL")
        }
        if (-not $p.category) { Fail ("Codex 插件 " + $p.name + " 缺少 category") }
    }
    foreach ($name in $expectedNames) { if (-not $seenNames.ContainsKey($name)) { Fail ("Codex marketplace 缺少插件: " + $name) } }
    Ok ("Codex marketplace 校验通过: name/source.path/policy/category 完整，无 version 字段（" + $Rel + "）")
}

function Assert-CodexManifestFile {
    param([string]$Rel)
    try {
        $json = [System.IO.File]::ReadAllText((Get-RepoPath $Rel)) | ConvertFrom-Json
    } catch {
        Fail ("JSON 解析失败: " + $Rel + " -> " + $_.Exception.Message)
    }
    if ($json.skills -ne "./skills") { Fail ("Codex manifest skills 必须为 ./skills: " + $Rel) }
    foreach ($forbidden in @("hooks", "commands", "agents")) {
        if (@($json.PSObject.Properties.Name) -contains $forbidden) { Fail ("Codex manifest 禁止字段 " + $forbidden + ": " + $Rel) }
    }
    $displayValues = @(
        $json.description,
        $json.interface.displayName,
        $json.interface.shortDescription,
        $json.interface.longDescription,
        $json.interface.developerName,
        $json.interface.category,
        ($json.interface.capabilities -join ' '),
        ($json.interface.defaultPrompt -join ' ')
    )
    foreach ($value in $displayValues) {
        if ([string]::IsNullOrWhiteSpace([string]$value) -or ([string]$value -notmatch '[\u4E00-\u9FFF]')) {
            Fail ("Codex manifest 面向用户的展示字段必须非空且包含中文: " + $Rel)
        }
    }
    Ok ("Codex manifest 校验通过: " + $Rel)
}

function Assert-ChangelogTop {
    param([string]$Rel, [string]$ExpectedVersion, [string]$ExpectedDate)
    $lines = @(([System.IO.File]::ReadAllText((Get-RepoPath $Rel))) -split "`n")
    foreach ($line in $lines) {
        $m = [regex]::Match($line, '^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})')
        if ($m.Success) {
            if ($m.Groups[1].Value -eq $ExpectedVersion -and $m.Groups[2].Value -eq $ExpectedDate) { return $true }
            Fail ("CHANGELOG 顶部条目不符: " + $Rel + "（期望 [" + $ExpectedVersion + "] - " + $ExpectedDate + "，实际 [" + $m.Groups[1].Value + "] - " + $m.Groups[2].Value + "）")
        }
    }
    Fail ("CHANGELOG 未找到版本条目: " + $Rel)
}

function Assert-SkillVersionFile {
    param([string]$Path, [string]$Expected)
    $info = Get-SkillFrontmatter $Path
    if (-not $info.Old) { Fail ("SKILL.md 校验失败（无 version）: " + $Path) }
    if ($info.Old -ne $Expected) {
        Fail ("SKILL.md version 不符: " + $Path + "（期望 " + $Expected + "，实际 " + $info.Old + "）")
    }
}

# ============ 打印计划 ============
Write-Host ""
Info ("===== 发布计划（" + $(if ($DoWrite) { "Apply 模式" } else { "DryRun 模式" }) + "） =====")
if ($Version) { Info ("插件主版本: " + $Version + "（" + $Date + "）") }
foreach ($plan in $JsonPlans) { Info ("修改 JSON: " + $plan.Rel + "（" + $plan.Action + "）") }
foreach ($sc in $SkillChanges) {
    $v = if ($sc.Old) { ($sc.Old + " -> " + $sc.New) } else { ("（新增）" + $sc.New) }
    Info ("升级技能: " + $sc.Name + "（" + $sc.Plugin + "）" + $v)
}
foreach ($plan in $ChangelogPlans) { Info ("修改: " + $plan.Rel + "（" + $plan.Action + "）") }

# ============ 写前校验（两种模式都对计划内容校验，失败即停且不写文件） ============
if ($Version) {
    foreach ($plan in $JsonPlans) {
        if ($plan.Rel -match '\.claude-plugin\\marketplace\.json$' -or $plan.Rel -match '\.cursor-plugin\\marketplace\.json$' -or $plan.Rel -match '\.claude-plugin/marketplace\.json$' -or $plan.Rel -match '\.cursor-plugin/marketplace\.json$') {
            $null = Assert-MarketplaceContent $plan.Content $plan.Rel $Version
        } else {
            $null = Assert-JsonContent $plan.Content $plan.Rel $Version
        }
    }
    Ok "计划 JSON 校验通过: 6 份 plugin.json + Claude/Cursor marketplace 版本均为 $Version 且可解析"
}
foreach ($plan in $JsonPlans) { $null = Assert-JsonContent $plan.Content $plan.Rel $null }
Ok "计划 JSON 可解析性校验通过"

# 既有 9 份 JSON 可解析（含未改动的 Codex marketplace）
foreach ($rel in ($PluginJson + $MarketplaceJson)) {
    $null = Assert-JsonContent ([System.IO.File]::ReadAllText((Get-RepoPath $rel))) $rel $null
}
Ok "磁盘上 9 份 JSON 均可解析"
Assert-CodexMarketplaceFile ".agents/plugins/marketplace.json"
Assert-CodexManifestFile "ai-plugins/common-tools/.codex-plugin/plugin.json"
Assert-CodexManifestFile "ai-plugins/dev-skills/.codex-plugin/plugin.json"

# ============ 写入 ============
function Write-Atomic {
    param([string]$Rel, [string]$Content)
    $path = Get-RepoPath $Rel
    $tmp = $path + "." + $PID + ".tmp"
    try {
        [System.IO.File]::WriteAllText($tmp, $Content, (New-Object System.Text.UTF8Encoding($false)))
        Move-Item -LiteralPath $tmp -Destination $path -Force
    } finally {
        if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force }
    }
}

if ($DoWrite) {
    foreach ($plan in $JsonPlans) { Write-Atomic $plan.Rel $plan.Content }
    foreach ($sc in $SkillChanges) { Write-Atomic ($sc.Path.Substring($Root.Length + 1)) $sc.NewText }
    foreach ($plan in $ChangelogPlans) { Write-Atomic $plan.Rel $plan.Content }
    Ok "已写入全部文件（Apply 模式）"
} else {
    Warn "DryRun 模式：未写入任何文件。确认计划无误后加 -Apply 执行"
}

# ============ 写后校验 ============
if ($DoWrite) {
    if ($Version) {
        foreach ($rel in $PluginJson) { $null = Assert-JsonContent ([System.IO.File]::ReadAllText((Get-RepoPath $rel))) $rel $Version }
        foreach ($rel in @(".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json")) {
            $null = Assert-MarketplaceContent ([System.IO.File]::ReadAllText((Get-RepoPath $rel))) $rel $Version
        }
        Ok "写后版本一致性校验通过: 6 份 plugin.json + Claude/Cursor marketplace 均为 $Version"
        foreach ($rel in $Changelogs) { $null = Assert-ChangelogTop $rel $Version $Date }
        Ok ("写后 CHANGELOG 顶部条目校验通过: [" + $Version + "] - " + $Date)
    }
    foreach ($rel in ($PluginJson + $MarketplaceJson)) {
        $null = Assert-JsonContent ([System.IO.File]::ReadAllText((Get-RepoPath $rel))) $rel $null
    }
    Ok "写后 9 份 JSON 可解析性校验通过"
    Assert-CodexMarketplaceFile ".agents/plugins/marketplace.json"
    Assert-CodexManifestFile "ai-plugins/common-tools/.codex-plugin/plugin.json"
    Assert-CodexManifestFile "ai-plugins/dev-skills/.codex-plugin/plugin.json"
    foreach ($sc in $SkillChanges) { Assert-SkillVersionFile $sc.Path $sc.New }
    Ok "写后技能 metadata.version 校验通过"
}

# ============ git diff --check ============
$gitOk = $true
try {
    $isGit = (& git -C $Root rev-parse --is-inside-work-tree 2>$null)
} catch {
    $isGit = $null
}
if ($isGit -ne "true") {
    Warn "未检测到 git 仓库，跳过 git diff --check"
} else {
    & git -C $Root diff --check 2>$null
    if ($LASTEXITCODE -ne 0) { Fail "git diff --check 发现空白错误（trailing whitespace 等），请修复后重试" }
    Ok "git diff --check 通过"
}

# ============ 结束 ============
Write-Host ""
if ($DoWrite) {
    $skillNames = (@($SkillChanges | ForEach-Object { $_.Name }) -join "、")
    Ok ("发布完成: 版本 " + $Version + "，技能 " + $skillNames + "，日期 " + $Date)
} else {
    Ok "DryRun 校验完成：计划如上，未修改任何文件"
}
exit 0
