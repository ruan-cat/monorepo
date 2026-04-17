# Common Tools - Claude Code Plugin

阮喵喵开发时常用的一些通用工具集合，提供命令、代理、技能和钩子功能。

## 版本

**当前版本**: `6.0.0`

⚠️ **v6.0.0 版本同步**:

- 版本号与 marketplace 主版本同步至 `6.0.0`（本次 `common-tools` 技能树无内容变更；`dev-skills` 中 **init-release-base-relizy-and-bumpp** 的重大破坏性调整与 `metadata.version` `3.0.0` 升级见该插件 CHANGELOG）。

⚠️ **v5.0.0 版本同步**:

- 版本号与 marketplace 主版本同步至 `5.0.0`（本次 `common-tools` 技能树无内容变更；`dev-skills` 中 **init-release-base-relizy-and-bumpp** 的重大调整与 `metadata.version` `2.0.0` 升级见该插件 CHANGELOG）。

⚠️ **v2.16.1 版本同步**:

- 版本号与 marketplace 主版本同步至 2.16.1（本次无 `common-tools` 功能变更）

⚠️ **v2.16.0 版本同步**:

- 版本号与 marketplace 主版本同步至 2.16.0（本次无 `common-tools` 功能变更）

⚠️ **v2.15.1 技能调整**:

- `pr-ruancat-repo`（`0.3.1`）：精简 `references/target-repos.md` 仓库表（移除冗余分支列），目标分支策略以 `SKILL.md`「阶段 3」为准

⚠️ **v2.15.0 新增技能**:

- 新增 `pr-ruancat-repo`：多仓库批量 PR 工作流（仓库清单与模板见 `skills/pr-ruancat-repo/references/`），统一 commit 文案需先通过 `git-commit` 技能协助生成

⚠️ **v2.14.0 版本同步**:

- 版本号与 marketplace 主版本同步至 2.14.0（本次无 common-tools 功能变更）

⚠️ **v2.12.1 技能增强**:

- `init-ai-md` 新增技能表管理（步骤 6）和内置技能部署（步骤 5）能力
- 新增 `record-bug-fix-memory` 内置技能模板，支持 bug 修复经验沉淀
- 新增 `08.本项目的技能表.md` 模板文件

⚠️ **v2.12.0 新增技能**:

- 新增 `init-vscode` 技能，支持 monorepo 与单体项目的 VSCode 配置初始化

⚠️ **v2.10.1 技能修复**:

- `git-commit` 添加 Claude Code 官方邮箱到 Co-authored-by 对照表

查看完整的更新历史，请参阅 [CHANGELOG.md](./CHANGELOG.md)

## 功能特性

### Commands (命令)

- **markdown-title-order**: 设置并维护 Markdown 文档的标题序号
- **close-window-port**: 关闭指定端口的窗口进程

### Agents (代理)

- **format-markdown**: 格式化 Markdown 文档的专用子代理
- **migrate-iconify-use-pure-admin**: 将 pure-admin 的 iconify 图标方案迁移到 vite+vue3 项目
- **add-git-mcp**: 在 `.mcp.json` 文件中配置 git-mcp 服务器，实现对 GitHub 仓库的精准索引

### Skills (技能)

通用开发辅助技能，覆盖 Git 工作流、项目初始化、AI 记忆管理等高频场景：

- **get-git-branch**: 诊断并修复 Git 仓库无法看到所有远程分支的问题，恢复通配符 fetch refspec
- **git-commit**: 创建高质量 Git 提交，支持 Conventional Commits 规范、Emoji、破坏性变更格式、暂存区优先与多提交拆分
- **init-ai-md**: 初始化和增量更新 AI 记忆文件（`CLAUDE.md`、`AGENTS.md`、`GEMINI.md`），包含技能表管理与内置技能部署
- **init-claude-code-statusline**: 初始化 Claude Code 状态栏配置文件（`.claude/settings.json` + `statusline.sh`），展示目录、分支、模型、上下文窗口
- **init-prettier-git-hooks**: 初始化基于 lint-staged + simple-git-hooks + prettier 的 Git 提交前代码格式化流程
- **init-vscode**: 初始化或更新 VSCode 配置文件（`extensions.json`、`settings.json`），支持 monorepo 和单体项目，智能合并现有配置
- **pr-ruancat-repo**: 对固定清单内的多个 GitHub 仓库批量发起统一内容 PR（协调者 + 多子代理；仓库清单见 `references/target-repos.md`）
- **rebase2main**: 将当前开发分支通过 git rebase 同步到 main 分支，推送后切回原分支
- **use-other-model**: 指导主代理驱动其他 AI 模型（MiniMax、Gemini）完成任务，实现 50–80% token 节省

### Hooks (钩子)

提供基于 Claude Code 各个生命周期事件的通知系统：

- `Stop`: 任务完成时触发通知，支持 Gemini AI 智能生成任务摘要
  - ✨ **智能总结**: 从对话历史中提取上下文，生成有意义的任务摘要
  - 📝 **完整日志**: 自动记录所有输入、处理过程和输出结果
  - 🚀 **多模型策略**: 优先使用 gemini-2.5-flash（快速），备用 gemini-2.5-pro（高质量）
  - 🔍 **调试支持**: 详细日志存储在 `%TEMP%\claude-code-task-complete-notifier-logs\`
  - 🔧 **自动任务清理**: v0.8.0+ 自动删除已完成任务，避免误报通知
- `SessionStart` / `SessionEnd`: 会话开始/结束时的定时检查通知
- `UserPromptSubmit`: 用户提交消息时的定时检查通知
- `PreToolUse`: 工具使用前的定时检查通知
- `SubagentStop`: 子代理停止时的定时检查通知

通知功能由 [`@ruan-cat/claude-notifier`](../../packages/claude-notifier) 包提供支持。

⚠️ **v0.8.0 架构变更**: Stop 钩子不再使用 `check-and-notify`，改为在 `task-complete-notifier.sh` 中直接删除任务，避免 stdin 竞争问题。

#### 任务总结功能详情

**钩子系统架构**（v0.8.0）：

```plain
UserPromptSubmit  ──→  user-prompt-logger.sh
                        ├─ 初始化会话日志
                        └─ 记录用户输入

[Claude Code 处理中...]

Stop              ──→  task-complete-notifier.sh
                        ├─ 读取完整对话历史 (transcript-reader.ts)
                        ├─ 生成 Gemini 总结
                        ├─ 删除已完成任务 (remove-task.ts) [NEW in v0.8.0]
                        └─ 发送桌面通知
```

**关键改进**（v0.8.0）：

- ✅ Stop 钩子现在直接删除任务，不再依赖 `check-and-notify`
- ✅ 避免了 stdin 流竞争问题
- ✅ 消除了任务删除失败导致的误报通知

**核心脚本**：

1. **transcript-reader.ts** - JSONL 对话历史解析器（TypeScript）
   - 完整读取 Claude Code 的对话历史
   - 提取用户消息、Agent 响应、工具调用
   - 支持三种输出格式：summary（摘要）、full（完整）、keywords（关键词）
   - 使用 `tsx` 运行，确保与 ES Module 环境兼容

2. **parse-hook-data.ts** - JSON 钩子数据解析器
   - 解析 Claude Code 钩子传入的 JSON 数据
   - 支持 Windows 路径自动转义
   - 提取 session_id、transcript_path、cwd 等字段

3. **user-prompt-logger.sh** - UserPromptSubmit 钩子
   - 初始化会话日志
   - 记录用户输入和会话信息
   - 快速返回（< 1 秒），不阻塞

4. **task-complete-notifier.sh** - Stop 钩子
   - 调用 transcript-reader.ts 读取完整上下文
   - 三级降级策略：gemini-2.5-flash → gemini-2.5-pro → 关键词提取
   - 后台发送通知，避免阻塞
   - 详细日志记录

**功能特性**：

- **完整上下文读取**: 读取完整的 JSONL 对话历史，不再只截取最后几条消息
- **智能总结生成**: 优先使用 Gemini AI，失败时降级到关键词提取
- **双钩子协作**: UserPromptSubmit 记录输入，Stop 生成总结
- **详细日志记录**: 所有操作都记录到日志文件，方便调试
- **快速返回**: 不阻塞 Claude Code 执行（15 秒超时保护）

## 安装

### 安装要求

⚠️ **从 v0.7.0 开始，插件需要预安装全局依赖**（解决进程堆积问题）

**必需依赖**：

```bash
# 1. 安装 claude-notifier（必需）
pnpm add -g @ruan-cat/claude-notifier
# 或使用 npm
npm install -g @ruan-cat/claude-notifier

# 2. 安装 tsx（必需）
pnpm add -g tsx
# 或使用 npm
npm install -g tsx
```

**可选依赖**：

```bash
# 安装 gemini CLI（用于 AI 智能摘要，可选）
npm install -g @google/generative-ai-cli
```

**验证安装**：

```bash
claude-notifier --version
tsx --version
gemini --version  # 如果安装了 gemini
```

### 通过插件市场安装

1. 添加插件市场（如果尚未添加）：

   ```bash
   /plugin marketplace add ruan-cat/monorepo
   ```

2. 安装插件：
   ```bash
   /plugin install common-tools@ruan-cat-tools
   ```

### 更新插件

```bash
# 更新插件市场
/plugin marketplace update ruan-cat/monorepo

# 或重新安装插件
/plugin uninstall common-tools
/plugin install common-tools@ruan-cat-tools
```

### 从旧版本升级

如果从 v0.6.x 升级到 v0.7.0，请按照以下步骤：

1. 安装全局依赖（见上方[安装要求](#安装要求)）
2. 更新插件到最新版本
3. 重启 Claude Code
4. （可选）手动清理现有僵尸进程：
   ```bash
   # Windows 任务管理器：结束包含 "claude-notifier" 或 "gemini" 的 node.exe/npx.exe 进程
   # 或运行清理脚本（如果已安装插件）
   bash ai-plugins/common-tools/scripts/cleanup-orphan-processes.sh
   ```

## 使用方法

### 使用命令

在 Claude Code 中输入斜杠命令：

```bash
/markdown-title-order
/close-window-port
```

### 使用代理

```bash
/format-markdown
```

### 钩子自动运行

钩子会在对应的事件触发时自动运行，无需手动调用。例如：

- 当你提交消息时，`UserPromptSubmit` 钩子会自动检查并发送通知
- 当任务完成时，`Stop` 钩子会生成任务摘要并发送通知

## 配置

### 环境变量

插件使用以下环境变量（由 Claude Code 自动提供）：

- `CLAUDE_PLUGIN_ROOT`: 插件根目录路径
- `CLAUDE_PROJECT_DIR`: 项目目录路径

### 通知配置

通知功能依赖 `@ruan-cat/claude-notifier` 包。要配置通知行为，请参考：

- [通知包文档](../../packages/claude-notifier/README.md)
- [通知包配置指南](../../packages/claude-notifier/src/docs/use/cli.md)

### 日志查看

任务总结功能会生成详细的日志文件，位于：

**Windows**: `C:\Users\<用户名>\AppData\Local\Temp\claude-code-task-complete-notifier-logs\`
**Linux/Mac**: `/tmp/claude-code-task-complete-notifier-logs/`

日志文件命名格式：`YYYY-MM-DD__HH-mm-ss__工作目录.log`

查看最新日志：

```powershell
# Windows PowerShell
Get-Content (Get-ChildItem "$env:TEMP\claude-code-task-complete-notifier-logs" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

# Linux/Mac
tail -f /tmp/claude-code-task-complete-notifier-logs/$(ls -t /tmp/claude-code-task-complete-notifier-logs | head -1)
```

### 调试指南

#### 问题：Gemini 调用失败

**排查步骤**：

1. 检查 Gemini CLI 是否安装：

   ```bash
   which gemini
   gemini --version
   ```

2. 检查 API Key 是否配置：

   ```bash
   echo $GEMINI_API_KEY
   ```

3. 手动测试 Gemini 调用：

   ```bash
   gemini --model "gemini-2.5-flash" --output-format text "测试总结"
   ```

4. 查看详细错误日志：
   ```bash
   grep "Gemini" $TEMP/claude-code-task-complete-notifier-logs/*.log
   ```

#### 问题：上下文提取为空

**排查步骤**：

1. 检查 tsx 是否已安装：

   ```bash
   which tsx
   tsx --version
   ```

2. 手动运行 transcript-reader.ts：

   ```bash
   tsx scripts/transcript-reader.ts "$TRANSCRIPT_PATH" --format=full
   ```

3. 检查 JSONL 格式是否正确：
   ```bash
   head -1 "$TRANSCRIPT_PATH" | jq .
   ```

#### 问题：tsx 未安装

**解决方案**：

安装全局 tsx 包：

```bash
npm install -g tsx
# 或使用 pnpm
pnpm add -g tsx
```

脚本会在 tsx 不可用时自动降级到使用 grep/sed 提取，但功能会受限。

## 问题报告

如果您在使用插件时遇到问题：

1. 查看详细的问题分析报告：[docs/reports](../../docs/reports/)
2. 在 GitHub 仓库提交 Issue：[ruan-cat/monorepo/issues](https://github.com/ruan-cat/monorepo/issues)

## 开发

### 目录结构

```plain
common-tools/
├── .claude-plugin/
│   └── plugin.json                          # 插件配置清单（Claude）
├── .cursor-plugin/
│   └── plugin.json                          # 插件配置清单（Cursor）
├── agents/                                  # 代理定义
│   ├── add-git-mcp.md
│   ├── format-markdown.md
│   └── migrate-iconify-use-pure-admin.md
├── commands/                                # 命令定义
│   ├── close-window-port.md
│   └── markdown-title-order.md
├── hooks/                                   # 钩子配置
│   ├── hooks.json
│   └── README.md
├── scripts/                                 # 辅助脚本
│   ├── parse-hook-data.ts                   # JSON 钩子数据解析器
│   ├── task-complete-notifier.sh            # 任务完成通知脚本（Stop 钩子）
│   ├── transcript-reader.ts                 # JSONL 对话历史解析器
│   └── user-prompt-logger.sh               # 用户消息记录脚本（UserPromptSubmit 钩子）
├── skills/                                  # 技能定义
│   ├── get-git-branch/SKILL.md             # 修复远程分支拉取问题
│   ├── git-commit/SKILL.md                 # 高质量 Git 提交
│   ├── init-ai-md/                          # 初始化 AI 记忆文件
│   │   ├── SKILL.md
│   │   └── templates/                       # 各类记忆章节模板 + record-bug-fix-memory 子技能
│   ├── init-claude-code-statusline/SKILL.md # Claude Code 状态栏初始化
│   ├── init-prettier-git-hooks/SKILL.md    # Prettier + Git Hooks 初始化
│   ├── init-vscode/SKILL.md                # VSCode 配置初始化
│   ├── pr-ruancat-repo/                     # 多仓库批量 PR
│   │   ├── SKILL.md
│   │   └── references/                      # 目标仓库清单与执行模板
│   ├── rebase2main/SKILL.md                # dev → main rebase 同步
│   └── use-other-model/                     # 驱动其他 AI 模型
│       ├── SKILL.md
│       └── references/                      # 方案参考文档
├── CHANGELOG.md                             # 版本更新日志
└── README.md                                # 本文件
```

### 参考资源

- [Claude Code 官方文档](https://docs.claude.com/en/docs/claude-code)
- [插件开发指南](https://docs.claude.com/en/docs/claude-code/plugins)
- [钩子系统参考](https://docs.claude.com/en/docs/claude-code/hooks)

## 许可证

MIT License

## 作者

**ruan-cat** (阮喵喵)

- Email: 1219043956@qq.com
- GitHub: [@ruan-cat](https://github.com/ruan-cat)

## 仓库

[https://github.com/ruan-cat/monorepo](https://github.com/ruan-cat/monorepo)
