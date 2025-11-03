---
"@ruan-cat/claude-notifier": minor
---

重构长任务管理：基于 cwd 的智能 hook 处理

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
