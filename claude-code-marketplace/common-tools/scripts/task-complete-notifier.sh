#!/bin/bash
# Claude Code Stop 钩子 - 任务完成通知器
# 在 Agent 响应完成后触发，发送通知（非阻塞）

set -euo pipefail

# ====== 读取钩子输入（仅用于获取必要信息） ======
HOOK_DATA=$(cat)

# ====== 获取脚本所在目录 ======
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ====== 提取关键信息 ======
SESSION_ID=$(echo "$HOOK_DATA" | grep -oP '"session_id"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
CWD_RAW=$(echo "$HOOK_DATA" | grep -oP '"cwd"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
CWD=$(echo "$CWD_RAW" | sed 's/[\\/:*?"<>|]/_/g' 2>/dev/null || echo "unknown")

# ====== 日志配置 ======
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

LOG_TIMESTAMP=$(date +"%Y-%m-%d__%H-%M-%S")
LOG_FILE="${LOG_DIR}/${LOG_TIMESTAMP}__${CWD}.log"

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*" >> "$LOG_FILE" 2>/dev/null || true
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*"
}

# ====== 错误处理 ======
cleanup() {
  log "Script cleanup on exit"
}
trap 'cleanup' ERR EXIT

log "====== Task Complete Notifier Started ======"
log "Session ID: $SESSION_ID"
log "CWD: $CWD"
log "Log File: $LOG_FILE"

# ====== 检测项目目录 ======
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
else
  CURRENT_DIR=$(pwd)
  PROJECT_DIR=""

  while [ "$CURRENT_DIR" != "/" ] && [ "$CURRENT_DIR" != "" ]; do
    if [ -f "$CURRENT_DIR/pnpm-workspace.yaml" ]; then
      PROJECT_DIR="$CURRENT_DIR"
      break
    fi
    CURRENT_DIR=$(dirname "$CURRENT_DIR")
  done

  if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(pwd)
  fi
fi

log "Project directory: $PROJECT_DIR"

# ====== 发送通知（非阻塞异步调用） ======
log "====== Sending Notification (async) ======"

# 使用后台进程 + nohup 确保持续运行不被阻塞
# 即使 Claude Code 退出，通知也会显示
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  claude-notifier task-complete --message "任务已完成" 2>&1 || {
    log "Notifier failed with exit code: $?"
  }
) &

NOTIFIER_PID=$!
log "Notifier started with PID: $NOTIFIER_PID"
log "Notification sent asynchronously (non-blocking)"

# ====== 输出成功信息 ======
log "====== Task Complete Notifier Finished ======"

# 输出 JSON 告诉 Claude Code 可以继续
echo '{"continue": true, "stopReason": "任务完成通知已发送"}'
exit 0
