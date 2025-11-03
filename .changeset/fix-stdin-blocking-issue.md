---
"@ruan-cat/claude-notifier": patch
---

修复 stdin 阻塞导致进程挂起的问题

在高频调用 check-and-notify 命令时，readHookInput() 函数会永久等待 stdin 关闭事件，导致进程无法退出，累积大量未关闭的 npx 进程。

**修复内容：**

- 为 readHookInput() 添加 500ms 超时机制
- 超时后自动清理事件监听器，防止内存泄漏
- 确保进程能够正常退出

**影响范围：**

- 影响所有通过 Claude Code hooks 高频调用 check-and-notify 的场景
- Windows 系统下尤其明显（会看到大量未关闭的 npx.exe 进程）
