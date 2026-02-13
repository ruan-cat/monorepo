#!/bin/bash
# Claude Code Stop 钩子 - 任务完成通知器
# 在 Agent 响应完成后触发，发送通知（非阻塞）
#
# 设计要点：
#   1. 不使用 set -e，避免意外退出导致 JSON 响应丢失
#   2. 使用 trap EXIT 保障 JSON 响应一定输出
#   3. log() 只写文件，不输出 stdout（stdout 保留给 JSON 响应）
#   4. 后台进程完全关闭继承的 FD（stdin/stdout/stderr），避免阻塞 Claude Code

# ====== 安全保障：确保无论如何都输出 JSON 响应 ======
_HOOK_RESPONDED=false
_respond_hook() {
  if [ "$_HOOK_RESPONDED" = "false" ]; then
    _HOOK_RESPONDED=true
    echo '{"continue": true, "stopReason": "任务完成通知已发送"}'
    if [ -n "${LOG_FILE:-}" ]; then
      echo "[$(date +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "?")] Hook JSON response sent" >> "$LOG_FILE" 2>/dev/null || true
    fi
  fi
}
trap '_respond_hook' EXIT

# ====== 读取钩子输入（仅用于获取必要信息） ======
HOOK_DATA=$(cat 2>/dev/null || echo "")

# ====== 获取脚本所在目录 ======
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR="."

# ====== 提取关键信息 ======
SESSION_ID=$(echo "$HOOK_DATA" | grep -oP '"session_id"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
CWD_RAW=$(echo "$HOOK_DATA" | grep -oP '"cwd"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
CWD=$(echo "$CWD_RAW" | sed 's/[\\/:*?"<>|]/_/g' 2>/dev/null || echo "unknown")

# ====== 日志配置 ======
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

LOG_TIMESTAMP=$(date +"%Y-%m-%d__%H-%M-%S" 2>/dev/null || echo "unknown")
LOG_FILE="${LOG_DIR}/${LOG_TIMESTAMP}__${CWD}.log"

# 日志只写入文件，不输出到 stdout（stdout 保留给 JSON 响应）
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "?")] $*" >> "$LOG_FILE" 2>/dev/null || true
}

log "====== Task Complete Notifier Started ======"
log "Session ID: $SESSION_ID"
log "CWD: $CWD"
log "Log File: $LOG_FILE"

# ====== 检测项目目录 ======
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
else
  CURRENT_DIR=$(pwd 2>/dev/null || echo ".")
  PROJECT_DIR=""

  while [ "$CURRENT_DIR" != "/" ] && [ "$CURRENT_DIR" != "" ]; do
    if [ -f "$CURRENT_DIR/pnpm-workspace.yaml" ]; then
      PROJECT_DIR="$CURRENT_DIR"
      break
    fi
    CURRENT_DIR=$(dirname "$CURRENT_DIR" 2>/dev/null) || break
  done

  if [ -z "${PROJECT_DIR:-}" ]; then
    PROJECT_DIR=$(pwd 2>/dev/null || echo ".")
  fi
fi

log "Project directory: $PROJECT_DIR"

# ====== 检测 claude-notifier 是否可用 ======
NOTIFIER_CMD=""
if command -v claude-notifier >/dev/null 2>&1; then
  NOTIFIER_CMD="claude-notifier"
  NOTIFIER_PATH=$(command -v claude-notifier 2>/dev/null || echo "unknown")
  log "Found claude-notifier at: $NOTIFIER_PATH"
else
  log "ERROR: claude-notifier not found in PATH"
  log "PATH: ${PATH:-empty}"
fi

# ====== 发送通知（非阻塞异步调用） ======
log "====== Sending Notification (async) ======"

if [ -n "$NOTIFIER_CMD" ]; then
  # 跨平台统一的异步调用方式（Git Bash / Unix / macOS 通用）
  #
  # 关键技术说明：
  #   - </dev/null   : 关闭后台进程对父进程 stdin 的继承
  #   - >>"$LOG_FILE" 2>&1 : 将后台进程的 stdout/stderr 重定向到日志文件
  #                           这样后台进程不再持有父进程的 stdout
  #                           Claude Code 就不需要等待后台进程结束才能读取 JSON 响应
  #   - &            : 在后台运行子 shell
  #
  # 如果不关闭 FD，Claude Code 会等待后台进程的 stdout 关闭才认为 hook 执行完毕，
  # 导致 hook 超时。这是之前 "通知窗口无法打开" 的真正原因。
  (
    cd "$PROJECT_DIR" 2>/dev/null || true
    echo "[NOTIFIER START] $(date +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "?")" >> "$LOG_FILE" 2>/dev/null || true
    "$NOTIFIER_CMD" task-complete --message "任务已完成" 2>&1 || {
      echo "[NOTIFIER ERROR] exit code: $?" >> "$LOG_FILE" 2>/dev/null || true
    }
    echo "[NOTIFIER DONE] $(date +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "?")" >> "$LOG_FILE" 2>/dev/null || true
  ) </dev/null >>"$LOG_FILE" 2>&1 &

  NOTIFIER_PID=$!
  log "Notifier started with PID: $NOTIFIER_PID (FDs fully detached)"
else
  log "SKIP: claude-notifier not available, cannot send notification"
fi

log "====== Task Complete Notifier Finished ======"

# JSON 响应通过 trap EXIT 自动输出，确保一定被发送
exit 0
