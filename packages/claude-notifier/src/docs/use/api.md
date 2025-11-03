# API 使用文档

本文档详细说明 API 使用方式，介绍如何在 Node.js 项目中以编程方式使用 `@ruan-cat/claude-notifier`。

## 安装

```bash
npm install @ruan-cat/claude-notifier
# 或
pnpm add @ruan-cat/claude-notifier
```

## 基本使用

### 1. 发送基础通知

```typescript
import { sendNotification } from "@ruan-cat/claude-notifier";

// 最简单的通知
await sendNotification({
	message: "任务完成了",
});

// 带标题的通知
await sendNotification({
	title: "构建任务",
	message: "项目构建完成",
});
```

### 2. 使用快捷函数

```typescript
import { quickNotify } from "@ruan-cat/claude-notifier";

// 快捷发送通知（使用默认标题）
await quickNotify("构建成功完成");

// 自定义标题
await quickNotify("测试通过", "测试结果");
```

## 使用预设

### 音频预设

```typescript
import { sendNotification, SoundPreset } from "@ruan-cat/claude-notifier";

// 使用成功音效
await sendNotification({
	message: "操作成功",
	sound: SoundPreset.SUCCESS,
});

// 使用警告音效
await sendNotification({
	message: "检查项有潜在风险",
	sound: SoundPreset.WARNING,
});

// 使用错误音效
await sendNotification({
	message: "操作失败",
	sound: SoundPreset.ERROR,
});

// 使用自定义预设（manbo）
await sendNotification({
	message: "任务完成",
	sound: SoundPreset.MANBO,
});

// 静音通知
await sendNotification({
	message: "静音通知",
	sound: SoundPreset.NONE,
});

// 使用系统默认音
await sendNotification({
	message: "普通通知",
	sound: SoundPreset.DEFAULT,
});
```

### 图标预设

```typescript
import { sendNotification, IconPreset } from "@ruan-cat/claude-notifier";

// ✨ 使用 Alice 成功图标（默认，动态 GIF）
await sendNotification({
	message: "操作成功",
	icon: IconPreset.ALICE_SUCCESS,
});

// ✨ 使用 Alice 错误图标（动态 GIF）
await sendNotification({
	message: "操作失败",
	icon: IconPreset.ALICE_ERROR,
});

// ✨ 使用 Alice 超时图标（动态 GIF）
await sendNotification({
	message: "任务超时",
	icon: IconPreset.ALICE_TIMEOUT,
});

// 使用传统成功图标（静态）
await sendNotification({
	message: "操作成功",
	icon: IconPreset.SUCCESS,
});

// 使用警告图标
await sendNotification({
	message: "警告消息",
	icon: IconPreset.WARNING,
});

// 使用错误图标
await sendNotification({
	message: "错误消息",
	icon: IconPreset.ERROR,
});

// 使用信息图标
await sendNotification({
	message: "提示消息",
	icon: IconPreset.INFO,
});

// 使用时钟图标（长任务）
await sendNotification({
	message: "任务运行中",
	icon: IconPreset.CLOCK,
});
```

**✨ Alice 图标系列（推荐）**：

- `IconPreset.ALICE_SUCCESS` - Alice 成功图标（动态 GIF）
- `IconPreset.ALICE_ERROR` - Alice 错误图标（动态 GIF）
- `IconPreset.ALICE_TIMEOUT` - Alice 超时图标（动态 GIF）
- 更加生动可爱，提供更好的视觉体验

### 组合使用音效和图标

```typescript
import { sendNotification, SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

// ✨ 成功通知（音效 + Alice 图标）
await sendNotification({
	title: "任务完成",
	message: "项目构建完成，耗时 2分30秒",
	sound: SoundPreset.SUCCESS,
	icon: IconPreset.ALICE_SUCCESS,
});

// 错误通知（音效 + 图标）
await sendNotification({
	title: "构建失败",
	message: "TypeScript 编译错误",
	sound: SoundPreset.ERROR,
	icon: IconPreset.ERROR,
});
```

## 使用自定义资源

### 指定具体文件

```typescript
import { sendNotification } from "@ruan-cat/claude-notifier";

// 指定预设文件夹内的具体文件
await sendNotification({
	message: "任务完成",
	sound: "manbo/01.mp3", // 使用 manbo 预设文件夹的 01.mp3
	icon: "success/custom.png", // 使用 success 预设文件夹的 custom.png
});
```

### 使用自定义路径

```typescript
import { sendNotification } from "@ruan-cat/claude-notifier";

// 使用自定义文件路径
await sendNotification({
	message: "任务完成",
	sound: "C:/Users/YourName/sounds/custom.mp3",
	icon: "C:/Users/YourName/icons/custom.png",
});
```

## 长任务管理（基于 cwd）

### 添加或重置任务

```typescript
import { addOrResetTask } from "@ruan-cat/claude-notifier";

// 为当前工作目录添加或重置任务
const cwd = process.cwd();
addOrResetTask(cwd);
```

### 删除任务

```typescript
import { removeTask } from "@ruan-cat/claude-notifier";

// 删除指定 cwd 的任务
const cwd = process.cwd();
removeTask(cwd);
```

### 查询任务状态

```typescript
import { getTaskState, getAllTaskStates, formatTimeDiff } from "@ruan-cat/claude-notifier";

// 获取指定 cwd 的任务状态
const cwd = process.cwd();
const state = getTaskState(cwd);

if (state) {
	const timeDiff = formatTimeDiff(state.startTime);
	console.log(`任务已运行: ${timeDiff}`);
	console.log(`已触发的提醒: ${state.triggeredIndexes.join(", ")} 分钟`);
} else {
	console.log("当前无运行中的任务");
}

// 获取所有任务状态
const allTasks = getAllTaskStates();
for (const [cwd, task] of Object.entries(allTasks)) {
	console.log(`CWD: ${cwd}`);
	console.log(`  运行时长: ${formatTimeDiff(task.startTime)}`);
	console.log(`  已触发: ${task.triggeredIndexes.length} 次`);
}
```

### 检查并通知任务

```typescript
import { checkAndNotifyTask, checkAndNotifyAllTasks } from "@ruan-cat/claude-notifier";

// 检查并通知指定 cwd 的任务
const cwd = process.cwd();
const notificationsSent = await checkAndNotifyTask(cwd);
console.log(`发送了 ${notificationsSent} 条通知`);

// 检查并通知所有任务
const totalNotifications = await checkAndNotifyAllTasks();
console.log(`总共发送了 ${totalNotifications} 条通知`);

// 自定义提醒间隔
const customNotifications = await checkAndNotifyAllTasks([5, 10, 15, 20]);
```

### 清理过期任务

```typescript
import { cleanupExpiredTasks } from "@ruan-cat/claude-notifier";

// 清理超过 8 小时的任务
const cleanedCount = cleanupExpiredTasks();
console.log(`已清理 ${cleanedCount} 个过期任务`);
```

## 完整示例

### 示例 1：构建任务的通知

```typescript
import { sendNotification, SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

async function buildProject() {
	console.log("开始构建项目...");

	try {
		// 执行构建
		await executeBuild();

		// 发送成功通知
		await sendNotification({
			title: "构建任务",
			message: "项目构建完成 ✓",
			sound: SoundPreset.SUCCESS,
			icon: IconPreset.SUCCESS,
		});
	} catch (error) {
		// 发送失败通知
		await sendNotification({
			title: "构建任务",
			message: `构建失败: ${error.message}`,
			sound: SoundPreset.ERROR,
			icon: IconPreset.ERROR,
		});
	}
}

buildProject();
```

### 示例 2：测试结果的通知

```typescript
import { sendNotification, SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

async function runTests() {
	const results = await executeTests();

	if (results.passed === results.total) {
		// 所有测试通过
		await sendNotification({
			title: "测试结果",
			message: `✓ 所有测试通过 (${results.total}/${results.total})`,
			sound: SoundPreset.SUCCESS,
			icon: IconPreset.SUCCESS,
		});
	} else {
		// 有测试失败
		await sendNotification({
			title: "测试结果",
			message: `⚠️ 有 ${results.failed} 个测试失败 (${results.passed}/${results.total} 通过)`,
			sound: SoundPreset.WARNING,
			icon: IconPreset.WARNING,
		});
	}
}

runTests();
```

### 示例 3：长任务管理（基于 cwd）

```typescript
import {
	addOrResetTask,
	removeTask,
	checkAndNotifyAllTasks,
	sendNotification,
	SoundPreset,
	IconPreset,
} from "@ruan-cat/claude-notifier";

async function processLargeDataset() {
	const cwd = process.cwd();

	// 添加任务
	addOrResetTask(cwd);

	try {
		// 执行长时间任务
		await processData();

		// 任务完成，删除任务
		removeTask(cwd);

		// 发送完成通知
		await sendNotification({
			title: "数据处理",
			message: "数据处理完成 ✓",
			sound: SoundPreset.SUCCESS,
			icon: IconPreset.SUCCESS,
		});
	} catch (error) {
		// 出错，删除任务
		removeTask(cwd);

		// 发送错误通知
		await sendNotification({
			title: "数据处理",
			message: `处理失败: ${error.message}`,
			sound: SoundPreset.ERROR,
			icon: IconPreset.ERROR,
		});
	}
}

// 在后台定期检查并通知
setInterval(async () => {
	await checkAndNotifyAllTasks([5, 10, 20, 30]);
}, 30000); // 每 30 秒检查一次

processLargeDataset();
```

**注意**：对于 Claude Code hooks 场景，推荐使用 `check-and-notify` 命令，它会自动处理任务的创建、检查和删除。

### 示例 4：文件监控器

```typescript
import { watch } from "fs";
import { sendNotification, SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

// 监控文件变化
watch("./src", { recursive: true }, async (eventType, filename) => {
	if (eventType === "change") {
		await sendNotification({
			title: "文件监控器",
			message: `文件已更新: ${filename}`,
			sound: SoundPreset.DEFAULT,
			icon: IconPreset.INFO,
		});
	}
});
```

### 示例 5：API 请求超时的通知

```typescript
import { sendNotification, SoundPreset, IconPreset } from "@ruan-cat/claude-notifier";

async function fetchWithTimeout(url: string, timeout = 5000) {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);

		return response;
	} catch (error) {
		if (error.name === "AbortError") {
			// 请求超时
			await sendNotification({
				title: "API 请求",
				message: `请求超时: ${url}`,
				sound: SoundPreset.ERROR,
				icon: IconPreset.ERROR,
			});
		}
		throw error;
	}
}

fetchWithTimeout("https://api.example.com/data");
```

## 高级用法

### 1. 资源路径配置

如果需要直接获取资源路径配置：

```typescript
import { resolveSoundConfig, resolveIconConfig } from "@ruan-cat/claude-notifier";

// 解析音频配置
const soundPath = resolveSoundConfig("manbo");
console.log(soundPath); // 输出 sounds/manbo/main.mp3

// 解析图标配置
const iconPath = resolveIconConfig("success");
console.log(iconPath); // 输出 icons/success/icon.png
```

### 2. 使用命令创建器

```typescript
import { createTaskCompleteCommand } from "@ruan-cat/claude-notifier";
import { Command } from "commander";

// 创建自定义 CLI
const program = new Command();
program.addCommand(createTaskCompleteCommand());
program.parse();
```

## 错误处理

```typescript
import { sendNotification, SoundPreset } from "@ruan-cat/claude-notifier";

try {
	await sendNotification({
		message: "测试通知",
		sound: SoundPreset.SUCCESS,
	});
	console.log("通知发送成功");
} catch (error) {
	console.error("通知发送失败:", error);
}
```

## TypeScript 类型

所有类型定义都已导出：

```typescript
import type {
	NotificationOptions,
	LongTaskOptions,
	TaskCompleteOptions,
	TimeoutOptions,
	ErrorOptions,
	TaskState,
	TimerStateFile,
	HookInputData,
	SoundPreset,
	IconPreset,
} from "@ruan-cat/claude-notifier";

// TaskState - 单个任务的状态
interface TaskState {
	cwd: string;
	addedTime: string; // 语义化时间字符串
	startTime: string; // 语义化时间字符串
	lastCheckTime: string; // 语义化时间字符串
	triggeredIndexes: number[]; // 已触发的分钟值数组
}

// TimerStateFile - 定时器状态文件结构
interface TimerStateFile {
	tasks: Record<string, TaskState>;
}

// HookInputData - Claude Code hooks 输入数据
interface HookInputData {
	session_id: string;
	cwd?: string;
	hook_event_name?: string;
	stop_hook_active?: boolean;
	// ... 其他字段
}
```

## 最佳实践

1. **平台检查**：当前版本仅支持 Windows 系统
2. **异步等待**：所有通知函数都是异步的，确保正确使用 `await`
3. **资源文件**：请确保音频和图标文件存在，并正确处理错误日志
4. **定时器清理**：使用长任务定时器时，确保在任务结束时调用停止函数
