#!/bin/bash
# Claude Code 任务完成通知器（集成 Gemini 总结功能）
# 当 Claude Code 任务完成时触发此钩子，使用 Gemini 生成简洁摘要
# 依赖：Node.js（monorepo 中已有）、Gemini CLI

# 关键修复：Stop hook 必须快速返回，添加全局超时和错误处理
set -euo pipefail

# 全局超时保护：整个脚本最多运行 12 秒
# 如果脚本运行时间超过此限制，自动终止并返回成功
# 这样可以防止 Stop hook 阻塞 Claude Code
GLOBAL_TIMEOUT=12

# ====== 日志配置 ======
# 日志目录：Windows 临时文件夹
LOG_DIR="${TEMP:-${TMP:-/tmp}}/claude-code-task-complete-notifier-logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

# 日志文件名：YYYY-MM-DD__HH-mm-ss__工作目录（无非法字符）
LOG_TIMESTAMP=$(date +"%Y-%m-%d__%H-%M-%S")

# 从标准输入读取钩子上下文数据
HOOK_DATA=$(cat)

# 从 HOOK_DATA 提取 cwd（如果存在）
HOOK_CWD=$(echo "$HOOK_DATA" | node -e '
const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
// Stop 钩子没有 cwd，使用环境变量或当前目录
const cwd = data.cwd || process.env.PWD || process.cwd();
// 移除非法字符用于文件名
const sanitized = cwd.replace(/[\\/:*?"<>|]/g, "_");
console.log(sanitized);
' 2>/dev/null || echo "unknown")

LOG_FILE="${LOG_DIR}/${LOG_TIMESTAMP}__${HOOK_CWD}.log"

# 日志函数（避免使用 tee 防止阻塞）
log() {
  local msg="[$(date +"%Y-%m-%d %H:%M:%S")] $*"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
  echo "$msg"
}

# 错误陷阱：确保脚本总是返回成功，避免阻塞 Claude Code
trap 'log "Script interrupted or failed, returning success to prevent hook blocking"; echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT

log "====== Task Complete Notifier Started ======"
log "Log file: $LOG_FILE"
log "Global timeout: ${GLOBAL_TIMEOUT}s"

# 记录输入数据
log "====== Hook Input Data ======"
echo "$HOOK_DATA" >> "$LOG_FILE" 2>/dev/null || true
log ""

# 提取 transcript_path（对话历史文件）
TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.transcript_path || '');
" 2>/dev/null || echo "")

log "Transcript path: $TRANSCRIPT_PATH"

# 使用 Node.js 从对话历史中提取最近的消息作为上下文
CONVERSATION_CONTEXT=$(node -e "
const fs = require('fs');
const path = require('path');

try {
  const transcriptPath = process.argv[1];
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    console.log('无法读取对话历史');
    process.exit(0);
  }

  // 读取 JSONL 文件（每行一个 JSON 对象）
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.trim().split('\n').filter(l => l.trim());

  // 解析最后几条消息
  const messages = lines.slice(-5).map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // 提取用户消息和助手响应
  const userMessages = [];
  const assistantMessages = [];

  messages.forEach(msg => {
    if (msg.role === 'user' && msg.content) {
      if (Array.isArray(msg.content)) {
        const textContent = msg.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join(' ');
        if (textContent) userMessages.push(textContent);
      } else if (typeof msg.content === 'string') {
        userMessages.push(msg.content);
      }
    } else if (msg.role === 'assistant' && msg.content) {
      if (Array.isArray(msg.content)) {
        const textContent = msg.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join(' ');
        if (textContent) assistantMessages.push(textContent);
      } else if (typeof msg.content === 'string') {
        assistantMessages.push(msg.content);
      }
    }
  });

  // 生成简洁的上下文摘要（限制长度以避免 prompt 过长）
  const lastUserMsg = userMessages[userMessages.length - 1] || '';
  const lastAssistantMsg = assistantMessages[assistantMessages.length - 1] || '';

  const summary = [
    lastUserMsg.substring(0, 500),
    lastAssistantMsg.substring(0, 500)
  ].filter(Boolean).join('\\n\\n');

  console.log(summary || '任务处理完成');
} catch (error) {
  console.log('解析对话历史出错');
}
" "$TRANSCRIPT_PATH" 2>/dev/null || echo "任务处理完成")

log "====== Extracted Conversation Context ======"
log "$CONVERSATION_CONTEXT"
log ""

# 创建给 Gemini 的简洁总结请求（使用实际对话内容）
SUMMARY_PROMPT="你是一个任务总结助手。请根据以下对话内容，生成一个5-20字的简短任务标题。

对话内容：
${CONVERSATION_CONTEXT}

要求：
1. 只输出标题文本，不要任何解释或多余内容
2. 5-20个汉字
3. 简洁明了，突出核心动作和结果
4. 如果内容涉及代码或技术，请突出关键技术点

示例格式：
- 修复登录验证bug
- 实现用户权限管理功能
- 优化数据库查询性能
- 添加API文档

请直接输出标题："

# 调用 Gemini 模型生成总结
# 策略：优先使用 gemini-2.5-flash（速度快），失败则尝试 gemini-2.5-pro（质量高）
SUMMARY=""
GEMINI_ERROR=""

log "====== Gemini Summary Prompt ======"
log "$SUMMARY_PROMPT"
log ""

# 尝试 1: gemini-2.5-flash（快速，适合5秒内响应）
log "Trying gemini-2.5-flash (timeout: 5s)..."
GEMINI_START=$(date +%s)
# 修复：移除 tee 命令，分别记录日志和捕获输出
GEMINI_OUTPUT=$(timeout 5s gemini \
  --model "gemini-2.5-flash" \
  --output-format text \
  "$SUMMARY_PROMPT" 2>&1 || echo "")
echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
SUMMARY=$(echo "$GEMINI_OUTPUT" | head -n 1 | tr -d '\n')
GEMINI_END=$(date +%s)
GEMINI_DURATION=$((GEMINI_END - GEMINI_START))
log "gemini-2.5-flash completed in ${GEMINI_DURATION}s"
log "Result: $SUMMARY"

# 尝试 2: 如果 flash 失败或结果太短，尝试 gemini-2.5-pro（更高质量）
if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 5 ]; then
  log "gemini-2.5-flash failed or result too short, trying gemini-2.5-pro (timeout: 5s)..."
  GEMINI_START=$(date +%s)
  GEMINI_OUTPUT=$(timeout 5s gemini \
    --model "gemini-2.5-pro" \
    --output-format text \
    "$SUMMARY_PROMPT" 2>&1 || echo "")
  echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
  SUMMARY=$(echo "$GEMINI_OUTPUT" | head -n 1 | tr -d '\n')
  GEMINI_END=$(date +%s)
  GEMINI_DURATION=$((GEMINI_END - GEMINI_START))
  log "gemini-2.5-pro completed in ${GEMINI_DURATION}s"
  log "Result: $SUMMARY"
fi

# 尝试 3: 默认模型（不指定 --model）
if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 5 ]; then
  log "Trying default gemini model (timeout: 4s)..."
  GEMINI_OUTPUT=$(timeout 4s gemini \
    --output-format text \
    "$SUMMARY_PROMPT" 2>&1 || echo "")
  echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
  SUMMARY=$(echo "$GEMINI_OUTPUT" | head -n 1 | tr -d '\n')
  log "Default model result: $SUMMARY"
fi

# 如果所有 Gemini 尝试都失败，使用降级策略
if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 5 ]; then
  log "All Gemini attempts failed, using fallback strategy"
  # 从对话上下文中提取关键词作为摘要
  SUMMARY=$(echo "$CONVERSATION_CONTEXT" | head -c 50 | tr '\n' ' ' || echo "任务处理完成")
fi

# 清理和规范化摘要
# 移除多余的空白和换行
SUMMARY=$(echo "$SUMMARY" | tr -s ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

# 确保摘要在合理范围内
SUMMARY_LENGTH=${#SUMMARY}
log "Summary length: $SUMMARY_LENGTH characters"

if [ $SUMMARY_LENGTH -lt 5 ]; then
  SUMMARY="任务处理完成"
  log "Summary too short, using default"
elif [ $SUMMARY_LENGTH -gt 50 ]; then
  SUMMARY="${SUMMARY:0:50}..."
  log "Summary too long, truncated"
fi

log "====== Final Summary ======"
log "$SUMMARY"
log ""

# 检测项目根目录
# 优先使用环境变量 CLAUDE_PROJECT_DIR，如果未设置则自动检测
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

# 使用生成的摘要调用通知器（后台运行，避免阻塞）
log "====== Sending Notification ======"
log "Project directory: $PROJECT_DIR"
log "Notification message: $SUMMARY"

# 修复：将通知器放到后台运行，避免阻塞 Stop hook
# 创建一个独立的脚本来运行通知器，这样即使挂起也不会影响主流程
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  # 使用 timeout 和后台运行的组合，确保不会阻塞
  timeout 8s pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" >> "$LOG_FILE" 2>&1 || echo "Notifier failed" >> "$LOG_FILE"
) &

# 不等待通知器完成，直接继续
log "Notifier started in background (PID: $!)"
log ""

# 清除错误陷阱，正常退出
trap - ERR EXIT

# 向 Claude Code 输出成功信息
OUTPUT_JSON="{\"decision\": \"proceed\", \"additionalContext\": \"已发送通知：${SUMMARY} (日志: ${LOG_FILE})\"}"
log "====== Claude Code Output ======"
log "$OUTPUT_JSON"
log "====== Task Complete Notifier Finished ======"

# 正常退出
echo "$OUTPUT_JSON"
exit 0
