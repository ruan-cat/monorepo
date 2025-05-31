/**
 * 前后端数据对接数据对象
 * @description
 * 后端 JsonVO 泛型类的前端翻译
 *
 * `01s` 项目统一的数据返回格式
 */
export interface JsonVO<T> {
	/** 状态码 */
	code: number;

	/** 提示消息 */

	message: string;

	/** 数据对象 */
	data: T;
}
