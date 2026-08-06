param(
  [Parameter(Mandatory = $true)]
  [string]$Workdir,

  [Parameter(Mandatory = $true)]
  [string]$TaskDir,

  [ValidateSet("low", "high", "max", "minimal")]
  [string]$Variant = "max"
)

$ErrorActionPreference = "Stop"

$contextPacket = Join-Path $TaskDir "context-packet.md"
$resultJsonl = Join-Path $TaskDir "result.jsonl"
$stderrLog = Join-Path $TaskDir "stderr.log"

if (-not (Test-Path -LiteralPath $contextPacket -PathType Leaf)) {
  throw "Missing task packet: $contextPacket"
}

New-Item -ItemType Directory -Force -Path $TaskDir | Out-Null
Set-Location -LiteralPath $Workdir

# The model flag is intentionally omitted: OpenCode selects its configured internal/default model.
opencode run `
  --format json `
  --auto `
  --variant $Variant `
  --dir $Workdir `
  "Act as an unattended coding agent. Read '$contextPacket' first, follow it exactly, verify the result, write execution-log.md, and exit without questions." `
  1> $resultJsonl `
  2> $stderrLog

exit $LASTEXITCODE
