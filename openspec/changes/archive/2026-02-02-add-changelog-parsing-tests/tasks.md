## 1. Prepare Code for Testing

- [x] 1.1 修改 `packages/release-toolkit/src/plugins/changelog-with-changelogen.ts`:
  - 导出 `formatCommitToChangelogLine` 函数。
  - 添加注释说明仅用于测试。

## 2. Implement Tests

- [x] 2.1 创建 `packages/release-toolkit/src/tests/changelog-parsing.test.ts`。
- [x] 2.2 实现 "Requirement: 解析标准 Conventional Commits" 的测试用例。
- [x] 2.3 实现 "Requirement: 解析 Emoji 风格提交" 的测试用例。
- [x] 2.4 实现 "Requirement: 解析 Breaking Changes" 的测试用例。
- [x] 2.5 实现 "Requirement: 生成链接" 的测试用例。

## 3. Verify

- [x] 3.1 运行测试并确保全部通过: `pnpm test run packages/release-toolkit/src/tests/changelog-parsing.test.ts`
