---
"@ruan-cat/claude-notifier": minor
---

新增 `interaction-needed` 通知类型，用于 Claude Code 的 Notification 钩子事件

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
