# 架构文档

本文档详细说明 `@ruan-cat/claude-notifier` 的架构设计、技术选型和模块职责。

## 概述

`@ruan-cat/claude-notifier` 是一个基于 Node.js 的系统通知工具，专门为 Claude Code 设计。它运行在 Windows 平台上，提供系统通知、定时提醒和自定义配置功能。

## 技术栈

- **语言**: 纯 TypeScript
- **构建工具**: tsup（基于 esbuild）
- **CLI 框架**: commander
- **通知**: node-notifier
- **日志**: consola
- **运行环境**: Node.js 18+

## 目录结构

```plain
packages/claude-notifier/
├── src/                          # 源代码目录
│   ├── cli.ts                    # CLI 主入口（含 shebang）
│   ├── index.ts                  # 导出模块主文件
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts              # 所有类型定义
│   │
│   ├── core/                     # 核心模块
│   │   ├── notifier.ts           # 通知核心逻辑
│   │   └── timer.ts              # 长任务定时器
│   │
│   ├── commands/                 # CLI 子命令
│   │   ├── task-complete.ts      # 任务完成命令
│   │   ├── long-task.ts          # 长任务命令
│   │   ├── timeout.ts            # 超时通知命令
│   │   └── error.ts              # 错误通知命令
│   │
│   ├── config/                   # 配置模块
│   │   ├── sounds.ts             # 音频配置
│   │   ├── icons.ts              # 图标配置
│   │   └── utils.ts              # 配置工具函数（路径查找等）
│   │
│   ├── assets/                   # 静态资源
│   │   ├── sounds/               # 音频（分预设文件夹）
│   │   │   ├── success/
│   │   │   ├── warning/
│   │   │   ├── error/
│   │   │   └── manbo/
│   │   └── icons/                # 图标（分预设文件夹）
│   │       ├── success/
│   │       ├── warning/
│   │       ├── error/
│   │       ├── info/
│   │       └── clock/
│   │
│   └── docs/                     # 架构文档
│       ├── architecture.md       # 本文档
│       ├── how-to-add-assets.md  # 资源添加指南
│       └── use/                  # 使用文档
│           ├── api.md            # API 使用指南
│           ├── cli.md            # CLI 使用指南
│           └── claude-code.md    # Claude Code 配置指南
│
├── dist/                         # 构建输出目录
│   ├── cli.cjs                   # CLI 可执行文件
│   ├── cli.d.cts                 # CLI 类型定义
│   ├── index.cjs                 # 主模块
│   ├── index.d.cts               # 主模块类型定义
│   └── assets/                   # 复制的静态资源
│
├── tsup.config.ts                # tsup 构建配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 包配置
└── README.md                     # 主文档
```

## 核心模块说明

### 1. CLI 入口 (`src/cli.ts`)

**职责**：CLI 命令行工具的主入口，在 commander 框架上注册所有子命令。

**关键代码**：

```typescript
const program = new Command();
program.name("@ruan-cat/claude-notifier").description("Claude Code 的通知工具").version(version);

// 注册子命令
program.addCommand(createTaskCompleteCommand());
program.addCommand(createLongTaskCommand());
program.addCommand(createTimeoutCommand());
program.addCommand(createErrorCommand());

program.parse();
```

### 2. 导出模块 (`src/index.ts`)

**职责**：对外提供编程式 API 接口。

**导出内容**：

- 所有 TypeScript 类型定义
- 核心函数（sendNotification, quickNotify）
- 长任务管理 API（addOrResetTask, removeTask, checkAndNotifyTask 等）
- 配置模块（resolveSoundConfig, resolveIconConfig）
- 子命令创建函数（供高级用户使用）

### 3. 通知核心 (`src/core/notifier.ts`)

**职责**：封装 node-notifier，提供统一的系统通知接口。

**核心函数**：

```typescript
export async function sendNotification(options: NotificationOptions): Promise<void>;
export async function quickNotify(message: string, title?: string): Promise<void>;
```

**特性**：

- 默认通知持续 2.5 秒
- 自动图标配置
- 处理文件不存在的容错逻辑
- 仅支持 Windows 平台

### 4. 长任务管理器 (`src/core/timer.ts`)

**职责**：基于 cwd 管理长任务的定时提醒。

**工作机制**：

- 使用当前工作目录（cwd）作为任务唯一标识
- 在 JSON 文件中保存所有任务状态
- 通过 `check-and-notify` 命令进行高频检查（由 Claude Code hooks 触发）
- 根据 `hook_event_name` 智能处理不同事件：
  - SessionStart: 跳过通知
  - UserPromptSubmit: 无条件删除旧任务并创建新任务
  - SessionEnd: 删除任务
  - Stop/SubagentStop: 删除任务
  - 其他事件: 检查并通知
- 自动清理超过 8 小时的过期任务
- lastCheckTime 立即保存，防止重复通知（10 秒内不重复检查）

**状态文件位置**：`os.tmpdir() + "/.claude-notifier-timer.json"`

**状态文件格式**（基于 cwd）：

```json
{
	"tasks": {
		"D:\\code\\project1": {
			"cwd": "D:\\code\\project1",
			"addedTime": "2025-01-15 10:30:00",
			"startTime": "2025-01-15 10:30:00",
			"lastCheckTime": "2025-01-15 10:35:00",
			"triggeredIndexes": [6]
		}
	}
}
```

### 5. 资源配置 (`src/config/`)

**配置逻辑**：文件夹预设模式

- 每个预设对应一个文件夹（如 `manbo`）
- 支持指定具体文件（如 `manbo/01.mp3`）
- 查找默认文件的优先级（`main.mp3` > `index.mp3` > `default.mp3`）

#### 5.1 配置工具模块 (`src/config/utils.ts`)

**职责**：提供统一的资源路径查找逻辑，解决开发环境和生产环境的路径差异问题。

**核心函数**：

```typescript
export function findResourceDir(currentDirname: string, resourceType: string): string;
```

**路径查找策略**（按优先级）：

1. `dist/{resourceType}` - 生产环境（tsup publicDir 直接复制）
2. `dist/config/../{resourceType}` - 生产环境备用
3. `src/assets/{resourceType}` - 开发环境
4. `src/config/../assets/{resourceType}` - 开发环境备用
5. `dist/../../src/assets/{resourceType}` - 降级备用

**为什么需要多路径查找？**

在使用 tsup 打包时遇到的问题：

- tsup 的 `publicDir` 配置将 `src/assets/` 内容直接复制到 `dist/` （不是 `dist/assets/`）
- tsup 将 ESM 转 CJS 时，所有 `import.meta.url` 都指向入口文件的 URL
- 导致所有模块的 `__dirname` 都指向 `dist/` 而不是 `dist/config/`

通过多路径尝试，确保在各种环境下都能找到正确的资源目录。

## 设计决策

### 为什么使用文件夹预设方式？

- 允许每个预设包含多个可选文件
- 允许用户自定义预设并指定文件
- 允许灵活扩展

### 为什么使用基于 cwd 的任务管理？

- 支持多个工作目录同时运行独立任务
- 通过 Claude Code hooks 的高频触发实现检查（避免后台进程）
- 使用 hook_event_name 智能判断当前应该执行的操作
- 更简单的状态管理，无需管理 session_id
- 防止重复通知：lastCheckTime 立即保存，10 秒内不重复检查

### 为什么删除了基于 session_id 的旧 API？

- 旧的基于 session_id 的设计已被基于 cwd 的设计完全替代
- 新设计更简洁、更可靠，避免了 session_id 管理的复杂性
- 移除废弃代码减少维护成本
- 用户应该迁移到新的 API（addOrResetTask、checkAndNotifyTask 等）

### 为什么默认格式是 MP3？

- 允许其他格式（如 WAV）
- 兼容性好
- 文件体积小
- 满足 Windows node-notifier 的支持

## 执行流程

### CLI 执行流程

```plain
用户执行命令
  ↓
node dist/cli.cjs task-complete --sound manbo
  ↓
cli.ts 解析命令行参数
  ↓
执行 createTaskCompleteCommand()
  ↓
task-complete.ts 处理参数
  ↓
执行 sendNotification({...})
  ↓
notifier.ts 核心逻辑
  ↓
resolveSoundConfig("manbo") 调用
  ↓
findResourceDir(__dirname, "sounds") 查找资源目录
  ↓
解析出 sounds/manbo/main.mp3 的完整路径
  ↓
node-notifier 发送系统通知
```

### API 执行流程

```typescript
import { sendNotification } from "@ruan-cat/claude-notifier";

await sendNotification({
	title: "任务完成",
	message: "构建完成",
	sound: "success",
	icon: "success",
});
```

## 扩展性

### 添加新的通知场景

1. 在 `src/commands/` 创建新命令文件
2. 导出 `createXxxCommand()` 函数
3. 在 `src/cli.ts` 注册命令
4. 在 `src/index.ts` 导出命令

### 添加新的资源预设

1. 在 `src/assets/sounds/` 或 `icons/` 创建文件夹
2. 放入默认文件（`main.mp3` 或 `icon.png`）
3. 重新构建：`pnpm build`
4. 使用：`--sound my-preset` 或 `--icon my-preset`

## 未来计划

- [ ] 支持 macOS 和 Linux
- [ ] 支持更多通知场景（进度条）
- [ ] 支持通知交互性
- [ ] 扩展通知模板
- [ ] 外部配置文件支持（.notifierrc）
