/**
 * 前后端数据对接数据对象
 * @description
 * 后端 JsonVO 泛型类的前端翻译
 *
 * 这是01星球项目内，常见的返回值类型
 *
 * TODO: 在开源库内 找到类似的 公共通用的类型 避免每次项目都要自己手动声明定义一次
 */
export interface JsonVO<T> {
	/** 状态码 */
	code: number;

	/** 提示消息 */

	message: string;

	/** 数据对象 */
	data: T;
}
