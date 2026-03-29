#!/bin/bash
# Claude Code UserPromptSubmit 钩子 - 记录用户输入
# 在用户提交 prompt 时触发，记录用户输入并初始化会话日志
# 关键：必须快速返回，不阻塞 Claude Code
#
# 设计要点：
#   1. 不使用 set -e，避免意外退出导致 JSON 响应丢失
#   2. 使用 trap EXIT 保障 JSON 响应一定输出
#   3. log() 只写文件，不输出 stdout（stdout 保留给 JSON 响应）

# ====== 安全保障：确保无论如何都输出 JSON 响应 ======
_HOOK_RESPONDED=false
_respond_hook() {
  if [ "$_HOOK_RESPONDED" = "false" ]; then
    _HOOK_RESPONDED=true
    echo "{}"
  fi
}
trap '_respond_hook' EXIT

# ====== 配置 ======
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

# ====== 读取钩子输入 ======
HOOK_DATA=$(cat 2>/dev/null || echo "")

# ====== 提取关键信息 ======
# session_id / transcript_path 是简单字符串，用 grep -oP 提取（无 node 启动开销）
SESSION_ID=$(echo "$HOOK_DATA" | grep -oP '"session_id"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | grep -oP '"transcript_path"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")

# prompt 可能含换行、引号等复杂内容，用 node 做完整 JSON 解析
# printf 比 echo 安全：不会把 HOOK_DATA 开头的 -e/-n 解释为 flag
USER_PROMPT=$(printf '%s\n' "$HOOK_DATA" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.prompt || '');
" 2>/dev/null || echo "")

# ====== 生成日志文件名 ======
LOG_TIMESTAMP=$(date +"%Y-%m-%d__%H-%M-%S")
SESSION_LOG="${LOG_DIR}/session_${SESSION_ID:0:8}_${LOG_TIMESTAMP}.log"

# ====== 记录会话信息 ======
{
  echo "====== Claude Code Session Started ======"
  echo "Time: $(date +"%Y-%m-%d %H:%M:%S")"
  echo "Session ID: $SESSION_ID"
  echo "Transcript Path: $TRANSCRIPT_PATH"
  echo ""
  echo "====== User Prompt ======"
  echo "$USER_PROMPT"
  echo ""
} >> "$SESSION_LOG" 2>/dev/null || true

# ====== 保存会话信息到环境变量文件 ======
# 这样 Stop 钩子可以找到对应的日志文件
SESSION_ENV="${LOG_DIR}/.session_${SESSION_ID}"
{
  echo "SESSION_ID=$SESSION_ID"
  echo "SESSION_LOG=$SESSION_LOG"
  echo "TRANSCRIPT_PATH=$TRANSCRIPT_PATH"
  echo "START_TIME=$(date +%s)"
} > "$SESSION_ENV" 2>/dev/null || true

# ====== 快速返回（JSON 响应由 trap EXIT 保障输出） ======
exit 0
