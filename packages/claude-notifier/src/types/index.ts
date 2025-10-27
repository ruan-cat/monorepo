/**
 * 音频预设枚举
 */
export enum SoundPreset {
	/** Windows 系统默认通知音 */
	DEFAULT = "default",
	/** 成功提示音 */
	SUCCESS = "success",
	/** 警告提示音 */
	WARNING = "warning",
	/** 错误提示音 */
	ERROR = "error",
	/** 自定义预设示例 */
	MANBO = "manbo",
	/** 静音 */
	NONE = "none",
}

/**
 * 图标预设枚举
 */
export enum IconPreset {
	/** 成功图标 */
	SUCCESS = "success",
	/** 警告图标 */
	WARNING = "warning",
	/** 错误图标 */
	ERROR = "error",
	/** 信息图标 */
	INFO = "info",
	/** 时钟图标（长任务） */
	CLOCK = "clock",
}

/**
 * 通知配置选项
 */
export interface NotificationOptions {
	/** 通知标题 */
	title?: string;
	/** 通知消息内容 */
	message: string;
	/** 音频预设或自定义音频文件路径 */
	sound?: SoundPreset | string;
	/** 图标预设或自定义图标文件路径 */
	icon?: IconPreset | string;
	/** 通知显示时长（秒），默认 2.5 秒 */
	timeout?: number;
	/** 是否等待用户交互 */
	wait?: boolean;
}

/**
 * 长任务监控配置选项
 */
export interface LongTaskOptions {
	/** 提醒时间点数组（分钟），默认 [6, 10, 18, 25, 45] */
	intervals?: number[];
	/** 音频预设 */
	sound?: SoundPreset | string;
	/** 图标预设 */
	icon?: IconPreset | string;
	/** 任务描述信息 */
	taskDescription?: string;
}

/**
 * 任务完成通知选项
 */
export interface TaskCompleteOptions {
	/** 自定义消息 */
	message?: string;
	/** 音频预设 */
	sound?: SoundPreset | string;
	/** 图标预设 */
	icon?: IconPreset | string;
	/** 任务描述 */
	taskDescription?: string;
}

/**
 * 超时通知选项
 */
export interface TimeoutOptions {
	/** 自定义消息 */
	message?: string;
	/** 超时详情 */
	timeoutDetails?: string;
	/** 音频预设 */
	sound?: SoundPreset | string;
	/** 图标预设 */
	icon?: IconPreset | string;
}

/**
 * 错误通知选项
 */
export interface ErrorOptions {
	/** 自定义消息 */
	message?: string;
	/** 错误详情 */
	errorDetails?: string;
	/** 音频预设 */
	sound?: SoundPreset | string;
	/** 图标预设 */
	icon?: IconPreset | string;
}

/**
 * 定时器状态
 */
export interface TimerState {
	/** 进程 ID */
	pid: number;
	/** 启动时间戳 */
	startTime: number;
	/** 提醒时间点（分钟） */
	intervals: number[];
	/** 已触发的提醒索引 */
	triggeredIndexes: number[];
	/** 音频预设 */
	sound?: string;
	/** 图标预设 */
	icon?: string;
	/** 任务描述 */
	taskDescription?: string;
}
