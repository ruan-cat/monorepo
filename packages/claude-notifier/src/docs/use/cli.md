# CLI 使用文档

本文档详细说明完整的命令行使用方法，介绍如何以命令行的形式使用 `@ruan-cat/claude-notifier`。

## 快速开始

### 方式 1：使用 npx（推荐）

无需安装，直接使用：

```bash
npx @ruan-cat/claude-notifier <command> [options]
```

### 方式 2：使用 pnpm dlx

```bash
pnpm dlx @ruan-cat/claude-notifier <command> [options]
```

### 方式 3：全局安装

```bash
npm install -g @ruan-cat/claude-notifier
claude-notifier <command> [options]
```

## 基础命令

### 查看帮助

```bash
# 查看主帮助
npx @ruan-cat/claude-notifier --help

# 查看子命令帮助
npx @ruan-cat/claude-notifier task-complete --help
npx @ruan-cat/claude-notifier long-task --help
```

### 查看版本

```bash
npx @ruan-cat/claude-notifier --version
```

## 命令详解

### 1. task-complete - 任务完成通知

发送任务完成通知。

**基本使用**：

```bash
# 使用默认消息
npx @ruan-cat/claude-notifier task-complete

# 自定义消息
npx @ruan-cat/claude-notifier task-complete --message "任务完成"
```

**完整示例**：

```bash
npx @ruan-cat/claude-notifier task-complete \
  --title "构建任务" \
  --message "项目构建完成" \
  --sound success \
  --icon success \
  --task-description "编译项目代码"
```

**选项说明**：

- `-t, --title <title>` - 自定义通知标题（默认：`Claude Code`）
- `-m, --message <message>` - 自定义通知消息（默认：`任务完成 ✓`）
- `-s, --sound <sound>` - 音频预设或自定义音频（默认：`success`）
- `-i, --icon <icon>` - 图标预设或自定义图标（默认：`alice/success.gif` ✨）
- `-d, --task-description <description>` - 任务描述消息

**示例**：

```bash
# 1. 最简单的完成通知
npx @ruan-cat/claude-notifier task-complete

# 2. 带任务描述
npx @ruan-cat/claude-notifier task-complete \
  --message "测试通过" \
  --task-description "单元测试"

# 3. 使用 manbo 音效
npx @ruan-cat/claude-notifier task-complete \
  --sound manbo \
  --message "任务完成了"

# 4. 使用自定义音频
npx @ruan-cat/claude-notifier task-complete \
  --sound "C:\sounds\custom.mp3" \
  --icon "C:\icons\custom.png"

# 5. 指定预设文件夹的具体文件
npx @ruan-cat/claude-notifier task-complete \
  --sound manbo/01.mp3 \
  --icon success/custom.png
```

### 2. long-task - 长任务样式通知

纯样式化的通知命令，发送长任务风格的通知。定时逻辑由 `check-and-notify` 命令负责。

**重要说明**：此命令已重构为纯样式化命令，不再处理任何定时逻辑。对于 Claude Code hooks 的长任务管理，请使用 `check-and-notify` 命令。

**基本使用**：

```bash
# 发送默认长任务通知
npx @ruan-cat/claude-notifier long-task

# 自定义消息
npx @ruan-cat/claude-notifier long-task --message "claude code 任务运行中"

# 自定义音效和图标
npx @ruan-cat/claude-notifier long-task --sound warning --icon alice/timeout.gif
```

**完整示例**：

```bash
# 1. 基本通知
npx @ruan-cat/claude-notifier long-task

# 2. 自定义消息
npx @ruan-cat/claude-notifier long-task \
  --message "长时间任务进行中，请稍候"

# 3. 自定义音效和图标
npx @ruan-cat/claude-notifier long-task \
  --sound manbo \
  --icon clock
```

**选项说明**：

- `-m, --message <message>` - 自定义通知消息（默认：`claude code 长任务正在运行`）
- `-s, --sound <sound>` - 音频预设或自定义音频路径（默认：`warning`）
- `--icon <icon>` - 图标预设或自定义图标路径（默认：`alice/timeout.gif`）

**说明**：

long-task 命令现在是一个纯样式化的通知命令，类似于 `task-complete`、`timeout`、`error` 命令。它仅负责发送通知，不处理任何定时逻辑。

如果需要长任务的定时提醒功能，请使用 `check-and-notify` 命令，它会根据 hook 事件自动管理长任务。

### 3. check-and-notify - 智能检查和通知（推荐用于 hooks）

专为 Claude Code hooks 设计的智能命令。根据 `hook_event_name` 的不同，执行不同的逻辑。

**核心功能**：

- ✅ 基于 cwd 区分任务，支持多工作目录
- ✅ **UserPromptSubmit 事件**：添加/重置任务（删除旧任务，创建新任务）
- ✅ **Stop/SubagentStop 事件**：删除任务（当 stop_hook_active=true 时）
- ✅ **其他事件**：检查任务并发送通知
- ✅ 清理超过 8 小时的过期任务
- ✅ 精确时间差计算（显示"X 分 Y 秒"）
- ✅ 防重复通知（10 秒内不重复检查）

**基本使用**：

```bash
# 静默模式（推荐用于 hooks）
npx @ruan-cat/claude-notifier check-and-notify

# 查看详细日志
npx @ruan-cat/claude-notifier check-and-notify --verbose

# 自定义提醒间隔
npx @ruan-cat/claude-notifier check-and-notify --intervals "6,10,15,20,30"
```

**选项说明**：

- `--verbose` - 显示详细日志输出
- `--no-cleanup` - 跳过清理过期任务
- `-i, --intervals <intervals>` - 提醒时间点（分钟），逗号分隔（默认：`6,10,18,25,45`）

**示例**：

```bash
# 1. 静默模式（hooks 使用）
npx @ruan-cat/claude-notifier check-and-notify

# 2. 查看详细日志
npx @ruan-cat/claude-notifier check-and-notify --verbose

# 3. 禁用自动清理
npx @ruan-cat/claude-notifier check-and-notify --no-cleanup --verbose

# 4. 仅检查通知，不创建新任务
npx @ruan-cat/claude-notifier check-and-notify --no-auto-create
```

**工作流程**：

```plain
1. 从 stdin 读取 hook 数据
   ↓
   解析 cwd, hook_event_name, stop_hook_active 等字段
   ↓
2. 根据 hook_event_name 处理
   ↓
   UserPromptSubmit: 添加/重置任务 → 结束
   Stop/SubagentStop (stop_hook_active=true): 删除任务 → 结束
   其他事件: 继续执行后续流程
   ↓
3. 清理过期任务
   ↓
   遍历所有任务，删除超过 8 小时的
   ↓
4. 检查并通知
   ↓
   遍历所有任务，检查是否到提醒时间
   发送精确时间差通知（"X分Y秒"）
   标题显示阶段（如"长任务提醒：6分钟阶段"）
```

**输出示例**（--verbose 模式）：

```plain
📥 接收到 hook 数据:
   - cwd: D:\code\project
   - hook_event_name: BeforeToolUse
   - stop_hook_active: false
🧹 已清理 2 个过期任务（超过 8 小时）
📬 已发送 1 条通知
```

**通知格式示例**：

```plain
标题：长任务提醒：6分钟阶段
消息：claude code任务已运行8分42秒
```

**使用建议**：

- 在几乎所有 hooks 事件中调用 `check-and-notify`
- 命令会根据 `hook_event_name` 自动决定执行什么操作
- UserPromptSubmit 时创建任务，Stop 时删除任务，其他时间检查通知
- 支持多个工作目录同时运行独立任务

**推荐配置**（Claude Code hooks）：

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
					},
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

### 4. timeout - 连接超时通知

发送连接超时通知。

**基本使用**：

```bash
# 使用默认消息
npx @ruan-cat/claude-notifier timeout

# 自定义消息
npx @ruan-cat/claude-notifier timeout --message "API 请求超时"
```

**完整示例**：

```bash
npx @ruan-cat/claude-notifier timeout \
  --title "API 请求" \
  --message "请求超时" \
  --timeout-details "https://api.example.com 超时" \
  --sound error \
  --icon error
```

**选项说明**：

- `-t, --title <title>` - 自定义通知标题（默认：`Claude Code - 超时`）
- `-m, --message <message>` - 自定义通知消息（默认：`连接超时 ⏱️`）
- `--timeout-details <details>` - 超时详情
- `-s, --sound <sound>` - 音频预设（默认：`error`）
- `-i, --icon <icon>` - 图标预设（默认：`alice/timeout.gif` ✨）

**示例**：

```bash
# 1. 基本超时通知
npx @ruan-cat/claude-notifier timeout

# 2. 带详细消息
npx @ruan-cat/claude-notifier timeout \
  --message "数据库连接超时" \
  --timeout-details "连接 MySQL 超过 30 秒"

# 3. 自定义音效
npx @ruan-cat/claude-notifier timeout \
  --sound warning \
  --message "网络延迟较高"
```

### 5. error - 错误通知

发送错误通知。

**基本使用**：

```bash
# 使用默认消息
npx @ruan-cat/claude-notifier error

# 自定义消息
npx @ruan-cat/claude-notifier error --message "构建失败"
```

**完整示例**：

```bash
npx @ruan-cat/claude-notifier error \
  --title "构建错误" \
  --message "构建失败" \
  --error-details "TypeScript 编译错误: TS2304" \
  --sound error \
  --icon error
```

**选项说明**：

- `-t, --title <title>` - 自定义通知标题（默认：`Claude Code - 错误`）
- `-m, --message <message>` - 自定义通知消息（默认：`发生错误 ✗`）
- `-e, --error-details <details>` - 错误详情
- `-s, --sound <sound>` - 音频预设（默认：`error`）
- `-i, --icon <icon>` - 图标预设（默认：`alice/error.gif` ✨）

**示例**：

```bash
# 1. 基本错误通知
npx @ruan-cat/claude-notifier error

# 2. 带错误详情
npx @ruan-cat/claude-notifier error \
  --message "测试失败" \
  --error-details "5 个测试用例失败"

# 3. 自定义标题和音效
npx @ruan-cat/claude-notifier error \
  --title "部署错误" \
  --message "部署失败" \
  --sound warning
```

## 资源配置

### 音频预设

| 预设值    | 说明                   | 使用方式                         |
| --------- | ---------------------- | -------------------------------- |
| `default` | Windows 系统默认通知音 | `--sound default`                |
| `success` | 成功提示音             | `--sound success`                |
| `warning` | 警告提示音             | `--sound warning`                |
| `error`   | 错误提示音             | `--sound error`                  |
| `manbo`   | 自定义预设（曼波音效） | `--sound manbo`                  |
| `none`    | 静音                   | `--sound none`                   |
| 具体文件  | 指定具体文件           | `--sound manbo/01.mp3`           |
| 绝对路径  | 自定义文件路径         | `--sound "C:\sounds\custom.mp3"` |
| 相对路径  | 相对 sounds/ 的路径    | `--sound "my-custom/audio.mp3"`  |

### 图标预设

| 预设值              | 说明                      | 使用方式                       |
| ------------------- | ------------------------- | ------------------------------ |
| `alice/success.gif` | ✨ Alice 成功图标（默认） | `--icon alice/success.gif`     |
| `alice/error.gif`   | ✨ Alice 错误图标（默认） | `--icon alice/error.gif`       |
| `alice/timeout.gif` | ✨ Alice 超时图标（默认） | `--icon alice/timeout.gif`     |
| `success`           | 成功图标（绿色对勾）      | `--icon success`               |
| `warning`           | 警告图标（黄色警告）      | `--icon warning`               |
| `error`             | 错误图标（红色错误）      | `--icon error`                 |
| `info`              | 信息图标（蓝色信息）      | `--icon info`                  |
| `clock`             | 时钟图标（长任务专用）    | `--icon clock`                 |
| 具体文件            | 指定具体图标文件          | `--icon success/custom.png`    |
| 绝对路径            | 自定义图标路径            | `--icon "C:\icons\custom.png"` |
| 相对路径            | 相对 icons/ 的路径        | `--icon "my-custom/icon.png"`  |

**✨ Alice 图标系列（新增）**：

- Alice 图标是动态 GIF 格式，更加生动可爱
- 所有命令默认使用 Alice 图标，提供更好的视觉体验
- 保留传统静态图标，可通过参数选择使用

## 实际场景

### 场景 1：构建完成后的通知

在 `package.json` 中配置：

```json
{
	"scripts": {
		"build": "tsc && npx @ruan-cat/claude-notifier task-complete --message '构建完成'",
		"test": "vitest && npx @ruan-cat/claude-notifier task-complete --message '测试通过'"
	}
}
```

### 场景 2：使用 && 或 || 处理完成/失败

```bash
# 构建成功后通知
npm run build && npx @ruan-cat/claude-notifier task-complete --message "构建完成"

# 构建失败后通知
npm run build || npx @ruan-cat/claude-notifier error --message "构建失败"

# 组合使用
npm run build && \
  npx @ruan-cat/claude-notifier task-complete --message "构建完成" || \
  npx @ruan-cat/claude-notifier error --message "构建失败"
```

### 场景 3：Claude Code hooks 集成（推荐）

在 `~/.claude/settings.json` 中配置：

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
					},
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

**效果**：

- 会话开始后自动创建长任务记录
- 到达 6, 10, 18, 25, 45 分钟时自动提醒
- 会话结束后自动清理任务数据
- 支持多个 Claude Code 对话同时运行

### 场景 4：查看长任务状态

```bash
# 查看所有活跃的会话
npx @ruan-cat/claude-notifier long-task --status

# 输出示例：
# ⏰ 共有 2 个活跃的长任务定时器:
#
# 会话: session-abc-123
#   - 已运行: 15 分钟
#   - 已触发: 2/5 次
#   - 任务描述: Claude Code 对话
#
# 会话: session-def-456
#   - 已运行: 8 分钟
#   - 已触发: 1/5 次

# 查看指定会话状态
npx @ruan-cat/claude-notifier long-task --status --session-id "session-abc-123"
```

### 场景 5：手动测试长任务（无需 hooks）

```bash
# 手动注册一个测试任务
npx @ruan-cat/claude-notifier long-task \
  --session-id "test-session" \
  --intervals "1,2,3" \
  --task-description "测试任务"

# 等待 1 分钟后，手动触发检查
npx @ruan-cat/claude-notifier check-and-notify --verbose

# 查看状态
npx @ruan-cat/claude-notifier long-task --status

# 清理测试任务
npx @ruan-cat/claude-notifier long-task --stop --session-id "test-session"
```

## 错误排查指南

### 查看日志输出

CLI 的日志输出：

- ✓ 成功消息
- ⚠️ 警告消息（如资源文件不存在）
- ✗ 错误消息

### 常见问题

1. **通知没有声音**
   - 检查 `--sound` 参数是否正确
   - 确保音频文件存在
   - 尝试使用 `--sound default` 使用系统默认音

2. **通知没有图标**
   - 检查 `--icon` 参数是否正确
   - 确保图标文件存在
   - 图标不存在不会阻止通知发送

3. **长任务通知没有生效**
   - 使用 `long-task --status` 查看任务状态
   - 确保 `check-and-notify` 命令被正确配置到 hooks
   - 使用 `check-and-notify --verbose` 查看详细日志
   - 检查状态文件：`%TEMP%\.claude-notifier-timer.json`

4. **命令执行过慢**
   - 使用完整的 `npx @ruan-cat/claude-notifier` 命令
   - 或全局安装后使用 `claude-notifier`

## 最佳建议

1. **使用 npx 的优点**
   - 无需全局安装
   - 始终使用最新版本
   - 适用于临时使用场景

2. **长任务定时器的使用建议**
   - 每 30 秒检查一次，建议使用合理的时间间隔
   - 不建议使用过短的间隔（会增加系统开销）

3. **推荐通知组合**
   - 保持简洁的消息内容
   - 避免过于冗长的描述

## 相关文档

- 参考 [API 使用文档](./api.md) 了解编程方式使用
- 参考 [Claude Code 配置文档](./claude-code.md) 了解如何集成到 Claude Code
- 参考 [资源添加指南](../how-to-add-assets.md) 了解如何添加自定义音频和图标
