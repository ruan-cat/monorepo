# Changelog

`common-tools` Claude Code 插件的所有重要变更都将记录在此文件中。

本文档格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
项目遵循[语义化版本规范](https://semver.org/lang/zh-CN/)。

## [0.4.1] - 2025-11-03

### Fixed

- **钩子重复执行问题**: 修复了插件钩子重复运行两次的严重 bug
  - 问题原因：`plugin.json` 中 `hooks` 字段使用了不受支持的数组格式 `["./hooks/hooks.json"]`
  - 修复方案：将 `hooks` 字段改为官方支持的字符串格式 `"./hooks/hooks.json"`
  - 影响范围：所有钩子事件（SessionStart、UserPromptSubmit、PreToolUse、PostToolUse、Stop、SessionEnd、SubagentStop）
  - 参考文档：[Claude Code 插件参考文档 - hooks 字段定义](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)
  - 详细分析：参见 `docs/reports/claude-code-hooks-duplicate-execution-issue.md`

### Technical Details

修复前的配置：

```json
{
	"hooks": ["./hooks/hooks.json"] // ❌ 不支持的数组格式
}
```

修复后的配置：

```json
{
	"hooks": "./hooks/hooks.json" // ✅ 正确的字符串格式
}
```

**影响**：修复后，每个钩子事件只会执行一次，解决了之前出现的 `Running PostToolUse hooks… (1/2 done)` 的问题。

## [0.4.0] - 2025-11-03

### Added

- **完整钩子系统**: 实现了基于 Claude Code 各个钩子事件的通知系统
  - `Stop`: 任务完成时触发通知，支持 Gemini AI 智能生成任务摘要
  - `SessionStart`: 会话开始时的定时检查通知
  - `SessionEnd`: 会话结束时的定时检查通知
  - `UserPromptSubmit`: 用户提交消息时的定时检查通知
  - `PreToolUse`: 工具使用前的定时检查通知
  - `PostToolUse`: 工具使用后的定时检查通知
  - `SubagentStop`: 子代理停止时的定时检查通知

- **通知功能**: 集成 `@ruan-cat/claude-notifier` 包提供通知能力
  - `task-complete`: 任务完成通知
  - `check-and-notify`: 定时检查并发送通知
  - 支持 Gemini AI 智能总结任务内容

- **脚本支持**: 新增 `task-complete-notifier.sh` 脚本
  - 使用环境变量 `CLAUDE_PLUGIN_ROOT` 定位插件目录
  - 提供更灵活的通知触发机制

### Changed

- 将所有通知钩子整合到 `Stop` 事件中，统一管理

### Fixed

- 修复了 `task-complete-notifier.sh` 脚本缺失 `CLAUDE_PROJECT_DIR` 环境变量的问题

## Previous Versions

### [0.3.x] - 2025-10-22 ~ 2025-11-01

早期版本包含了以下核心功能：

- **Commands**:
  - `markdown-title-order`: 设置并维护 Markdown 文档的标题序号
  - `close-window-port`: 关闭指定端口的窗口进程

- **Agents**:
  - `format-markdown`: 格式化 Markdown 文档的专用子代理

- **插件架构**: 基于 [claude-code-marketplace](https://github.com/ananddtyagi/claude-code-marketplace) 的代码结构设计

---

## 维护说明

### 报告问题

如果您在使用插件时遇到问题，请：

1. 查看详细的问题分析报告：`docs/reports/claude-code-hooks-duplicate-execution-issue.md`
2. 在 GitHub 仓库提交 Issue：[ruan-cat/monorepo](https://github.com/ruan-cat/monorepo/issues)

### 版本升级

本插件遵循语义化版本规范：

- **Major (x.0.0)**: 破坏性变更
- **Minor (0.x.0)**: 新增功能，向后兼容
- **Patch (0.0.x)**: Bug 修复，向后兼容

### 更新插件

如果您已安装此插件，请使用以下命令更新到最新版本：

```bash
# 更新插件市场
/plugin marketplace update ruan-cat/monorepo

# 或重新安装插件
/plugin uninstall common-tools
/plugin install common-tools@ruan-cat-tools
```

---

**维护者**: ruan-cat (1219043956@qq.com)

**仓库**: [https://github.com/ruan-cat/monorepo](https://github.com/ruan-cat/monorepo)

**许可证**: MIT
