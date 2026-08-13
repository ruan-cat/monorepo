# 2026-08-13 CP-05 production smoke

本证据由 Codex（GPT-5）记录。

## 2026-08-13 同提交候选到生产验证

- Preview 候选构建 `dadd3803-b8d0-4a14-a80c-c932551b4167` 已先对提交 `99bd0c9d954f34d227b4c137c158d2cf0f605fc0` 成功完成并通过 Preview smoke。
- 生产触发器随后以同一分支和精确提交 SHA 创建构建 `d20ace4e-373b-4365-a9a2-689c6e343096`，状态为 `success`。
- active production endpoint：`https://skill-router-mcp.1219043956.workers.dev`。
- `/health` 返回 HTTP 200、MCP SemVer `0.1.0`、build SHA `99bd0c9d954f34d227b4c137c158d2cf0f605fc0`，并返回当前 Worker version `e01b1d93-bca5-4276-b355-8f7325ea7bca` 与版本时间戳。
- production smoke 已通过：health、MCP 初始化、tools/list、get_server_info、known-skill 搜索和精确 SHA 的 pinned load；server metadata 与 health 的 SemVer/build SHA 一致。
- 可回退的前一稳定 Worker version 为 `ad1102d4-647d-4bed-9be2-6bae1a407b2b`。尚未执行回滚演练，不能把该记录当作 5.5 完成证据。
