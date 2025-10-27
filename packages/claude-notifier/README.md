# @ruan-cat/claude-notifier Claude Code 通知工具

<!-- automd:badges color="yellow" name="@ruan-cat/claude-notifier" -->

<!-- /automd -->

Claude Code 通知工具 - 在 Claude Code 任务完成后，发送 Windows 系统通知。

## 功能特性

- ✅ 任务完成通知
- ⏰ 长任务定时提醒（6, 10, 18, 25, 45 分钟）
- ⏱️ 连接超时提醒
- ❌ 错误通知
- 🔊 可自定义音频预设
- 🎨 可自定义图标预设
- 🪟 支持 Windows 系统

## 安装

```bash
# npm
npx @ruan-cat/claude-notifier

# pnpm
pnpm dlx @ruan-cat/claude-notifier

# 全局安装
npm install -g @ruan-cat/claude-notifier
```

## 使用方法

### 1. 任务完成通知

```bash
# 基本用法
npx @ruan-cat/claude-notifier task-complete

# 自定义消息
npx @ruan-cat/claude-notifier task-complete --message "构建完成！"

# 自定义标题和音频
npx @ruan-cat/claude-notifier task-complete \
  --title "我的任务" \
  --message "任务已完成" \
  --sound success \
  --icon success
```

### 2. 长任务定时提醒

```bash
# 启动长任务监控（默认在 6, 10, 18, 25, 45 分钟时提醒）
npx @ruan-cat/claude-notifier long-task

# 自定义提醒时间点
npx @ruan-cat/claude-notifier long-task --intervals "5,15,30"

# 查看定时器状态
npx @ruan-cat/claude-notifier long-task --status

# 停止定时器
npx @ruan-cat/claude-notifier long-task --stop

# 带任务描述
npx @ruan-cat/claude-notifier long-task \
  --task-description "大型模型训练" \
  --sound warning
```

### 3. 连接超时通知

```bash
# 基本用法
npx @ruan-cat/claude-notifier timeout

# 带详情
npx @ruan-cat/claude-notifier timeout \
  --message "API 请求超时" \
  --timeout-details "请求 https://api.example.com 超时"
```

### 4. 错误通知

```bash
# 基本用法
npx @ruan-cat/claude-notifier error

# 带错误详情
npx @ruan-cat/claude-notifier error \
  --message "构建失败" \
  --error-details "TypeScript 编译错误: TS2304"
```

## 配置选项

### 音频预设

音频资源采用**文件夹方式**组织，每个预设对应一个文件夹，可以包含多个音频文件。

| 预设值    | 说明                   | 默认文件路径              |
| --------- | ---------------------- | ------------------------- |
| `default` | Windows 系统默认通知音 | 系统音                    |
| `success` | 成功提示音             | `sounds/success/main.mp3` |
| `warning` | 警告提示音             | `sounds/warning/main.mp3` |
| `error`   | 错误提示音             | `sounds/error/main.mp3`   |
| `manbo`   | 自定义预设（曼波音效） | `sounds/manbo/main.mp3`   |
| `none`    | 静音                   | 无音频                    |

**使用方式**：

```bash
# 1. 使用预设（自动查找 manbo/main.mp3）
npx @ruan-cat/claude-notifier task-complete --sound manbo

# 2. 指定预设文件夹内的具体文件
npx @ruan-cat/claude-notifier task-complete --sound manbo/01.mp3

# 3. 使用自定义路径（绝对路径）
npx @ruan-cat/claude-notifier task-complete --sound "C:\sounds\custom.mp3"

# 4. 使用相对于 sounds/ 目录的路径
npx @ruan-cat/claude-notifier task-complete --sound "my-custom/audio.mp3"
```

**文件查找规则**：

- 当使用预设名称（如 `manbo`）时，自动查找该文件夹下的默认文件
- 默认文件优先级：`main.mp3` > `index.mp3` > `default.mp3`
- 推荐使用 `.mp3` 格式，也支持 `.wav` 等格式

### 图标预设

图标资源同样采用**文件夹方式**组织，每个预设对应一个文件夹。

| 预设值    | 说明                   | 默认文件路径             |
| --------- | ---------------------- | ------------------------ |
| `success` | 成功图标（绿色对勾）   | `icons/success/icon.png` |
| `warning` | 警告图标（黄色警告）   | `icons/warning/icon.png` |
| `error`   | 错误图标（红色错误）   | `icons/error/icon.png`   |
| `info`    | 信息图标（蓝色信息）   | `icons/info/icon.png`    |
| `clock`   | 时钟图标（长任务专用） | `icons/clock/icon.png`   |

**使用方式**：

```bash
# 1. 使用预设（自动查找 success/icon.png）
npx @ruan-cat/claude-notifier task-complete --icon success

# 2. 指定预设文件夹内的具体文件
npx @ruan-cat/claude-notifier task-complete --icon success/custom.png

# 3. 使用自定义路径（绝对路径）
npx @ruan-cat/claude-notifier task-complete --icon "C:\icons\custom.png"

# 4. 使用相对于 icons/ 目录的路径
npx @ruan-cat/claude-notifier task-complete --icon "my-custom/icon.png"
```

**文件查找规则**：

- 当使用预设名称（如 `success`）时，自动查找该文件夹下的默认文件
- 默认文件优先级：`icon.png` > `index.png` > `default.png` > `main.png`
- 推荐使用 `.png` 格式，也支持 `.jpg`、`.ico` 等格式

### 如何添加自定义资源

详细的资源文件组织说明，请查看 [`src/assets/README.md`](./src/assets/README.md)。

**快速开始**：

```bash
# 1. 创建自定义音频预设
mkdir -p src/assets/sounds/my-sound
cp /path/to/your/audio.mp3 src/assets/sounds/my-sound/main.mp3

# 2. 创建自定义图标预设
mkdir -p src/assets/icons/my-icon
cp /path/to/your/icon.png src/assets/icons/my-icon/icon.png

# 3. 重新构建
pnpm build

# 4. 使用自定义预设
npx @ruan-cat/claude-notifier task-complete \
  --sound my-sound \
  --icon my-icon
```

## 在 Claude Code Hooks 中使用

在您的 Claude Code 设置文件 `~/.claude/settings.json` 中配置 hooks：

### 任务完成通知（Stop Hook）

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

### 长任务监控（SessionStart Hook）

```json
{
	"hooks": {
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

## 编程式使用

您也可以在 Node.js 项目中以编程方式使用此工具：

```typescript
import { sendNotification, startLongTaskTimer } from "@ruan-cat/claude-notifier";
import { SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

// 发送通知
await sendNotification({
	title: "任务完成",
	message: "构建成功！",
	sound: SoundPreset.SUCCESS,
	icon: IconPreset.SUCCESS,
});

// 启动长任务定时器
await startLongTaskTimer({
	intervals: [5, 10, 15],
	sound: SoundPreset.WARNING,
	taskDescription: "数据处理任务",
});
```

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式（监听变化）
pnpm dev

# 测试 CLI
pnpm test:cli
```

## 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **tsup** - 零配置的 TypeScript 打包工具
- **commander** - 命令行框架
- **node-notifier** - 跨平台系统通知库
- **consola** - 优雅的控制台日志

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
