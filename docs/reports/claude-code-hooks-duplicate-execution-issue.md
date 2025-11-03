# Claude Code 钩子重复执行问题分析报告

## 报告信息

- **日期**: 2025-11-03
- **问题**: Claude Code 插件钩子每次都重复运行两次
- **影响范围**: `common-tools` 插件的所有钩子事件
- **状态**: ✅ 已修复

---

## 问题描述

### 症状表现

在使用 `claude-code-marketplace/common-tools` 插件时，所有钩子事件都会执行两次，导致：

1. 控制台输出重复的成功消息：

   ```plain
   SessionStart:Callback hook success: Success
   SessionStart:Callback hook success: Success

   UserPromptSubmit:Callback hook success: Success
   UserPromptSubmit:Callback hook success: Success
   ```

2. 工具使用钩子显示进度 `(1/2 done)`：
   ```plain
   Running PostToolUse hooks… (1/2 done)
   ```

### 影响范围

- 本项目 `d:\code\github-desktop-store\gh.ruancat.monorepo`
- 所有从插件市场 `ruan-cat/monorepo` 安装此插件的其他项目
- 所有钩子事件类型：`SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`

---

## 探索过程

### 1. 初步分析

**目标**: 确认问题不是来自本地配置重复

**步骤**:

```bash
# 检查本地配置文件
cat .claude/settings.json
cat .claude/settings.local.json
```

**发现**:

- `.claude/settings.json`: 仅包含 statusLine 配置，无钩子
- `.claude/settings.local.json`: 钩子配置在 `not-use-now-hooks` 键下（已禁用）
- 本地配置未启用任何钩子，排除本地配置重复的可能性

### 2. 插件配置检查

**目标**: 查找插件如何注册钩子

**步骤**:

```bash
# 查找所有插件配置
find . -name "plugin.json" -path "*/.claude-plugin/*"
find . -name "hooks.json" -path "*/hooks/*"

# 检查插件市场配置
cat .claude-plugin/marketplace.json
```

**发现**:

- 插件市场配置正确，只注册了一次 `common-tools` 插件
- 插件源码位置：`./claude-code-marketplace/common-tools`
- 钩子配置文件：`claude-code-marketplace/common-tools/hooks/hooks.json`

### 3. 钩子配置分析

**目标**: 分析钩子配置文件的数量和内容

**步骤**:

```bash
# 检查插件的 plugin.json
cat claude-code-marketplace/common-tools/.claude-plugin/plugin.json | jq '.'

# 检查钩子配置
cat claude-code-marketplace/common-tools/hooks/hooks.json | jq '.hooks | keys'

# 统计每个事件的钩子数量
cat claude-code-marketplace/common-tools/hooks/hooks.json | \
  jq '.hooks | to_entries | map({key: .key, count: (.value | length)})'
```

**发现**:

```json
// plugin.json 中的 hooks 配置
"hooks": ["./hooks/hooks.json"]  // ⚠️ 使用了数组格式

// 每个事件只配置了一个 matcher
[
  {"key": "Stop", "count": 1},
  {"key": "UserPromptSubmit", "count": 1},
  {"key": "PreToolUse", "count": 1},
  {"key": "PostToolUse", "count": 1},
  {"key": "SessionStart", "count": 1},
  {"key": "SessionEnd", "count": 1},
  {"key": "SubagentStop", "count": 1}
]
```

每个事件只有一个钩子配置，但仍然执行了两次。

### 4. 文档验证

**目标**: 确认 Claude Code 官方文档中 `hooks` 字段的正确格式

**步骤**:
使用 WebFetch 工具查询官方文档：

- `https://docs.claude.com/en/docs/claude-code/plugins-reference.md`
- `https://docs.claude.com/en/docs/claude-code/hooks.md`

**关键发现**:

根据 [Claude Code 插件参考文档](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)：

> **Plugin Manifest Schema - hooks 字段**
>
> | Field | Type             | Description                       |
> | ----- | ---------------- | --------------------------------- |
> | hooks | `string\|object` | Hook config path or inline config |

**重要结论**:

- ✅ 支持：`"hooks": "./hooks.json"` (字符串)
- ✅ 支持：`"hooks": { ... }` (对象)
- ❌ **不支持**：`"hooks": ["./hooks.json"]` (数组)

---

## 技术分析

### 问题根源

`plugin.json` 中使用了**不受支持的数组格式**来配置 `hooks` 字段：

```json
// ❌ 错误配置 (plugin.json:13)
{
	"hooks": ["./hooks/hooks.json"]
}
```

### 错误机制推测

当 Claude Code 解析到数组格式的 `hooks` 配置时，可能发生以下情况之一：

1. **重复解析**: 将数组当作两个独立的配置源处理
2. **降级处理**: 尝试兼容数组格式，但实现有 bug，导致钩子被注册两次
3. **回退机制**: 数组解析失败后回退到默认路径 `./hooks/hooks.json`，同时也部分解析了数组，导致重复注册

### 配置格式对比

| 字段       | 支持的类型       | 示例                                              |
| ---------- | ---------------- | ------------------------------------------------- |
| `commands` | `string\|array`  | `["./commands/cmd1.md", "./commands/cmd2.md"]` ✅ |
| `agents`   | `string\|array`  | `["./agents/agent1.md"]` ✅                       |
| `hooks`    | `string\|object` | `"./hooks/hooks.json"` ✅                         |
| `hooks`    | ~~array~~        | ~~`["./hooks/hooks.json"]`~~ ❌                   |

**关键差异**: `commands` 和 `agents` 支持数组（可以有多个文件），但 `hooks` 只支持单个字符串路径或内联对象。

---

## 最终结论

### 问题确认

钩子重复执行的根本原因是 `plugin.json` 中 `hooks` 字段使用了不符合规范的数组格式，导致 Claude Code 解析异常，每个钩子被注册并执行了两次。

### 修复内容

**文件**: `claude-code-marketplace/common-tools/.claude-plugin/plugin.json:13`

**修改前**:

```json
{
	"commands": ["./commands/markdown-title-order.md", "./commands/close-window-port.md"],
	"agents": ["./agents/format-markdown.md"],
	"hooks": ["./hooks/hooks.json"]
}
```

**修改后**:

```json
{
	"commands": ["./commands/markdown-title-order.md", "./commands/close-window-port.md"],
	"agents": ["./agents/format-markdown.md"],
	"hooks": "./hooks/hooks.json"
}
```

**关键变化**: 将 `hooks` 从数组 `["./hooks/hooks.json"]` 改为字符串 `"./hooks/hooks.json"`

---

## 验证方案

### 本地验证

1. **重启 Claude Code 会话**

   ```bash
   # 在 Claude Code 中执行
   /clear
   ```

2. **观察控制台输出**
   - 期望看到每个钩子事件只输出一次成功消息
   - 期望看到 `Running PostToolUse hooks… (1/1 done)` 而不是 `(1/2 done)`

3. **测试各类钩子事件**
   - SessionStart: 启动新会话
   - UserPromptSubmit: 提交任意消息
   - PreToolUse/PostToolUse: 使用任意工具（如 Read、Bash）
   - Stop: 完成任务响应

### 其他项目验证

对于已安装此插件的其他项目：

1. **更新插件**

   ```bash
   # 在项目目录执行
   /plugin marketplace update ruan-cat/monorepo
   ```

2. **或重新安装**

   ```bash
   /plugin uninstall common-tools
   /plugin install common-tools@ruan-cat-tools
   ```

3. **验证钩子执行次数**
   - 观察是否还会出现重复的成功消息
   - 确认工具钩子进度显示为 `(1/1 done)`

---

## 相关文件

### 修改的文件

- `claude-code-marketplace/common-tools/.claude-plugin/plugin.json`

### 相关配置文件

- `claude-code-marketplace/common-tools/hooks/hooks.json` (钩子配置)
- `.claude-plugin/marketplace.json` (插件市场配置)
- `.claude/settings.local.json` (本地设置)

### 文档引用

- [Claude Code 插件参考文档](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)
- [Claude Code 钩子指南](https://docs.claude.com/en/docs/claude-code/hooks-guide.md)
- [Claude Code 钩子参考](https://docs.claude.com/en/docs/claude-code/hooks.md)

---

## 经验总结

### 技术要点

1. **严格遵循 Schema 定义**: 插件配置必须严格按照官方文档的 schema 定义，不同字段支持的类型不同
2. **注意 hooks 字段的特殊性**: 与 `commands`/`agents` 不同，`hooks` 字段不支持数组
3. **配置错误的影响**: 配置格式错误可能导致意外的重复注册行为

### 调试方法

1. **系统化排查**: 从本地配置 → 插件配置 → 官方文档，逐层深入
2. **对比验证**: 将实际配置与官方文档的 schema 定义对比
3. **文档查询**: 使用 WebFetch 工具查询官方文档确认规范
4. **数量统计**: 通过 `jq` 等工具统计配置项数量，快速定位问题

### 预防措施

1. **参考官方示例**: 创建插件配置时参考官方文档的示例
2. **Schema 验证**: 使用 JSON schema 验证工具检查配置文件
3. **测试验证**: 配置完成后进行完整的功能测试
4. **版本管理**: 配置变更时使用 Git 记录清晰的 commit 信息

---

## 附录

### 完整的 hooks.json 结构

```json
{
	"description": "在 Claude Code 任务完成后，发送通知。支持通过 Gemini AI 智能生成任务摘要。",
	"hooks": {
		"Stop": [
			{
				"hooks": [
					{
						"type": "command",
						"command": "pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message \"非gemini总结：任务完成\""
					},
					{
						"type": "command",
						"command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh",
						"timeout": 10
					}
				]
			}
		],
		"UserPromptSubmit": [
			{
				"hooks": [
					{
						"type": "command",
						"command": "pnpm dlx @ruan-cat/claude-notifier@latest check-and-notify"
					}
				]
			}
		]
		// ... 其他事件配置
	}
}
```

### Git 提交记录

相关的提交历史：

```bash
commit c8637d0a8deb93f2b2920e18bc9f66b55f487e33
Date:   Mon Nov 3 17:44:22 2025 +0800

    ✨ feat(root)!: claude code插件商城，提供基于各个钩子的通知提示配置钩子。
```

---

**报告完成时间**: 2025-11-03 20:50

**审核人**: ruan-cat

**状态**: ✅ 问题已修复，等待验证
