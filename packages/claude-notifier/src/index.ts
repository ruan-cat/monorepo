/**
 * @ruan-cat/claude-notifier
 * Claude Code 通知工具
 *
 * 在 Claude Code 任务完成后，发送 Windows 系统通知
 */

// 导出所有类型
export * from "./types/index.ts";

// 导出核心功能
export { sendNotification, quickNotify } from "./core/notifier.ts";
export { startLongTaskTimer, stopLongTaskTimer, getTimerState } from "./core/timer.ts";

// 导出配置
export { SOUND_PRESET_MAP, resolveSoundConfig } from "./config/sounds.ts";
export { ICON_PRESET_MAP, resolveIconConfig } from "./config/icons.ts";

// 导出命令（供编程式使用）
export { createTaskCompleteCommand } from "./commands/task-complete.ts";
export { createLongTaskCommand } from "./commands/long-task.ts";
export { createTimeoutCommand } from "./commands/timeout.ts";
export { createErrorCommand } from "./commands/error.ts";
