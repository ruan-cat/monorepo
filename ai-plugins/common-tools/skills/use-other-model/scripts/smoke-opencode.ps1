$ErrorActionPreference = "Stop"

# Minimal check: verify OpenCode can run its configured default model.
opencode run --format json --variant max "只回答 OPENCODE_DEFAULT_MODEL_SMOKE_OK，不调用工具，完成后退出。"
exit $LASTEXITCODE
