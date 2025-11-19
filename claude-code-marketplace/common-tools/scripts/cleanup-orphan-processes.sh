#!/bin/bash
# 孤儿进程清理脚本
# 清理未正确退出的 node/npx/pnpm 相关进程
# 在 Claude Code Stop 钩子中调用，避免进程堆积

set -euo pipefail

# ====== 配置 ======
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

LOG_FILE="${LOG_DIR}/cleanup-$(date +"%Y-%m-%d__%H-%M-%S").log"

# 最大清理时间（秒）- 必须在 hooks.json 设置的 timeout 内完成
# 优化后预计 3-5 秒完成，设置为 6 秒以便检测异常情况
MAX_CLEANUP_TIME=6

# ====== 日志函数 ======
log() {
  local msg="[$(date +"%Y-%m-%d %H:%M:%S")] $*"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
  echo "$msg"
}

# ====== 错误陷阱 - 确保总是返回成功 ======
trap 'log "Cleanup script interrupted, returning success"; echo "{}"; exit 0' ERR EXIT

log "====== Orphan Process Cleanup Started ======"
log "Log File: $LOG_FILE"
log "Max Cleanup Time: ${MAX_CLEANUP_TIME}s"
log ""

START_TIME=$(date +%s)

# ====== 检测操作系统 ======
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  IS_WINDOWS=true
  log "Platform: Windows (via $OSTYPE)"
else
  IS_WINDOWS=false
  log "Platform: Unix-like ($OSTYPE)"
fi
log ""

# ====== Windows 平台的进程清理 ======
if [ "$IS_WINDOWS" = true ]; then
  log "====== Cleaning Windows Processes ======"

  # 查找并清理孤儿的 pnpm dlx 进程
  # 这些进程通常包含 "@ruan-cat/claude-notifier" 参数
  log "Searching for orphan pnpm dlx processes..."

  # 使用 wmic 查找进程（Windows 命令）
  # 注意：在 Git Bash 中可以调用 Windows 命令
  if command -v wmic.exe &> /dev/null; then
    # 查找包含 "claude-notifier" 的进程
    NOTIFIER_PIDS=$(wmic.exe process where "CommandLine like '%claude-notifier%'" get ProcessId 2>/dev/null | grep -o '[0-9]\+' || echo "")

    if [ -n "$NOTIFIER_PIDS" ]; then
      log "Found claude-notifier processes: $NOTIFIER_PIDS"
      for pid in $NOTIFIER_PIDS; do
        log "Terminating process $pid..."
        taskkill.exe //F //PID "$pid" >> "$LOG_FILE" 2>&1 || log "Failed to kill $pid (may have already exited)"
      done
    else
      log "No claude-notifier processes found"
    fi

    # 查找包含 "gemini" 的进程
    GEMINI_PIDS=$(wmic.exe process where "CommandLine like '%gemini%'" get ProcessId 2>/dev/null | grep -o '[0-9]\+' || echo "")

    if [ -n "$GEMINI_PIDS" ]; then
      log "Found gemini processes: $GEMINI_PIDS"
      for pid in $GEMINI_PIDS; do
        log "Terminating process $pid..."
        taskkill.exe //F //PID "$pid" >> "$LOG_FILE" 2>&1 || log "Failed to kill $pid (may have already exited)"
      done
    else
      log "No gemini processes found"
    fi

    # 查找长时间运行的 npx.exe 进程（运行时间 > 60 秒）
    # 注意：这是一个保守的清理策略，只清理明显的僵尸进程
    log "Searching for long-running npx processes..."

    # 使用 PowerShell 查找运行时间超过 60 秒的 npx 进程
    # 优化：限制最多处理 10 个进程，避免耗时过长
    if command -v powershell.exe &> /dev/null; then
      LONG_NPX=$(powershell.exe -Command "
        Get-Process | Where-Object {
          \$_.ProcessName -eq 'npx' -and
          ((Get-Date) - \$_.StartTime).TotalSeconds -gt 60
        } | Select-Object -First 10 -ExpandProperty Id
      " 2>/dev/null || echo "")

      if [ -n "$LONG_NPX" ]; then
        NPX_COUNT=$(echo "$LONG_NPX" | wc -w)
        log "Found $NPX_COUNT long-running npx processes (limited to 10)"

        # 批量杀死进程，使用后台并行执行，不等待每个进程
        for pid in $LONG_NPX; do
          (taskkill.exe //F //PID "$pid" > /dev/null 2>&1 &)
        done

        # 等待 1 秒让 taskkill 命令完成
        sleep 1
        log "Cleanup completed for npx processes"
      else
        log "No long-running npx processes found"
      fi
    fi
  else
    log "WARNING: wmic.exe not found, skipping Windows-specific cleanup"
  fi

# ====== Unix-like 平台的进程清理 ======
else
  log "====== Cleaning Unix Processes ======"

  # 使用 pgrep 查找相关进程
  if command -v pgrep &> /dev/null; then
    # 查找 claude-notifier 进程
    log "Searching for claude-notifier processes..."
    NOTIFIER_PIDS=$(pgrep -f "claude-notifier" || echo "")

    if [ -n "$NOTIFIER_PIDS" ]; then
      log "Found claude-notifier processes: $NOTIFIER_PIDS"
      for pid in $NOTIFIER_PIDS; do
        # 检查进程是否还在运行
        if kill -0 "$pid" 2>/dev/null; then
          log "Terminating process $pid..."
          kill -TERM "$pid" 2>/dev/null || true

          # 等待最多 2 秒让进程优雅退出
          for i in {1..10}; do
            if ! kill -0 "$pid" 2>/dev/null; then
              log "Process $pid exited gracefully"
              break
            fi
            sleep 0.2
          done

          # 如果还没退出，强制杀死
          if kill -0 "$pid" 2>/dev/null; then
            log "Force killing process $pid..."
            kill -KILL "$pid" 2>/dev/null || true
          fi
        fi
      done
    else
      log "No claude-notifier processes found"
    fi

    # 查找 gemini 进程
    log "Searching for gemini processes..."
    GEMINI_PIDS=$(pgrep -f "gemini" || echo "")

    if [ -n "$GEMINI_PIDS" ]; then
      log "Found gemini processes: $GEMINI_PIDS"
      for pid in $GEMINI_PIDS; do
        if kill -0 "$pid" 2>/dev/null; then
          log "Terminating gemini process $pid..."
          kill -TERM "$pid" 2>/dev/null || true
          sleep 0.5
          kill -KILL "$pid" 2>/dev/null || true
        fi
      done
    else
      log "No gemini processes found"
    fi
  else
    log "WARNING: pgrep not found, using fallback method"

    # 降级方案：使用 ps + grep
    if command -v ps &> /dev/null; then
      NOTIFIER_PIDS=$(ps aux | grep -i "claude-notifier" | grep -v grep | awk '{print $2}' || echo "")
      if [ -n "$NOTIFIER_PIDS" ]; then
        log "Found processes (ps fallback): $NOTIFIER_PIDS"
        for pid in $NOTIFIER_PIDS; do
          kill -TERM "$pid" 2>/dev/null || true
        done
      fi
    fi
  fi
fi

# ====== 清理完成 ======
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log ""
log "====== Cleanup Completed in ${DURATION}s ======"

# 检查是否超时
if [ $DURATION -ge $MAX_CLEANUP_TIME ]; then
  log "WARNING: Cleanup took longer than expected ($DURATION >= $MAX_CLEANUP_TIME)"
fi

# ====== 清除陷阱，正常退出 ======
trap - ERR EXIT

# 返回成功状态给 Claude Code
echo "{}"
exit 0
