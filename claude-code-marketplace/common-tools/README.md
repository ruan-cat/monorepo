# Common Tools - Claude Code Plugin

阮喵喵开发时常用的一些通用工具集合，提供命令、代理和钩子功能。

## 版本

**当前版本**: `0.6.2`

查看完整的更新历史，请参阅 [CHANGELOG.md](./CHANGELOG.md)

## 功能特性

### Commands (命令)

- **markdown-title-order**: 设置并维护 Markdown 文档的标题序号
- **close-window-port**: 关闭指定端口的窗口进程

### Agents (代理)

- **format-markdown**: 格式化 Markdown 文档的专用子代理

### Hooks (钩子)

提供基于 Claude Code 各个生命周期事件的通知系统：

- `Stop`: 任务完成时触发通知，支持 Gemini AI 智能生成任务摘要
  - ✨ **智能总结**: 从对话历史中提取上下文，生成有意义的任务摘要
  - 📝 **完整日志**: 自动记录所有输入、处理过程和输出结果
  - 🚀 **多模型策略**: 优先使用 gemini-2.5-flash（快速），备用 gemini-2.5-pro（高质量）
  - 🔍 **调试支持**: 详细日志存储在 `%TEMP%\claude-code-task-complete-notifier-logs\`
- `SessionStart` / `SessionEnd`: 会话开始/结束时的定时检查通知
- `UserPromptSubmit`: 用户提交消息时的定时检查通知
- `PreToolUse` / `PostToolUse`: 工具使用前后的定时检查通知
- `SubagentStop`: 子代理停止时的定时检查通知

通知功能由 [`@ruan-cat/claude-notifier`](../../packages/claude-notifier) 包提供支持。

#### 任务总结功能详情

**钩子系统架构**：

```plain
UserPromptSubmit  ──→  user-prompt-logger.sh
                        ├─ 初始化会话日志
                        └─ 记录用户输入

[Claude Code 处理中...]

Stop              ──→  task-complete-notifier.sh
                        ├─ 读取完整对话历史 (transcript-reader.ts)
                        ├─ 生成 Gemini 总结
                        └─ 发送桌面通知
```

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

## 版本历史

### [0.6.2] - 2025-11-06

**修复**：

- 🐞 **钩子上下文读取失败**: 修复了 transcript-reader.js 因 ES Module 错误无法读取对话上下文的问题
  - **根本原因**：JavaScript 文件使用 `require()` 语法，但父级 package.json 设置了 `"type": "module"`
  - **修复方案**：
    1. 迁移到 TypeScript (transcript-reader.ts)
    2. 新增 parse-hook-data.ts 处理 JSON 解析和 Windows 路径转义
    3. 使用全局 `tsx` 运行 TypeScript 文件
  - **测试结果**：
    - ✅ JSON 解析正常
    - ✅ 对话上下文正确提取
    - ✅ Gemini 总结功能恢复
    - ✅ Windows 路径正确处理

详情参见 [CHANGELOG.md](./CHANGELOG.md#062---2025-11-06)

### [0.6.1] - 2025-11-04

**修复**：

- 修复了钩子返回值类型错误（`proceed` → `approve`）导致 Claude Code 崩溃的问题

详情参见 [CHANGELOG.md](./CHANGELOG.md#061---2025-11-04)

### [0.5.1] - 2025-11-03

**修复**：

- 🐞 **Stop hook 阻塞问题**: 修复了 `● Stop hook prevented continuation` 导致 Claude Code 无法继续执行的严重问题
  - **根本原因**：
    1. `tee` 命令导致 I/O 管道阻塞
    2. `pnpm dlx` 调用可能挂起，等待下载包
    3. 缺少全局错误处理机制
  - **修复方案**：
    1. 移除 `tee` 命令，改用分离的日志记录方式
    2. 通知器后台运行，不等待完成
    3. 添加错误陷阱，确保脚本总是返回成功
    4. 优化超时时间（5s/5s/4s/8s）
  - **测试结果**：
    - ✅ 脚本在约 17 秒内完成
    - ✅ 返回有效的 JSON 输出
    - ✅ 即使 Gemini 和通知器失败，也能正常返回
    - ✅ 不再阻塞 Claude Code

详情参见 [CHANGELOG.md](./CHANGELOG.md#051---2025-11-03)

### [0.5.0] - 2025-11-03

**新增**：

- 🎯 **智能总结系统重构**: 完全修复 Gemini 总结功能，现在可以生成有意义的任务摘要
- 📝 **完整日志记录**: 新增自动日志记录机制，记录所有输入、处理过程和输出
- 🚀 **多模型策略**: 实现 flash → pro → 默认模型的智能降级策略
- 🔍 **调试支持**: 详细日志文件帮助排查问题

**修复**：

- 🐞 **核心问题修复**: 修复了 Stop 钩子无法获取任务描述的根本问题
  - 原因：Stop 钩子不包含 `tool_input` 字段
  - 解决方案：从 `transcript_path` 读取对话历史并提取上下文
- 📊 **对话解析**: 实现了完整的 JSONL 格式对话历史解析
- ⚡ **性能优化**: 优化了 Gemini 调用超时策略（flash: 5s, pro: 8s）

详情参见 [CHANGELOG.md](./CHANGELOG.md#050---2025-11-03) 和 [scripts/TASK_COMPLETE_NOTIFIER_README.md](./scripts/TASK_COMPLETE_NOTIFIER_README.md)

### [0.4.1] - 2025-11-03

**修复**：

- 修复了插件钩子重复运行两次的严重 bug
- 将 `plugin.json` 中的 `hooks` 字段从不受支持的数组格式改为字符串格式

详情参见 [CHANGELOG.md](./CHANGELOG.md#041---2025-11-03)

## 问题报告

如果您在使用插件时遇到问题：

1. 查看详细的问题分析报告：[docs/reports](../../docs/reports/)
2. 在 GitHub 仓库提交 Issue：[ruan-cat/monorepo/issues](https://github.com/ruan-cat/monorepo/issues)

## 开发

### 目录结构

```plain
common-tools/
├── .claude-plugin/
│   └── plugin.json                      # 插件配置清单
├── commands/                            # 命令定义
│   ├── markdown-title-order.md
│   └── close-window-port.md
├── agents/                              # 代理定义
│   └── format-markdown.md
├── hooks/                               # 钩子配置
│   ├── hooks.json
│   └── README.md
├── scripts/                             # 辅助脚本
│   ├── task-complete-notifier.sh        # 任务完成通知脚本
│   └── TASK_COMPLETE_NOTIFIER_README.md # 详细功能说明
├── CHANGELOG.md                         # 版本更新日志
├── README.md                            # 本文件
└── TEST-REPORT.md                       # 测试报告
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
