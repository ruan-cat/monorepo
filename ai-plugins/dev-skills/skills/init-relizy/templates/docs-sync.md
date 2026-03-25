# README 发版章节（模板）

将以下段落合并到根 `README.md` 已有「发版」或新建章节（标题可本地化）。

## 标题示例

`## 发版（Relizy）`

## 建议小节

1. **适用场景**：本仓库使用 relizy + changelogen 管理 monorepo 版本与 changelog。
2. **常用命令**（与实际 `package.json` 一致）：
   - `pnpm run changelog` — 生成/预览 changelog（dry-run 见下）。
   - `pnpm run release` — 发版（若使用 `relizy-runner`，写明与 `package.json` 一致的命令）。
3. **首次接入**：若使用 `independent`，说明需先具备 package baseline tags（见技能 references/baseline-tags.md）。
4. **安全变体**：dry-run 与 `--no-publish`、`--no-push` 等标志的含义。
5. **`--yes`（非交互）**：说明发版/预览脚本中**显式传递** `--yes` 是为了跳过 relizy 确认提示、避免 CI 与 `pnpm` 脚本挂起；需要本地逐步确认时说明可使用 `relizy-runner` 的 `--no-yes`（见 `packages/utils/.../relizy-runner/index.md`）。
6. **兼容说明**：若使用 `@ruan-cat/utils` 的 `relizy-runner` 或 `pnpm patch`，说明**为何需要**、**不负责**改变 relizy 语义，仅解决平台/调用链问题。
7. **与 CHANGELOG 的关系**：根 `CHANGELOG.md` 与子包 changelog 的生成规则；README 不替代 changelog 文件。

## 禁止

- 不要写与脚本不一致的命令。
- 不要把 `rootChangelog: true` 误描述为「会改 README」。
