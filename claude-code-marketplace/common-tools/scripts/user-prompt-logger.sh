#!/bin/bash
# Claude Code UserPromptSubmit 钩子 - 记录用户输入
# 在用户提交 prompt 时触发，记录用户输入并初始化会话日志
# 关键：必须快速返回，不阻塞 Claude Code

set -euo pipefail

# ====== 配置 ======
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

# ====== 读取钩子输入 ======
HOOK_DATA=$(cat)

# ====== 提取关键信息 ======
SESSION_ID=$(echo "$HOOK_DATA" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.session_id || 'unknown');
" 2>/dev/null || echo "unknown")

TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.transcript_path || '');
" 2>/dev/null || echo "")

USER_PROMPT=$(echo "$HOOK_DATA" | node -e "
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

# ====== 快速返回 ======
# UserPromptSubmit 钩子的输出会添加到 Claude 的上下文中
# 这里可以添加一些有用的上下文信息
echo "{\"decision\": \"approve\"}"
exit 0
