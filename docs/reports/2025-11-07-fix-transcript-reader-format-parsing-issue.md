# 修复 transcript-reader.ts 格式解析问题

**日期**: 2025-11-07
**版本**: 0.6.3
**作者**: Claude (Sonnet 4.5)
**问题类型**: Bug 修复

## 摘要

本次修复解决了 `transcript-reader.ts` 无法正确解析 Claude Code 生成的 `transcript.jsonl` 文件格式的关键问题。该问题导致钩子系统无法提取有效的对话上下文，使得 Gemini AI 总结功能失效，每次都返回默认的"任务处理完成"文本。

## 问题描述

### 症状

从用户提供的日志文件可以观察到以下症状：

1. **提取的上下文长度异常短**: 所有日志显示 `Extracted Context Length: 6 characters`
2. **上下文内容始终为默认值**: `任务处理完成`
3. **Gemini 无法生成有意义的总结**: 因为输入的上下文是默认文本而非真实对话
4. **关键词提取也返回默认值**: `任务处理完成`

### 根本原因分析

通过深入分析代码和实际数据格式，发现了问题的根本原因：

**代码期望的格式与实际格式不匹配**

#### 代码期望的格式

```typescript
interface Message {
	role: "user" | "assistant" | "system";
	content: string | ContentItem[];
}

// readTranscript 函数期望每行直接是一个 Message 对象
const msg = JSON.parse(line) as Message;
messages.push(msg);
```

#### Claude Code 实际生成的格式

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
```

**关键差异**：

- 实际格式的 `role` 字段不在顶层，而是嵌套在 `message` 字段中
- 顶层有一个 `type` 字段标识消息类型
- 还包含 `uuid`、`timestamp` 等元数据

### 影响范围

这个格式不匹配导致了以下连锁反应：

```plain
readTranscript()
  → 解析每行为 Message 对象（❌ 格式不匹配）
  → analyzeConversation() 检查 msg.role === "user"（❌ role 不在顶层）
  → userMessages 和 assistantMessages 数组为空
  → generateSummary() 检测到数组为空
  → 返回默认值 "任务处理完成"
```

## 修复方案

### 设计思路

1. **定义正确的类型接口**: 创建 `TranscriptLine` 接口来描述实际的 JSONL 格式
2. **两步解析策略**: 先解析为 `TranscriptLine`，再提取嵌套的 `message` 对象
3. **类型过滤**: 只处理 `type === "user"` 或 `type === "assistant"` 的行，忽略其他元数据行

### 实现代码

#### 步骤 1: 新增 TranscriptLine 接口

```typescript
// Claude Code transcript.jsonl 实际格式
interface TranscriptLine {
	type: string;
	message?: Message;
	// 其他字段可选
	[key: string]: any;
}
```

#### 步骤 2: 修改 readTranscript 函数

```typescript
function readTranscript(transcriptPath: string): Message[] {
	// ... 文件读取逻辑 ...

	const messages: Message[] = [];
	for (const line of lines) {
		try {
			// 先解析为 TranscriptLine
			const transcriptLine = JSON.parse(line) as TranscriptLine;

			// 只处理 user 和 assistant 类型的消息
			if ((transcriptLine.type === "user" || transcriptLine.type === "assistant") && transcriptLine.message) {
				// 提取真正的消息对象
				messages.push(transcriptLine.message);
			}
		} catch (err) {
			console.error(`Failed to parse line: ${line.substring(0, 50)}...`, err.message);
		}
	}

	return messages;
}
```

### 修复前后对比

| 对比项          | 修复前                              | 修复后                                     |
| --------------- | ----------------------------------- | ------------------------------------------ |
| 解析逻辑        | `JSON.parse(line) as Message`       | `JSON.parse(line) as TranscriptLine`       |
| 消息提取        | 直接使用解析结果                    | 从 `transcriptLine.message` 提取           |
| 类型检查        | `msg.role === "user"` (❌ 始终失败) | `transcriptLine.type === "user"` (✅ 正确) |
| 提取的消息数量  | 0 条                                | 完整对话历史                               |
| 上下文长度      | 6 字符（默认文本）                  | 完整对话内容（数百到数千字符）             |
| Gemini 总结质量 | "任务处理完成"（无意义）            | 基于真实对话的有意义总结                   |

## 测试验证

### 测试环境

- **操作系统**: Windows 11
- **Node.js**: v22.x
- **tsx 版本**: 最新版
- **测试文件**:
  - `d2de3058-8439-4374-803c-0db866cb1ede.jsonl`
  - `300b35d9-f468-4005-9811-2f6edf73b351.jsonl`

### 测试结果

#### 测试 1: Summary 格式输出

**命令**:

```bash
tsx transcript-reader.ts "C:\Users\pc\.claude\projects\D--my-docs-personal-data\d2de3058-8439-4374-803c-0db866cb1ede.jsonl" --format=summary
```

**修复前**:

```plain
任务处理完成
```

**修复后**:

```plain
用户请求:
你好？你是什么模型啊？

最近的交互:
你好？你是什么模型啊？

请再检查一下自己是什么模型？

Agent 响应:
我是 Claude Code，使用的是 Claude 3.5 Sonnet 模型。
```

#### 测试 2: Keywords 格式输出

**命令**:

```bash
tsx transcript-reader.ts <file> --format=keywords
```

**修复前**:

```plain
任务处理完成
```

**修复后**:

```plain
Claude, 你好, 我是, Code, Sonnet, 模型, 你是什么模型啊, 请再检查一下自己是什么模型, Anthropic, 开发的
```

#### 测试 3: 复杂对话场景

**文件**: `300b35d9-f468-4005-9811-2f6edf73b351.jsonl`（包含 vue-tsc 类型检查任务）

**修复后的摘要**:

```plain
用户请求:
运行 vue-tsc --build 命令，将报错信息全部输出到 d:\code\01s\202510-12psi\yunxiao-code\zero-one-12psi\psi-frontend\docs\reports 内，以md形式输出。

Agent 响应:
已完成 `vue-tsc --build` 类型检查，并生成了详细的报告。
发现 403 个类型错误...
```

### 测试结论

✅ **所有测试通过**

- 成功提取用户消息和 Agent 响应
- 上下文长度从 6 字符提升到完整对话内容
- Gemini 能够基于真实对话生成有意义的总结
- 关键词提取功能正常工作

## 经验教训

### 1. 接口定义要基于实际数据

**教训**: 不要假设数据格式，而应该先查看实际数据再定义接口。

**示例**: 本次问题的根源就是假设 transcript.jsonl 的格式是简单的 `{role, content}`，但实际上是更复杂的嵌套结构。

**建议**:

- 在编写解析代码前，先用 `jq` 或类似工具查看实际的 JSON 结构
- 为实际格式创建准确的 TypeScript 接口
- 使用 `console.log` 输出解析结果，验证是否符合预期

### 2. 调试时要查看中间状态

**教训**: 当最终结果异常时，应该逐步检查每个环节的中间状态。

**示例**: 本次调试过程：

1. 发现 `generateSummary` 返回默认值
2. 检查 `userMessages` 和 `assistantMessages` 是否为空 → **发现为空**
3. 检查 `analyzeConversation` 的输入 → **发现消息数组也为空**
4. 检查 `readTranscript` 的解析结果 → **发现格式不匹配**

**建议**:

- 在关键函数中添加日志输出，记录数据流
- 使用 `console.log` 或 debugger 检查中间变量
- 从最终结果向上追溯，逐步定位问题

### 3. 类型系统的局限性

**教训**: TypeScript 的类型检查在运行时不生效，`as Type` 断言不会验证数据格式。

**示例**:

```typescript
// 这行代码不会报错，即使格式完全不匹配
const msg = JSON.parse(line) as Message;
```

**建议**:

- 使用运行时验证库（如 zod、io-ts）验证 JSON 数据
- 在解析后检查关键字段是否存在
- 添加错误处理捕获解析异常

### 4. 文档的重要性

**教训**: 官方文档和实际实现可能存在差异，要以实际数据为准。

**示例**: 可能文档中没有详细说明 transcript.jsonl 的确切格式，导致开发者只能猜测。

**建议**:

- 为自己的代码编写清晰的文档，说明数据格式
- 提供示例数据文件
- 在代码中添加注释说明关键的数据结构

### 5. 单元测试的价值

**教训**: 如果有单元测试覆盖 `readTranscript` 函数，这个问题在开发阶段就能发现。

**建议**:

- 为数据解析函数编写单元测试
- 使用真实的示例数据作为测试用例
- 测试边界情况（空文件、格式错误的行等）

## 后续改进建议

1. **添加运行时验证**

   ```typescript
   import { z } from "zod";

   const TranscriptLineSchema = z.object({
   	type: z.enum(["user", "assistant", "system" /* ... */]),
   	message: z
   		.object({
   			role: z.enum(["user", "assistant", "system"]),
   			content: z.union([z.string(), z.array(ContentItemSchema)]),
   		})
   		.optional(),
   	// 其他字段...
   });
   ```

2. **添加单元测试**

   ```typescript
   describe("readTranscript", () => {
   	it("should parse Claude Code transcript.jsonl format", () => {
   		const messages = readTranscript("./fixtures/sample.jsonl");
   		expect(messages).toHaveLength(2);
   		expect(messages[0].role).toBe("user");
   	});
   });
   ```

3. **增强错误处理**

   ```typescript
   try {
   	const transcriptLine = JSON.parse(line) as TranscriptLine;

   	if (!transcriptLine.message) {
   		console.warn(`Line ${lineNum}: message field is missing`);
   		continue;
   	}

   	// ...
   } catch (err) {
   	console.error(`Line ${lineNum}: Failed to parse - ${err.message}`);
   	console.error(`Raw line: ${line.substring(0, 100)}...`);
   }
   ```

4. **更新文档**
   - 在 README 中添加 transcript.jsonl 格式说明
   - 提供示例 JSONL 文件
   - 说明如何调试解析问题

## 总结

本次修复通过正确识别 Claude Code 生成的 transcript.jsonl 文件格式，并相应地调整了解析逻辑，成功恢复了对话上下文提取功能。这使得 Gemini AI 总结系统能够基于真实的对话内容生成有意义的任务摘要，而不是返回无意义的默认文本。

**关键收获**：

- ✅ 始终以实际数据为准，不要假设格式
- ✅ 使用 TypeScript 接口准确描述数据结构
- ✅ 添加充分的错误处理和日志记录
- ✅ 通过实际测试验证修复效果

**影响**：

- 用户现在可以看到有意义的任务总结通知
- 钩子系统的核心功能得以恢复
- 为后续的功能开发奠定了稳定的基础

---

**相关文件**:

- `claude-code-marketplace/common-tools/scripts/transcript-reader.ts`
- `claude-code-marketplace/common-tools/CHANGELOG.md`
- `claude-code-marketplace/common-tools/README.md`

**版本**: 0.6.3
**发布日期**: 2025-11-07
