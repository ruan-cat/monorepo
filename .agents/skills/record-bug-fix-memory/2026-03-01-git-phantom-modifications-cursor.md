# 本 monorepo 的 Git 状态与 Cursor「幽灵修改」

> 原始记录时间：2026-03。本条事故在 SKILL.md 中内嵌存放，后因 record-bug-fix-memory 升级至双层存储架构而拆分为独立案例文件。文件日期取原始记录月份的首日作为归档标记。

- **问题现象**：提交或处理完成后，`git status` 仍显示某文件为已修改（`M`），但 **`git diff` / `git diff HEAD` 无输出**；或侧栏/编辑器仍显示红绿 diff，与命令行不一致。用户易误判为「Git 坏了」或「仓库损坏」。
- **实际根因（多因叠加，需交叉验证）**：
  1. **索引与状态缓存**：全局启用 `core.fsmonitor`、`core.untrackedCache` 时，偶发出现「stat 认为变了、内容未变」；或对某文件执行 `git add` 后刷新索引，状态即恢复干净。
  2. **编辑器 / Cursor**：Diff 视图默认 **`diffEditor.maxComputationTime`** 约 5s，大仓库或大文件上 diff 算不完会导致**界面与真实 Git 状态脱节**（侧栏仍显示有改动）。
  3. **钩子与格式化**：`lint-staged` + Prettier 若在提交过程中改写文件，会产生**新的真实 diff**，需再次暂存/提交，勿与「幽灵」混淆。
  4. **误判 `git ls-files -v` 首字母**：在 Git 2.50+ 中 `-t` 下 **`H` 表示 cached（已缓存）**，勿与「assume-unchanged」混淆；空 diff 时勿仅凭首字母下结论。
- **关键线索**：`git hash-object <文件>` 与 `git rev-parse HEAD:<路径>` 若一致，则**工作区内容与最后一次提交一致**，问题在 UI 或索引缓存，而非内容丢失。
- **关键误导点**：以为「无 diff 却有 modified」一定是 CRLF；本案例中也可能是 **索引未刷新** 或 **IDE 未刷新**，需先区分命令行真值与 UI。
- **有效修复**：
  1. 命令行：对可疑文件执行 **`git add <路径>`** 或 **`git update-index --refresh`**，再 **`git status`**。
  2. 本仓库已在 **`.vscode/settings.json`** 增加：`diffEditor.maxComputationTime` 为 `0`、`git.ignoreLimitWarning`、`editor.colorDecoratorsLimit`（见提交 `1071cd6` 附近），减轻 Cursor/VS Code 侧假阳性。
  3. 排查时可临时：`git -c core.fsmonitor=false -c core.untrackedCache=false status` 对照。
- **验证方式**：修复后 **`git status` 干净**；**`git diff` 与 `git diff HEAD` 均为空**；需要时 **`git push` 后再次 `status`**，确认无配置文件被再次标改。
- **后续约束**：遇到「只有本仓库、别仓库没有」时，优先查 **本仓库 `.vscode/settings.json`**、**`.gitattributes`（eol=lf）** 与用户 **全局 `~/.gitconfig`**（fsmonitor、autocrlf），再怀疑 Git 安装损坏。
