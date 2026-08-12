# CRLF、并行 worker 与 Git Hook 事故分流

## CRLF 与插件加载不是同一故障

CRLF 幽灵修改使用分层治理：

1. `.gitattributes` 控制 Git index 的规范行尾。
2. `.editorconfig` 控制编辑器写入。
3. Prettier `endOfLine: "lf"` 控制格式化输出。
4. VSCode 工作区设置可作为编辑器侧补充。

只修改 `.gitattributes` 不会自动刷新已跟踪文件。`git add --renormalize .` 会修改暂存区，必须先展示影响并取得用户授权。

插件未加载则按版本、声明形态、运行入口和 pnpm 解析排查。不要因为 Markdown 中空格没有变化就直接修改行尾规则，也不要用 LF 修复掩盖 lint-md 静默失效。

## WorkTankWorkerError 演进

experimental CLI 的并行 worker 在特定 Windows、Node 和文件组合中曾崩溃并阻塞提交。最初只在 lint-staged 中增加 `--no-parallel`，却错误允许全量 `format` 保留并行；这留下了另一条可复发入口。

现行规则：所有活动的 `--experimental-cli` 命令都必须带且只带一个 `--no-parallel`。普通 CLI 不应无意义添加该 experimental 专用约束。

## Hook 与暂存区风险

- `pnpm exec lint-staged --debug` 会执行任务、改写文件并可能 stash，不是只读诊断。
- `pnpm exec simple-git-hooks` 会写入 `.git/hooks`。修改 Hook 配置不等于已安装。
- `git add --renormalize .` 会改变暂存区。
- 可选 post-commit 恢复命令可能覆盖同一文件的未暂存内容，默认禁止启用。
- Husky、lefthook、自定义 `core.hooksPath` 与 simple-git-hooks 同时出现时，必须先确认所有权，不能覆盖。

以上动作都需要用户明确授权，并在执行前后检查 `git status --short`、`git diff` 与 `git diff --cached`。
