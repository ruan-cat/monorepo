#!/bin/bash
# Claude Code Stop 钩子 - 任务完成通知器
# 在 Agent 响应完成后触发，生成 Gemini 总结并发送通知
# 关键：必须快速返回（15秒内），避免阻塞 Claude Code

set -euo pipefail

# ====== 全局超时保护 ======
GLOBAL_TIMEOUT=15

# ====== 日志配置 ======
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

# ====== 读取钩子输入 ======
HOOK_DATA=$(cat)

# ====== 获取脚本所在目录（用于解析工具） ======
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARSE_HOOK_DATA="$SCRIPT_DIR/parse-hook-data.ts"

# ====== 提取关键信息 ======
# 检查 tsx 是否可用
if command -v tsx &> /dev/null && [ -f "$PARSE_HOOK_DATA" ]; then
  SESSION_ID=$(echo "$HOOK_DATA" | tsx "$PARSE_HOOK_DATA" session_id 2>/dev/null || echo "unknown")
  TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | tsx "$PARSE_HOOK_DATA" transcript_path 2>/dev/null || echo "")
  CWD=$(echo "$HOOK_DATA" | tsx "$PARSE_HOOK_DATA" cwd_sanitized 2>/dev/null || echo "unknown")
else
  # 降级：使用简单的 grep/sed 提取（不完美但可用）
  SESSION_ID=$(echo "$HOOK_DATA" | grep -oP '"session_id"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
  TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | grep -oP '"transcript_path"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")
  CWD_RAW=$(echo "$HOOK_DATA" | grep -oP '"cwd"\s*:\s*"\K[^"]+' 2>/dev/null || echo "unknown")
  CWD=$(echo "$CWD_RAW" | sed 's/[\\/:*?"<>|]/_/g')
fi

# ====== 生成日志文件 ======
LOG_TIMESTAMP=$(date +"%Y-%m-%d__%H-%M-%S")
LOG_FILE="${LOG_DIR}/${LOG_TIMESTAMP}__${CWD}.log"

# ====== 日志函数 ======
log() {
  local msg="[$(date +"%Y-%m-%d %H:%M:%S")] $*"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
  echo "$msg"
}

# ====== 错误陷阱 ======
trap 'log "Script interrupted, returning success to prevent blocking"; echo "{}"; exit 0' ERR EXIT

log "====== Task Complete Notifier Started ======"
log "Session ID: $SESSION_ID"
log "Transcript Path: $TRANSCRIPT_PATH"
log "Log File: $LOG_FILE"
log "Global Timeout: ${GLOBAL_TIMEOUT}s"
log ""

# ====== 记录钩子输入数据 ======
log "====== Hook Input Data ======"
echo "$HOOK_DATA" >> "$LOG_FILE" 2>/dev/null || true
log ""

# ====== 检查 transcript 文件 ======
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  log "ERROR: Transcript file not found: $TRANSCRIPT_PATH"
  SUMMARY="任务处理完成"
else
  # ====== 使用 transcript-reader.ts 提取完整上下文 ======
  log "====== Extracting Conversation Context ======"

  # 使用前面已定义的 SCRIPT_DIR
  TRANSCRIPT_READER="$SCRIPT_DIR/transcript-reader.ts"

  # 检查 tsx 是否存在
  if ! command -v tsx &> /dev/null; then
    log "ERROR: tsx command not found. Please install tsx globally: npm install -g tsx"
    log "Falling back to default summary due to missing tsx"
    SUMMARY="任务处理完成"
  elif [ ! -f "$TRANSCRIPT_READER" ]; then
    log "ERROR: transcript-reader.ts not found at $TRANSCRIPT_READER"
    SUMMARY="任务处理完成"
  else
    log "Using transcript-reader: $TRANSCRIPT_READER"
    log "Using tsx to run TypeScript file"

    # 提取对话摘要（用于 Gemini）
    CONVERSATION_CONTEXT=$(timeout 3s tsx "$TRANSCRIPT_READER" "$TRANSCRIPT_PATH" --format=summary 2>&1 || echo "")

    if [ -z "$CONVERSATION_CONTEXT" ]; then
      log "WARNING: Failed to extract context, trying keywords fallback"
      CONVERSATION_CONTEXT=$(timeout 2s tsx "$TRANSCRIPT_READER" "$TRANSCRIPT_PATH" --format=keywords 2>&1 || echo "任务处理完成")
    fi

    log "Extracted Context Length: ${#CONVERSATION_CONTEXT} characters"
    log ""
    log "====== Conversation Context ======"
    echo "$CONVERSATION_CONTEXT" >> "$LOG_FILE" 2>/dev/null || true
    log ""

    # ====== 调用 Gemini 生成总结 ======
    log "====== Generating Gemini Summary ======"

    SUMMARY_PROMPT="你是一个任务总结助手。请根据以下对话内容，生成一个5-20字的简短任务标题。

对话内容：
${CONVERSATION_CONTEXT}

要求：
1. 只输出标题文本，不要任何解释或多余内容。
2. 5-20个汉字。
3. 简洁明了，突出核心动作和结果。
4. 如果内容涉及代码或技术，请突出关键技术点。
5. 输出文本必须是中文，不允许你输出英文或者是其他语言。

示例格式：
- 修复登录验证bug
- 实现用户权限管理功能
- 优化数据库查询性能
- 添加API文档

请直接输出标题："

    log "Gemini Prompt Preview:"
    echo "$SUMMARY_PROMPT" | head -n 10 >> "$LOG_FILE" 2>/dev/null || true
    log "..."
    log ""

    # 尝试 1: gemini-2.5-flash（快速）
    SUMMARY=""
    log "Trying gemini-2.5-flash (timeout: 5s)..."
    GEMINI_START=$(date +%s)

    GEMINI_OUTPUT=$(timeout 5s gemini \
      --model "gemini-2.5-flash" \
      --output-format text \
      "$SUMMARY_PROMPT" 2>&1 || echo "")

    GEMINI_END=$(date +%s)
    GEMINI_DURATION=$((GEMINI_END - GEMINI_START))

    # 记录完整输出到日志
    log "Gemini raw output:"
    echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
    log ""

    # 提取第一行作为总结
    SUMMARY=$(echo "$GEMINI_OUTPUT" | grep -v "^$" | head -n 1 | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || echo "")

    log "gemini-2.5-flash completed in ${GEMINI_DURATION}s"
    log "Result: '$SUMMARY'"
    log ""

    # 尝试 2: 如果结果为空或太短，尝试 gemini-2.5-pro
    if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 5 ]; then
      log "gemini-2.5-flash failed, trying gemini-2.5-pro (timeout: 5s)..."
      GEMINI_START=$(date +%s)

      GEMINI_OUTPUT=$(timeout 5s gemini \
        --model "gemini-2.5-pro" \
        --output-format text \
        "$SUMMARY_PROMPT" 2>&1 || echo "")

      GEMINI_END=$(date +%s)
      GEMINI_DURATION=$((GEMINI_END - GEMINI_START))

      echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
      SUMMARY=$(echo "$GEMINI_OUTPUT" | grep -v "^$" | head -n 1 | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || echo "")

      log "gemini-2.5-pro completed in ${GEMINI_DURATION}s"
      log "Result: '$SUMMARY'"
      log ""
    fi

    # 尝试 3: 降级到关键词提取
    if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 5 ]; then
      log "Gemini failed, using keyword extraction fallback"

      # 检查 tsx 是否可用
      if command -v tsx &> /dev/null; then
        KEYWORDS=$(timeout 2s tsx "$TRANSCRIPT_READER" "$TRANSCRIPT_PATH" --format=keywords 2>&1 || echo "")
      else
        log "WARNING: tsx not available for keywords extraction, using empty keywords"
        KEYWORDS=""
      fi

      if [ -n "$KEYWORDS" ] && [ ${#KEYWORDS} -gt 5 ]; then
        # 从关键词生成简短标题
        SUMMARY=$(echo "$KEYWORDS" | head -c 50 | tr ',' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        log "Keyword-based summary: '$SUMMARY'"
      else
        SUMMARY="任务处理完成"
        log "Using default summary"
      fi
    fi
  fi
fi

# ====== 清理和规范化总结 ======
# 移除多余的空白、引号、标点
SUMMARY=$(echo "$SUMMARY" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -s ' ' | sed 's/^["'\'']*//;s/["'\'']*$//')

# 确保长度合理
SUMMARY_LENGTH=${#SUMMARY}
log "Summary length: $SUMMARY_LENGTH characters"

if [ $SUMMARY_LENGTH -lt 5 ]; then
  SUMMARY="任务处理完成"
  log "Summary too short, using default"
elif [ $SUMMARY_LENGTH -gt 50 ]; then
  SUMMARY="${SUMMARY:0:50}..."
  log "Summary truncated to 50 characters"
fi

log "====== Final Summary ======"
log "'$SUMMARY'"
log ""

# ====== 检测项目根目录 ======
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
else
  # 通过向上查找 pnpm-workspace.yaml 来检测 monorepo 根目录
  CURRENT_DIR=$(pwd)
  PROJECT_DIR=""

  while [ "$CURRENT_DIR" != "/" ] && [ "$CURRENT_DIR" != "" ]; do
    if [ -f "$CURRENT_DIR/pnpm-workspace.yaml" ]; then
      PROJECT_DIR="$CURRENT_DIR"
      break
    fi
    CURRENT_DIR=$(dirname "$CURRENT_DIR")
  done

  # 如果找不到 monorepo 根目录，使用当前工作目录
  if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(pwd)
  fi
fi

log "Project directory: $PROJECT_DIR"

# ====== 发送通知（后台运行） ======
log "====== Sending Notification ======"
log "Message: $SUMMARY"

# 后台运行通知器，避免阻塞
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  timeout 8s pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" >> "$LOG_FILE" 2>&1 || echo "Notifier failed or timed out" >> "$LOG_FILE"
) &

NOTIFIER_PID=$!
log "Notifier started in background (PID: $NOTIFIER_PID)"
log ""

# ====== 清除错误陷阱，正常退出 ======
trap - ERR EXIT

# ====== 向 Claude Code 输出成功信息 ======
OUTPUT_JSON="{\"continue\": true, \"stopReason\": \"✅ 任务总结: ${SUMMARY}\"}"
log "====== Claude Code Output ======"
log "$OUTPUT_JSON"
log "====== Task Complete Notifier Finished ======"

echo "$OUTPUT_JSON"
exit 0
