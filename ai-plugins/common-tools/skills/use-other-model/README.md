# Use Other Model Skill

## 概述

`use-other-model` 技能教会 Claude Code 主代理如何智能地驱动其他 AI 模型（如 MiniMax、Gemini）来完成任务，实现 **50-80% 的 token 节省**。

## 核心价值

- 💰 **显著降低成本**：复杂任务可节省 50-80% token
- 🎯 **智能决策**：自动评估任务是否适合委托
- 🔧 **两种方案**：根据任务复杂度选择最优方案
- 📝 **完整实现**：包含详细的技术细节和代码模板
- 🔒 **安全可靠**：提供安全最佳实践和风险控制

## 适用场景

### ✅ 强烈推荐使用

- 批量文件处理（10+ 文件）
- 多个独立的 git 提交（4+ 个）
- 执行时间超过 5 分钟的任务
- 批量重复操作
- 可并行的独立任务

### ❌ 不推荐使用

- 单文件编辑
- 执行时间 < 1 分钟的任务
- 需要深度理解业务逻辑的任务
- 需要实时用户交互的任务

## 两种实现方案

### 方案 A：MCP 工具（简单任务）

- **适用**：单次调用、简单任务、执行时间 < 2 分钟
- **Token 节省**：20-40%
- **实现复杂度**：低
- **工具**：`mcp__MiniMax__*`、`mcp__gemini__gemini`

### 方案 B：独立 Claude Code 会话（复杂任务）

- **适用**：多步骤、批量操作、执行时间 > 5 分钟
- **Token 节省**：50-80%
- **实现复杂度**：中
- **核心技术**：
  - 绕过嵌套检查（`unset CLAUDECODE`）
  - Bash 后台任务（`run_in_background: true`）
  - 文件通信（执行计划 + 执行日志）
  - Heredoc 任务传递

## 实际案例

### 案例：批量 Git 提交

**任务**：创建 4 个独立的 git 提交

**方案 B 执行结果**：

- ✅ 成功完成 4 个提交
- ⏱️ 执行时间：3 分 24 秒
- 💰 Token 使用：主会话 5,200 + 子会话 8,500 = 13,700
- 📊 Token 节省：约 65%（相比直接执行预计 39,000 tokens）

## 技能结构

```plain
use-other-model/
├── SKILL.md              # 主技能文件（完整实现细节）
├── README.md             # 本文件
└── evals/
    └── evals.json        # 测试用例
```

## 快速开始

### 1. 安装技能

将 `use-other-model` 目录复制到您的 Claude Code 技能目录。

### 2. 配置 API

准备以下配置信息：

**MiniMax**：

- `ANTHROPIC_AUTH_TOKEN`：您的 MiniMax API 密钥
- `ANTHROPIC_BASE_URL`：`https://api.minimaxi.com/anthropic`
- `ANTHROPIC_MODEL`：`MiniMax-M2.5-highspeed` 或 `MiniMax-M2.5-pro`

**Gemini**：

- 使用 Gemini MCP 工具，无需额外配置

### 3. 使用技能

当您遇到以下情况时，技能会自动触发：

- 用户提及"使用其他模型"、"节省 token"
- 批量操作、多文件处理
- 执行时间超过 5 分钟的任务

或者手动调用：

```plain
/use-other-model
```

## 安全注意事项

⚠️ **重要**：

1. **API 密钥保护**：
   - 不要在 prompt 中包含 API 密钥
   - 使用环境变量或 `.env` 文件管理配置
   - 执行完成后立即删除包含密钥的脚本文件

2. **输出验证**：
   - 始终验证其他模型的输出质量
   - 对关键代码进行人工审查

3. **权限控制**：
   - 使用 `--dangerously-skip-permissions` 时要特别小心
   - 在执行计划中明确限制子会话的操作范围

## 技术参考

- [技术报告：驱动 MiniMax 模型](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-driving-minimax-model-technical-report.md)
- [Token 节省分析](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-token-savings-analysis.md)
- [Claude Code 官方文档](https://code.claude.com/docs)
- [MCP 服务器配置](https://modelcontextprotocol.io/)

## 版本历史

### v0.2.0 (2026-03-04)

**重大更新**：

- ✨ **新增方案 B**：独立 Claude Code 会话驱动方案
  - 完整的技术实现细节（绕过嵌套检查、Bash 后台任务、文件通信）
  - 7 步完整实施流程
  - 4 个可直接使用的代码模板

- 📊 **添加详细案例分析**：
  - 批量 Git 提交实战案例
  - 完整的执行计划和启动脚本
  - 实际 token 使用对比（节省 65%）

- 📝 **补充完整文档**：
  - 方案对比表和选择建议
  - 架构图和工作流程图
  - 潜在风险与限制说明

- 🔒 **增强安全性**：
  - API 密钥保护方案
  - 执行后自动清理机制
  - 权限控制建议

- ❓ **扩展常见问题**：
  - 从 4 个问题扩展到 10 个问题
  - 涵盖方案选择、配置管理、调试方法、安全实践

- 📚 **添加核心参考资料**：
  - 技术报告：驱动 MiniMax 模型的完整方案
  - Token 节省分析报告

### v0.1.0 (2026-03-04)

**初始版本**：

- 🎉 创建 `use-other-model` 技能
- 🔧 支持方案 A（MCP 工具）：
  - MiniMax MCP Server 集成
  - Gemini MCP Server 集成
- 📊 基础决策流程和成本收益分析
- 📝 3 个测试用例

---

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
