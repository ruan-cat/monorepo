param(
  [Parameter(Mandatory = $true)]
  [string]$Model,

  [string]$Prompt = "reply with ok"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
  throw "ANTHROPIC_API_KEY is missing from the current PowerShell session."
}

if ([string]::IsNullOrWhiteSpace($env:OPENCODE_CONFIG_CONTENT)) {
  throw "OPENCODE_CONFIG_CONTENT is missing from the current PowerShell session."
}

opencode run --model $Model $Prompt
exit $LASTEXITCODE
