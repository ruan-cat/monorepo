---
"@ruan-cat/claude-notifier": patch
---

修复 Stop hooks 执行超时和逻辑错误问题

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
