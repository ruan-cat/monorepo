# changelog-parsing-verification Specification

## Purpose

TBD - created by archiving change add-changelog-parsing-tests. Update Purpose after archive.

## Requirements

### Requirement: 解析标准 Conventional Commits

系统 MUST 正确解析符合标准 Conventional Commits 规范的提交信息。

#### Scenario: 解析带作用域的标准提交

- **WHEN** 提交信息为 `feat(auth): add login support`
- **THEN** 生成的日志行应包含 `feat` 对应的 emoji (如果有配置)
- **AND** 应包含加粗的类型 `**feat**`
- **AND** 应包含作用域 `(auth)`
- **AND** 应包含描述 `add login support`

#### Scenario: 解析无作用域的标准提交

- **WHEN** 提交信息为 `fix: crash on startup`
- **THEN** 生成的日志行应包含 `fix` 对应的 emoji
- **AND** 应包含加粗的类型 `**fix**`
- **AND** 不应包含括号包裹的作用域
- **AND** 应包含描述 `crash on startup`

### Requirement: 解析 Emoji 风格提交

系统 MUST 解析以 Emoji 开头的提交信息（gitmoji 风格）。

#### Scenario: 解析 Emoji 前缀的 Conventional Commits

- **WHEN** 提交信息为 `✨ feat(ui): update button styles`
- **THEN** 生成的日志行应保留 emoji `✨`
- **AND** 应识别出类型为 `feat`
- **AND** 应包含作用域 `(ui)`

#### Scenario: 解析仅 Emoji 的非标准提交

- **WHEN** 提交信息为 `🐛 fix typo`
- **THEN** 生成的日志行应保留 emoji `🐛`
- **AND** 尝试推断类型（如果可能）或作为普通文本处理

### Requirement: 解析 Breaking Changes

系统 MUST 识别破坏性变更标记。

#### Scenario: 解析感叹号标记的 Breaking Change

- **WHEN** 提交信息为 `feat!: remove legacy api`
- **THEN** 生成的日志行应包含 `**BREAKING**:` 标记

### Requirement: 生成链接

系统 MUST 为提交生成对应的链接（如果提供了 repo URL）。

#### Scenario: 包含提交哈希链接

- **WHEN** 解析提交且提供了 `repoUrl` 和 `commitHash`
- **THEN** 日志行末尾应附加 `([shortHash](url))` 格式的链接
