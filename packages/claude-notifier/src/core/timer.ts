import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import dayjs from "dayjs";
import { TimerStateFile, TaskState, HookInputData, IconPreset, SoundPreset } from "../types/index.ts";
import { sendNotification } from "./notifier.ts";

/**
 * 默认提醒时间点（分钟）
 */
export const DEFAULT_INTERVALS = [6, 10, 18, 25, 45];

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
 * 时间格式化模板
 */
const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * 格式化时间为语义化字符串
 * @param timestamp - 时间戳或 Date 对象
 * @returns 格式化后的时间字符串
 */
export function formatTime(timestamp?: number | Date): string {
	return dayjs(timestamp).format(TIME_FORMAT);
}

/**
 * 解析语义化时间字符串为时间戳
 * @param timeString - 时间字符串
 * @returns 时间戳
 */
export function parseTime(timeString: string): number {
	return dayjs(timeString, TIME_FORMAT).valueOf();
}

/**
 * 计算时间差并格式化为"X分Y秒"
 * @param startTime - 开始时间字符串
 * @param endTime - 结束时间（默认为当前时间）
 * @returns 格式化的时间差字符串
 */
export function formatTimeDiff(startTime: string, endTime?: string): string {
	const start = parseTime(startTime);
	const end = endTime ? parseTime(endTime) : Date.now();
	const diffSeconds = Math.floor((end - start) / 1000);

	const minutes = Math.floor(diffSeconds / 60);
	const seconds = diffSeconds % 60;

	return `${minutes}分${seconds}秒`;
}

/**
 * 加载所有任务状态
 * @returns 状态文件对象
 */
export function loadAllTasks(): TimerStateFile {
	try {
		if (!existsSync(TIMER_STATE_FILE)) {
			return { tasks: {} };
		}
		const content = readFileSync(TIMER_STATE_FILE, "utf-8");
		const data = JSON.parse(content);

		// 兼容性检查：确保数据格式正确
		if (!data || typeof data !== "object") {
			return { tasks: {} };
		}

		// 如果是旧格式（sessions），忽略并返回空
		if ("sessions" in data) {
			return { tasks: {} };
		}

		// 确保 tasks 字段存在且是对象
		if (!data.tasks || typeof data.tasks !== "object") {
			return { tasks: {} };
		}

		return data as TimerStateFile;
	} catch (error) {
		console.error("加载定时器状态失败:", error);
		return { tasks: {} };
	}
}

/**
 * 保存所有任务状态
 * @param stateFile - 状态文件对象
 */
export function saveAllTasks(stateFile: TimerStateFile): void {
	try {
		writeFileSync(TIMER_STATE_FILE, JSON.stringify(stateFile, null, 2), "utf-8");
	} catch (error) {
		console.error("保存定时器状态失败:", error);
	}
}

/**
 * 添加或重置任务（用于 UserPromptSubmit 事件）
 * @param cwd - 当前工作目录
 */
export function addOrResetTask(cwd: string): void {
	const stateFile = loadAllTasks();
	const now = formatTime();

	// 无条件删除旧任务并创建新任务
	stateFile.tasks[cwd] = {
		cwd,
		addedTime: now,
		startTime: now,
		lastCheckTime: now,
		triggeredIndexes: [],
	};

	saveAllTasks(stateFile);
}

/**
 * 删除任务
 * @param cwd - 当前工作目录
 */
export function removeTask(cwd: string): void {
	const stateFile = loadAllTasks();
	if (stateFile.tasks[cwd]) {
		delete stateFile.tasks[cwd];
		saveAllTasks(stateFile);
	}
}

/**
 * 清理超过 8 小时的任务
 * @returns 清理的任务数量
 */
export function cleanupExpiredTasks(): number {
	const stateFile = loadAllTasks();
	const now = Date.now();
	let cleanedCount = 0;

	for (const [cwd, task] of Object.entries(stateFile.tasks)) {
		const addedTime = parseTime(task.addedTime);
		const age = now - addedTime;
		if (age > MAX_TASK_AGE) {
			delete stateFile.tasks[cwd];
			cleanedCount++;
		}
	}

	if (cleanedCount > 0) {
		saveAllTasks(stateFile);
	}

	return cleanedCount;
}

/**
 * 检查单个任务并发送通知
 * @param cwd - 当前工作目录
 * @param intervals - 提醒时间点数组（分钟）
 * @returns 发送的通知数量
 */
export async function checkAndNotifyTask(cwd: string, intervals: number[] = DEFAULT_INTERVALS): Promise<number> {
	const stateFile = loadAllTasks();
	const task = stateFile.tasks[cwd];

	if (!task) {
		return 0;
	}

	const now = Date.now();
	const lastCheckTime = parseTime(task.lastCheckTime);

	// 检查是否距离上次检查太近（防止重复通知）
	if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
		return 0;
	}

	// 更新上次检查时间并立即保存（防止重复通知）
	task.lastCheckTime = formatTime(now);
	saveAllTasks(stateFile);

	const startTime = parseTime(task.startTime);
	const elapsedSeconds = Math.floor((now - startTime) / 1000);
	const elapsedMinutes = Math.floor(elapsedSeconds / 60);

	let notificationsSent = 0;

	// 检查是否需要发送通知
	for (const intervalMinute of intervals) {
		// 如果已触发过，跳过
		if (task.triggeredIndexes.includes(intervalMinute)) {
			continue;
		}

		// 如果已达到该时间点
		if (elapsedMinutes >= intervalMinute) {
			// 计算精确的时间差
			const timeDiff = formatTimeDiff(task.startTime);

			// 发送通知
			const title = `长任务提醒：${intervalMinute}分钟阶段`;
			const message = `claude code任务已运行${timeDiff}`;

			try {
				await sendNotification({
					title,
					message,
					sound: SoundPreset.WARNING,
					icon: IconPreset.ALICE_TIMEOUT,
				});
				notificationsSent++;
			} catch (err) {
				console.error("发送通知失败:", err);
			}

			// 标记为已触发（存储分钟值而非索引）
			task.triggeredIndexes.push(intervalMinute);
		}
	}

	// 如果发送了通知，再次保存状态（更新 triggeredIndexes）
	if (notificationsSent > 0) {
		saveAllTasks(stateFile);
	}

	return notificationsSent;
}

/**
 * 检查所有任务并发送通知
 * @param intervals - 提醒时间点数组（分钟）
 * @returns 发送的通知总数
 */
export async function checkAndNotifyAllTasks(intervals: number[] = DEFAULT_INTERVALS): Promise<number> {
	const stateFile = loadAllTasks();
	let totalNotifications = 0;

	for (const cwd of Object.keys(stateFile.tasks)) {
		const count = await checkAndNotifyTask(cwd, intervals);
		totalNotifications += count;
	}

	return totalNotifications;
}

/**
 * 获取任务状态
 * @param cwd - 当前工作目录
 * @returns 任务状态或 null
 */
export function getTaskState(cwd: string): TaskState | null {
	const stateFile = loadAllTasks();
	return stateFile.tasks[cwd] || null;
}

/**
 * 获取所有任务状态
 * @returns 所有任务状态
 */
export function getAllTaskStates(): Record<string, TaskState> {
	const stateFile = loadAllTasks();
	return stateFile.tasks;
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
