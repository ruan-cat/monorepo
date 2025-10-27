# Claude Code 配置文档

本文档说明如何在 Claude Code 的配置文件中使用 hooks 集成通知工具。

## 配置文件位置

Claude Code 的配置文件位置：

```plain
Windows: %USERPROFILE%\.claude\settings.json
macOS/Linux: ~/.claude/settings.json
```

## 完整配置示例

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --message \"Claude Code 任务已完成\""
					}
				]
			}
		],
		"SessionStart": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier long-task --task-description \"Claude 会话\" &"
					}
				]
			}
		],
		"SessionEnd": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier long-task --stop"
					}
				]
			}
		]
	}
}
```

## Hook 类型详解

### 1. Stop - 任务完成的通知

当 Claude 完成任务时触发，发送完成通知。

**配置示例**：

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --message \"任务完成\" --sound success"
					}
				]
			}
		]
	}
}
```

**进阶示例**：

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --title \"Claude Code\" --message \"执行完成\" --sound manbo --icon success"
					}
				]
			}
		]
	}
}
```

### 2. SessionStart - 会话启动

当 Claude Code 会话启动时触发，可用于启动长任务监控。

**配置示例**：

```json
{
	"hooks": {
		"SessionStart": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier long-task --intervals \"10,20,30\" --task-description \"Claude 会话\" &"
					}
				]
			}
		]
	}
}
```

**注意事项**：

- 命令末尾加 `&` 符号让定时器在后台运行
- 定时器会在周期性时间间隔发送提醒会话
- 需要在 SessionEnd 中停止定时器

### 3. SessionEnd - 会话结束

当 Claude Code 会话结束时触发，用于停止长任务定时器。

**配置示例**：

```json
{
	"hooks": {
		"SessionEnd": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier long-task --stop"
					}
				]
			}
		]
	}
}
```

### 4. PreToolUse - 工具使用前

在 Claude 使用工具前（如 Read、Write）触发。

**配置示例**：

```json
{
	"hooks": {
		"PreToolUse": [
			{
				"matcher": "tool.name == 'Write'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --message \"开始写入文件\" --sound default --icon info"
					}
				]
			}
		]
	}
}
```

### 5. PostToolUse - 工具使用后

在 Claude 使用工具后触发。

**配置示例**：

```json
{
	"hooks": {
		"PostToolUse": [
			{
				"matcher": "tool.name == 'Bash' && tool.status == 'error'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier error --message \"命令执行失败\" --sound error"
					}
				]
			}
		]
	}
}
```

## Matcher 语法

### 操作系统匹配

```json
"matcher": "os == 'windows'"  // 仅 Windows
"matcher": "os == 'darwin'"   // 仅 macOS
"matcher": "os == 'linux'"    // 仅 Linux
```

### 工具匹配

```json
"matcher": "tool.name == 'Write'"         // Write 工具
"matcher": "tool.name == 'Bash'"          // Bash 工具
"matcher": "tool.status == 'success'"     // 工具执行成功
"matcher": "tool.status == 'error'"       // 工具执行失败
```

### 组合匹配

```json
"matcher": "os == 'windows' && tool.name == 'Bash'"
"matcher": "os == 'windows' || os == 'linux'"
```

## 使用配置模板

### 模板 1：基础会话通知

最简单的配置，仅在任务完成时通知：

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete"
					}
				]
			}
		]
	}
}
```

### 模板 2：完整监控

包含任务完成、长任务监控：

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --sound success"
					}
				]
			}
		],
		"SessionStart": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier long-task --intervals \"6,10,18,25,45\" &"
					}
				]
			}
		],
		"SessionEnd": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier long-task --stop"
					}
				]
			}
		]
	}
}
```

### 模板 3：错误监控

监控工具执行错误：

```json
{
	"hooks": {
		"PostToolUse": [
			{
				"matcher": "tool.status == 'error'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier error --message \"工具执行失败\" --error-details \"${tool.name} 执行出错\""
					}
				]
			}
		]
	}
}
```

### 模板 4：特定工具的通知

仅在特定工具执行成功时通知：

```json
{
	"hooks": {
		"PostToolUse": [
			{
				"matcher": "tool.name == 'Bash' && tool.status == 'success'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --message \"命令执行成功\" --sound default"
					}
				]
			}
		]
	}
}
```

## 错误排查指南

### 1. 测试配置是否生效

保存 Claude Code 配置文件后，重启当前会话即可生效。可以先手动测试命令：

```bash
# 测试命令是否可以正常运行
npx @ruan-cat/claude-notifier task-complete --message "测试通知"
```

### 2. 查看 Hook 执行日志

Claude Code 的输出窗口会显示 hook 执行情况：

```plain
[Hook] Executing: npx @ruan-cat/claude-notifier task-complete
[Hook] ✓ 任务完成通知已发送
```

### 3. 常见问题

**问题 1：通知没有生效**

- 检查 `matcher` 条件是否正确
- 确保操作系统匹配（Windows 使用 `os == 'windows'`）
- 重启 Claude Code

**问题 2：命令执行超时**

- Claude Code hooks 默认 60 秒超时
- 确保命令在 60 秒内完成
- 长任务使用后台方式（在命令末尾加 `&`）

**问题 3：转义字符问题**

- JSON 中使用 `\"` 转义双引号
- 或使用单引号字符串：`--message '任务完成'`

**问题 4：npx 下载过慢**

- 预先全局安装包：`npm install -g @ruan-cat/claude-notifier`
- 然后直接使用：`claude-notifier task-complete`

## 最佳实践

### 1. 避免 Hook 执行阻塞

保持长任务在后台运行的通知：

```json
// 不推荐：可能会阻塞其他通知
{
	"PostToolUse": [
		{
			"matcher": "true",
			"hooks": [...]
		}
	]
}

// 推荐：仅在特定条件下触发
{
	"PostToolUse": [
		{
			"matcher": "tool.name == 'Bash' && tool.status == 'error'",
			"hooks": [...]
		}
	]
}
```

### 2. 使用全局安装

保持命令执行更快的响应：

```bash
# 全局安装
npm install -g @ruan-cat/claude-notifier

# 配置中使用
{
	"command": "claude-notifier task-complete"
}
```

### 3. 合理设置提醒间隔

不建议使用过短的提醒间隔：

```json
// 不推荐：过于频繁
"--intervals \"1,2,3,4,5\""

// 推荐：合理的间隔
"--intervals \"6,10,18,25,45\""
```

## 高级用法

### 条件通知

根据不同情况发送不同的通知：

```json
{
	"hooks": {
		"PostToolUse": [
			{
				"matcher": "tool.name == 'Bash' && tool.status == 'success'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --sound success"
					}
				]
			},
			{
				"matcher": "tool.name == 'Bash' && tool.status == 'error'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier error --sound error"
					}
				]
			}
		]
	}
}
```

### 会话的组合操作

在一个 hook 中执行多个命令：

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete && echo 'Task completed' >> log.txt"
					}
				]
			}
		]
	}
}
```

## 相关文档

- 参考 [CLI 使用文档](./cli.md) 了解所有命令的使用方式
- 参考 [API 使用文档](./api.md) 了解编程方式使用
- 参考 [资源添加指南](../how-to-add-assets.md) 了解自定义音频和图标

## 外部资源

- [Claude Code Hooks 官方文档](https://docs.claude.com/en/docs/claude-code/hooks.md)
- [Claude Code Hooks 指南](https://docs.claude.com/en/docs/claude-code/hooks-guide.md)
