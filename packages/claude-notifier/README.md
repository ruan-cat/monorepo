# Claude Code 通知工具

<!-- automd:badges color="yellow" name="@ruan-cat/claude-notifier" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/claude-notifier?color=yellow)](https://npmjs.com/package/@ruan-cat/claude-notifier)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/claude-notifier?color=yellow)](https://npm.chart.dev/@ruan-cat/claude-notifier)

<!-- /automd -->

Claude Code 通知工具 - 在 Claude Code 任务完成后发送 Windows 系统通知。

## 功能特性

- ✅ 任务完成通知
- ⏰ 长任务定时提醒（6, 10, 18, 25, 45 分钟）
- ⏱️ 连接超时提醒
- ❌ 错误通知
- 🔊 可自定义音频预设（文件夹方式组织）
- 🎨 可自定义图标预设（文件夹方式组织）
- 🪟 支持 Windows 系统

## 快速开始

### 安装

```bash
# 使用 npx（推荐，无需安装）
npx @ruan-cat/claude-notifier

# 使用 pnpm dlx
pnpm dlx @ruan-cat/claude-notifier

# 全局安装
npm install -g @ruan-cat/claude-notifier
```

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

在 `~/.claude/settings.json` 中配置：

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
		]
	}
}
```

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
npx @ruan-cat/claude-notifier task-complete \
  --message "构建完成" \
  --sound success \
  --icon success
```

### long-task - 长任务监控

```bash
# 启动监控（默认 6,10,18,25,45 分钟提醒）
npx @ruan-cat/claude-notifier long-task

# 查看状态
npx @ruan-cat/claude-notifier long-task --status

# 停止监控
npx @ruan-cat/claude-notifier long-task --stop
```

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

| 预设      | 说明     | 使用方式         |
| --------- | -------- | ---------------- |
| `success` | 成功图标 | `--icon success` |
| `warning` | 警告图标 | `--icon warning` |
| `error`   | 错误图标 | `--icon error`   |
| `info`    | 信息图标 | `--icon info`    |
| `clock`   | 时钟图标 | `--icon clock`   |

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

## License

MIT

---

## 旧版笔记（保留）

### 基本思路

发布一个包，然后每次 claude code 的 hooks 执行时，都直接使用该包的 npx 形式。直接使用 dist 文件，直接就能用的文件。

不能纯粹依靠 tsx 来直接运行 typescript，安装 claude code 插件市场时，是直接克隆仓库，但是不会默认安装依赖。所以直接使用 tsx 运行 hooks 插件是行不通的，因为没有上下游依赖。

所以只能选择保守的方案，发包，走 tsup 打包的流程。

### 参考对话

- https://gemini.google.com/share/857515862373
- https://github.com/copilot/share/02671392-0840-8470-a051-b84560024178

### 预设曼波语音

在完成任务后，播放默认的曼波语音。
