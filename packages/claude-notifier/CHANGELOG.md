# @ruan-cat/claude-notifier

## 0.8.1

### Patch Changes

- 修复 Stop hooks 执行超时和逻辑错误问题 ([`1b0b831`](https://github.com/ruan-cat/monorepo/commit/1b0b831c7171d7dd30435b801b76c07a90a62d5f))

  **核心修复**：
  1. **修复 check-and-notify 的 Stop 逻辑错误**
     - 移除对 `stop_hook_active === true` 的错误判断
     - 现在 Stop/SubagentStop 事件能正确删除任务，避免执行错误的"清理和通知"逻辑
     - 修复文件：`src/commands/check-and-notify.ts:160-176`
  2. **优化性能和超时问题**
     - 改进日志记录，增加 `stop_hook_active` 状态输出
     - 确保 Stop 阶段快速返回，不做任何通知处理

  **影响**：
  - 解决了 Claude Code Stop hooks 中 `check-and-notify` 无法正确清理任务的问题
  - 配合插件侧的 `cleanup-orphan-processes.sh` 优化，整体 Stop hooks 执行更稳定

## 0.8.0

### Minor Changes

- 改进 `check-and-notify` 命令的事件处理和日志功能 ([`3afa5d1`](https://github.com/ruan-cat/monorepo/commit/3afa5d12cfc4ff9222946421ee7436c5e683c829))

  ## 新增功能

  ### 事件处理增强
  - 新增 **SessionStart 事件**处理：跳过通知，避免会话启动时的干扰，立即返回不执行后续逻辑
  - 新增 **SessionEnd 事件**处理：删除任务并清理资源，不发送通知，确保会话结束时正确清理任务数据
  - 改进 **UserPromptSubmit 事件**处理：无条件删除旧任务并创建新任务，确保每次用户输入都重新计时

  ### 日志和性能监控
  - 新增详细的日志记录系统：
    - 日志文件保存在临时目录 `%TEMP%\claude-notifier-debug\`
    - 每次执行创建独立的日志文件 `check-and-notify-{timestamp}.log`
    - 日志包含时间戳、执行耗时、各阶段详细信息
  - 新增性能监控功能：
    - 记录 stdin 读取、任务清理、通知检查等各阶段的耗时
    - 输出总执行时间和各阶段耗时统计
    - 当总耗时接近或超过 5 秒时自动发出警告
  - 改进 `--verbose` 选项：同时输出到控制台和日志文件

  ## 文档更新
  - 更新 README.md，补充 SessionStart 和 SessionEnd 事件的说明
  - 更新 CLI 使用文档，新增日志功能和性能监控的详细说明
  - 更新工作机制说明，完善所有事件的处理流程

  ## 技术改进
  - 优化事件处理逻辑，根据不同的 `hook_event_name` 智能执行相应操作
  - 改进注释文档，提供更清晰的函数说明和参数描述
  - 增强错误处理和日志记录，便于调试和问题排查

## 0.7.0

### Minor Changes

- 新增 `interaction-needed` 通知类型，用于 Claude Code 的 Notification 钩子事件 ([`232b6c7`](https://github.com/ruan-cat/monorepo/commit/232b6c723855e92f2200451be9fa6c8682b3d2de))

  **新增功能：**
  - 新增 `InteractionNeededOptions` 类型定义
  - 新增 `interaction-needed` CLI 命令，用于发送需要交互的通知
  - 默认使用 `alice/timeout.gif` 图标和 `warning` 音效
  - 支持自定义消息、标题和交互详情

  **使用场景：**
  - 在 Claude Code 的 Notification 钩子中使用
  - 当 Claude 使用 AskUserQuestion 工具需要用户输入时
  - 需要用户确认或交互的场景

  **文档更新：**
  - 更新 CLI 使用文档，新增 `interaction-needed` 命令说明
  - 更新 Claude Code 配置文档，新增 Notification 钩子使用示例

## 0.6.1

### Patch Changes

- 修复 stdin 阻塞导致进程挂起的问题 ([`43b1265`](https://github.com/ruan-cat/monorepo/commit/43b1265decdbb1faae3e7fa89f85d7467b1ea043))

  在高频调用 check-and-notify 命令时，readHookInput() 函数会永久等待 stdin 关闭事件，导致进程无法退出，累积大量未关闭的 npx 进程。

  **修复内容：**
  - 为 readHookInput() 添加 500ms 超时机制
  - 超时后自动清理事件监听器，防止内存泄漏
  - 确保进程能够正常退出

  **影响范围：**
  - 影响所有通过 Claude Code hooks 高频调用 check-and-notify 的场景
  - Windows 系统下尤其明显（会看到大量未关闭的 npx.exe 进程）

## 0.6.0

### Minor Changes

- 改进通知逻辑和事件处理 ([`331ec73`](https://github.com/ruan-cat/monorepo/commit/331ec735f8d60800d579b68c7e0c14a7126735f3))

  ## 破坏性变更

  ### 删除废弃的 session_id API

  完全移除了所有基于 `session_id` 的废弃函数和类型定义，不再保留兼容性：
  - 删除函数：`loadAllSessions()`、`saveAllSessions()`、`addOrUpdateSession()`、`removeSession()`、`cleanupExpiredSessions()`、`checkAndNotifySession()`、`checkAndNotifyAll()`、`getSessionState()`、`getAllSessionStates()`
  - 删除类型：`TimerState`、`SessionTimerState`

  ## 新功能

  ### 增强的事件处理

  `check-and-notify` 命令现在支持更多 Claude Code 生命周期事件：
  - **SessionStart**：跳过通知，避免会话启动时的干扰
  - **UserPromptSubmit**：无条件删除旧任务并创建新任务，确保每次用户输入都重新计时
  - **SessionEnd**：删除任务，不做通知，确保会话结束时清理任务
  - **Stop/SubagentStop**：保持原有逻辑，删除任务

  ### 修复重复通知问题

  修复了 `lastCheckTime` 更新时机不当导致的重复通知问题：
  - **原有问题**：只有在发送通知后才保存 `lastCheckTime`，导致没有发送通知时更新丢失
  - **修复方案**：在通过 `MIN_CHECK_INTERVAL` 验证后立即更新并保存 `lastCheckTime`
  - **效果**：防止打开 Claude Code 后出现多次重复提醒

  ## 改进点
  1. **精准的事件分类**：SessionStart 和 UserPromptSubmit 阶段不做长任务提醒
  2. **更可靠的时间戳管理**：确保每次检查都会更新时间戳
  3. **更清晰的代码**：移除所有废弃代码，简化维护成本

## 0.5.0

### Minor Changes

- 重构长任务管理：基于 cwd 的智能 hook 处理 ([`f1f43cb`](https://github.com/ruan-cat/monorepo/commit/f1f43cbf6b44d6492b049caafff2237e46d06599))

  ## 破坏性变更

  ### 1. 数据结构变更
  - 状态文件从基于 `session_id` 改为基于 `cwd`
  - 时间字段从时间戳改为语义化字符串（YYYY-MM-DD HH:mm:ss）
  - `triggeredIndexes` 从存储索引改为存储分钟值（如 [6, 10]）
  - 删除了 `intervals`、`sound`、`icon` 字段

  ### 2. long-task 命令行为变更
  - 从"长任务管理命令"改为"纯样式化通知命令"
  - 移除了 `--stop`、`--status`、`--session-id`、`--intervals` 等选项
  - 新增 `--message` 选项用于自定义通知消息
  - 不再处理任何定时逻辑

  ### 3. check-and-notify 智能处理
  - 改为根据 `hook_event_name` 智能处理不同逻辑
  - UserPromptSubmit: 添加/重置任务
  - Stop/SubagentStop: 删除任务
  - 其他事件: 检查并通知
  - 新增 `--intervals` 选项支持自定义提醒间隔

  ## 新功能

  ### 1. 基于 cwd 的任务管理
  - 使用当前工作目录（cwd）作为任务唯一标识
  - 支持多个工作目录同时运行独立任务
  - 自动清理过期任务（超过 8 小时）

  ### 2. 精确时间差计算
  - 通知文本显示精确的"X 分 Y 秒"格式
  - 通知标题显示阶段信息（如"长任务提醒：6 分钟阶段"）
  - 使用 dayjs 进行时间格式化

  ### 3. 智能事件处理
  - check-and-notify 根据 hook_event_name 自动决定操作
  - 无需手动管理任务创建和删除
  - 适配 Claude Code hooks 的完整生命周期

  ## API 变更

  ### 新增 API
  - `addOrResetTask(cwd)` - 添加或重置任务
  - `removeTask(cwd)` - 删除任务
  - `checkAndNotifyTask(cwd, intervals)` - 检查并通知单个任务
  - `checkAndNotifyAllTasks(intervals)` - 检查并通知所有任务
  - `formatTime(timestamp)` - 格式化时间为语义化字符串
  - `parseTime(timeString)` - 解析时间字符串为时间戳
  - `formatTimeDiff(startTime, endTime)` - 计算时间差并格式化
  - `DEFAULT_INTERVALS` - 默认提醒间隔常量

  ### 废弃 API（保留空实现用于兼容）
  - `addOrUpdateSession()` - 请使用 `addOrResetTask()`
  - `removeSession()` - 请使用 `removeTask()`
  - `getSessionState()` - 请使用 `getTaskState()`
  - `getAllSessionStates()` - 请使用 `getAllTaskStates()`

  ## 依赖变更
  - 新增 `dayjs@^1.11.19` 用于时间格式化

  ## 迁移指南

  ### 更新 Claude Code hooks 配置

  ```json
  // 旧配置（不再推荐）
  {
    "hooks": {
      "SessionStart": [{
        "hooks": [{
          "command": "npx @ruan-cat/claude-notifier long-task"
        }]
      }]
    }
  }

  // 新配置（推荐）
  {
    "hooks": {
      "UserPromptSubmit": [{
        "hooks": [{
          "command": "npx @ruan-cat/claude-notifier check-and-notify"
        }]
      }],
      "Stop": [{
        "hooks": [{
          "command": "npx @ruan-cat/claude-notifier check-and-notify"
        }]
      }],
      "BeforeToolUse": [{
        "hooks": [{
          "command": "npx @ruan-cat/claude-notifier check-and-notify"
        }]
      }]
    }
  }
  ```

  ### 更新状态文件

  旧的状态文件将被自动忽略，新版本会创建新的数据结构。无需手动迁移。

  ### 更新 API 调用

  ```typescript
  // 旧 API（已废弃）
  import { addOrUpdateSession } from "@ruan-cat/claude-notifier";
  addOrUpdateSession(sessionId);

  // 新 API
  import { addOrResetTask } from "@ruan-cat/claude-notifier";
  addOrResetTask(cwd);
  ```

## 0.4.0

### Minor Changes

- # 重构长任务管理系统，支持多会话管理 ([`de4f5fe`](https://github.com/ruan-cat/monorepo/commit/de4f5fe87190c6ae66848e29490879aa48223ebb))

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

## 0.3.1

### Patch Changes

- 修复 timer.ts 中的类型错误，添加缺失的 DEFAULT_INTERVALS 常量定义 ([`c840569`](https://github.com/ruan-cat/monorepo/commit/c840569c61fa4fa2773af57a1ae09794bbd7dde3))

## 0.3.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

## 0.2.0

### Minor Changes

- 将默认图标更改为 Alice 版本 ([`4ab0797`](https://github.com/ruan-cat/monorepo/commit/4ab0797e04fe189b4b51b2d6e90ed391852a2885))

  **新功能**：
  - 添加了三个新的图标预设：`alice/success.gif`, `alice/error.gif`, `alice/timeout.gif`
  - 所有命令现在默认使用 Alice 风格的动态图标

  **具体变更**：
  - `task-complete` 命令：默认图标从 `success` 改为 `alice/success.gif`
  - `error` 命令：默认图标从 `error` 改为 `alice/error.gif`
  - `timeout` 命令：默认图标从 `error` 改为 `alice/timeout.gif`
  - `long-task` 命令：默认图标从 `clock` 改为 `alice/timeout.gif`

  **用户影响**：
  - 用户在不指定 `-i, --icon` 参数时，将自动使用 Alice 风格的动态 GIF 图标
  - 仍然支持通过 `-i` 参数指定其他预设图标或自定义图标路径
  - 旧的图标预设（success, warning, error, info, clock）仍然可用

### Patch Changes

- 修复云端环境中文档构建失败的问题 ([`590984f`](https://github.com/ruan-cat/monorepo/commit/590984f774e84b62869d81a42a95bb07e07092b4))

  在根包的 package.json 中添加 @ruan-cat/claude-notifier 作为 devDependencies，确保 turbo deploy-vercel 命令能够正确识别并执行该包的 build:docs 任务。

  **技术细节**：
  - Turbo 的 `^build:docs` 依赖解析基于 package.json 的依赖声明
  - 只有在根包中声明的工作区包才会被包含在根任务的依赖图中
  - 本次修复确保 GitHub Actions 工作流能够正确部署 claude-notifier 的文档站点

  **相关文档**：
  - 详细事故报告：docs/incident-reports/2025-10-28-claude-notifier-build-docs-failure.md

## 0.1.1

### Patch Changes

- 修复生产环境资源路径问题，并重构路径查找逻辑： ([`b3dbf75`](https://github.com/ruan-cat/monorepo/commit/b3dbf7563c3bed8e3a71892c1b39c810e5131ee8))
  - 修复：生产环境下无法找到 assets 内的图片和音频资源
  - 重构：提取公共的路径查找逻辑到 `src/config/utils.ts`
  - 新增：`findResourceDir()` 工具函数，统一处理开发环境和生产环境的路径差异
  - 优化：简化 `sounds.ts` 和 `icons.ts` 的代码，提升可维护性
  - 文档：更新 `architecture.md`，详细说明路径查找策略和技术背景

## 0.1.0

### Minor Changes

- 初始化本包。 ([`396eec8`](https://github.com/ruan-cat/monorepo/commit/396eec8b4a4634b116583d3ed784be05de0f7107))
  - 默认用小爱丽丝作为图标 icon。
  - 目前无法播出曼波的声音，自定义声音的功能疑似在 window10 系统内无法使用。
