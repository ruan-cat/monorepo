# 2026-08-13 CP-05 rollback exercise

本证据由 Codex（GPT-5）记录。用户已授权线上短时流量切换；本次只切换已记录的 Worker 版本，不修改 Git 历史或 Skill 内容。

## 2026-08-13 稳定版本回滚与恢复

- 当前版本：`e01b1d93-bca5-4276-b355-8f7325ea7bca`，构建 SHA `99bd0c9d954f34d227b4c137c158d2cf0f605fc0`。
- 稳定版本：`ad1102d4-647d-4bed-9be2-6bae1a407b2b`，构建 SHA 相同。
- 使用 Wrangler `versions deploy` 将稳定版本切换到 100% 流量；切换后 `/health` 返回 200，Worker 版本为稳定版本；只读 MCP smoke（initialize、tools/list、get_server_info、search→pinned-load）通过。
- 使用同一命令将当前版本恢复到 100% 流量。等待边缘传播后，带随机查询参数的 `/health` 返回 200，Worker 版本恢复为 `e01b1d93-bca5-4276-b355-8f7325ea7bca`；生产 smoke 再次通过。
- 过程中没有触发 Git 回退，也没有将 Skill 内容故障误记为 Worker 版本回滚。
