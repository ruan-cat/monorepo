---
"@ruan-cat/utils": patch
---

1. 修复 `relizy-runner` 在 `changelog --dry-run --yes` 场景下会把 `--yes` 透传给上游 `relizy` 并触发非法参数报错的问题；现在 `changelog` 子命令下会兼容接受并忽略该参数。
2. 补充 `relizy-runner` 的参数规整回归测试，并同步更新 CLI 与脚本文档，明确 `release` / `bump` 的自动 `--yes` 注入行为，以及 `changelog --yes`、`--no-yes` 的语义。
