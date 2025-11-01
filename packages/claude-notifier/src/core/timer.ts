import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
	TimerStateFile,
	SessionTimerState,
	LongTaskOptions,
	IconPreset,
	SoundPreset,
	HookInputData,
} from "../types/index.ts";
import { sendNotification } from "./notifier.ts";

/**
 * 默认提醒时间点（分钟）
 */
const DEFAULT_INTERVALS = [6, 10, 18, 25, 45];

/**
 * 定时器状态文件路径
 */
const TIMER_STATE_FILE = path.join(os.tmpdir(), ".claude-notifier-timer.json");

/**
 * 最大任务存活时间（毫秒）- 8 小时
 */
const MAX_TASK_AGE = 8 * 60 * 60 * 1000;

/**
 * 最小检查间隔（毫秒）- 10 秒
 * 防止在很短时间内重复检查同一任务
 */
const MIN_CHECK_INTERVAL = 10 * 1000;

/**
 * 加载所有会话状态
 * @returns 状态文件对象
 */
export function loadAllSessions(): TimerStateFile {
	try {
		if (!existsSync(TIMER_STATE_FILE)) {
			return { sessions: {} };
		}
		const content = readFileSync(TIMER_STATE_FILE, "utf-8");
		const data = JSON.parse(content);

		// 兼容性检查：确保数据格式正确
		if (!data || typeof data !== "object") {
			return { sessions: {} };
		}

		// 如果是旧格式（直接是 TimerState），忽略并返回空
		if ("pid" in data || !("sessions" in data)) {
			return { sessions: {} };
		}

		// 确保 sessions 字段存在且是对象
		if (!data.sessions || typeof data.sessions !== "object") {
			return { sessions: {} };
		}

		return data as TimerStateFile;
	} catch (error) {
		console.error("加载定时器状态失败:", error);
		return { sessions: {} };
	}
}

/**
 * 保存所有会话状态
 * @param stateFile - 状态文件对象
 */
export function saveAllSessions(stateFile: TimerStateFile): void {
	try {
		writeFileSync(TIMER_STATE_FILE, JSON.stringify(stateFile, null, 2), "utf-8");
	} catch (error) {
		console.error("保存定时器状态失败:", error);
	}
}

/**
 * 添加或更新会话
 * @param sessionId - 会话 ID
 * @param options - 长任务配置选项
 */
export function addOrUpdateSession(sessionId: string, options?: LongTaskOptions): void {
	const stateFile = loadAllSessions();
	const now = Date.now();

	// 如果会话已存在，只更新配置（但不重置时间）
	if (stateFile.sessions[sessionId]) {
		const existingSession = stateFile.sessions[sessionId];
		if (options) {
			existingSession.intervals = options.intervals || existingSession.intervals;
			existingSession.sound = options.sound || existingSession.sound;
			existingSession.icon = options.icon || existingSession.icon;
			existingSession.taskDescription = options.taskDescription || existingSession.taskDescription;
		}
	} else {
		// 创建新会话
		stateFile.sessions[sessionId] = {
			sessionId,
			addedTime: now,
			startTime: now,
			lastCheckTime: 0,
			intervals: options?.intervals || DEFAULT_INTERVALS,
			triggeredIndexes: [],
			sound: options?.sound || SoundPreset.WARNING,
			icon: options?.icon || IconPreset.CLOCK,
			taskDescription: options?.taskDescription,
		};
	}

	saveAllSessions(stateFile);
}

/**
 * 删除会话
 * @param sessionId - 会话 ID
 */
export function removeSession(sessionId: string): void {
	const stateFile = loadAllSessions();
	if (stateFile.sessions[sessionId]) {
		delete stateFile.sessions[sessionId];
		saveAllSessions(stateFile);
	}
}

/**
 * 清理超过 8 小时的会话
 * @returns 清理的会话数量
 */
export function cleanupExpiredSessions(): number {
	const stateFile = loadAllSessions();
	const now = Date.now();
	let cleanedCount = 0;

	for (const [sessionId, session] of Object.entries(stateFile.sessions)) {
		const age = now - session.addedTime;
		if (age > MAX_TASK_AGE) {
			delete stateFile.sessions[sessionId];
			cleanedCount++;
		}
	}

	if (cleanedCount > 0) {
		saveAllSessions(stateFile);
	}

	return cleanedCount;
}

/**
 * 检查单个会话并发送通知
 * @param sessionId - 会话 ID
 * @returns 发送的通知数量
 */
export async function checkAndNotifySession(sessionId: string): Promise<number> {
	const stateFile = loadAllSessions();
	const session = stateFile.sessions[sessionId];

	if (!session) {
		return 0;
	}

	const now = Date.now();

	// 检查是否距离上次检查太近（防止重复通知）
	if (now - session.lastCheckTime < MIN_CHECK_INTERVAL) {
		return 0;
	}

	// 更新上次检查时间
	session.lastCheckTime = now;

	const elapsedMinutes = (now - session.startTime) / 1000 / 60;
	let notificationsSent = 0;

	// 检查是否需要发送通知
	for (let i = 0; i < session.intervals.length; i++) {
		const intervalMinute = session.intervals[i];

		// 如果已触发过，跳过
		if (session.triggeredIndexes.includes(i)) {
			continue;
		}

		// 如果已达到该时间点
		if (elapsedMinutes >= intervalMinute) {
			// 发送通知
			const message = session.taskDescription
				? `任务 "${session.taskDescription}" 已执行 ${intervalMinute} 分钟`
				: `当前任务已执行 ${intervalMinute} 分钟`;

			try {
				await sendNotification({
					title: "Claude Code - 长任务提醒",
					message,
					sound: session.sound,
					icon: session.icon,
				});
				notificationsSent++;
			} catch (err) {
				console.error("发送通知失败:", err);
			}

			// 标记为已触发
			session.triggeredIndexes.push(i);
		}
	}

	// 保存更新后的状态
	saveAllSessions(stateFile);

	return notificationsSent;
}

/**
 * 检查所有会话并发送通知
 * @returns 发送的通知总数
 */
export async function checkAndNotifyAll(): Promise<number> {
	const stateFile = loadAllSessions();
	let totalNotifications = 0;

	for (const sessionId of Object.keys(stateFile.sessions)) {
		const count = await checkAndNotifySession(sessionId);
		totalNotifications += count;
	}

	return totalNotifications;
}

/**
 * 获取会话状态
 * @param sessionId - 会话 ID
 * @returns 会话状态或 null
 */
export function getSessionState(sessionId: string): SessionTimerState | null {
	const stateFile = loadAllSessions();
	return stateFile.sessions[sessionId] || null;
}

/**
 * 获取所有会话状态
 * @returns 所有会话状态
 */
export function getAllSessionStates(): Record<string, SessionTimerState> {
	const stateFile = loadAllSessions();
	return stateFile.sessions;
}

/**
 * 从 stdin 读取 Hook 输入数据
 * @returns Promise<HookInputData | null>
 */
export function readHookInput(): Promise<HookInputData | null> {
	return new Promise((resolve) => {
		let data = "";

		process.stdin.setEncoding("utf-8");

		process.stdin.on("data", (chunk) => {
			data += chunk;
		});

		process.stdin.on("end", () => {
			try {
				if (!data.trim()) {
					resolve(null);
					return;
				}
				const parsed = JSON.parse(data) as HookInputData;
				resolve(parsed);
			} catch (error) {
				console.error("解析 stdin JSON 失败:", error);
				resolve(null);
			}
		});

		process.stdin.on("error", (error) => {
			console.error("读取 stdin 失败:", error);
			resolve(null);
		});
	});
}
