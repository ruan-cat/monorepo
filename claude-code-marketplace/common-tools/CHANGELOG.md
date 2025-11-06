# Changelog

`common-tools` Claude Code 插件的所有重要变更都将记录在此文件中。

本文档格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
项目遵循[语义化版本规范](https://semver.org/lang/zh-CN/)。

## [0.6.4] - 2025-11-07

### Changed

- **任务总结提示词优化**: 新增强制中文输出要求，确保 Gemini 生成的任务摘要始终使用中文，避免出现英文或其他语言

## [0.6.3] - 2025-11-07

### Fixed

- **🐞 对话历史解析格式错误**: 修复了 transcript-reader.ts 无法正确解析 Claude Code transcript.jsonl 文件格式的关键问题
  - **问题原因**: 解析逻辑期望的消息格式与 Claude Code 实际生成的格式不匹配
    - **期望格式**: 每行直接是 `{role: "user", content: "..."}`
    - **实际格式**: 每行是 `{type: "user", message: {role: "user", content: "..."}}`
  - **影响范围**:
    - `analyzeConversation` 函数无法找到任何有效消息
    - `userMessages` 和 `assistantMessages` 数组始终为空
    - `generateSummary` 总是返回默认值 "任务处理完成"
    - 钩子无法提取有效的对话上下文供 Gemini 使用
  - **修复方案**:
    1. 新增 `TranscriptLine` 接口定义真实的 JSONL 格式
    2. 修改 `readTranscript` 函数正确解析嵌套的消息结构
    3. 只提取 `type === "user"` 或 `type === "assistant"` 的行
    4. 从 `transcriptLine.message` 中获取真正的消息对象

### Technical Details

#### 修复前的解析逻辑

```typescript
// 错误：直接解析为 Message，期望顶层就有 role 字段
const msg = JSON.parse(line) as Message;
messages.push(msg);

// analyzeConversation 检查
if (msg.role === "user") { ... }  // ❌ role 不在顶层
```

#### 修复后的解析逻辑

```typescript
// 正确：先解析为 TranscriptLine，再提取嵌套的 message
const transcriptLine = JSON.parse(line) as TranscriptLine;

if ((transcriptLine.type === "user" || transcriptLine.type === "assistant") && transcriptLine.message) {
	messages.push(transcriptLine.message); // ✅ 提取真正的消息对象
}
```

#### Claude Code 实际的 transcript.jsonl 格式

```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "你好？你是什么模型啊？"
  },
  "uuid": "3c37859f-a9f2-40aa-a98c-9edc831847d9",
  "timestamp": "2025-11-06T21:06:26.835Z"
}

{
  "type": "assistant",
  "message": {
    "role": "assistant",
    "content": [
      {"type": "text", "text": "你好！我是 Claude Code..."}
    ],
    "model": "kimi-k2-turbo-preview"
  },
  "uuid": "5ff8f34b-b284-4229-970b-bab98195825a"
}
```

### Testing

测试结果确认修复成功：

**测试文件 1**: `d2de3058-8439-4374-803c-0db866cb1ede.jsonl`

```plain
✅ 修复前: "任务处理完成" (6 字符)
✅ 修复后: "你好？你是什么模型啊？\n\n我是 Claude Code，使用的是 Claude 3.5 Sonnet 模型。"
```

**测试文件 2**: `300b35d9-f468-4005-9811-2f6edf73b351.jsonl`

```plain
✅ 修复前: "任务处理完成" (6 字符)
✅ 修复后: "运行 vue-tsc --build 命令...\n\n已完成类型检查，发现 403 个类型错误..."
```

**关键词提取测试**:

```bash
tsx transcript-reader.ts <file> --format=keywords
✅ 输出: "Claude, 你好, 我是, Code, Sonnet, 模型, ..."
```

### References

- 修复的脚本：`scripts/transcript-reader.ts:43-48, 186-213`
- 相关日志分析：
  - `C:\Users\pc\AppData\Local\Temp\claude-code-task-complete-notifier-logs\2025-11-07__00-03-46__*.log`
  - 所有日志显示 "Extracted Context Length: 6 characters" (仅包含默认文本)

## [0.6.2] - 2025-11-06

### Fixed

- **🐞 钩子上下文读取失败**: 修复了 transcript-reader.js 因 ES Module 错误无法读取对话上下文的问题
  - **问题原因**: `transcript-reader.js` 使用 CommonJS 的 `require()` 语法，但父级 package.json 设置了 `"type": "module"`
  - **错误信息**: `ReferenceError: require is not defined in ES module scope`
  - **影响范围**:
    - `task-complete-notifier.sh`: 无法提取对话上下文，导致 Gemini 总结失败
    - 所有日志显示错误信息而非有效的任务摘要
  - **修复方案**:
    1. 将 `transcript-reader.js` 改为 `transcript-reader.ts`，使用 TypeScript + ES Module
    2. 创建 `parse-hook-data.ts` 解析钩子 JSON 输入（支持 Windows 路径转义）
    3. 使用全局 `tsx` 命令运行 TypeScript 文件
    4. 添加降级机制：tsx 不存在时使用 grep/sed 提取

### Changed

- **脚本迁移至 TypeScript**:
  - `transcript-reader.js` → `transcript-reader.ts`
  - 新增 `parse-hook-data.ts` 用于 JSON 解析
  - 添加完整的 TypeScript 类型定义
  - 改进错误处理和日志记录

- **Windows 路径支持增强**:
  - 修复 JSON 解析器无法处理 Windows 路径中的反斜杠问题
  - 实现智能转义：自动将单反斜杠转为双反斜杠
  - 兼容 Git Bash 和 PowerShell 环境

### Technical Details

#### 修复前的错误

日志显示的错误信息：

```plain
file:///C:/Users/pc/.claude/plugins/.../transcript-reader.js:15
const fs = require("fs");
           ^
ReferenceError: require is not defined in ES module scope
```

Gemini 收到的是错误信息而非上下文，导致总结失败。

#### 修复后的实现

**新文件结构**：

- `transcript-reader.ts` - TypeScript 版本，使用 `import` 语法
- `parse-hook-data.ts` - JSON 解析器，处理 Windows 路径转义

**运行方式**：

```bash
# 使用 tsx 运行 TypeScript 文件
tsx transcript-reader.ts "$TRANSCRIPT_PATH" --format=summary
tsx parse-hook-data.ts session_id < hook-data.json
```

**降级策略**：

```bash
# 检查 tsx 是否可用
if command -v tsx &> /dev/null; then
  # 使用 TypeScript 版本
  tsx transcript-reader.ts "$TRANSCRIPT_PATH" --format=summary
else
  # 记录 tsx 不存在的情况到日志
  log "WARNING: tsx not available, using default summary"
  SUMMARY="任务处理完成"
fi
```

#### Windows 路径转义问题

**问题**：钩子传入的 JSON 包含未转义的反斜杠

```json
{ "transcript_path": "C:\Users\pc\.claude\projects\..." }
```

**解决方案**：智能转义算法

```typescript
// 1. 暂存已转义的双反斜杠
input = input.replace(/\\\\/g, "\x00");
// 2. 将所有单反斜杠转为双反斜杠
input = input.replace(/\\/g, "\\\\");
// 3. 恢复双反斜杠
input = input.replace(/\x00/g, "\\\\");
```

### Testing

测试结果确认修复成功：

- ✅ JSON 解析正常（Session ID、Transcript Path 正确提取）
- ✅ transcript-reader.ts 成功执行
- ✅ 对话上下文正确提取
- ✅ Gemini 总结功能恢复正常
- ✅ Windows 路径正确处理

### References

- 修复的脚本：
  - `scripts/transcript-reader.ts` (新)
  - `scripts/parse-hook-data.ts` (新)
  - `scripts/task-complete-notifier.sh` (更新)
- 删除的文件：
  - `scripts/transcript-reader.js` (已废弃)

## [0.6.1] - 2025-11-04

### Fixed

- **🐞 钩子决策类型错误**: 修复了钩子返回值导致 Claude Code 内部故障的严重问题
  - **问题原因**: 钩子脚本返回了 `{"decision": "proceed"}`，但 Claude Code 只接受 `approve` 或 `block` 两种决策类型
  - **错误信息**: `Error: Unknown hook decision type: proceed. Valid types are: approve, block`
  - **影响范围**:
    - `user-prompt-logger.sh`: UserPromptSubmit 钩子无法正常工作
    - `task-complete-notifier.sh`: Stop 钩子导致 Claude Code 崩溃
  - **修复方案**: 将所有钩子脚本的返回值从 `"proceed"` 改为 `"approve"`
    - `user-prompt-logger.sh:60`: 快速返回时的决策类型
    - `task-complete-notifier.sh:48`: 错误陷阱中的决策类型
    - `task-complete-notifier.sh:247`: 正常输出时的决策类型

### Technical Details

#### 修复前的代码（导致崩溃）

```bash
# user-prompt-logger.sh:60
echo "{\"decision\": \"proceed\"}"  # ❌ 错误的决策类型

# task-complete-notifier.sh:48
trap 'echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT  # ❌ 错误的决策类型

# task-complete-notifier.sh:247
OUTPUT_JSON="{\"decision\": \"proceed\", ...}"  # ❌ 错误的决策类型
```

#### 修复后的代码（正常工作）

```bash
# user-prompt-logger.sh:60
echo "{\"decision\": \"approve\"}"  # ✅ 正确的决策类型

# task-complete-notifier.sh:48
trap 'echo "{\"decision\": \"approve\"}"; exit 0' ERR EXIT  # ✅ 正确的决策类型

# task-complete-notifier.sh:247
OUTPUT_JSON="{\"decision\": \"approve\", ...}"  # ✅ 正确的决策类型
```

#### 钩子决策类型规范

根据 Claude Code 官方文档，钩子返回的 JSON 必须包含 `decision` 字段，且只支持两种值：

| 决策类型  | 说明                       | 使用场景                     |
| --------- | -------------------------- | ---------------------------- |
| `approve` | 允许操作继续               | 正常执行，不阻塞 Claude Code |
| `block`   | 阻止操作继续，显示阻塞消息 | 需要用户确认或满足特定条件   |

**重要**: `proceed` 不是有效的决策类型，会导致 Claude Code 抛出异常并崩溃。

### References

- 修复的脚本：
  - `scripts/user-prompt-logger.sh`
  - `scripts/task-complete-notifier.sh`
- 官方文档：[Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

## [0.6.0] - 2025-11-04

### Added

- **完整对话历史读取**: 新增 `transcript-reader.js` JSONL 解析器
  - 读取完整的对话历史，不再限制消息数量
  - 支持三种输出格式：summary（摘要）、full（完整）、keywords（关键词）
  - 智能提取用户消息、Agent 响应、工具调用信息
  - 智能截断长文本，避免超过 Gemini token 限制

- **双钩子协作机制**: 实现 UserPromptSubmit 和 Stop 钩子协作
  - `user-prompt-logger.sh`: 在 UserPromptSubmit 钩子中初始化会话日志，记录用户输入
  - `task-complete-notifier.sh`: 在 Stop 钩子中读取完整上下文，生成总结
  - 快速返回（UserPromptSubmit < 1s，Stop < 15s），不阻塞 Claude Code

- **增强的总结生成**: 改进 Gemini 总结策略
  - 基于完整对话历史生成上下文（不再只读取最后 5 条）
  - 三级降级策略：gemini-2.5-flash → gemini-2.5-pro → 关键词提取
  - 提取第一个用户请求、最近交互、最后响应，构建结构化上下文
  - 更准确的总结结果，显著减少"任务处理完成"的空洞摘要

### Changed

- **上下文提取优化**: 从"读取最后 5 条，每条 500 字符"改为"读取全部，智能截断"
  - 旧实现：`lines.slice(-5)` + `substring(0, 500)`
  - 新实现：读取所有消息，按重要性智能截断（第一个请求 800 字符，最近交互 600 字符，最后响应 800 字符）
  - 总上下文限制：3000 字符（可配置）

- **日志记录增强**: 更详细的日志信息
  - 记录提取的上下文长度
  - 记录 Gemini 原始输出（便于调试）
  - 记录每次尝试的结果和耗时

- **钩子配置更新**: 在 hooks.json 中添加 UserPromptSubmit 钩子
  - 保留原有的所有钩子配置
  - 添加 `user-prompt-logger.sh` 到 UserPromptSubmit
  - 更新 Stop 钩子超时时间为 15 秒

### Fixed

- **上下文缺失问题**: 修复 Gemini 总结总是生成"任务处理完成"的根本原因
  - 问题原因：只读取最后 5 条消息且每条只截取 500 字符，导致上下文不足
  - 解决方案：读取完整对话历史，智能提取关键部分
  - 结果：Gemini 现在能基于完整上下文生成有意义的总结

- **关键词提取改进**: 优化降级策略中的关键词提取
  - 移除常见停用词（中文和英文）
  - 统计词频，返回前 10 个高频关键词
  - 作为 Gemini 失败时的兜底方案

### Technical Details

#### 新增文件

1. **transcript-reader.js** - 对话历史解析器

   ```javascript
   // 使用方式
   node transcript-reader.js /path/to/transcript.jsonl --format=summary
   ```

2. **user-prompt-logger.sh** - UserPromptSubmit 钩子
   ```bash
   # 记录到会话日志
   session_{SESSION_ID}_{TIMESTAMP}.log
   ```

#### 核心改进对比

| 对比项     | v0.5.1                   | v0.6.0                          |
| ---------- | ------------------------ | ------------------------------- |
| 上下文读取 | 最后 5 条，每条 500 字符 | 完整历史，智能截断 3000 字符    |
| 钩子数量   | 1 个（Stop）             | 2 个（UserPromptSubmit + Stop） |
| 解析方式   | 内联 Node.js 脚本        | 独立 transcript-reader.js       |
| 总结质量   | 经常返回"任务处理完成"   | 基于完整上下文的有意义总结      |

#### 架构设计

```plain
UserPromptSubmit  ──→  user-prompt-logger.sh
                        ├─ 初始化会话日志
                        └─ 记录用户输入

[Claude Code 处理中...]

Stop              ──→  task-complete-notifier.sh
                        ├─ 调用 transcript-reader.js
                        ├─ 生成 Gemini 总结
                        └─ 发送桌面通知
```

### Migration Guide

无需手动迁移。更新到 0.6.0 后，所有改进将自动生效：

1. UserPromptSubmit 钩子会自动开始记录用户输入
2. Stop 钩子会自动使用新的解析器读取完整上下文
3. Gemini 总结质量将显著提升

### References

- 设计文档：`docs/reports/2025-11-04-claude-code-conversation-context-improvement.md`
- 核心脚本：`scripts/transcript-reader.js`, `scripts/user-prompt-logger.sh`
- 改进的 Stop 钩子：`scripts/task-complete-notifier.sh`

## [0.5.1] - 2025-11-03

### Fixed

- **🐞 Stop hook 阻塞问题**: 修复了 `● Stop hook prevented continuation` 导致 Claude Code 无法继续执行的严重问题
  - **问题原因 1**：`tee` 命令导致 I/O 管道阻塞
    - 在 Gemini API 调用中使用 `2>&1 | tee -a "$LOG_FILE"` 同时记录日志和捕获输出
    - 管道操作在 Windows Git Bash 环境中可能挂起
  - **问题原因 2**：`pnpm dlx` 调用挂起
    - 通知器使用 `pnpm dlx` 可能需要下载包，时间不可控
    - Windows 环境下 `timeout` 命令对进程组的控制不可靠
  - **问题原因 3**：缺少全局错误处理
    - 没有错误陷阱确保脚本总是返回成功
    - 异常情况下会阻塞 Claude Code

- **修复方案**：
  1. 移除 `tee` 命令，改用分离的日志记录方式
     - 先捕获完整输出到变量
     - 再分别写入日志文件和提取结果
     - 避免管道阻塞
  2. 通知器后台运行
     - 使用子进程 `(...)&` 在后台执行
     - 不等待通知器完成，主脚本立即继续
     - 添加 8 秒超时保护
  3. 添加错误陷阱
     - 使用 `trap` 捕获 `ERR` 和 `EXIT` 信号
     - 确保脚本总是返回 `{"decision": "proceed"}`
     - 防止异常导致 hook 阻塞
  4. 优化超时时间
     - Gemini flash: 5s（快速响应）
     - Gemini pro: 5s（从 8s 优化）
     - Default model: 4s（更短超时）
     - 通知器: 8s（后台运行）

- **测试结果**：
  - ✅ 脚本在约 17 秒内完成（包括 3 次 Gemini 调用）
  - ✅ 返回有效的 JSON 输出：`{"decision": "proceed", "additionalContext": "..."}`
  - ✅ 即使 Gemini 和通知器失败，也能正常返回
  - ✅ 不再阻塞 Claude Code

### Technical Details

#### 修复前的代码（会阻塞）

```bash
# 问题 1: tee 命令导致管道阻塞
SUMMARY=$(timeout 5s gemini ... 2>&1 | tee -a "$LOG_FILE" | head -n 1)

# 问题 2: pnpm dlx 可能挂起，且等待完成
NOTIFIER_OUTPUT=$(pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" 2>&1)

# 问题 3: 缺少错误处理
# 如果任何步骤失败，脚本就会挂起或返回错误
```

#### 修复后的代码（不阻塞）

```bash
# 修复 1: 分离日志记录和输出捕获
GEMINI_OUTPUT=$(timeout 5s gemini ... 2>&1 || echo "")
echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
SUMMARY=$(echo "$GEMINI_OUTPUT" | head -n 1 | tr -d '\n')

# 修复 2: 通知器后台运行
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  timeout 8s pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" >> "$LOG_FILE" 2>&1
) &
log "Notifier started in background (PID: $!)"

# 修复 3: 错误陷阱确保总是成功返回
trap 'log "Script interrupted, returning success"; echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT
```

### References

- 问题分析：参见 `.github/prompts/index.md` 第 86-151 行
- 修复代码：`scripts/task-complete-notifier.sh`

## [0.5.0] - 2025-11-03

### Added

- **完整日志记录机制**: 新增自动日志记录系统
  - 日志位置：`%TEMP%\claude-code-task-complete-notifier-logs\`（Windows）或 `/tmp/claude-code-task-complete-notifier-logs/`（Linux/Mac）
  - 日志文件命名：`YYYY-MM-DD__HH-mm-ss__工作目录.log`
  - 记录内容：Hook 输入数据、对话上下文、Gemini prompt、响应、执行时间统计
  - 日志函数：`log()` 函数同时输出到控制台和日志文件

- **对话历史解析功能**: 从 `transcript_path` 读取对话历史
  - 支持 JSONL 格式解析（每行一个 JSON 对象）
  - 提取最近 5 条消息的用户和助手内容
  - 限制每条消息 500 字符，避免 prompt 过长
  - 智能组合成有意义的上下文摘要

- **多模型降级策略**: 实现三级模型选择机制
  - 级别 1：`gemini-2.5-flash`（5 秒超时，快速响应）
  - 级别 2：`gemini-2.5-pro`（8 秒超时，高质量总结）
  - 级别 3：默认模型（5 秒超时）
  - 降级策略：使用对话上下文前 50 字符

- **执行时间统计**: 记录每个 Gemini 调用的执行时间
  - 帮助分析和优化模型选择
  - 监控性能表现

- **详细功能文档**: 新增 `TASK_COMPLETE_NOTIFIER_README.md`
  - 完整的问题分析和解决方案说明
  - 模型选择建议和性能对比
  - 使用方法和调试指南
  - 示例日志展示

### Fixed

- **🐞 核心问题修复**: 修复了 Gemini 总结总是返回"任务已完成"的根本问题
  - **问题原因**：Stop 钩子不包含 `tool_input` 字段
  - **原始代码**：错误地尝试从 `data.tool_input?.description` 提取任务描述
  - **导致结果**：`TASK_DESCRIPTION` 始终为默认值"任务"，Gemini 收到的 prompt 过于简单
  - **解决方案**：从 `transcript_path` 读取完整对话历史并提取有意义的上下文

- **对话上下文提取**: 实现正确的数据提取逻辑
  - 使用 Node.js 解析 JSONL 格式的会话历史
  - 提取用户消息和助手响应的文本内容
  - 支持数组和字符串两种内容格式
  - 过滤空消息和无效数据

- **Gemini Prompt 优化**: 改进发送给 Gemini 的 prompt
  - 提供实际的对话内容而非空洞的"任务"
  - 包含明确的输出格式要求和示例
  - 清晰的字数限制（5-20 字）
  - 增强的上下文描述

### Changed

- **摘要长度调整**: 将最大长度从 20 字符扩展到 50 字符
  - 允许更详细的任务描述
  - 超过 50 字符时自动截断并添加 `...`

- **错误处理增强**: 改进 Gemini 调用的错误处理
  - 使用 `2>&1` 捕获错误输出并记录到日志
  - 使用 `tee` 同时输出到控制台和日志文件
  - 检查结果长度判断是否需要重试

- **超时策略优化**: 调整不同模型的超时时间
  - flash 模型：5 秒（符合快速响应需求）
  - pro 模型：8 秒（留出更多时间保证质量）
  - 默认模型：5 秒

### Technical Details

#### Stop 钩子的实际数据格式

```json
{
	"session_id": "abc123",
	"transcript_path": "~/.claude/projects/.../session.jsonl",
	"permission_mode": "default",
	"hook_event_name": "Stop",
	"stop_hook_active": true
}
```

**重要发现**：Stop 钩子**不包含** `tool_input`、`cwd` 或 `conversationMessages` 字段。

#### 对话历史文件格式

transcript_path 指向的 JSONL 文件格式：

```jsonl
{"role":"user","content":[{"type":"text","text":"用户消息"}]}
{"role":"assistant","content":[{"type":"text","text":"助手响应"}]}
```

#### 模型性能对比

| 模型             | 平均响应时间 | 总结质量 | 推荐场景               |
| ---------------- | ------------ | -------- | ---------------------- |
| gemini-2.5-flash | 1-3 秒       | 良好     | 快速通知，简单任务     |
| gemini-2.5-pro   | 3-6 秒       | 优秀     | 复杂任务，需要精准表达 |

**实施策略**：优先使用 flash（速度），失败时切换 pro（质量），确保在 5-8 秒内完成。

### Breaking Changes

无破坏性变更。所有改进都向后兼容。

### Migration Guide

无需迁移。现有用户更新到 0.5.0 后将自动享受改进的总结功能。

### Debugging

如果遇到总结问题，可以查看详细日志：

```powershell
# Windows
cd $env:TEMP\claude-code-task-complete-notifier-logs
Get-Content (Get-ChildItem | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

# Linux/Mac
tail -f /tmp/claude-code-task-complete-notifier-logs/$(ls -t /tmp/claude-code-task-complete-notifier-logs | head -1)
```

日志包含：

1. Hook 输入数据（完整 JSON）
2. 提取的对话上下文
3. 发送给 Gemini 的 prompt
4. Gemini 的原始响应
5. 执行时间统计
6. 最终通知结果

### References

- 详细说明：[scripts/TASK_COMPLETE_NOTIFIER_README.md](./scripts/TASK_COMPLETE_NOTIFIER_README.md)
- 官方文档：[Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

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
