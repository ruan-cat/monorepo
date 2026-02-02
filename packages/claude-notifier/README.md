# Claude Code 通知工具

<!-- automd:badges color="yellow" name="@ruan-cat/claude-notifier" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/claude-notifier?color=yellow)](https://npmjs.com/package/@ruan-cat/claude-notifier)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/claude-notifier?color=yellow)](https://npm.chart.dev/@ruan-cat/claude-notifier)

<!-- /automd -->

Claude Code 通知工具 - 在 Claude Code 任务完成后发送 Windows 系统通知。

## 功能特性

- ✅ 任务完成通知
- ⏰ 长任务定时提醒（基于 cwd 的多工作目录管理）
  - 支持多个工作目录同时运行独立任务
  - 自动清理过期任务（超过 8 小时）
  - 精确的时间差计算（分钟+秒）
  - 防重复通知机制
- ⏱️ 连接超时提醒
- ❌ 错误通知
- 🔄 check-and-notify 智能 hook 命令（根据事件自动处理）
- 🔊 可自定义音频预设（文件夹方式组织）
- 🎨 可自定义图标预设（文件夹方式组织）
- 🪟 支持 Windows 系统

## 快速开始

### 安装

<!-- automd:pm-install name="@ruan-cat/claude-notifier" dev -->

```sh
# ✨ Auto-detect
npx nypm install -D @ruan-cat/claude-notifier

# npm
npm install -D @ruan-cat/claude-notifier

# yarn
yarn add -D @ruan-cat/claude-notifier

# pnpm
pnpm add -D @ruan-cat/claude-notifier

# bun
bun install -D @ruan-cat/claude-notifier

# deno
deno install --dev npm:@ruan-cat/claude-notifier
```

<!-- /automd -->

### 基本使用

```bash
# 任务完成通知
npx @ruan-cat/claude-notifier task-complete --message "构建完成"

# 长任务监控
npx @ruan-cat/claude-notifier long-task

# 查看帮助
npx @ruan-cat/claude-notifier --help
```

### Claude Code Hooks 集成

> ⚠️ **重要变更（v0.9.0+）**：不再在 Stop hooks 中使用 `check-and-notify`
>
> 由于多个钩子竞争读取 stdin 流的问题，`check-and-notify` 现在会自动跳过 Stop/SubagentStop 事件。
> 任务删除现在由 `task-complete-notifier.sh` 或其他脚本直接调用 `remove-task.ts` 完成。
>
> 详见：[破坏性变更说明](#破坏性变更-stop-hooks-配置)

**推荐配置**：使用 `check-and-notify` 命令实现自动长任务管理

```json
{
	"hooks": {
		"Stop": [
			{
				"matcher": "os == 'windows'",
				"hooks": [
					{
						"type": "command",
						"command": "npx @ruan-cat/claude-notifier task-complete --message \"任务完成\""
					}
				]
			}
		],
		"UserPromptSubmit": [
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
		"PreToolUse": [
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
		"SessionEnd": [
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

- `check-and-notify` 优先从环境变量读取数据，fallback 到 stdin（避免 stdin 竞争）
- **SessionStart**: 跳过通知，避免会话启动时的干扰
- **UserPromptSubmit**: 无条件删除旧任务并创建新任务，确保每次用户输入都重新计时
- **SessionEnd**: 删除任务，不做通知，确保会话结束时清理任务
- **Stop/SubagentStop**: ⚠️ **自动跳过**（v0.9.0+），不执行任何逻辑（避免 stdin 竞争问题）
- **其他事件**: 检查任务，到达时间点时自动通知（默认：6, 10, 18, 25, 45 分钟）
- 通知文本精确显示"X 分 Y 秒"，标题显示阶段（如"长任务提醒：6 分钟阶段"）
- 详细的日志记录和性能监控（日志文件：`%TEMP%\claude-notifier-debug\`）

**环境变量支持（v0.9.0+）**：

`check-and-notify` 现在支持通过环境变量传递数据，避免 stdin 竞争：

```json
{
	"type": "command",
	"command": "npx @ruan-cat/claude-notifier check-and-notify",
	"env": {
		"CLAUDE_CWD": "${cwd}",
		"CLAUDE_HOOK_EVENT": "${hook_event_name}",
		"CLAUDE_STOP_HOOK_ACTIVE": "${stop_hook_active}"
	}
}
```

数据获取优先级：环境变量 > stdin

## 📚 使用文档

### 命令行使用

📖 **[CLI 使用文档](./src/docs/use/cli.md)** - 完整的命令行使用指南

- 4 个子命令详解（task-complete, long-task, timeout, error）
- 音频和图标预设配置
- 5 个实际使用场景示例

### 编程式使用

💻 **[API 使用文档](./src/docs/use/api.md)** - Node.js 编程方式

- 安装和基本使用
- 音频和图标预设
- 长任务监控 API
- 5 个完整的实战示例

### Claude Code 集成

🔗 **[Claude Code 配置文档](./src/docs/use/claude-code.md)** - Hooks 配置指南

- 完整配置示例
- 5 种 Hook 类型详解
- Matcher 语法和配置模板
- 错误排查指南

### 自定义资源

🎨 **[资源添加指南](./src/docs/how-to-add-assets.md)** - 添加音频和图标

- 文件夹预设方式说明
- 添加音频/图标的完整步骤
- 资源规范和建议
- 免费资源获取渠道

### 项目架构

🏗️ **[架构文档](./src/docs/architecture.md)** - 项目架构设计

- 技术栈和目录结构
- 核心模块说明
- 设计决策和执行流程

## 主要命令

### task-complete - 任务完成通知

```bash
# 使用默认 Alice 成功图标
npx @ruan-cat/claude-notifier task-complete --message "构建完成"

# 使用传统图标
npx @ruan-cat/claude-notifier task-complete \
  --message "构建完成" \
  --sound success \
  --icon success
```

### long-task - 长任务样式通知

发送长任务样式的通知，纯样式化命令。定时逻辑由 `check-and-notify` 命令负责。

```bash
# 发送默认长任务通知
npx @ruan-cat/claude-notifier long-task

# 自定义消息
npx @ruan-cat/claude-notifier long-task --message "claude code 任务运行中"

# 自定义音效和图标
npx @ruan-cat/claude-notifier long-task --sound warning --icon alice/timeout.gif
```

### check-and-notify - 智能检查和通知（推荐用于 hooks）

根据 hook_event_name 智能处理不同逻辑的命令，用于 Claude Code hooks 集成。

```bash
# 从 stdin 读取 hook 数据并自动处理
npx @ruan-cat/claude-notifier check-and-notify

# 查看详细日志
npx @ruan-cat/claude-notifier check-and-notify --verbose

# 自定义提醒间隔
npx @ruan-cat/claude-notifier check-and-notify --intervals "6,10,15,20,30"
```

**特性**：

- ✅ 基于 cwd 区分任务，支持多工作目录
- ✅ 智能事件处理（SessionStart/UserPromptSubmit/SessionEnd）
- ✅ **环境变量优先支持**（v0.9.0+）：优先读取环境变量，fallback 到 stdin
- ✅ **自动跳过 Stop 事件**（v0.9.0+）：检测到 Stop/SubagentStop 时立即返回，避免 stdin 竞争
- ✅ 精确时间差计算（显示"X 分 Y 秒"）
- ✅ 自动清理超过 8 小时的任务
- ✅ 防重复通知（10 秒内不重复）
- ✅ 详细的日志记录和性能监控
- ✅ 超时警告（总耗时接近 5 秒时警告）

**环境变量支持**（v0.9.0+）：

- `CLAUDE_CWD` - 当前工作目录
- `CLAUDE_HOOK_EVENT` - Hook 事件名称
- `CLAUDE_STOP_HOOK_ACTIVE` - Stop hook 是否激活

**事件处理逻辑**：

| 事件                  | 行为          | 说明                             |
| --------------------- | ------------- | -------------------------------- |
| SessionStart          | 跳过          | 避免会话启动时干扰               |
| UserPromptSubmit      | 创建/重置任务 | 无条件删除旧任务并创建新任务     |
| SessionEnd            | 删除任务      | 不做通知，仅清理                 |
| **Stop/SubagentStop** | **立即返回**  | v0.9.0+ 自动跳过，不执行任何逻辑 |
| PreToolUse 等其他事件 | 检查并通知    | 到达时间点时自动通知             |

### timeout - 超时通知

```bash
npx @ruan-cat/claude-notifier timeout --message "API 请求超时"
```

### error - 错误通知

```bash
npx @ruan-cat/claude-notifier error --message "构建失败"
```

## 资源预设

### 音频预设（文件夹方式）

| 预设      | 说明       | 使用方式          |
| --------- | ---------- | ----------------- |
| `success` | 成功提示音 | `--sound success` |
| `warning` | 警告提示音 | `--sound warning` |
| `error`   | 错误提示音 | `--sound error`   |
| `manbo`   | 曼波音效   | `--sound manbo`   |
| `default` | 系统默认音 | `--sound default` |
| `none`    | 静音       | `--sound none`    |

**文件夹方式**：每个预设对应一个文件夹，支持指定具体文件

```bash
# 使用预设默认文件
--sound manbo

# 指定预设内的具体文件
--sound manbo/01.mp3

# 使用自定义路径
--sound "C:\sounds\custom.mp3"
```

**文件查找规则**：`main.mp3` > `index.mp3` > `default.mp3`

### 图标预设（文件夹方式）

| 预设                | 说明                      | 使用方式                   |
| ------------------- | ------------------------- | -------------------------- |
| `alice/success.gif` | ✨ Alice 成功图标（默认） | `--icon alice/success.gif` |
| `alice/error.gif`   | ✨ Alice 错误图标         | `--icon alice/error.gif`   |
| `alice/timeout.gif` | ✨ Alice 超时图标         | `--icon alice/timeout.gif` |
| `success`           | 成功图标                  | `--icon success`           |
| `warning`           | 警告图标                  | `--icon warning`           |
| `error`             | 错误图标                  | `--icon error`             |
| `info`              | 信息图标                  | `--icon info`              |
| `clock`             | 时钟图标                  | `--icon clock`             |

**✨ 新增 Alice 图标系列**：

- 所有命令现在默认使用 Alice 风格的动态 GIF 图标
- Alice 图标更加生动可爱，提供更好的视觉体验
- `task-complete` 默认使用 `alice/success.gif`
- `error` 和 `timeout` 默认使用对应的 `alice` 版本

**文件查找规则**：`icon.png` > `index.png` > `default.png` > `main.png`

## 编程式使用

```typescript
import { sendNotification, SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

// 发送通知
await sendNotification({
	title: "任务完成",
	message: "构建成功",
	sound: SoundPreset.SUCCESS,
	icon: IconPreset.SUCCESS,
});

// 长任务定时器
import { startLongTaskTimer, stopLongTaskTimer } from "@ruan-cat/claude-notifier";

await startLongTaskTimer({
	intervals: [5, 10, 15],
	taskDescription: "数据处理任务",
});

stopLongTaskTimer();
```

📖 详细文档：[API 使用文档](./src/docs/use/api.md)

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式
pnpm dev

# 测试 CLI
pnpm test:cli
```

## 技术栈

- **TypeScript** - 类型安全
- **tsup** - 快速构建（基于 esbuild）
- **commander** - CLI 框架
- **node-notifier** - 系统通知
- **consola** - 日志输出

## 文档索引

### 📖 使用指南

- [CLI 使用文档](./src/docs/use/cli.md) - 命令行完整指南
- [API 使用文档](./src/docs/use/api.md) - 编程方式使用
- [Claude Code 配置](./src/docs/use/claude-code.md) - Hooks 集成配置

### 🎨 资源管理

- [资源添加指南](./src/docs/how-to-add-assets.md) - 添加自定义音频和图标
- [资源文件说明](./src/assets/README.md) - 资源目录快速参考

### 🏗️ 项目信息

- [架构文档](./src/docs/architecture.md) - 项目架构和设计

## 破坏性变更：Stop Hooks 配置

### 问题背景（v0.9.0 之前）

在 v0.9.0 之前，推荐在 Stop hooks 中使用 `check-and-notify` 来自动删除任务：

```json
{
	"Stop": [
		{
			"hooks": [
				{
					"command": "bash scripts/task-complete-notifier.sh"
				},
				{
					"command": "claude-notifier check-and-notify" // ❌ 有问题
				}
			]
		}
	]
}
```

**问题**：多个钩子竞争读取 stdin 流

1. 第一个钩子（`task-complete-notifier.sh`）读取 stdin 成功
2. 第二个钩子（`check-and-notify`）尝试读取 stdin，但流已被消费
3. `check-and-notify` 500ms 超时后返回 `null`
4. 检测到 `null` 后提前返回，删除任务的代码永远不会执行
5. 已完成的任务持续存在，6 分钟后触发误报通知

### 解决方案（v0.9.0+）

#### 方案 1：从 Stop hooks 中移除 check-and-notify

```json
{
	"Stop": [
		{
			"hooks": [
				{
					"command": "bash scripts/task-complete-notifier.sh" // 此脚本内部调用 remove-task.ts
				},
				{
					"command": "claude-notifier task-complete --message \"任务完成\"" // 独立通知
				}
			]
		}
	]
}
```

**说明**：

- ✅ `task-complete-notifier.sh` 读取 stdin，生成 Gemini 总结，然后调用 `tsx remove-task.ts` 删除任务
- ✅ `task-complete` 不需要 stdin，独立发送通知
- ✅ 没有 stdin 竞争，任务能够正确删除

#### 方案 2：使用环境变量（如果 Claude Code 支持）

```json
{
	"type": "command",
	"command": "claude-notifier check-and-notify",
	"env": {
		"CLAUDE_CWD": "${cwd}",
		"CLAUDE_HOOK_EVENT": "${hook_event_name}"
	}
}
```

**说明**：

- ✅ 不依赖 stdin，完全避免竞争
- ⚠️ 需要确认 Claude Code 是否支持 hooks 环境变量注入

### 新增工具脚本

**`src/scripts/remove-task.ts`**（v0.9.0+）

可被 tsx 直接调用，用于在 Bash 脚本中删除任务：

```bash
# 在 task-complete-notifier.sh 中使用
tsx packages/claude-notifier/src/scripts/remove-task.ts /path/to/project
```

**特性**：

- ✅ 不依赖 stdin
- ✅ 2 秒超时保护
- ✅ 详细的成功/失败日志

### 迁移指南

#### 步骤 1：检查你的 hooks 配置

查找是否在 Stop hooks 中使用了 `check-and-notify`：

```bash
# 查找配置文件
find . -name "hooks.json" -o -name ".claude/hooks.json"

# 检查是否包含问题配置
grep -A 10 '"Stop"' your-hooks.json
```

#### 步骤 2：移除 check-and-notify

如果找到了，从 Stop hooks 中移除 `check-and-notify`：

```diff
{
  "Stop": [
    {
      "hooks": [
        {
          "command": "bash scripts/task-complete-notifier.sh"
        },
-       {
-         "command": "claude-notifier check-and-notify"
-       }
      ]
    }
  ]
}
```

#### 步骤 3：确保任务删除逻辑

确保你的 `task-complete-notifier.sh` 或其他脚本调用了 `remove-task.ts`：

```bash
# 在脚本末尾添加
tsx "$MONOREPO_ROOT/packages/claude-notifier/src/scripts/remove-task.ts" "$PROJECT_DIR"
```

#### 步骤 4：验证修复

1. 启动 Claude Code 对话
2. 提交任务并等待完成
3. 等待 6 分钟
4. 确认不再收到长任务通知 ✅

### 其他 Hooks 不受影响

以下 hooks 仍然可以正常使用 `check-and-notify`：

- ✅ **UserPromptSubmit** - 创建/重置任务
- ✅ **PreToolUse** - 检查长任务并通知
- ✅ **SessionEnd** - 清理任务

### 技术细节

详见：

- [Stop Hooks 故障深度分析报告](../../docs/reports/2025-11-19-stop-hooks-failure-analysis.md)
- [v0.8.0 发布报告](../../docs/reports/2025-11-19-common-tools-v0.8.0-release.md)

## License

MIT

---
