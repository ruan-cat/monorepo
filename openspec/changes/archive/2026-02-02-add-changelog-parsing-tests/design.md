## Context

`packages/release-toolkit/src/plugins/changelog-with-changelogen.ts` 当前是一个包含大量内部逻辑的文件。主要的格式化逻辑在 `formatCommitToChangelogLine` 函数中，但它未被导出。

## Goals / Non-Goals

**Goals:**

- 使核心格式化逻辑可测试。
- 添加全面的单元测试覆盖率。
- 确保不破坏现有的插件接口。

**Non-Goals:**

- 重构整个插件架构。
- 修改日志生成的最终输出格式（除非发现它是错误的）。

## Decisions

### Decision 1: 导出内部函数用于测试

我们将修改 `packages/release-toolkit/src/plugins/changelog-with-changelogen.ts`，为 `formatCommitToChangelogLine` 函数添加 `export` 关键字。
**重要**：必须添加注释说明该导出仅用于测试目的，不属于公共 API 的一部分。

### Decision 2: 使用 Vitest 进行测试

我们将遵循 monorepo 的标准，使用 Vitest 编写测试。测试文件将位于 `packages/release-toolkit/src/tests/changelog-parsing.test.ts`。

### Decision 3: Mock 数据策略

我们将手动构造 `GitCommit` (来自 `changelogen` 类型) 对象作为测试输入，而不是依赖真实的 git 仓库或历史。这确保了测试是纯粹的单元测试，运行速度快且稳定。
