# 代码模板

本文件现在不是方案 B 的主入口,但仍然保留“可以直接抄”的模板骨架。

如果你想按新主线严谨执行,优先看:

1. `claude-code-launch-templates.md`
2. `context-packet-template.md`
3. `frontend-browser-verification-template.md`
4. `failure-routing.md`

如果你只是想快速拿一个模板起手,本文件仍然有价值。

## A. 任务封包模板 (`context-packet.md`)

> 这是旧“执行计划模板”的升级版。  
> 旧模板偏步骤列表,新模板偏执行契约。

```markdown
# Task Packet

## Working directory

- Repository root: `/absolute/path/to/repo`

## Branch

- Expected branch: `dev`
- Do not switch branches.

## Read first

- `path/to/file-a`
- `path/to/file-b`

## Goal

- [目标 1]
- [目标 2]

## Allowed edits

- `path/to/file-a`
- `path/to/dir/**`

## Do not do

- Do not edit files outside the allowed scope.
- Do not ask follow-up questions unless the packet contains direct contradictions.
- Do not claim completion without running the required verification commands.

## Verification commands

- `pnpm test --filter ...`
- `pnpm build --filter ...`

## Browser verification target

- Required: `yes` / `no`
- URL: `http://localhost:5173/#/`

## Required output log

1. Start time
2. Files read
3. Files changed
4. Commands executed
5. Verification results
6. Browser observations
7. Final status

## Completion rule

You are done only if:

1. Allowed edits are finished
2. Required verification commands have passed
3. Browser verification is completed or explicitly marked blocked with reason
4. The execution log is complete
5. You exit immediately after writing the result
```

## B. Bash 启动脚本模板 (`execute-task.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

unset CLAUDECODE

WORKDIR="/absolute/path/to/repo"
TASK_DIR="$WORKDIR/.use-other-model/task-001"
CONTEXT_PACKET="$TASK_DIR/context-packet.md"
SYSTEM_PROMPT_FILE="$TASK_DIR/unattended-system-prompt.txt"
RESULT_JSON="$TASK_DIR/result.json"
EXECUTION_LOG="$TASK_DIR/execution-log.md"

mkdir -p "$TASK_DIR"
cd "$WORKDIR"

export ANTHROPIC_AUTH_TOKEN="[用户提供的 API Key]"
export ANTHROPIC_BASE_URL="[用户提供的 Base URL]"
export ANTHROPIC_MODEL="[用户提供的模型名称]"

claude -p \
  --permission-mode bypassPermissions \
  --tools default \
  --output-format json \
  --append-system-prompt "$(cat "$SYSTEM_PROMPT_FILE")" \
  "先阅读 '$CONTEXT_PACKET'。按封包要求完成任务，把执行过程写入 '$EXECUTION_LOG'。完成后退出，不要反问。" \
  > "$RESULT_JSON"
```

## C. PowerShell 启动脚本模板 (`execute-task.ps1`)

```powershell
$ErrorActionPreference = "Stop"

Remove-Item Env:CLAUDECODE -ErrorAction SilentlyContinue

$workdir = "D:\path\to\repo"
$taskDir = Join-Path $workdir ".use-other-model\task-001"
$contextPacket = Join-Path $taskDir "context-packet.md"
$systemPromptFile = Join-Path $taskDir "unattended-system-prompt.txt"
$resultJson = Join-Path $taskDir "result.json"
$executionLog = Join-Path $taskDir "execution-log.md"

New-Item -ItemType Directory -Force -Path $taskDir | Out-Null
Set-Location $workdir

$env:ANTHROPIC_AUTH_TOKEN = "[用户提供的 API Key]"
$env:ANTHROPIC_BASE_URL = "[用户提供的 Base URL]"
$env:ANTHROPIC_MODEL = "[用户提供的模型名称]"

claude -p `
  --permission-mode bypassPermissions `
  --tools default `
  --output-format json `
  --append-system-prompt (Get-Content -Raw $systemPromptFile) `
  "先阅读 '$contextPacket'。按封包要求完成任务，把执行过程写入 '$executionLog'。完成后退出，不要反问。" |
  Set-Content -Path $resultJson
```

## D. 主会话调用骨架

```typescript
// 1. 写 context-packet.md
// 2. 写 unattended-system-prompt.txt
// 3. 启动 execute-task.sh 或 execute-task.ps1
// 4. 读取 result.json 和 execution-log.md
// 5. 主代理重新验证 diff / 测试 / 浏览器结果
```

## E. 环境变量文件模板 (`.env`)

```bash
# Claude Code provider 配置
# 注意:此文件包含敏感信息,不要提交到 git

ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
ANTHROPIC_MODEL=MiniMax-M2.5-highspeed
```

**使用方式**:

```bash
source .env
```

## 迁移说明

### 为什么还保留这个文件

因为很多人仍然习惯先找“模板合集”,再决定看哪份细文档。  
所以这个文件保留,但不再承担全部规则说明。

### 现在它和新文档的关系

- 这里给你“可以直接抄”的骨架
- 细规则去看:
  - `claude-code-launch-templates.md`
  - `context-packet-template.md`
  - `frontend-browser-verification-template.md`
  - `failure-routing.md`
