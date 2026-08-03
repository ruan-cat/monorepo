#Requires -Version 5.1

<#
.SYNOPSIS
    本地全局 Agent Skills 同步器兜底脚本（Windows PowerShell）。
.DESCRIPTION
    将 ~/.agents/skills 作为目录级链接分发到 WorkBuddy、QoderWork、Kimi Work、CodeBuddy 平台。
    此脚本在无法使用 Node/TypeScript 主脚本时作为兜底方案。
#>

param(
    [string]$Source = "$env:USERPROFILE\.agents\skills",
    [switch]$DryRun,
    [switch]$NoBackup,
    [switch]$Help,
    [switch]$SkipMemorixRefresh,
    [switch]$ForceMemorixRefresh
)

if ($Help) {
    Write-Host "Usage: sync.ps1 [options]`n`nOptions:`n  -Source <path>   Source skills directory (default: ~\.agents\skills)`n  -DryRun          Print the plan without modifying the filesystem`n  -NoBackup        Do not backup existing directories before replacing`n  -Help            Show this help message`n  -SkipMemorixRefresh  Skip scanning local memorix skills sources before sync`n  -ForceMemorixRefresh Overwrite existing memorix skills in target directory"
    exit 0
}

# ---------- memorix refresh ----------
if (-not $SkipMemorixRefresh) {
    $candidates = @(
        "$env:USERPROFILE\.cursor\skills",
        "$env:USERPROFILE\.codex\plugins\memorix\skills",
        "$env:USERPROFILE\.claude\plugins\marketplaces\memorix-local\plugins\memorix\skills"
    )
    $sourceDir = $null
    foreach ($dir in $candidates) {
        if (Test-Path $dir) { $sourceDir = $dir; break }
    }
    if ($sourceDir) {
        Get-ChildItem $sourceDir -Directory -Filter "memorix-*" | ForEach-Object {
            $target = Join-Path "$env:USERPROFILE\.agents\skills" $_.Name
            if (-not (Test-Path $target) -or $ForceMemorixRefresh) {
                Copy-Item $_.FullName $target -Recurse -Force
            }
        }
    } else {
        Write-Warning "未找到本地 memorix skills 来源，跳过刷新"
    }
}

$platforms = @(
    @{ Name = "WorkBuddy"; Path = "$env:USERPROFILE\.workbuddy\skills" },
    @{ Name = "QoderWork"; Path = "$env:USERPROFILE\.qoderworkcn\skills" },
    @{ Name = "Kimi Work"; Path = "$env:USERPROFILE\AppData\Roaming\kimi-desktop\daimon-share\daimon\skills" },
    @{ Name = "CodeBuddy"; Path = "$env:USERPROFILE\.codebuddy\skills" }
)

if (-not (Test-Path -Path $Source -PathType Container)) {
    Write-Error "Source directory does not exist: $Source"
    exit 1
}

function New-DirectoryLink($target, $linkPath) {
    try {
        New-Item -ItemType SymbolicLink -Path $linkPath -Target $target -Force | Out-Null
    }
    catch {
        cmd /c mklink /J "$linkPath" "$target" | Out-Null
    }
}

foreach ($platform in $platforms) {
    $skillsDir = $platform.Path
    $result = [PSCustomObject]@{
        Platform = $platform.Name
        SkillsDir = $skillsDir
        Status = "skipped"
        PreviousType = $null
        BackupPath = $null
        Error = $null
    }

    try {
        $parent = Split-Path -Parent $skillsDir
        if (-not (Test-Path -Path $parent)) {
            if (-not $DryRun) {
                New-Item -ItemType Directory -Path $parent -Force | Out-Null
            }
        }

        if (-not (Test-Path -Path $skillsDir)) {
            if (-not $DryRun) {
                New-DirectoryLink $Source $skillsDir
            }
            $result.Status = "created"
        }
        elseif ((Get-Item $skillsDir).Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            $currentTarget = (Get-Item $skillsDir).Target
            if ($currentTarget -eq $Source) {
                $result.Status = "skipped"
            }
            else {
                $result.PreviousType = "symlink"
                if (-not $DryRun) {
                    Remove-Item $skillsDir -Force
                    New-DirectoryLink $Source $skillsDir
                }
                $result.Status = "replaced"
            }
        }
        elseif (Test-Path -Path $skillsDir -PathType Container) {
            $result.PreviousType = "directory"
            if (-not $DryRun) {
                if (-not $NoBackup) {
                    $backupPath = "$skillsDir.bak.$(Get-Date -Format yyyyMMddHHmmss)-$([System.Guid]::NewGuid())"
                    Move-Item -Path $skillsDir -Destination $backupPath -Force
                    $result.BackupPath = $backupPath
                }
                else {
                    Remove-Item $skillsDir -Recurse -Force
                }
                New-DirectoryLink $Source $skillsDir
            }
            $result.Status = "replaced"
        }
        else {
            # Regular file
            $result.PreviousType = "file"
            if (-not $DryRun) {
                Remove-Item $skillsDir -Force
                New-DirectoryLink $Source $skillsDir
            }
            $result.Status = "replaced"
        }
    }
    catch {
        $result.Status = "error"
        $result.Error = $_.Exception.Message
    }

    $result | ConvertTo-Json -Compress
}
