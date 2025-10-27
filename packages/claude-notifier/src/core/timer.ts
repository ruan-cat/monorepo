import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { TimerState, LongTaskOptions, IconPreset, SoundPreset } from "../types/index.ts";
import { sendNotification } from "./notifier.ts";

/**
 * 定时器状态文件路径
 */
const TIMER_STATE_FILE = path.join(os.tmpdir(), ".claude-notifier-timer.json");

/**
 * 默认提醒时间点（分钟）
 */
const DEFAULT_INTERVALS = [6, 10, 18, 25, 45];

/**
 * 启动长任务定时器
 * @param options - 长任务配置选项
 */
export async function startLongTaskTimer(options: LongTaskOptions): Promise<void> {
	const {
		intervals = DEFAULT_INTERVALS,
		sound = SoundPreset.WARNING,
		icon = IconPreset.CLOCK,
		taskDescription,
	} = options;

	// 检查是否已有定时器在运行
	if (existsSync(TIMER_STATE_FILE)) {
		const state = loadTimerState();
		if (state && isProcessRunning(state.pid)) {
			console.log("长任务定时器已在运行中");
			return;
		}
	}

	// 创建定时器状态
	const state: TimerState = {
		pid: process.pid,
		startTime: Date.now(),
		intervals: intervals.sort((a, b) => a - b), // 确保时间点是排序的
		triggeredIndexes: [],
		sound,
		icon,
		taskDescription,
	};

	// 保存状态
	saveTimerState(state);

	// 启动后台监控进程
	runTimerLoop(state);
}

/**
 * 停止长任务定时器
 */
export function stopLongTaskTimer(): void {
	if (existsSync(TIMER_STATE_FILE)) {
		const state = loadTimerState();
		if (state && isProcessRunning(state.pid)) {
			try {
				process.kill(state.pid);
			} catch (error) {
				// 进程可能已经结束
			}
		}
		// 删除状态文件
		unlinkSync(TIMER_STATE_FILE);
		console.log("长任务定时器已停止");
	} else {
		console.log("没有运行中的长任务定时器");
	}
}

/**
 * 获取当前定时器状态
 */
export function getTimerState(): TimerState | null {
	if (existsSync(TIMER_STATE_FILE)) {
		return loadTimerState();
	}
	return null;
}

/**
 * 运行定时器循环（后台进程）
 * @param state - 定时器状态
 */
function runTimerLoop(state: TimerState): void {
	const checkInterval = 30 * 1000; // 每 30 秒检查一次

	const intervalId = setInterval(() => {
		const currentState = loadTimerState();
		if (!currentState) {
			// 状态文件被删除，停止定时器
			clearInterval(intervalId);
			return;
		}

		const elapsedMinutes = (Date.now() - currentState.startTime) / 1000 / 60;

		// 检查是否需要发送通知
		for (let i = 0; i < currentState.intervals.length; i++) {
			const intervalMinute = currentState.intervals[i];

			// 如果已触发过，跳过
			if (currentState.triggeredIndexes.includes(i)) {
				continue;
			}

			// 如果已达到该时间点
			if (elapsedMinutes >= intervalMinute) {
				// 发送通知
				const message = currentState.taskDescription
					? `任务 "${currentState.taskDescription}" 已执行 ${intervalMinute} 分钟`
					: `当前任务已执行 ${intervalMinute} 分钟`;

				sendNotification({
					title: "Claude Code - 长任务提醒",
					message,
					sound: currentState.sound,
					icon: currentState.icon,
				}).catch((err) => {
					console.error("发送通知失败:", err);
				});

				// 标记为已触发
				currentState.triggeredIndexes.push(i);
				saveTimerState(currentState);
			}
		}

		// 如果所有时间点都已触发，停止定时器
		if (currentState.triggeredIndexes.length >= currentState.intervals.length) {
			clearInterval(intervalId);
			// 删除状态文件
			if (existsSync(TIMER_STATE_FILE)) {
				unlinkSync(TIMER_STATE_FILE);
			}
			console.log("所有长任务提醒已完成，定时器已停止");
		}
	}, checkInterval);

	// 防止进程退出
	intervalId.unref();
}

/**
 * 保存定时器状态到文件
 * @param state - 定时器状态
 */
function saveTimerState(state: TimerState): void {
	writeFileSync(TIMER_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

/**
 * 从文件加载定时器状态
 * @returns 定时器状态或 null
 */
function loadTimerState(): TimerState | null {
	try {
		if (!existsSync(TIMER_STATE_FILE)) {
			return null;
		}
		const content = readFileSync(TIMER_STATE_FILE, "utf-8");
		return JSON.parse(content) as TimerState;
	} catch (error) {
		console.error("加载定时器状态失败:", error);
		return null;
	}
}

/**
 * 检查进程是否在运行
 * @param pid - 进程 ID
 * @returns 是否在运行
 */
function isProcessRunning(pid: number): boolean {
	try {
		// 发送信号 0 来检查进程是否存在
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return false;
	}
}
