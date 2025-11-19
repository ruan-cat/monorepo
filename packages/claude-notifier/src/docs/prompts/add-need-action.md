# 增加新的通知类型

对于 `packages\claude-notifier\package.json` 包而言，增加一个新的通知类型，`需要交互类型`。

请阅读以下几个类似的通知类型：

- packages\claude-notifier\src\commands\error.ts
- packages\claude-notifier\src\commands\task-complete.ts
- packages\claude-notifier\src\commands\timeout.ts

增加的新的通知类型，`需要交互类型`，和上述的交互逻辑差不多。预期在 claude code 的 `Notification` 钩子事件内使用。

## 通知用的图标

图标预设请使用 `IconPreset.ALICE_TIMEOUT` 。

## 及时更新文档

增加完毕后，请及时更新 `packages\claude-notifier\src\docs` 相关的说明文档。
