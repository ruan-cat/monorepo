# @ruan-cat/claude-notifier

## 0.4.0

### Minor Changes

- # 重构长任务管理系统，支持多会话管理 ([`de4f5fe`](https://github.com/ruan-cat/monorepo/commit/de4f5fe87190c6ae66848e29490879aa48223ebb))

  ## 🎉 新功能

  ### 新增 `check-and-notify` 命令

  专为 Claude Code hooks 设计的高频调用命令，提供自动化的长任务管理。

  **核心功能**：
  - ✅ 自动创建新会话任务（首次检测到 session_id 时）
  - ✅ 自动删除已完成任务（stop_hook_active = true 时）
  - ✅ 自动清理过期任务（超过 8 小时）
  - ✅ 定时检查并发送到期通知
  - ✅ 防重复通知机制（10 秒内不重复检查同一任务）

  **推荐配置**（~/.claude/settings.json）：

  ```json
  {
  	"hooks": {
  		"BeforeToolUse": [
  			{
  				"matcher": "os == 'windows'",
  				"hooks": [
  					{
  						"type": "command",
  						"command": "npx @ruan-cat/claude-notifier check-and-notify"
  					}
  				]
  			}
  		],
  		"Stop": [
  			{
  				"matcher": "os == 'windows'",
  				"hooks": [
  					{
  						"type": "command",
  						"command": "npx @ruan-cat/claude-notifier check-and-notify"
  					}
  				]
  			}
  		]
  	}
  }
  ```

  ## 🔧 重构

  ### `long-task` 命令重构

  从单进程后台定时器重构为基于 session_id 的多会话管理系统。

  **主要变化**：
  - 从 stdin 读取 session_id（支持 Claude Code hooks）
  - 支持多个 Claude Code 对话同时运行
  - 无后台进程，基于状态文件管理
  - 配合 `check-and-notify` 命令使用

  **新用法**：

  ```bash
  # 从 stdin 读取 session_id 并注册任务
  echo '{"session_id":"my-session"}' | npx @ruan-cat/claude-notifier long-task

  # 查看所有会话状态
  npx @ruan-cat/claude-notifier long-task --status

  # 手动指定 session_id（测试用途）
  npx @ruan-cat/claude-notifier long-task --session-id "test-123"
  ```

  ## 🐛 修复
  - 修复了长任务定时器在实际运行时不生效的问题
  - 修复了多个 Claude Code 实例同时运行时的冲突问题
  - 修复了定时器状态文件可能无限增长的问题

  ## 📚 文档更新
  - 更新 README.md，说明新的长任务管理机制
  - 更新 claude-code.md，添加 check-and-notify 命令的 hooks 配置指南
  - 更新 cli.md，详细说明新的命令用法和工作机制

  ## 💡 升级指南

  ### 对现有用户的影响

  **如果你正在使用旧版的 `long-task` 命令**：

  旧的直接调用方式仍然可用，但不推荐：

  ```bash
  # 旧版（不推荐）
  npx @ruan-cat/claude-notifier long-task
  ```

  **推荐迁移到新版**：

  使用 `check-and-notify` 命令配置到 hooks，实现自动化管理：

  ```json
  {
  	"hooks": {
  		"BeforeToolUse": [
  			{
  				"matcher": "os == 'windows'",
  				"hooks": [
  					{
  						"type": "command",
  						"command": "npx @ruan-cat/claude-notifier check-and-notify"
  					}
  				]
  			}
  		]
  	}
  }
  ```

  ### 破坏性变更
  - `long-task` 命令不再启动后台进程
  - `long-task` 需要从 stdin 读取 session_id 或手动指定 --session-id
  - 旧的 `--stop` 选项需要配合 session_id 使用

  ### 兼容性
  - ✅ 所有其他命令（task-complete, timeout, error）保持不变
  - ✅ 音频和图标预设完全兼容
  - ✅ 现有的 hooks 配置可以继续使用

  ## 🔗 相关资源
  - [完整文档](https://ccntf.ruan-cat.com)
  - [CLI 使用指南](./src/docs/use/cli.md)
  - [Claude Code 集成指南](./src/docs/use/claude-code.md)

## 0.3.1

### Patch Changes

- 修复 timer.ts 中的类型错误，添加缺失的 DEFAULT_INTERVALS 常量定义 ([`c840569`](https://github.com/ruan-cat/monorepo/commit/c840569c61fa4fa2773af57a1ae09794bbd7dde3))

## 0.3.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

## 0.2.0

### Minor Changes

- 将默认图标更改为 Alice 版本 ([`4ab0797`](https://github.com/ruan-cat/monorepo/commit/4ab0797e04fe189b4b51b2d6e90ed391852a2885))

  **新功能**：
  - 添加了三个新的图标预设：`alice/success.gif`, `alice/error.gif`, `alice/timeout.gif`
  - 所有命令现在默认使用 Alice 风格的动态图标

  **具体变更**：
  - `task-complete` 命令：默认图标从 `success` 改为 `alice/success.gif`
  - `error` 命令：默认图标从 `error` 改为 `alice/error.gif`
  - `timeout` 命令：默认图标从 `error` 改为 `alice/timeout.gif`
  - `long-task` 命令：默认图标从 `clock` 改为 `alice/timeout.gif`

  **用户影响**：
  - 用户在不指定 `-i, --icon` 参数时，将自动使用 Alice 风格的动态 GIF 图标
  - 仍然支持通过 `-i` 参数指定其他预设图标或自定义图标路径
  - 旧的图标预设（success, warning, error, info, clock）仍然可用

### Patch Changes

- 修复云端环境中文档构建失败的问题 ([`590984f`](https://github.com/ruan-cat/monorepo/commit/590984f774e84b62869d81a42a95bb07e07092b4))

  在根包的 package.json 中添加 @ruan-cat/claude-notifier 作为 devDependencies，确保 turbo deploy-vercel 命令能够正确识别并执行该包的 build:docs 任务。

  **技术细节**：
  - Turbo 的 `^build:docs` 依赖解析基于 package.json 的依赖声明
  - 只有在根包中声明的工作区包才会被包含在根任务的依赖图中
  - 本次修复确保 GitHub Actions 工作流能够正确部署 claude-notifier 的文档站点

  **相关文档**：
  - 详细事故报告：docs/incident-reports/2025-10-28-claude-notifier-build-docs-failure.md

## 0.1.1

### Patch Changes

- 修复生产环境资源路径问题，并重构路径查找逻辑： ([`b3dbf75`](https://github.com/ruan-cat/monorepo/commit/b3dbf7563c3bed8e3a71892c1b39c810e5131ee8))
  - 修复：生产环境下无法找到 assets 内的图片和音频资源
  - 重构：提取公共的路径查找逻辑到 `src/config/utils.ts`
  - 新增：`findResourceDir()` 工具函数，统一处理开发环境和生产环境的路径差异
  - 优化：简化 `sounds.ts` 和 `icons.ts` 的代码，提升可维护性
  - 文档：更新 `architecture.md`，详细说明路径查找策略和技术背景

## 0.1.0

### Minor Changes

- 初始化本包。 ([`396eec8`](https://github.com/ruan-cat/monorepo/commit/396eec8b4a4634b116583d3ed784be05de0f7107))
  - 默认用小爱丽丝作为图标 icon。
  - 目前无法播出曼波的声音，自定义声音的功能疑似在 window10 系统内无法使用。
