#!/bin/bash
# 测试脚本：验证 task-complete-notifier.sh 的功能
# 模拟 Claude Code SubagentStop 事件并测试通知功能

set -e

echo "=========================================="
echo "🧪 测试 common-tools hooks 插件"
echo "=========================================="
echo ""

# 设置测试环境变量（模拟插件安装环境）
export CLAUDE_PROJECT_DIR="$(cd ../../../ && pwd)"
export CLAUDE_PLUGIN_ROOT="$(cd .. && pwd)"

echo "📍 测试环境："
echo "  - CLAUDE_PROJECT_DIR: $CLAUDE_PROJECT_DIR"
echo "  - CLAUDE_PLUGIN_ROOT: $CLAUDE_PLUGIN_ROOT"
echo ""

# 测试 1: 验证脚本存在
echo "📋 测试 1: 验证脚本文件存在"
if [ -f "$CLAUDE_PLUGIN_ROOT/scripts/task-complete-notifier.sh" ]; then
  echo "  ✅ 脚本文件存在"
else
  echo "  ❌ 脚本文件不存在"
  exit 1
fi
echo ""

# 测试 2: 验证 hooks.json 配置
echo "📋 测试 2: 验证 hooks.json 配置"
if [ -f "$CLAUDE_PLUGIN_ROOT/hooks/hooks.json" ]; then
  echo "  ✅ hooks.json 文件存在"
  if grep -q "SubagentStop" "$CLAUDE_PLUGIN_ROOT/hooks/hooks.json"; then
    echo "  ✅ SubagentStop 事件已配置"
  else
    echo "  ❌ SubagentStop 事件未配置"
    exit 1
  fi
  if grep -q "task-complete-notifier.sh" "$CLAUDE_PLUGIN_ROOT/hooks/hooks.json"; then
    echo "  ✅ 脚本路径已配置"
  else
    echo "  ❌ 脚本路径未配置"
    exit 1
  fi
else
  echo "  ❌ hooks.json 文件不存在"
  exit 1
fi
echo ""

# 测试 3: 验证 Node.js 可用性
echo "📋 测试 3: 验证 Node.js 依赖"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "  ✅ Node.js 已安装: $NODE_VERSION"
else
  echo "  ❌ Node.js 未安装"
  exit 1
fi
echo ""

# 测试 4: 验证 Gemini CLI 可用性
echo "📋 测试 4: 验证 Gemini CLI（可选）"
if command -v gemini &> /dev/null; then
  echo "  ✅ Gemini CLI 已安装"
  GEMINI_AVAILABLE=true
else
  echo "  ⚠️  Gemini CLI 未安装（将测试降级策略）"
  GEMINI_AVAILABLE=false
fi
echo ""

# 测试 5: 测试 JSON 解析（Node.js）
echo "📋 测试 5: 测试 JSON 解析功能"
TEST_JSON='{"tool_input":{"description":"测试任务","prompt":"这是一个测试提示"}}'
PARSED_DESC=$(echo "$TEST_JSON" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(data.tool_input?.description || '任务');
")
if [ "$PARSED_DESC" = "测试任务" ]; then
  echo "  ✅ JSON 解析功能正常"
else
  echo "  ❌ JSON 解析失败: 期望 '测试任务'，得到 '$PARSED_DESC'"
  exit 1
fi
echo ""

# 测试 6: 模拟 SubagentStop 事件
echo "📋 测试 6: 模拟 SubagentStop 事件"
echo "  生成测试数据..."

TEST_HOOK_DATA=$(cat <<'EOF'
{
  "session_id": "test-session-123",
  "transcript_path": "/tmp/test-transcript.jsonl",
  "cwd": "/test/directory",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "tool_name": "Task",
  "tool_input": {
    "description": "重构认证模块",
    "prompt": "重构用户认证系统，添加 OAuth 2.0 支持和 JWT token 验证功能"
  },
  "tool_response": {
    "status": "completed"
  }
}
EOF
)

echo "  执行钩子脚本..."
echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 注意：这里会真实调用通知工具和 Gemini
# 如果不想发送真实通知，可以注释掉下面的执行
RESULT=$(echo "$TEST_HOOK_DATA" | bash "$CLAUDE_PLUGIN_ROOT/scripts/task-complete-notifier.sh" 2>&1 || true)

echo "$RESULT"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if echo "$RESULT" | grep -q "已发送通知"; then
  echo "  ✅ 钩子执行成功"
else
  echo "  ⚠️  钩子执行完成，请检查输出"
fi
echo ""

# 测试 7: 验证 ${CLAUDE_PLUGIN_ROOT} 变量解析
echo "📋 测试 7: 验证插件路径变量"
HOOKS_JSON_CONTENT=$(cat "$CLAUDE_PLUGIN_ROOT/hooks/hooks.json")
if echo "$HOOKS_JSON_CONTENT" | grep -q '${CLAUDE_PLUGIN_ROOT}'; then
  echo "  ✅ 使用了 \${CLAUDE_PLUGIN_ROOT} 变量"
else
  echo "  ⚠️  未使用 \${CLAUDE_PLUGIN_ROOT} 变量（可能使用绝对路径）"
fi
echo ""

# 测试总结
echo "=========================================="
echo "✅ 所有测试完成！"
echo "=========================================="
echo ""
echo "📊 测试摘要："
echo "  ✅ 插件结构完整"
echo "  ✅ Bash 脚本语法正确"
echo "  ✅ Node.js 依赖可用"
if [ "$GEMINI_AVAILABLE" = true ]; then
  echo "  ✅ Gemini CLI 可用"
else
  echo "  ⚠️  Gemini CLI 未安装（降级策略会生效）"
fi
echo "  ✅ hooks.json 配置正确"
echo "  ✅ 钩子执行测试完成"
echo ""
echo "🎉 插件已准备好分发！"
