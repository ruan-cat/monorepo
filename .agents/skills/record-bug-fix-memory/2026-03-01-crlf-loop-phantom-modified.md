# Windows CRLF 残留导致「循环幽灵 modified」

> 原始记录时间：2026-03。本条事故在 SKILL.md 中内嵌存放，后因 record-bug-fix-memory 升级至双层存储架构而拆分为独立案例文件。文件日期取原始记录月份的首日作为归档标记。

- **问题现象**：`git status` 反复显示某文件 `modified`，但 `git diff` / `git diff HEAD` 无任何输出；`git add` 后暂时干净，下次打开 IDE 或系统事件触碰文件后又恢复 `modified`，形成循环，无论执行多少次 `git add` 都无法根治。
- **实际根因**：磁盘文件是 **CRLF 行尾**（物理大小较大），git blob 存的是 **LF**（较小），`.gitattributes` 明确要求 `eol=lf`。Git 校验 stat 缓存时同时比对 **mtime + size**：CRLF 文件比 LF blob 多 N 字节（每行多一个 `\r`），只要 mtime 一变（IDE 打开、杀毒扫描、系统事件），stat 必然 miss → 强制重新 hash。重新 hash 时 Git 先归一化 CRLF→LF 再计算，结果与 blob 一致 → diff 为空、文件「干净」；但 **Windows 上 Git 不总是把这次「重检后为干净」的结果回写 stat 缓存**，下次 `git status` 再次 miss，陷入死循环。
- **关键诊断信号**：运行 `git ls-files --eol <文件>`，看到 `i/lf  w/crlf  attr/text eol=lf` 即可确诊——index （blob） 是 LF，工作区是 CRLF，gitattributes 要求 LF。三个 hash（`git hash-object`、`git rev-parse :path`、`git rev-parse HEAD:path`）完全一致是正常的（hash 算时归一化过），**不能用 hash 相等否定 CRLF 残留**。
- **关键误导点**：三个 blob hash 完全一致 → 误以为内容无差异、问题在 IDE；`git diff` 为空 → 误以为 `assume-unchanged` 或 fsmonitor 问题。真正的关键是**物理文件大小**：CRLF 文件比 blob 大（差值 = 行数），只要 size 不同，stat miss 就永远无法靠缓存命中绕过。
- **有效修复**：
  1. 用 `git ls-files --eol | Select-String "w/crlf"` 列出所有受影响文件（本次 63 个）。
  2. 用 PowerShell 逐字节将这些文件从 CRLF 转换为 LF（不依赖 `git checkout`，因为 `git add --renormalize` 已刷新 stat 缓存后 checkout 会认为文件未变而跳过）。
  3. 执行 `git add --renormalize .` 刷新 index stat 缓存，使磁盘 LF 文件的 size 与 blob size 完全一致。
- **为何 `git checkout -- .` 无效**：`git add --renormalize .` 把 stat 缓存更新为 CRLF 文件的 size 后，`git checkout` 比对 stat 认为文件「未改变」，直接跳过写入，所以磁盘文件维持 CRLF 不变。必须先直接改磁盘字节，再刷新缓存。
- **验证方式**：`git ls-files --eol | Select-String "w/crlf"` 输出为空；`git status` 显示 `nothing to commit, working tree clean`；用 PowerShell 读文件字节确认 CRLF 计数为 0、文件大小与 blob size 一致。
- **后续约束**：遇到「反复幽灵 modified 且 diff 为空」时，**第一步先执行 `git ls-files --eol <文件>`**，看 `w/` 字段是否为 `crlf`；若是，则走 CRLF 字节转换流程，而不是反复 `git add` 或排查 IDE。本仓库 `.gitattributes` 已配置 `*.* text eol=lf`，CRLF 文件是历史遗留（可能来源于 Git 系统配置 `core.autocrlf=true` 曾短暂生效时的 checkout）。
