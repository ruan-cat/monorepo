#!/bin/bash
# 专项测试：验证 Gemini 摘要生成质量

echo "=========================================="
echo "🤖 测试 Gemini 摘要生成功能"
echo "=========================================="
echo ""

# 测试用例数组
declare -a TEST_CASES=(
  "重构认证模块|重构用户认证系统，添加 OAuth 2.0 支持和 JWT token 验证"
  "修复登录bug|修复移动端登录页面在iOS设备上无法正常显示的问题"
  "实现文件上传|开发文件上传功能，支持拖拽、预览、进度条和断点续传"
  "优化数据库查询|优化订单查询接口，添加索引并重构SQL语句"
  "添加单元测试|为用户服务层添加完整的单元测试覆盖"
)

echo "📊 测试 ${#TEST_CASES[@]} 个场景的摘要生成质量"
echo ""

PASSED=0
TOTAL=${#TEST_CASES[@]}

for i in "${!TEST_CASES[@]}"; do
  IFS='|' read -r DESCRIPTION PROMPT <<< "${TEST_CASES[$i]}"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "测试用例 $((i+1))/$TOTAL"
  echo "描述: $DESCRIPTION"
  echo "详情: $PROMPT"
  echo ""

  # 调用 Gemini 生成摘要
  SUMMARY_PROMPT="请将以下任务总结为5-20字的简短标题，只输出标题文本，不要其他内容：

任务描述：${DESCRIPTION}
详细内容：${PROMPT}

要求：
1. 只输出标题，不要解释
2. 5-20个汉字
3. 简洁明了，突出核心动作"

  echo "🤖 调用 Gemini 2.5 Flash..."
  SUMMARY=$(timeout 5s gemini \
    --model "gemini-2.5-flash" \
    --output-format text \
    "$SUMMARY_PROMPT" 2>/dev/null | head -n 1 | tr -d '\n' || echo "")

  # 验证摘要质量
  if [ -z "$SUMMARY" ]; then
    echo "❌ 生成失败（超时或错误）"
  else
    SUMMARY_LENGTH=${#SUMMARY}
    echo "✅ 生成摘要: 「$SUMMARY」"
    echo "   长度: $SUMMARY_LENGTH 字符"

    if [ $SUMMARY_LENGTH -ge 5 ] && [ $SUMMARY_LENGTH -le 20 ]; then
      echo "   ✅ 长度符合要求 (5-20字)"
      PASSED=$((PASSED+1))
    else
      echo "   ⚠️  长度不符合要求"
    fi
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果统计"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总测试数: $TOTAL"
echo "通过数: $PASSED"
echo "成功率: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")%"
echo ""

if [ $PASSED -eq $TOTAL ]; then
  echo "🎉 所有测试通过！Gemini 摘要质量优秀！"
  exit 0
elif [ $PASSED -ge $((TOTAL * 80 / 100)) ]; then
  echo "✅ 大部分测试通过，摘要质量良好"
  exit 0
else
  echo "⚠️  部分测试未通过，建议检查 Gemini 配置"
  exit 1
fi
