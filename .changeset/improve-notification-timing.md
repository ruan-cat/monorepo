---
"@ruan-cat/claude-notifier": minor
---

改进通知逻辑和事件处理

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
