## Why

`packages/release-toolkit` 中的 `changelog-with-changelogen` 插件包含复杂的提交消息解析逻辑（用于处理 Emoji、Conventional Commits 格式等）。

目前现有的测试 (`emoji-commit-parsing.test.ts`) 复制了正则表达式进行测试，而不是直接测试源码中的逻辑。这导致测试与实现可能脱节。我们需要一个真正的单元测试来覆盖核心解析逻辑，确保在重构或修改时不会破坏现有功能。

## What Changes

- 在 `packages/release-toolkit/src/tests/` 下创建一个新的测试文件 `changelog-parsing.test.ts`。
- 该测试将针对 `formatCommitToChangelogLine` 或其内部逻辑进行测试（可能需要导出这些内部函数以便测试，或者通过公共 API 测试）。
- 覆盖各种提交格式：
  - 标准格式：`feat(scope): message`
  - Emoji 格式：`✨ feat(scope): message`
  - 仅 Emoji：`✨ message`
  - Breaking Changes：`feat!: message` 或 `BREAKING CHANGE:`
  - 关联 Issue/Commit 链接

## Capabilities

### New Capabilities

- `changelog-parsing-verification`: 能够验证变更日志生成逻辑是否正确处理了各种复杂的提交消息格式。

### Modified Capabilities

<!-- No existing capabilities are being modified -->

## Impact

- `packages/release-toolkit/src/tests/changelog-parsing.test.ts`: 新增文件。
- `packages/release-toolkit/src/plugins/changelog-with-changelogen.ts`: 可能需要导出内部辅助函数以供测试（如 `createTypeEmojiMap`, `formatCommitToChangelogLine` 等）。
