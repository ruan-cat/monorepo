# release-ai-plugins 详细契约

## CHANGELOG 示例

```markdown
## [5.0.0] - 2026-04-15

### Changed

- **init-release-base-relizy-and-bumpp**：`metadata.version` `1.1.1` -> `2.0.0`。
- 根包 changelog 默认链路从 `conventional-changelog` 收口到 `changelogen`。
- `templates/bump.config.ts` 改为 `execute(newVersion)`。
- 根级 marketplace 与六个 `plugin.json` 的版本统一至 `5.0.0`。
```

禁止把上述多个变化压缩成一条包含多个分号的长 bullet。

## Codex 字段矩阵

`marketplace.json`：

- 两个插件的 `name` 必须是 `common-tools` 和 `dev-skills`。
- `source.source` 必须为 `local`。
- `source.path` 必须分别为 `./ai-plugins/common-tools` 和 `./ai-plugins/dev-skills`。
- `policy.installation` 必须为 `AVAILABLE`。
- `policy.authentication` 必须为 `ON_INSTALL`。
- 必须存在非空 `category`，且不得存在 marketplace 级 `version` 字段。

`.codex-plugin/plugin.json`：

- 必须包含 `version` 和 `skills: "./skills"`。
- 禁止添加 Claude Code 专属的 `hooks`、`commands`、`agents`。
- `interface` 中面向用户的展示字段使用中文；技术标识可保留插件名和 `Codex`。

## 发布后 smoke test

在隔离或临时环境执行，完成后清理临时安装：

```powershell
codex plugin marketplace add <repo-root> --json
codex plugin list --available --json --marketplace ruan-cat-tools
codex plugin add common-tools@ruan-cat-tools --json
codex plugin add dev-skills@ruan-cat-tools --json
codex plugin remove common-tools@ruan-cat-tools --json
codex plugin remove dev-skills@ruan-cat-tools --json
codex plugin marketplace remove ruan-cat-tools --json
```
