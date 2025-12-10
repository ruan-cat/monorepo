---
"@ruan-cat/commitlint-config": minor
---

修复 negation pattern 处理错误

**核心修复：**

- 在 `src/utils.ts` 和 `src/get-default-scope.ts` 中添加对 negation patterns（以 `!` 开头）的过滤逻辑
- negation patterns 由 pnpm 自身处理，不应传递给 glob 工具

**防御性改进：**

- 添加文件路径验证，确保匹配结果以 `package.json` 结尾
- 添加 JSON 内容验证，确保文件内容以 `{` 开头
- 使用 try-catch 包装 `JSON.parse()` 调用，防止解析非 JSON 文件时崩溃
- 使用 consola 输出详细的警告和错误信息

**测试覆盖：**

- 新增 `src/tests/negation-pattern.test.ts` 测试文件
- 验证 negation patterns 过滤逻辑
- 验证防御性检查的有效性

此修复解决了在包含 negation patterns 的 `pnpm-workspace.yaml` 配置中，使用 `cz` 命令时出现的 JSON 解析错误问题。
