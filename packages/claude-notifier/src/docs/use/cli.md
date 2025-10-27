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

### 2. long-task - 长任务监控

启动长任务监控，在指定时间间隔时发送周期性提醒通知。

**基本使用**：

```bash
# 使用默认时间点（6, 10, 18, 25, 45 分钟）
npx @ruan-cat/claude-notifier long-task

# 自定义时间点
npx @ruan-cat/claude-notifier long-task --intervals "5,10,15,30"
```

**完整示例**：

```bash
npx @ruan-cat/claude-notifier long-task \
  --intervals "6,10,18,25,45" \
  --sound warning \
  --icon clock \
  --task-description "正在长时间运行的任务"
```

**选项说明**：

- `-i, --intervals <intervals>` - 提醒时间点（分钟），逗号分隔（默认：`6,10,18,25,45`）
- `-s, --sound <sound>` - 音频预设（默认：`warning`）
- `--icon <icon>` - 图标预设（默认：`alice/timeout.gif` ✨）
- `-d, --task-description <description>` - 任务描述消息
- `--stop` - 停止当前正在运行的定时器
- `--status` - 查看当前正在运行的定时器状态

**示例**：

```bash
# 1. 启动默认定时器
npx @ruan-cat/claude-notifier long-task

# 2. 自定义提醒时间点
npx @ruan-cat/claude-notifier long-task \
  --intervals "5,15,30" \
  --task-description "数据处理任务"

# 3. 查看定时器状态
npx @ruan-cat/claude-notifier long-task --status

# 4. 停止定时器
npx @ruan-cat/claude-notifier long-task --stop

# 5. 使用自定义音效
npx @ruan-cat/claude-notifier long-task \
  --sound manbo \
  --task-description "训练深度学习模型"
```

**工作流程**：

```plain
启动定时器
  ↓
记录启动时间到文件（00:00）
  ↓
每 30 秒检查一次：
  - 00:06 时，发送 6 分钟 ● 提醒通知
  - 00:10 时，发送 10 分钟 ● 提醒通知
  - 00:18 时，发送 18 分钟 ● 提醒通知
  - 00:25 时，发送 25 分钟 ● 提醒通知
  - 00:45 时，发送 45 分钟 ● 提醒通知 ● 自动停止
```

### 3. timeout - 连接超时通知

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

### 4. error - 错误通知

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

### 场景 3：监控长时间运行的任务

```bash
# 启动定时器，然后执行任务，最后完成后停止定时器
npx @ruan-cat/claude-notifier long-task --task-description "正在处理数据" &
process_large_dataset.sh
npx @ruan-cat/claude-notifier long-task --stop
npx @ruan-cat/claude-notifier task-complete --message "数据处理完成"
```

### 场景 4：Shell 脚本集成

```bash
#!/bin/bash

# deploy.sh - 部署脚本

echo "开始部署..."

# 启动长任务监控
npx @ruan-cat/claude-notifier long-task \
  --intervals "2,5,10" \
  --task-description "正在部署" &

# 执行部署
if deploy_application; then
  # 停止定时器
  npx @ruan-cat/claude-notifier long-task --stop

  # 发送成功通知
  npx @ruan-cat/claude-notifier task-complete \
    --message "部署成功" \
    --sound success
else
  # 停止定时器
  npx @ruan-cat/claude-notifier long-task --stop

  # 发送失败通知
  npx @ruan-cat/claude-notifier error \
    --message "部署失败" \
    --error-details "$deploy_error"
fi
```

### 场景 5：结合 watch 命令

```bash
# 监控文件变化并发送通知
watch -n 60 'git pull && npx @ruan-cat/claude-notifier task-complete --message "代码已更新"'
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

3. **长任务定时器没有响应**
   - 使用 `--status` 查看定时器状态
   - 确保定时器正在运行
   - 检查提醒时间点是否正确

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
