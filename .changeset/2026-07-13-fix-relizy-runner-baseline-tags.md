---
"@ruan-cat/utils": patch
---

1. 修复 `relizy-runner` 在 relizy independent 模式首次发版时缺少基线 tag 会直接中断的问题。
2. `relizy-runner` 现在会按当前子包版本自动准备 annotated baseline tags，减少首次接入 relizy 时的人工补 tag 成本。
3. 在 `--dry-run` 或 `--no-commit` 禁写场景下保持只提示兜底命令，不会产生实际 tag 写入。
