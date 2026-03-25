---
"@ruan-cat/utils": minor
---

1. `relizy-runner` 对 `release` 与 `bump` 子命令默认在调用 relizy 前自动追加 `--yes`，避免 bump 前交互确认在非 TTY 或 CI 中阻塞。
2. 新增 runner 专用参数 `--no-yes`：不转发给 relizy，用于关闭上述自动注入并在本地保留人工确认。
3. 导出 `prepareRelizySpawnArgs` 供程序拼装参数；说明文档与测试已同步更新。
