/**
 * @file Nitro API 通用响应类型定义
 * @description 提供标准化的 API 响应类型，确保前后端数据对接的一致性。
 *
 * 使用方式：
 * 1. 将本文件复制到你的项目中（推荐放在 `server/types/` 或 `shared/types/` 目录下）
 * 2. 在 API Handler 中导入并使用这些类型
 *
 * @example
 * ```typescript
 * import type { ApiResponse, PageResponse } from "@/server/types";
 * ```
 */

// ============================================================================
// 通用响应类型
// ============================================================================

/**
 * 前后端数据对接的通用响应包装类型
 *
 * 所有 API 端点 **必须** 使用此类型约束响应变量，确保 TypeScript 编译期检查字段结构。
 *
 * @template T - 响应数据的类型
 *
 * @example
 * ```typescript
 * // ✅ 正确：使用类型注解约束响应变量
 * const response: ApiResponse<typeof result> = {
 *   success: true,
 *   code: 200,
 *   message: "操作成功",
 *   data: result,
 * };
 * return response;
 *
 * // ❌ 错误：仅导入类型但不用作注解，TypeScript 不会检查字段
 * return { success: true, code: 200, msg: "ok", data: result }; // msg 拼错也不报错
 * ```
 */
export interface ApiResponse<T> {
	/** 请求是否成功 */
	success: boolean;

	/** HTTP 状态码 */
	code: number;

	/** 提示消息 */
	message: string;

	/** 数据对象 */
	data: T;

	/** 时间戳（可选） */
	timestamp?: number;

	/** 错误信息（仅在请求失败时返回） */
	error?: string;

	/** 错误堆栈（仅在开发环境下返回，生产环境不暴露） */
	stack?: string;
}

// ============================================================================
// 分页响应类型
// ============================================================================

/**
 * 分页数据传输对象
 *
 * 用于列表接口的分页数据包装。
 *
 * @template T - 列表项的类型
 *
 * @example
 * ```typescript
 * const response: ApiResponse<PageData<(typeof data)[number]>> = {
 *   success: true,
 *   code: 200,
 *   message: "查询成功",
 *   data: {
 *     list: data,
 *     total,
 *     pageIndex: query.page,
 *     pageSize: query.pageSize,
 *     totalPages,
 *   },
 * };
 * ```
 */
export interface PageData<T> {
	/** 数据列表 */
	list: T[];

	/** 总记录数 */
	total: number;

	/** 当前页码 (1-based) */
	pageIndex: number;

	/** 每页大小 */
	pageSize: number;

	/** 总页数 */
	totalPages: number;
}

// ============================================================================
// 查询参数类型
// ============================================================================

/**
 * 分页查询参数基础类型
 *
 * 所有列表接口的查询参数都应继承此类型。
 *
 * @example
 * ```typescript
 * interface UserQueryParams extends BaseQueryParams {
 *   name?: string;
 *   status?: "enabled" | "disabled";
 * }
 * ```
 */
export interface BaseQueryParams {
	/** 页码 (1-based) */
	pageIndex: number;

	/** 每页大小 */
	pageSize: number;
}

// ============================================================================
// 常用常量
// ============================================================================

/** 默认页码 */
export const DEFAULT_PAGE_INDEX = 1;

/** 默认每页大小 */
export const DEFAULT_PAGE_SIZE = 10;

/** 最大每页大小 */
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// HTTP 状态码常量
// ============================================================================

/** 成功 */
export const SUCCESS_CODE = 200;

/** 请求参数错误 */
export const BAD_REQUEST_CODE = 400;

/** 未授权 */
export const UNAUTHORIZED_CODE = 401;

/** 禁止访问 */
export const FORBIDDEN_CODE = 403;

/** 资源不存在 */
export const NOT_FOUND_CODE = 404;

/** 服务器内部错误 */
export const INTERNAL_ERROR_CODE = 500;
