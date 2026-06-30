# 平台命令参考

> 当工作流程中使用 PowerShell 或 POSIX Shell 时，查阅此文件获取具体命令。

## PowerShell

- 读取远程 raw 文件：`(Invoke-WebRequest -UseBasicParsing '<raw-url>').Content`
- 预校验提交信息：`pnpm exec commitlint --edit commit-message.txt --strict`
- 删除临时文件：`Remove-Item -LiteralPath commit-message.txt`
- 删除临时文件（别名）：`del commit-message.txt`

## POSIX Shell (Bash / Zsh)

- 读取远程 raw 文件：`curl -fsSL '<raw-url>'`
- 预校验提交信息：`pnpm exec commitlint --edit commit-message.txt --strict`
- 删除临时文件：`rm -- commit-message.txt`

## 通用提示

- 对于包含中文的 commit message，始终使用 `git commit -F commit-message.txt`（避免 shell 参数编码问题）
- `--trailer` 参数在 PowerShell 和 POSIX Shell 下均可正常使用
