# Kimi Desktop（Daimon）内置技能污染案例

本文件是 `install-skills` 技能「Kimi Desktop（Daimon）污染排查与清除」章节的参考案例：记录污染机制、证据路径与首次清除记录，供未来排查复用。

## 事件结论

2026-07-17 20:31，Kimi Desktop 首次供应 Daimon 运行时（版本 0.5.45）时，`kimi-daimon setup` 执行固定步骤 `Prepare: copying built-in skills.`，把 32 个内置技能写入规范源目录 `~/.agents/skills`。这些技能：

- 不是 `skills` CLI 安装的；全局注册表中 `source` / `sourceUrl` / `sourceType` 均为空。
- 被记录在 `~/.agents/skills/.daimon-managed-builtin-skills.json` 中；该文件既是污染标记文件，也是清除黑名单来源。
- 对所有读取 `~/.agents/skills` 的 agent 可见，并随目录级链接扩散到每个已验证同步平台。

## 证据路径

- 供应日志：`~/AppData/Roaming/kimi-desktop/daimon-share/daimon/provision.log`（含 `kimi-daimon setup` 命令行与 `copying built-in skills` 步骤）。
- 污染标记文件与黑名单：`~/.agents/skills/.daimon-managed-builtin-skills.json`（含 `skills` 数组、`sourceRoot`、`updatedAt`）。
- 版本标记：`~/AppData/Roaming/kimi-desktop/daimon-share/daimon/.kimi-provisioned`。
- 捆绑技能源：以标记文件 `sourceRoot` 为准，通常为 `~/AppData/Roaming/kimi-desktop/daimon-bundle/app/daimon/assets/builtin-skills`。
- 注意：`~/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills` 是指向 `~/.agents/skills` 的目录级链接；清除结果会同步反映到 Kimi 自己的技能面。

## 首次清除记录（2026-08-31）

- 按标记文件黑名单删除 32 个真实目录，全部为实体目录，零符号链接、零遗漏。
- 取证时 30 个技能的 `SKILL.md` 与捆绑源逐字节一致；`kimi-webbridge`、`seaborn-visualization` 内容漂移（被 Kimi 后续更新覆写），仍按黑名单删除。
- `skill-creator` 在污染时已被 Daimon 内置版覆盖；用户如需 Anthropic 版本，需通过 `skills add` 流程重装。
- 删除标记文件后，全局目录从 118 条恢复为 86 条，各链接平台同步反映。

## 复发风险

`copying built-in skills` 是 `kimi-daimon setup` 的固定步骤；Kimi Desktop 更新或重新供应时可能再次写入内置技能并重建标记文件。出现复发时，按 `SKILL.md` 正文的清除流程重新执行。
