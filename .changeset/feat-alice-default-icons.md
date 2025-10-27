---
"@ruan-cat/claude-notifier": minor
---

将默认图标更改为 Alice 版本

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
