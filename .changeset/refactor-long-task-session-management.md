---
"@ruan-cat/claude-notifier": minor
---

# 重构长任务管理系统，支持多会话管理

## 🎉 新功能

### 新增 `check-and-notify` 命令

专为 Claude Code hooks 设计的高频调用命令，提供自动化的长任务管理。

**核心功能**：

- ✅ 自动创建新会话任务（首次检测到 session_id 时）
- ✅ 自动删除已完成任务（stop_hook_active = true 时）
- ✅ 自动清理过期任务（超过 8 小时）
- ✅ 定时检查并发送到期通知
- ✅ 防重复通知机制（10 秒内不重复检查同一任务）

**推荐配置**（~/.claude/settings.json）：

```json
{
	"hooks": {
		"BeforeToolUse": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier check-and-notify"
					}
				]
			}
		],
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier check-and-notify"
					}
				]
			}
		]
	}
}
```

## 🔧 重构

### `long-task` 命令重构

从单进程后台定时器重构为基于 session_id 的多会话管理系统。

**主要变化**：

- 从 stdin 读取 session_id（支持 Claude Code hooks）
- 支持多个 Claude Code 对话同时运行
- 无后台进程，基于状态文件管理
- 配合 `check-and-notify` 命令使用

**新用法**：

```bash
# 从 stdin 读取 session_id 并注册任务
echo '{"session_id":"my-session"}' | npx @ruan-cat/claude-notifier long-task

# 查看所有会话状态
npx @ruan-cat/claude-notifier long-task --status

# 手动指定 session_id（测试用途）
npx @ruan-cat/claude-notifier long-task --session-id "test-123"
```

## 🐛 修复

- 修复了长任务定时器在实际运行时不生效的问题
- 修复了多个 Claude Code 实例同时运行时的冲突问题
- 修复了定时器状态文件可能无限增长的问题

## 📚 文档更新

- 更新 README.md，说明新的长任务管理机制
- 更新 claude-code.md，添加 check-and-notify 命令的 hooks 配置指南
- 更新 cli.md，详细说明新的命令用法和工作机制

## 💡 升级指南

### 对现有用户的影响

**如果你正在使用旧版的 `long-task` 命令**：

旧的直接调用方式仍然可用，但不推荐：

```bash
# 旧版（不推荐）
npx @ruan-cat/claude-notifier long-task
```

**推荐迁移到新版**：

使用 `check-and-notify` 命令配置到 hooks，实现自动化管理：

```json
{
	"hooks": {
		"BeforeToolUse": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier check-and-notify"
					}
				]
			}
		]
	}
}
```

### 破坏性变更

- `long-task` 命令不再启动后台进程
- `long-task` 需要从 stdin 读取 session_id 或手动指定 --session-id
- 旧的 `--stop` 选项需要配合 session_id 使用

### 兼容性

- ✅ 所有其他命令（task-complete, timeout, error）保持不变
- ✅ 音频和图标预设完全兼容
- ✅ 现有的 hooks 配置可以继续使用

## 🔗 相关资源

- [完整文档](https://ccntf.ruan-cat.com)
- [CLI 使用指南](./src/docs/use/cli.md)
- [Claude Code 集成指南](./src/docs/use/claude-code.md)
