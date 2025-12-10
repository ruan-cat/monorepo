<!--
	一次性提示词
	TODO: 未完成
 -->

# 处理匹配故障

在新的项目内，使用 `@ruan-cat/commitlint-config` 来触发提交，会出现错误。

完整的阅读 `https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-12-09-fix-commitlint-config-negation-pattern-bug.md` 报告。

1. 按照报告的以下部分的要求，来改造 `@ruan-cat/commitlint-config` 包的代码。
   - `4. 解决方案`
   - `7.2 中期行动（待完成）`
   - `7.3 长期行动（建议）`
   - `10.2 改进建议`
2. 编写简要的更新日志，发版标签为 minor 。

## 01 处理故障

我提交代码时，出现以下错误：

```log
✔ Backed up original state in git stash (2baf736)
⚠ Running tasks for staged files...
  ❯ lint-staged.config.js — 4 files
    ❯ * — 4 files
      ✖ prettier --experimental-cli --write [FAILED]
↓ Skipped because of errors from tasks.
✔ Reverting to original state because of errors...
✔ Cleaning up temporary files...

✖ prettier --experimental-cli --write:
[error] configs-package/commitlint-config/src/get-default-scope.ts: TypeError: Cannot read properties of undefined (reading 'value')
[error] configs-package/commitlint-config/src/tests/negation-pattern.test.ts:
TypeError: Cannot read properties of undefined (reading 'value')
[error] configs-package/commitlint-config/src/utils.ts: TypeError: Cannot read properties of undefined (reading 'value')
git exited with error code 1
```

执行 `lint-staged.config.js` 的 `prettier --experimental-cli --write` 回调命令时，出现错误，请帮我处理。
