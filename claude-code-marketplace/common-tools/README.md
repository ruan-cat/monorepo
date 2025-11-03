# Common Tools - Claude Code Plugin

阮喵喵开发时常用的一些通用工具集合，提供命令、代理和钩子功能。

## 版本

**当前版本**: `0.4.1`

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
- `SessionStart` / `SessionEnd`: 会话开始/结束时的定时检查通知
- `UserPromptSubmit`: 用户提交消息时的定时检查通知
- `PreToolUse` / `PostToolUse`: 工具使用前后的定时检查通知
- `SubagentStop`: 子代理停止时的定时检查通知

通知功能由 [`@ruan-cat/claude-notifier`](../../packages/claude-notifier) 包提供支持。

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

## 版本历史

### [0.4.1] - 2025-11-03

**修复**：

- 修复了插件钩子重复运行两次的严重 bug
- 将 `plugin.json` 中的 `hooks` 字段从不受支持的数组格式改为字符串格式

详情参见 [CHANGELOG.md](./CHANGELOG.md#041---2025-11-03)

### [0.4.0] - 2025-11-03

**新增**：

- 完整的钩子系统，支持所有 Claude Code 生命周期事件
- 集成 Gemini AI 智能任务摘要功能
- 任务完成通知脚本

详情参见 [CHANGELOG.md](./CHANGELOG.md#040---2025-11-03)

## 问题报告

如果您在使用插件时遇到问题：

1. 查看详细的问题分析报告：[docs/reports](../../docs/reports/)
2. 在 GitHub 仓库提交 Issue：[ruan-cat/monorepo/issues](https://github.com/ruan-cat/monorepo/issues)

## 开发

### 目录结构

```plain
common-tools/
├── .claude-plugin/
│   └── plugin.json         # 插件配置清单
├── commands/               # 命令定义
│   ├── markdown-title-order.md
│   └── close-window-port.md
├── agents/                 # 代理定义
│   └── format-markdown.md
├── hooks/                  # 钩子配置
│   ├── hooks.json
│   └── README.md
├── scripts/                # 辅助脚本
│   └── task-complete-notifier.sh
├── CHANGELOG.md            # 版本更新日志
├── README.md               # 本文件
└── TEST-REPORT.md          # 测试报告
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
