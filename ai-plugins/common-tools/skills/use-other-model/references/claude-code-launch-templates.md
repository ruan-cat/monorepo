# Claude Code 启动模板

本文件提供方案 B 的标准启动模板。

## 核实依据

以下参数已在 **2026-04-15** 通过本机 `claude --help` 和 `claude -p --help` 核实可用:

- `-p, --print`
- `--permission-mode`
- `--tools`
- `--output-format`
- `--append-system-prompt`

当前本机版本为 **Claude Code 2.1.107**。

## 默认参数

方案 B 默认使用:

- `claude -p`
- `--permission-mode bypassPermissions`
- `--tools default`
- `--output-format json`
- `--append-system-prompt "<无人值守硬约束提示>"`

### 为什么这样配

1. `-p`
   - 强制非交互输出
   - 更适合当作独立执行代理

2. `--permission-mode bypassPermissions`
   - 让子会话直接进入可编辑、可执行状态

3. `--tools default`
   - 不把工具能力留给子会话临场猜

4. `--output-format json`
   - 便于主代理解析结果

5. `--append-system-prompt`
   - 把硬约束注入默认系统提示

## Bash 模板

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

# 在这里注入 provider 环境变量
# 参见 environment-variables.md
export ANTHROPIC_AUTH_TOKEN="..."
export ANTHROPIC_BASE_URL="..."
export ANTHROPIC_MODEL="..."

claude -p \
  --permission-mode bypassPermissions \
  --tools default \
  --output-format json \
  --append-system-prompt "$(cat "$SYSTEM_PROMPT_FILE")" \
  "先阅读 '$CONTEXT_PACKET'。按封包要求完成任务，把执行过程写入 '$EXECUTION_LOG'。完成后退出，不要反问。" \
  > "$RESULT_JSON"
```

## PowerShell 模板

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

# 在这里注入 provider 环境变量
# 参见 environment-variables.md
$env:ANTHROPIC_AUTH_TOKEN = "..."
$env:ANTHROPIC_BASE_URL = "..."
$env:ANTHROPIC_MODEL = "..."

claude -p `
  --permission-mode bypassPermissions `
  --tools default `
  --output-format json `
  --append-system-prompt (Get-Content -Raw $systemPromptFile) `
  "先阅读 '$contextPacket'。按封包要求完成任务，把执行过程写入 '$executionLog'。完成后退出，不要反问。" |
  Set-Content -Path $resultJson
```

## 无人值守系统提示模板

把下面内容写入 `unattended-system-prompt.txt`:

```plain
你是 unattended coding agent，不是普通问答助手。

硬约束:
1. 不要反问，除非任务封包本身存在直接冲突。
2. 先读任务封包指定的文件，再修改代码，再运行命令，再做验证。
3. 需要浏览器验收的前端任务必须执行页面访问、视觉检查和至少一个核心交互。
4. 必须把实际执行过程、运行命令、验证结果、浏览器观察写入 execution log。
5. 如果任务无法完成，输出失败原因和停留位置，不要伪装成“基本完成”。
6. 完成后立即退出。
```

## 主代理侧超时建议

| 场景             | 建议超时   |
| ---------------- | ---------- |
| 启动 smoke check | 120000 ms  |
| 中等任务         | 900000 ms  |
| 复杂任务         | 1800000 ms |
| 复杂前端任务     | 2100000 ms |

## 兼容回退

只有在确认当前环境 **不支持** `--permission-mode` 时,才考虑回退到兼容命令。

回退前必须:

1. 运行 `claude --help`
2. 记录为什么不能用 `--permission-mode bypassPermissions`
3. 确认运行环境是受控的

兼容回退示例:

```bash
claude -p \
  --dangerously-skip-permissions \
  --tools default \
  --output-format json \
  --append-system-prompt "<硬约束系统提示>" \
  "<主提示>"
```

这个回退写法不是默认值。
