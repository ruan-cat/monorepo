#!/bin/bash
# Claude Code 任务完成通知器（集成 Gemini 总结功能）
# 当 Claude Code 任务完成时触发此钩子，使用 Gemini 生成简洁摘要
# 依赖：Node.js（monorepo 中已有）、Gemini CLI

set -euo pipefail

# 从标准输入读取钩子上下文数据
HOOK_DATA=$(cat)

# 使用 Node.js 从钩子数据中提取任务描述（无需 jq 依赖）
TASK_DESCRIPTION=$(echo "$HOOK_DATA" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.tool_input?.description || '任务');
" 2>/dev/null || echo "任务")

TASK_PROMPT=$(echo "$HOOK_DATA" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.tool_input?.prompt || '');
" 2>/dev/null || echo "")

# 创建给 Gemini 的简洁总结请求
SUMMARY_PROMPT="请将以下任务总结为5-20字的简短标题，只输出标题文本，不要其他内容：

任务描述：${TASK_DESCRIPTION}
${TASK_PROMPT:+详细内容：$TASK_PROMPT}

要求：
1. 只输出标题，不要解释
2. 5-20个汉字
3. 简洁明了，突出核心动作"

# 调用 Gemini 快速模型（兼顾速度和稳定性）
# 尝试多个模型名称，确保兼容性
# 5 秒超时以确保快速响应
SUMMARY=""

# 尝试 1: gemini-2.5-flash
if [ -z "$SUMMARY" ]; then
  SUMMARY=$(timeout 5s gemini \
    --model "gemini-2.5-flash" \
    --output-format text \
    "$SUMMARY_PROMPT" 2>/dev/null | head -n 1 | tr -d '\n' || echo "")
fi

# 尝试 2: 默认模型（不指定 --model）
if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 3 ]; then
  SUMMARY=$(timeout 5s gemini \
    --output-format text \
    "$SUMMARY_PROMPT" 2>/dev/null | head -n 1 | tr -d '\n' || echo "")
fi

# 尝试 3: 使用位置参数语法
if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 3 ]; then
  SUMMARY=$(timeout 5s gemini "$SUMMARY_PROMPT" 2>/dev/null | head -n 1 | tr -d '\n' || echo "")
fi

# 如果 Gemini 失败或超时，使用降级策略
if [ -z "$SUMMARY" ] || [ ${#SUMMARY} -lt 3 ]; then
  SUMMARY="${TASK_DESCRIPTION:0:20}"
fi

# 确保摘要在 5-20 字符范围内
SUMMARY_LENGTH=${#SUMMARY}
if [ $SUMMARY_LENGTH -lt 5 ]; then
  SUMMARY="${SUMMARY}已完成"
elif [ $SUMMARY_LENGTH -gt 20 ]; then
  SUMMARY="${SUMMARY:0:20}..."
fi

# 使用生成的摘要调用通知器
cd "$CLAUDE_PROJECT_DIR"
pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY"

# 向 Claude Code 输出成功信息
echo "{\"decision\": \"proceed\", \"additionalContext\": \"已发送通知：${SUMMARY}\"}"
exit 0
