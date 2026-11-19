#requires -Version 5.1
<#
.SYNOPSIS
    Skill transition 解析器：从 HEAD 与 working tree 构建技能索引，解析 rename / move / remove。

.DESCRIPTION
    只做索引构建与解析，不写任何文件。由 release-ai-plugins.ps1 dot-source 后调用：
      Get-HeadSkillIndex / Get-WorkingSkillIndex / Resolve-SkillTransitions

    解析事实源：
      - from 必须来自当前 HEAD 的 skill tree；
      - to 必须来自当前 working tree；
      - rename 要求旧 id 在 working tree 消失、新 id 存在；plugin 同时变化时规范化为 rename-move；
      - move 保持 id，目标 plugin 由参数指定；working tree 仍存在源目录时由 Apply 执行物理移动；
      - remove 要求旧 id 在 HEAD 存在，working tree 的残留目录由 Apply 删除。

    任何冲突、重复 id、非法 plugin / semver、旧目录残留都在写入前抛出。
#>

$script:AllowedPlugins = @("common-tools", "dev-skills", "low-frequency-skill")
$script:SkillRoots = @{
    "common-tools"        = "ai-plugins/common-tools/skills"
    "dev-skills"          = "ai-plugins/dev-skills/skills"
    "low-frequency-skill" = "ai-plugins/low-frequency-skill/skills"
}

function Get-SkillRootRelative {
    param([string]$Plugin)
    if (-not $script:SkillRoots.ContainsKey($Plugin)) { throw ("非法 plugin: " + $Plugin) }
    return $script:SkillRoots[$Plugin]
}

function Get-SkillRelativeEntry {
    param([string]$Plugin, [string]$Id)
    return ((Get-SkillRootRelative $Plugin) + "/" + $Id + "/SKILL.md")
}

function Get-SkillDirectoryPath {
    param([string]$RepositoryRoot, [string]$Plugin, [string]$Id)
    return (Join-Path $RepositoryRoot ((Get-SkillRootRelative $Plugin) + "/" + $Id))
}

function Read-SkillVersionFromText {
    param([string]$Text)
    if (-not $Text) { return $null }
    $fm = [regex]::Match($Text, '(?s)^---\r?\n(.*?)\r?\n---')
    if (-not $fm.Success) { return $null }
    $vm = [regex]::Match($fm.Groups[1].Value, '(?m)^\s+version:\s*"?([\d.]+)"?\s*$')
    if ($vm.Success) { return $vm.Groups[1].Value }
    $top = [regex]::Match($fm.Groups[1].Value, '(?m)^version:\s*"?([\d.]+)"?\s*$')
    if ($top.Success) { return $top.Groups[1].Value }
    return $null
}

function Get-HeadSkillIndex {
    param([string]$RepositoryRoot)
    $index = @{}
    foreach ($plugin in $script:AllowedPlugins) {
        $rel = Get-SkillRootRelative $plugin
        $files = @(& git -C $RepositoryRoot ls-tree -r --name-only HEAD -- $rel 2>$null)
        if ($LASTEXITCODE -ne 0) { continue }
        foreach ($line in $files) {
            if ($line -match ('^' + [regex]::Escape($rel) + '/([^/]+)/SKILL\.md$')) {
                $id = $Matches[1]
                $text = (@(& git -C $RepositoryRoot show ("HEAD:" + $line) 2>$null) -join "`n")
                $index[$id] = [pscustomobject]@{
                    Id      = $id
                    Plugin  = $plugin
                    Entry   = $line
                    Version = (Read-SkillVersionFromText $text)
                }
            }
        }
    }
    return $index
}

function Get-WorkingSkillIndex {
    param([string]$RepositoryRoot)
    $index = @{}
    foreach ($plugin in $script:AllowedPlugins) {
        $rel = Get-SkillRootRelative $plugin
        $dir = Join-Path $RepositoryRoot $rel
        if (-not (Test-Path -LiteralPath $dir)) { continue }
        foreach ($entry in @(Get-ChildItem -LiteralPath $dir -Directory -ErrorAction SilentlyContinue)) {
            $skillFile = Join-Path $entry.FullName "SKILL.md"
            if (-not (Test-Path -LiteralPath $skillFile)) { continue }
            $text = [System.IO.File]::ReadAllText($skillFile)
            $index[$entry.Name] = [pscustomobject]@{
                Id      = $entry.Name
                Plugin  = $plugin
                Entry   = (Get-SkillRelativeEntry $plugin $entry.Name)
                Version = (Read-SkillVersionFromText $text)
            }
        }
    }
    return $index
}

function Split-TransitionValues {
    param([string[]]$Values)
    $result = @()
    foreach ($value in @($Values)) {
        if (-not $value) { continue }
        foreach ($part in ($value -split ',')) {
            $trimmed = $part.Trim()
            if ($trimmed) { $result += $trimmed }
        }
    }
    return $result
}

function Assert-Semver {
    param([string]$Value, [string]$Label)
    if ($Value -notmatch '^\d+\.\d+\.\d+$') { throw ($Label + " 版本号格式错误: " + $Value) }
}

function Resolve-SkillTransitions {
    param(
        [string]$RepositoryRoot,
        [string[]]$RenameSkill,
        [string[]]$MoveSkill,
        [string[]]$RemoveSkill
    )

    $head = Get-HeadSkillIndex $RepositoryRoot
    $working = Get-WorkingSkillIndex $RepositoryRoot
    $transitions = New-Object System.Collections.Generic.List[object]
    $touched = @{}

    function Assert-NewId {
        param([string]$Id)
        if ($touched.ContainsKey($Id)) { throw ("transition 冲突：id 被多个 transition 引用 - " + $Id) }
        $touched[$Id] = $true
    }

    foreach ($pair in (Split-TransitionValues $RenameSkill)) {
        $split = $pair -split '=', 2
        if ($split.Count -ne 2 -or -not $split[0] -or -not $split[1]) { throw ("-RenameSkill 需要 old=new 形式: " + $pair) }
        $oldId = $split[0].Trim()
        $newId = $split[1].Trim()
        if (-not $head.ContainsKey($oldId)) { throw ("rename 源 id 不在 HEAD skill tree 中: " + $oldId) }
        if (-not $working.ContainsKey($newId)) { throw ("rename 目标 id 不在 working tree 中: " + $newId) }
        if ($working.ContainsKey($oldId)) { throw ("旧目录残留：working tree 仍存在 " + $oldId) }
        if ($head.ContainsKey($newId)) { throw ("rename 目标 id 已存在于 HEAD: " + $newId) }
        Assert-NewId $oldId
        Assert-NewId $newId
        $from = $head[$oldId]
        $to = $working[$newId]
        $kind = if ($from.Plugin -ne $to.Plugin) { "rename-move" } else { "rename" }
        $transitions.Add([pscustomobject]@{ Kind = $kind; From = $from; To = $to })
    }

    foreach ($pair in (Split-TransitionValues $MoveSkill)) {
        $split = $pair -split '=', 2
        if ($split.Count -ne 2 -or -not $split[0] -or -not $split[1]) { throw ("-MoveSkill 需要 id=plugin 形式: " + $pair) }
        $id = $split[0].Trim()
        $targetPlugin = $split[1].Trim()
        if (-not $script:SkillRoots.ContainsKey($targetPlugin)) { throw ("move 目标 plugin 非法: " + $targetPlugin) }
        if (-not $head.ContainsKey($id)) { throw ("move 源 id 不在 HEAD skill tree 中: " + $id) }
        $from = $head[$id]
        if ($from.Plugin -eq $targetPlugin) { throw ("move 目标 plugin 与源 plugin 相同: " + $id) }
        if ($working.ContainsKey($id) -and $working[$id].Plugin -ne $from.Plugin -and $working[$id].Plugin -ne $targetPlugin) {
            throw ("move 源 id 出现在第三个 plugin: " + $id + " -> " + $working[$id].Plugin)
        }
        if (-not $working.ContainsKey($id) -and -not (Test-Path -LiteralPath (Get-SkillDirectoryPath $RepositoryRoot $targetPlugin $id))) {
            throw ("move 源目录缺失且目标不存在: " + $id)
        }
        Assert-NewId $id
        $to = [pscustomobject]@{
            Id      = $id
            Plugin  = $targetPlugin
            Entry   = (Get-SkillRelativeEntry $targetPlugin $id)
            Version = $from.Version
        }
        $transitions.Add([pscustomobject]@{ Kind = "move"; From = $from; To = $to })
    }

    foreach ($id in (Split-TransitionValues $RemoveSkill)) {
        if (-not $head.ContainsKey($id)) { throw ("remove 源 id 不在 HEAD skill tree 中: " + $id) }
        Assert-NewId $id
        $transitions.Add([pscustomobject]@{ Kind = "remove"; From = $head[$id]; To = $null })
    }

    return $transitions.ToArray()
}

function Get-TransitionVersionMap {
    param([string[]]$SkillVersion)
    $map = @{}
    foreach ($pair in (Split-TransitionValues $SkillVersion)) {
        $split = $pair -split '=', 2
        if ($split.Count -ne 2 -or -not $split[0] -or -not $split[1]) { throw ("-SkillVersion 需要 id=x.y.z 形式: " + $pair) }
        $id = $split[0].Trim()
        $version = $split[1].Trim()
        Assert-Semver $version "-SkillVersion"
        $map[$id] = $version
    }
    return $map
}
