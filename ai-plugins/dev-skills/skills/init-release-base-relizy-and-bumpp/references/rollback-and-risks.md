# 回滚与止损

## 立即停止落盘

- `private` 风险未获批准。
- tag 历史不足以支撑首次 `independent` release，且用户不接受补 tag。
- 上游 relizy 升级导致兼容矩阵失效且未重新评估。

## 降级模式

- 仅输出方案与差异说明，不自动写文件，**直至**用户确认风险。

## 长期风险

- 上游修复 Windows 行为后，应评估移除 patch 或简化对 `relizy-runner` / `@ruan-cat/utils` 的依赖（若上游已等价覆盖）。
- 发版工具并存时，避免重复 bump 与 changelog 冲突。
