## Purpose

为 ChatGPT Web 提供一个可公开连接的只读 Skill Router MCP，使其能从同一 Git 提交快照中发现、搜索和读取 `ai-plugins` Skill，并能区分 Skill 数据、Worker Runtime 与 ChatGPT 工具元数据三类发布状态。

## ADDED Requirements

### Requirement: 远程 MCP 连接与稳定服务身份

系统 SHALL 在 HTTPS 的 `/mcp` 端点提供符合当期 OpenAI ChatGPT MCP 兼容基线的 Streamable HTTP 连接，并在初始化中公布稳定的服务名称 `skill-router-mcp` 与来自 MCP package `package.json.version` 的应用版本。

#### Scenario: 兼容客户端初始化服务

- **WHEN** 支持当前兼容基线的 MCP 客户端连接 `/mcp` 并执行初始化
- **THEN** 服务完成标准初始化，且返回的名称为 `skill-router-mcp`、版本等于 package 的 SemVer

#### Scenario: 客户端提出不同协议版本

- **WHEN** 客户端在初始化中协商协议版本
- **THEN** 服务 SHALL 由当前受支持 SDK 按兼容基线处理协商，且不把未经 OpenAI ChatGPT 支持验证的未来协议版本声明为生产契约

### Requirement: 匿名公开的只读访问与最小边缘防护

系统 SHALL 允许未携带 OAuth、API key 或用户身份的调用方访问 `/mcp` 与 `/health`，且 v1 所有工具 MUST 为只读。Worker MUST 施加可复现的最小边缘/runtime 防护，包括 Cloudflare 原生速率限制或等价策略、请求超时、请求体/响应大小上限与安全错误映射；系统 MUST NOT 引入用户账户、数据库或自定义 Skill snapshot server session。

#### Scenario: 匿名客户端读取 Skill

- **WHEN** 调用方仅持有公开 URL、未发送 `Authorization`，并完成 MCP 初始化后调用只读工具
- **THEN** 服务正常返回允许公开的数据，且不要求 OAuth、API key 或登录态

#### Scenario: 超限请求被安全拒绝

- **WHEN** 请求超过速率、大小或处理时限
- **THEN** 服务以稳定的 429、413 或超时错误拒绝请求，且响应与日志不包含 token、认证头或内部堆栈

### Requirement: 只读且同源的工具目录

系统 SHALL 公开 `get_server_info`、`list_skills`、`search_skills` 与 `load_skill` 四个只读工具；标准 `tools/list`、`get_server_info` 返回的工具摘要及工具注册 SHALL 来自同一权威工具定义。

#### Scenario: 标准工具发现

- **WHEN** 客户端调用标准 `tools/list`
- **THEN** 返回完整的四个核心工具及其当前 schema、描述和准确的只读 annotation

#### Scenario: 自描述工具目录

- **WHEN** 客户端调用 `get_server_info`
- **THEN** 响应中的工具摘要与同一服务版本的 `tools/list` 目录一致，且不会维护第二份手写工具列表

### Requirement: 安全的服务与部署自描述

系统 SHALL 通过 `get_server_info` 与只读健康检查公开 MCP 名称/版本、构建 Git SHA、Worker 版本 ID/tag/timestamp、Skill 源仓库/ref、registry schema 版本和工具摘要；系统 MUST 不公开 secret、认证头、原始环境变量或内部堆栈。

#### Scenario: 查询当前服务版本

- **WHEN** 客户端以空输入调用 `get_server_info`
- **THEN** 响应包含 MCP SemVer、构建 Git SHA、Worker 元数据、Skill source 与工具摘要，且 MCP SemVer 不被 Worker ID 或 Skill commit 替代

#### Scenario: 诊断接口不读取 Skill HEAD

- **WHEN** 客户端调用 `get_server_info`
- **THEN** 服务不为该调用解析 GitHub 当前 HEAD，也不在响应中泄露 GitHub credential

### Requirement: 精确提交的 Skill 读取快照

系统 SHALL 对每次 Skill 工具调用建立 `SourceSnapshot`。未 pin 调用 MUST 将配置的 Git ref 仅解析一次为精确提交 SHA；同一调用中 registry、选中 Skill 与按需关联文件 MUST 全部从该 SHA 读取。

#### Scenario: 未 pin 的单次读取保持一致

- **WHEN** `load_skill` 未提供 `sourceCommitSha`，且配置 ref 在调用期间发生推进
- **THEN** 本次调用继续使用开始时解析的同一 commit SHA 读取 registry 与 `SKILL.md`

#### Scenario: discovery 到加载的快照 pin

- **WHEN** 客户端先从 `search_skills` 获得 SHA A，随后 branch 推进到 SHA B 并以 A 调用 `load_skill`
- **THEN** 服务从 SHA A 返回该 Skill；未提供 pin 的新调用则可以返回 B 的最新快照

### Requirement: 受限的 GitHub Skill Source

系统 SHALL 仅从配置的 GitHub owner/repository 读取 `ai-plugins/skill-registry.json`、registry 指向的 `SKILL.md` 及所选 Skill 范围内按需关联文件。调用方 MUST 不能以输入覆盖 owner/repository，也不能借此读取任意仓库或越出选中 Skill 目录的路径。

#### Scenario: 读取被选中的 Skill

- **WHEN** 客户端以合法 `skillId` 调用 `load_skill`
- **THEN** 服务先在同一快照读取 registry，再读取其 entry 指向的 `SKILL.md`，并返回 `sourceCommitSha`

#### Scenario: 拒绝越界关联文件

- **WHEN** 关联文件路径逃出选中 Skill 根目录或不符合允许的 repo-relative 路径
- **THEN** 服务拒绝该读取并不返回文件内容或 GitHub 凭证信息

### Requirement: Registry 驱动的 Skill discovery 与确定性搜索

系统 SHALL 将已提交的 `ai-plugins/skill-registry.json` 作为 discovery manifest；`list_skills` 和 `search_skills` MUST 只基于其 v1 `id`、`plugin`、`name`、`description`、`version` 与 `entry` 数据工作，不扫描所有 Skill 正文，也不要求 Cloudflare 存储。

#### Scenario: 列出 Skill

- **WHEN** 客户端调用 `list_skills`
- **THEN** 服务返回 registry 摘要和其 `sourceCommitSha`，但不返回 deep-file mirror 或所有 `SKILL.md` 正文

#### Scenario: 搜索 Skill

- **WHEN** 客户端以关键词调用 `search_skills`
- **THEN** 服务仅对 id、name、description、plugin 进行确定性的标准化匹配和稳定排序，并在结果中返回 `sourceCommitSha`

### Requirement: 清晰且无敏感信息的错误契约

系统 SHALL 为 registry 缺失或 schema 不支持、Skill 不存在、entry 无效、source commit 无效、GitHub 认证失败、速率限制及上游读取失败返回稳定可诊断的领域错误；错误 MUST 不包含 token、Authorization header 或内部堆栈。

#### Scenario: registry 文件缺失

- **WHEN** 所选快照不存在 registry
- **THEN** 工具返回 `REGISTRY_NOT_FOUND` 及安全的 source commit/path 诊断信息

#### Scenario: GitHub 认证失败

- **WHEN** GitHub 返回认证失败
- **THEN** 工具返回 `GITHUB_AUTH_FAILED`，且响应和日志不会输出 credential 或认证头

### Requirement: Skill-only、Runtime 与工具契约发布边界

系统 SHALL 将 Skill 数据更新、MCP Runtime 更新和 ChatGPT 工具 metadata/schema 更新作为不同发布域。仅变更 Skill/registry 的发布 MUST 不要求 Worker redeploy 或 ChatGPT tool rescan；Runtime 发布 MUST 经过版本化 Worker candidate、smoke 与精确版本确认；工具契约变更 MUST 增加 ChatGPT refresh/rescan、重新评估及适用时的 Workspace 审核门禁。

#### Scenario: 仅发布 Skill 数据

- **WHEN** 同一 Git commit 中发布 Skill 与 canonical registry，且 MCP tool contract 未变化
- **THEN** 下一次未 pin 的 Skill 调用可读取新快照，而无需部署 Worker 或刷新 ChatGPT 工具目录

#### Scenario: 发布工具 schema 变更

- **WHEN** Runtime release 改变 tool name、schema、description 或 annotation
- **THEN** 该 release 在 ChatGPT refresh/rescan 和重新评估证据出现前不得标记为 ChatGPT 可用完成

### Requirement: 可验证的部署与回滚

系统 SHALL 支持不可变 Worker candidate 的预览/预发验证、将已验证的精确版本 promote 到 production、只读生产 smoke 以及已知稳定版本的回滚。生产 smoke MUST 验证 health、初始化、工具目录、服务信息、已知 Skill 搜索与 pinned load，并核对 MCP SemVer、Worker ID/tag 与 build Git SHA。

#### Scenario: 预览版本通过后上线

- **WHEN** candidate Worker 的预览 smoke 验证通过
- **THEN** production promotion 使用同一被验证的精确 Worker 版本，而不是重新构建的未验证版本

#### Scenario: Runtime 回滚

- **WHEN** 线上 Runtime 版本发生故障并回滚到稳定 Worker 版本
- **THEN** 回滚后重新验证 health、初始化、`tools/list` 与 `get_server_info`，并检查 ChatGPT 工具快照与回滚版本的兼容性

### Requirement: 分层自动测试与外部验证证据

系统 SHALL 提供 package-local Node unit、Cloudflare workerd、MCP 客户端契约和生产构建 harness 测试；根 Vitest 3.x MUST 不因本服务被强制升级。需要 Cloudflare、ChatGPT Developer Mode 或 Workspace 权限的验证 MUST 保存真实外部证据或标记为未验证/阻断。

#### Scenario: 自动测试通过但外部访问未授权

- **WHEN** 本地与 CI 自动测试全部通过，但缺少 Cloudflare 或 ChatGPT 账号权限
- **THEN** 任务仅标记自动验证完成，并把外部部署或 ChatGPT 验收保留为未完成的显式 checkpoint
