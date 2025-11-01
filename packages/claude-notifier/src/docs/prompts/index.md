---
order: 8000
---

# 提示词

制作本库用到的一些提示词。仅作为阅读参考，与本库关联不大。

可以选择性的阅读。

## 01 处理文件类型报错

1. 阅读 `packages\claude-notifier\src\core\timer.ts` 文件，处理类型报错。
2. 编写发版日志，发版标签 patch 。说明该类型错误已修复。

## 02 处理长期调用通知，无法按时通知的故障

包 `packages\claude-notifier` 的 `@ruan-cat/claude-notifier long-task` 命令没有生效。long-task 在实际运行时，总是不生效的。

1. 请你检查 `packages\claude-notifier\src\core\timer.ts` 逻辑。一台电脑是会同时运行好多个 claude code 实例的，多个 claude code 实例修改一个`定时器状态文件` `.claude-notifier-timer.json` 时，是否会有冲突呢？你如何去区分多个并行运行的 claude code 对话任务呢？你用的 claude code 对话 id 是什么？从哪里获取？
2. 请你阅读 https://docs.claude.com/zh-CN/docs/claude-code/hooks 和 https://docs.claude.com/en/docs/claude-code/hooks 文档，我希望使用 node 的能力，读取 stdin 的 JSON 数据，重点使用 session_id 来实现多个 claude code 对话的区分。请你适当的开始改写其他相关代码逻辑，确保能够实现基于 session_id 的长任务标记管理。

我希望你以 session_id 来实现多任务，长时间任务的调度管控。

1. 数据获取机制： 对于 `@ruan-cat/claude-notifier` 通知工具，不管是什么任务，你都应该要接收来自 stdin 的 数据。
2. 任务区分机制： 针对 `定时器状态文件` `.claude-notifier-timer.json` ，你要用 session_id 来管控，维护每一个任务。默认记录好时长，并定时通知通告。
3. 新增任务机制： 你一定会高强度的获取到来自 claude code stdin 的 数据。这些数据内，你遇到新的 session_id 时，你就当做是有一个新的定时任务来了，并开始做好即时工作。
4. 删除任务机制： 在 `定时器状态文件` 记录任务时，一定要记录一个任务被添加至 `定时器状态文件` 的起始时间，一旦某个任务时间超过了 8 小时，你就无条件的删除掉这个任务。就认定这个任务已经结束了，不需要你维护管控了，当做是脏数据删除掉。你必须实现这个机制，实现对全部任务信息的记录与删除。必须实现这个删除机制，我不希望看到一个极端冗长的 `定时器状态文件` `.claude-notifier-timer.json` 。
5. 为 `@ruan-cat/claude-notifier` 设置一个特殊的命令，实现定时检查，主动通告。这个命令和现有的通知命令完全不同，不是用来实现主动通知的，而是专门来主动检查 `定时器状态文件` 的内部任务状态的。这个命令预期会配置给 claude code hooks 的多个钩子事件触发使用。这个命令是一个高频调用的命令。这个命令会主动的遍历 `定时器状态文件` 内的任务，并完成核心的计时判断，和通知。执行该命令时，至少会做以下事情：
   - 获取 session_id ，判断是否要加入新任务，还是旧任务。
   - 检查整个 `定时器状态文件` 的任务是否有超过 8 小时？超过就无条件删除。
   - 检查整个 `定时器状态文件` 的任务是否有到提醒时间的？到预设的时间就主动提醒。
   - 从输入内检查 hooks 的类型，stop_hook_active 为 true 时，就删掉对应 session_id 的任务。避免重复提醒。

请你先思考一下，以 ultrathink 模式认真思考。有疑问疑惑的，请你立刻询问我。我与你共同完善设计一个合适的任务新增、删除、通知机制。
