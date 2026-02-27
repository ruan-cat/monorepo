/**
 * @file 时间格式化工具函数
 * @description 提供标准化的日期时间格式化函数，用于将数据库的 Date 类型转换为前端展示用的 string 类型。
 *
 * 使用方式：
 * 1. 将本文件复制到你的项目中（推荐放在 `server/utils/` 目录下）
 * 2. 在 API Handler 中导入使用
 *
 * @example
 * ```typescript
 * import { formatDateTime } from "server/utils/format-date";
 *
 * const list = data.map((item) => ({
 *   ...item,
 *   createTime: formatDateTime(item.createTime),
 *   updateTime: formatDateTime(item.updateTime),
 * }));
 * ```
 */

/**
 * 将数字填充为指定位数的字符串
 *
 * @param n - 需要填充的数字
 * @param width - 目标位数（默认 2）
 * @returns 填充后的字符串
 */
function pad(n: number, width: number = 2): string {
	return n.toString().padStart(width, "0");
}

/**
 * 格式化日期时间为 `YYYY-MM-DD HH:mm:ss` 格式
 *
 * 支持多种输入类型，自动处理 null/undefined 等边界情况。
 *
 * @param date - 日期值，支持 Date 对象、ISO 字符串、时间戳或 null/undefined
 * @param fallback - 当输入为空值时返回的默认字符串（默认 "-"）
 * @returns 格式化后的日期时间字符串
 *
 * @example
 * ```typescript
 * formatDateTime(new Date())           // "2025-01-15 14:30:00"
 * formatDateTime("2025-01-15T14:30:00Z") // "2025-01-15 14:30:00"
 * formatDateTime(null)                 // "-"
 * formatDateTime(undefined, "N/A")     // "N/A"
 * ```
 */
export function formatDateTime(date: Date | string | number | null | undefined, fallback: string = "-"): string {
	if (date === null || date === undefined) {
		return fallback;
	}

	const d = date instanceof Date ? date : new Date(date);

	if (isNaN(d.getTime())) {
		return fallback;
	}

	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 格式化日期为 `YYYY-MM-DD` 格式
 *
 * @param date - 日期值，支持 Date 对象、ISO 字符串、时间戳或 null/undefined
 * @param fallback - 当输入为空值时返回的默认字符串（默认 "-"）
 * @returns 格式化后的日期字符串
 *
 * @example
 * ```typescript
 * formatDate(new Date())               // "2025-01-15"
 * formatDate("2025-01-15T14:30:00Z")   // "2025-01-15"
 * formatDate(null)                     // "-"
 * ```
 */
export function formatDate(date: Date | string | number | null | undefined, fallback: string = "-"): string {
	if (date === null || date === undefined) {
		return fallback;
	}

	const d = date instanceof Date ? date : new Date(date);

	if (isNaN(d.getTime())) {
		return fallback;
	}

	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
