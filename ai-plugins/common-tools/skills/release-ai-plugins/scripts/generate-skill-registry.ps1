#requires -Version 5.1
<#
.SYNOPSIS
    Compatibility wrapper for the Node Skill Registry generator.
.DESCRIPTION
    Preserves the -Check and -Apply PowerShell CLI while delegating all
    parsing, canonical JSON generation, writing, and validation to Node.
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

if ($Check -and $Apply) { Fail "Specify only -Check or -Apply." }

$Generator = Join-Path $PSScriptRoot "generate-skill-registry.mjs"
if (-not (Test-Path -LiteralPath $Generator -PathType Leaf)) {
    Fail ("Skill Registry Node generator missing: " + $Generator)
}

$Node = Get-Command node -ErrorAction SilentlyContinue
if (-not $Node) {
    Fail "Node.js was not found."
}

$Mode = if ($Apply) { "--apply" } else { "--check" }
& $Node.Source $Generator $Mode
exit $LASTEXITCODE
