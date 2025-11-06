#!/usr/bin/env tsx
/**
 * Claude Code 对话历史解析器
 * 读取 transcript.jsonl 文件，提取完整的用户输入和 Agent 响应
 *
 * 使用方式：
 *   tsx transcript-reader.ts <transcript_path> [--format=summary|full|keywords]
 *
 * 输出格式：
 *   - summary: 结构化的对话摘要（默认）
 *   - full: 完整的对话历史
 *   - keywords: 关键词提取
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ====== 配置参数 ======
const MAX_CONTEXT_LENGTH = 3000; // 最大上下文长度（字符数）
const MAX_MESSAGES_TO_INCLUDE = 20; // 最多包含的消息数量

// ====== 类型定义 ======

interface TextContent {
	type: "text";
	text: string;
}

interface ToolUse {
	type: "tool_use";
	name: string;
	input: Record<string, any>;
}

type ContentItem = TextContent | ToolUse;

interface Message {
	role: "user" | "assistant" | "system";
	content: string | ContentItem[];
}

// Claude Code transcript.jsonl 实际格式
interface TranscriptLine {
	type: string;
	message?: Message;
	// 其他字段可选
	[key: string]: any;
}

interface ToolCallInfo {
	tool: string;
	input: Record<string, any>;
}

interface ConversationAnalysis {
	userMessages: string[];
	assistantMessages: string[];
	toolCalls: ToolCallInfo[];
	totalMessages: number;
}

// ====== 工具函数 ======

/**
 * 从消息中提取文本内容
 */
function extractTextContent(message: Message): string {
	if (!message || !message.content) return "";

	if (typeof message.content === "string") {
		return message.content;
	}

	if (Array.isArray(message.content)) {
		return message.content
			.filter((c): c is TextContent => c && c.type === "text")
			.map((c) => c.text || "")
			.join("\n");
	}

	return "";
}

/**
 * 从消息中提取工具调用信息
 */
function extractToolUses(message: Message): ToolCallInfo[] {
	if (!message || !message.content || !Array.isArray(message.content)) {
		return [];
	}

	return message.content
		.filter((c): c is ToolUse => c && c.type === "tool_use")
		.map((c) => ({
			tool: c.name || "unknown",
			input: c.input || {},
		}));
}

/**
 * 智能截断文本，保留关键部分
 */
function smartTruncate(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) return text;

	// 优先保留开头和结尾
	const headLength = Math.floor(maxLength * 0.6);
	const tailLength = Math.floor(maxLength * 0.3);

	const head = text.substring(0, headLength);
	const tail = text.substring(text.length - tailLength);

	return `${head}\n\n[... 省略 ${text.length - maxLength} 字符 ...]\n\n${tail}`;
}

/**
 * 提取关键词（简单实现）
 */
function extractKeywords(text: string): string[] {
	if (!text) return [];

	// 移除常见的停用词
	const stopWords = new Set([
		"的",
		"了",
		"在",
		"是",
		"我",
		"有",
		"和",
		"就",
		"不",
		"人",
		"都",
		"一",
		"一个",
		"上",
		"也",
		"很",
		"到",
		"说",
		"要",
		"去",
		"你",
		"会",
		"着",
		"没有",
		"the",
		"is",
		"at",
		"which",
		"on",
		"a",
		"an",
		"and",
		"or",
		"but",
		"in",
		"with",
	]);

	// 提取中文词汇和英文单词
	const words = text.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g) || [];

	// 统计词频
	const wordCount: Record<string, number> = {};
	words.forEach((word) => {
		const normalized = word.toLowerCase();
		if (!stopWords.has(normalized)) {
			wordCount[word] = (wordCount[word] || 0) + 1;
		}
	});

	// 按词频排序，返回前10个
	return Object.entries(wordCount)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([word]) => word);
}

// ====== 主函数 ======

/**
 * 读取并解析 JSONL 文件
 */
function readTranscript(transcriptPath: string): Message[] {
	if (!transcriptPath || !fs.existsSync(transcriptPath)) {
		throw new Error(`Transcript file not found: ${transcriptPath}`);
	}

	const content = fs.readFileSync(transcriptPath, "utf8");
	const lines = content
		.trim()
		.split("\n")
		.filter((l) => l.trim());

	const messages: Message[] = [];
	for (const line of lines) {
		try {
			const transcriptLine = JSON.parse(line) as TranscriptLine;

			// 只处理 user 和 assistant 类型的消息
			if ((transcriptLine.type === "user" || transcriptLine.type === "assistant") && transcriptLine.message) {
				messages.push(transcriptLine.message);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			console.error(`Failed to parse line: ${line.substring(0, 50)}...`, errorMessage);
		}
	}

	return messages;
}

/**
 * 分析对话历史，提取关键信息
 */
function analyzeConversation(messages: Message[]): ConversationAnalysis {
	const userMessages: string[] = [];
	const assistantMessages: string[] = [];
	const toolCalls: ToolCallInfo[] = [];

	messages.forEach((msg) => {
		if (msg.role === "user") {
			const text = extractTextContent(msg);
			if (text) userMessages.push(text);
		} else if (msg.role === "assistant") {
			const text = extractTextContent(msg);
			if (text) assistantMessages.push(text);

			const tools = extractToolUses(msg);
			toolCalls.push(...tools);
		}
	});

	return {
		userMessages,
		assistantMessages,
		toolCalls,
		totalMessages: messages.length,
	};
}

/**
 * 生成对话摘要（用于 Gemini）
 */
function generateSummary(analysis: ConversationAnalysis): string {
	const { userMessages, assistantMessages, toolCalls } = analysis;

	if (userMessages.length === 0 && assistantMessages.length === 0) {
		return "任务处理完成";
	}

	// 获取第一个用户请求（通常是主要任务）
	const firstUserMsg = userMessages[0] || "";

	// 获取最后几条用户消息（可能是补充需求）
	const recentUserMsgs = userMessages.slice(-3);

	// 获取最后的 Assistant 响应
	const lastAssistantMsg = assistantMessages[assistantMessages.length - 1] || "";

	// 提取工具调用摘要
	const toolSummary = toolCalls.length > 0 ? `\n\n工具调用: ${toolCalls.map((t) => t.tool).join(", ")}` : "";

	// 构建上下文
	let context = "";

	// 第一个用户请求
	context += `用户请求:\n${smartTruncate(firstUserMsg, 800)}\n\n`;

	// 如果有多轮对话，添加最近的请求
	if (recentUserMsgs.length > 1) {
		const recentContext = recentUserMsgs.slice(-2).join("\n\n");
		context += `最近的交互:\n${smartTruncate(recentContext, 600)}\n\n`;
	}

	// 最后的响应
	if (lastAssistantMsg) {
		context += `Agent 响应:\n${smartTruncate(lastAssistantMsg, 800)}`;
	}

	// 添加工具调用信息
	context += toolSummary;

	// 确保总长度不超过限制
	return smartTruncate(context, MAX_CONTEXT_LENGTH);
}

/**
 * 生成完整对话历史
 */
function generateFullContext(analysis: ConversationAnalysis): string {
	const { userMessages, assistantMessages } = analysis;

	let context = "===== 完整对话历史 =====\n\n";

	const maxMessages = Math.min(Math.max(userMessages.length, assistantMessages.length), MAX_MESSAGES_TO_INCLUDE);

	for (let i = 0; i < maxMessages; i++) {
		if (userMessages[i]) {
			context += `[用户]: ${userMessages[i]}\n\n`;
		}
		if (assistantMessages[i]) {
			context += `[Agent]: ${assistantMessages[i]}\n\n`;
		}
		context += "---\n\n";
	}

	return smartTruncate(context, MAX_CONTEXT_LENGTH * 2);
}

/**
 * 生成关键词摘要
 */
function generateKeywordSummary(analysis: ConversationAnalysis): string {
	const { userMessages, assistantMessages } = analysis;

	const allText = [...userMessages, ...assistantMessages].join(" ");
	const keywords = extractKeywords(allText);

	return keywords.length > 0 ? keywords.join(", ") : "任务处理完成";
}

// ====== CLI 入口 ======

function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
		console.log(`
用法: tsx transcript-reader.ts <transcript_path> [--format=summary|full|keywords]

参数:
  transcript_path    JSONL 格式的对话历史文件路径
  --format          输出格式 (默认: summary)
                    - summary: 结构化摘要（适合 Gemini）
                    - full: 完整对话历史
                    - keywords: 关键词提取

示例:
  tsx transcript-reader.ts /path/to/transcript.jsonl
  tsx transcript-reader.ts /path/to/transcript.jsonl --format=full
  tsx transcript-reader.ts /path/to/transcript.jsonl --format=keywords
`);
		process.exit(0);
	}

	const transcriptPath = args[0];
	const formatArg = args.find((arg) => arg.startsWith("--format="));
	const format = formatArg ? formatArg.split("=")[1] : "summary";

	try {
		// 读取并解析对话历史
		const messages = readTranscript(transcriptPath);

		// 分析对话
		const analysis = analyzeConversation(messages);

		// 根据格式输出
		let output: string;
		switch (format) {
			case "full":
				output = generateFullContext(analysis);
				break;
			case "keywords":
				output = generateKeywordSummary(analysis);
				break;
			case "summary":
			default:
				output = generateSummary(analysis);
				break;
		}

		console.log(output);
		process.exit(0);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`ERROR: ${errorMessage}`);
		process.exit(1);
	}
}

// 运行
main();

// 导出供其他模块使用
export { readTranscript, analyzeConversation, generateSummary, extractKeywords };
