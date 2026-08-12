#requires -Version 5.1
<#
.SYNOPSIS
    Skill Registry Node generator 的 PowerShell 兼容入口。

.DESCRIPTION
    保留既有 -Check / -Apply CLI，实际的 SKILL.md 文本解析、JSON 生成、规范化、
    写入与严格比较全部由同目录 generate-skill-registry.mjs 完成。
    本文件不参与任何 JSON 或文本 canonicalization。
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

if ($Check -and $Apply) { Fail "不能同时指定 -Check 与 -Apply" }

$Generator = Join-Path $PSScriptRoot "generate-skill-registry.mjs"
if (-not (Test-Path -LiteralPath $Generator -PathType Leaf)) {
    Fail ("Skill Registry Node generator 缺失: " + $Generator)
}

$Node = Get-Command node -ErrorAction SilentlyContinue
if (-not $Node) {
    Fail "未找到 Node.js。请使用仓库 package.json 要求的 Node 版本后重试。"
}

$Mode = if ($Apply) { "--apply" } else { "--check" }
& $Node.Source $Generator $Mode
exit $LASTEXITCODE
