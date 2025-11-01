# Claude Code 任务完成通知 Hooks

## 功能说明

这个 hooks 集合提供了两种任务完成通知方式：

### 1. 简单通知（Stop 事件）

当 Claude Code 完全停止时，发送简单的任务完成通知。

### 2. 智能通知（SubagentStop 事件）⭐ 推荐

当 Claude Code 子任务完成时：

1. 自动提取任务上下文
2. 调用 **Gemini 2.5 Flash** 快速生成 5-20 字的简洁摘要
3. 发送包含智能摘要的通知

## 依赖要求

### 必需依赖

- **@ruan-cat/claude-notifier**：通知工具（自动通过 `pnpm dlx` 安装）
- **Node.js**：用于 JSON 解析（monorepo 项目必备）

### 可选依赖

- **Gemini CLI**：启用智能摘要功能
  - 安装：`npm install -g @google/generative-ai-cli`
  - 如果未安装，会降级使用任务描述作为通知标题

## 技术特性

### 智能摘要脚本 (`scripts/task-complete-notifier.sh`)

- ✅ **无 jq 依赖**：使用 Node.js 解析 JSON
- ✅ **快速响应**：5 秒超时保证及时通知
- ✅ **稳定模型**：使用 `gemini-2.5-flash` 正式版
- ✅ **降级策略**：Gemini 失败时自动使用任务描述
- ✅ **中文注释**：便于阅读和维护

### Hook 配置

```json
{
	"SubagentStop": [
		{
			"hooks": [
				{
					"type": "command",
					"command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh",
					"timeout": 10
				}
			]
		}
	]
}
```

**关键变量**：

- `${CLAUDE_PLUGIN_ROOT}`：自动解析为插件安装路径，确保跨环境兼容

## 工作流程

```plain
用户任务 → Claude Code 执行
    ↓
SubagentStop 事件触发
    ↓
执行 task-complete-notifier.sh
    ↓
提取任务上下文 (Node.js)
    ↓
调用 Gemini 2.5 Flash (5秒超时)
    ↓
生成 5-20 字摘要
    ↓
发送通知 (@ruan-cat/claude-notifier)
```

## 通知示例

| 任务类型 | 原始描述                                                 | Gemini 摘要              |
| -------- | -------------------------------------------------------- | ------------------------ |
| 代码重构 | "重构用户认证系统，添加 OAuth 2.0 支持和 JWT token 验证" | "重构认证模块增加 OAuth" |
| Bug 修复 | "修复登录页面在移动端显示错误的问题"                     | "修复移动端登录显示"     |
| 功能开发 | "实现文件上传功能，支持拖拽和进度显示"                   | "实现文件上传功能"       |

## 故障排查

### 通知未发送

1. 检查 `@ruan-cat/claude-notifier` 是否正常工作
2. 查看终端输出是否有错误信息

### Gemini 摘要失败

1. 检查 Gemini CLI 是否已安装：`gemini --version`
2. 验证 API 密钥配置是否正确
3. 如果失败，脚本会自动降级使用任务描述

### 脚本执行超时

- 默认超时 10 秒（包含 Gemini 5 秒超时）
- 如需调整，修改 `hooks.json` 中的 `timeout` 值

## 版本历史

- **v0.3.0**：新增智能摘要功能，集成 Gemini 2.5 Flash
- **v0.2.0**：添加 SubagentStop 事件支持
- **v0.1.0**：基础通知功能
