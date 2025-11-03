# Claude Code 配置文档

本文档说明如何在 Claude Code 的配置文件中使用 hooks 集成通知工具。

## 配置文件位置

Claude Code 的配置文件位置：

```plain
Windows: %USERPROFILE%\.claude\settings.json
macOS/Linux: ~/.claude/settings.json
```

## 推荐配置（使用 check-and-notify）

**最简配置**：自动管理长任务通知

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier check-and-notify"
					},
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --message \"任务完成\""
					}
				]
			}
		],
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

**工作机制**：

- `check-and-notify` 从 stdin 读取 hook 数据（cwd、hook_event_name 等）
- **SessionStart**: 跳过通知，避免会话启动时的干扰
- **UserPromptSubmit**: 无条件删除旧任务并创建新任务，确保每次用户输入都重新计时
- **SessionEnd**: 删除任务，不做通知，确保会话结束时清理任务
- **Stop/SubagentStop**: 删除任务（当 stop_hook_active=true 时）
- **其他事件**: 检查任务，到达时间点时自动通知（默认：6, 10, 18, 25, 45 分钟）
- 通知文本精确显示"X 分 Y 秒"，标题显示阶段（如"长任务提醒：6 分钟阶段"）
- 基于 cwd 区分任务，支持多工作目录同时运行
- 自动清理超过 8 小时的过期任务
- 防止重复通知（lastCheckTime 立即保存，10 秒内不重复检查）

## 完整配置示例（旧版，仍然可用）

如果你想手动管理长任务定时器（不推荐），可以使用这个配置：

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
		]
	}
}
```

**注意**：旧版的 `long-task` 命令已改为基于 session_id 的管理方式，不再使用后台进程。推荐使用 `check-and-notify` 命令。

## check-and-notify 命令详解

`check-and-notify` 是一个专为 Claude Code hooks 设计的高频调用命令，提供自动化的长任务管理。

### 核心功能

1. **智能事件处理**：根据 `hook_event_name` 自动决定操作
   - SessionStart: 跳过通知
   - UserPromptSubmit: 无条件删除旧任务并创建新任务
   - SessionEnd: 删除任务
   - Stop/SubagentStop: 删除任务
   - 其他事件: 检查并通知
2. **基于 cwd 管理**：使用当前工作目录区分不同任务
3. **精确时间计算**：通知显示"X 分 Y 秒"格式的精确时间差
4. **清理过期任务**：自动删除超过 8 小时的任务
5. **防重复通知**：lastCheckTime 立即保存，10 秒内不会重复检查同一任务

### 使用示例

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

### 命令选项

```bash
# 静默模式（默认）
npx @ruan-cat/claude-notifier check-and-notify

# 查看详细日志
npx @ruan-cat/claude-notifier check-and-notify --verbose

# 禁用自动清理过期任务
npx @ruan-cat/claude-notifier check-and-notify --no-cleanup

# 禁用自动创建新任务
npx @ruan-cat/claude-notifier check-and-notify --no-auto-create
```

### 工作流程

```plain
1. Hook 触发 → 从 stdin 读取 cwd, hook_event_name, stop_hook_active
2. 根据 hook_event_name 智能处理：
   - SessionStart: 跳过通知 → 结束
   - UserPromptSubmit: 无条件删除旧任务并创建新任务 → 结束
   - SessionEnd: 删除任务 → 结束
   - Stop/SubagentStop (stop_hook_active=true): 删除任务 → 结束
   - 其他事件: 继续后续流程
3. 清理过期任务（超过 8 小时）
4. 检查并通知：
   - 检查是否距离上次检查太近（10秒内）
   - 立即更新并保存 lastCheckTime（防止重复通知）
   - 遍历所有任务，检查是否到提醒时间
   - 发送精确时间差通知（"X分Y秒"，标题显示阶段）
```

### 适用场景

- ✅ 多个工作目录（cwd）同时运行独立任务
- ✅ 长时间运行的会话需要定时提醒
- ✅ 自动化管理，根据 hook 事件智能处理
- ✅ 精确的时间差显示（分钟+秒）
- ✅ 防止状态文件无限增长

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

### 2. BeforeToolUse - 工具使用前（推荐用于 check-and-notify）

在 Claude 使用工具前触发，是 `check-and-notify` 的理想触发点。

**推荐配置**：

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

**为什么推荐使用 BeforeToolUse**：

- 高频触发，确保及时检查任务状态
- 自动从 stdin 获取 session_id
- 不会阻塞其他操作（快速返回）

### 3. AfterToolUse - 工具使用后

在 Claude 使用工具后触发，也可用于 `check-and-notify`。

**配置示例**：

```json
{
	"hooks": {
		"AfterToolUse": [
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
