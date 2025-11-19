---
"@ruan-cat/claude-notifier": minor
---

## 🔧 修复 Stop Hooks stdin 竞争问题，优化任务管理架构

### 新增功能

#### 1. 新增独立任务删除脚本

新增 `src/scripts/remove-task.ts`，可被 tsx 直接调用，用于在 Bash 脚本中删除任务：

```bash
tsx packages/claude-notifier/src/scripts/remove-task.ts /path/to/project
```

**特性**：

- ✅ 接受 cwd 作为命令行参数
- ✅ 2 秒超时保护
- ✅ 详细的成功/失败日志
- ✅ 不依赖 stdin，避免竞争

#### 2. check-and-notify 支持环境变量

`check-and-notify` 命令现在优先使用环境变量获取数据，避免 stdin 竞争：

```bash
# 支持的环境变量
CLAUDE_CWD               # 当前工作目录
CLAUDE_HOOK_EVENT        # Hook 事件名称
CLAUDE_STOP_HOOK_ACTIVE  # Stop hook 是否激活
```

**数据获取优先级**：

1. 环境变量（优先）
2. stdin（fallback）

### 重要改进

#### 1. Stop 事件自动跳过

`check-and-notify` 现在会自动检测并跳过 Stop/SubagentStop 事件：

```typescript
// 环境变量拦截（第一重防护）
if (envHookEvent === "Stop" || envHookEvent === "SubagentStop") {
	log("⚠️  check-and-notify 不应该在 Stop 钩子中被调用");
	return;
}

// stdin 拦截（第二重防护）
if (hook_event_name === "Stop" || hook_event_name === "SubagentStop") {
	log("⚠️  check-and-notify 不应该在 Stop 钩子中被调用");
	return;
}
```

#### 2. 优化日志输出

- 详细的环境变量检查日志
- 数据来源追踪（环境变量 vs stdin）
- 更清晰的警告和错误信息

### 破坏性变更 ⚠️

#### 不再在 Stop Hooks 中使用 check-and-notify

**原因**：

多个钩子竞争读取 stdin 流，导致：

- ❌ 后续钩子无法获取数据（500ms 超时返回 null）
- ❌ 任务删除逻辑无法执行
- ❌ 已完成的任务持续触发 6 分钟、10 分钟的长任务提醒

**修复方案**：

任务删除现在由 `task-complete-notifier.sh` 直接调用 `remove-task.ts` 完成：

```bash
# task-complete-notifier.sh 中的新逻辑
tsx "$MONOREPO_ROOT/packages/claude-notifier/src/scripts/remove-task.ts" "$PROJECT_DIR"
```

**新的 Stop Hooks 配置**（推荐）：

```json
{
	"Stop": [
		{
			"hooks": [
				{
					"type": "command",
					"command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh",
					"timeout": 20
				},
				{
					"type": "command",
					"command": "claude-notifier task-complete --message \"任务完成\"",
					"timeout": 5
				}
			]
		}
	]
}
```

**迁移指南**：

如果你的 Stop hooks 配置中包含 `check-and-notify`，请移除它：

```diff
{
  "Stop": [
    {
      "hooks": [
        {
          "command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh",
          "timeout": 20
        },
-       {
-         "command": "claude-notifier check-and-notify",
-         "timeout": 5
-       }
      ]
    }
  ]
}
```

**其他 Hooks 保持不变**：

`check-and-notify` 仍然可以在以下 hooks 中正常使用：

- ✅ UserPromptSubmit（创建任务）
- ✅ PreToolUse（检查长任务）
- ✅ SessionEnd（清理任务）
- ✅ SubagentStop（清理子任务）- 如果配置了环境变量

### 技术细节

#### stdin 竞争问题详解

**问题机制**：

1. Claude Code 为每个 hook 提供相同的 stdin 数据
2. Node.js 的 `process.stdin` 是流式读取，只能被消费一次
3. 第一个钩子读取后，后续钩子读到空数据
4. `readHookInput()` 设置了 500ms 超时，超时后返回 `null`
5. `check-and-notify` 检测到 `null` 后提前返回，不执行删除任务逻辑

**执行时序**（修复前）：

| 钩子                      | stdin 状态      | 结果                               |
| ------------------------- | --------------- | ---------------------------------- |
| task-complete-notifier.sh | ✅ 成功读取     | Gemini 总结完成                    |
| task-complete             | ⚠️ 不需要 stdin | 发送通知                           |
| check-and-notify          | ❌ stdin 已空   | 500ms 超时 → 提前返回 → 任务未删除 |

**执行时序**（修复后）：

| 钩子                      | stdin 状态      | 结果                                |
| ------------------------- | --------------- | ----------------------------------- |
| task-complete-notifier.sh | ✅ 成功读取     | Gemini 总结 + tsx remove-task.ts ✅ |
| task-complete             | ⚠️ 不需要 stdin | 发送通知 ✅                         |

#### 设计权衡

**为什么不在所有 hooks 中移除 check-and-notify？**

- ✅ 其他 hooks（如 PreToolUse）通常只有一个钩子，不存在竞争
- ✅ 环境变量方案可以避免 stdin 竞争（长期方案）
- ✅ 长任务监控功能仍然需要 `check-and-notify`

**为什么 Stop hooks 特殊？**

- ⚠️ Stop hooks 通常包含多个钩子（Gemini 总结 + 通知）
- ⚠️ stdin 竞争在 Stop 阶段最严重（执行时间长，更容易超时）
- ⚠️ 任务删除是关键操作，必须可靠执行

### 相关文件

#### 新增文件

- `src/scripts/remove-task.ts` - 独立任务删除脚本

#### 修改文件

- `src/commands/check-and-notify.ts` - 支持环境变量，自动跳过 Stop 事件
- `src/core/timer.ts` - 无变更（仅被新脚本调用）

#### 文档和报告

- `docs/reports/2025-11-19-stop-hooks-failure-analysis.md` - 问题深度分析报告
- `docs/reports/2025-11-19-common-tools-v0.8.0-release.md` - 发布报告

### 依赖要求

确保以下工具已安装：

- ✅ `tsx`（全局安装）：`npm install -g tsx`
- ✅ `node-notifier`（已在依赖中）
- ✅ `gemini` CLI（可选，用于 Gemini 总结）

### 验证步骤

1. **安装 tsx**（如果尚未安装）

   ```bash
   npm install -g tsx
   ```

2. **测试任务删除脚本**

   ```bash
   tsx packages/claude-notifier/src/scripts/remove-task.ts
   ```

3. **查看任务状态文件**

   ```bash
   # Windows
   type %TEMP%\.claude-notifier-timer.json

   # Linux/Mac
   cat ~/.claude-notifier-timer.json
   ```

4. **完整测试流程**
   - 启动 Claude Code 对话
   - 提交任务并等待完成
   - 观察 Stop hook 执行（应该看到两个通知）
   - 等待 6 分钟，确认不再收到长任务通知 ✅

### 后续计划

#### 短期优化

1. **推动 Claude Code 支持环境变量注入**
   - 在 hooks.json 中配置 `env` 字段
   - 完全避免 stdin 竞争

2. **减少 Gemini 超时时间**
   - 当前：Flash 5s + Pro 5s = 10s
   - 优化：Flash 3s + Pro 3s = 6s

#### 长期规划

1. **重构为单一 Node.js 钩子**
   - 合并 task-complete-notifier.sh 的逻辑到 TypeScript
   - 避免 Bash 脚本的跨平台问题

2. **使用 SQLite 替代 JSON 文件**
   - 更好的并发控制
   - 事务支持
   - 性能提升

### 致谢

感谢所有在测试和问题排查过程中提供帮助的用户。此次修复彻底解决了长期存在的 Stop hooks 超时和重复通知问题。
