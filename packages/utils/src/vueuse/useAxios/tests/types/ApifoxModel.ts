/**
 * apifox 生成的标准返回值对象
 * @description
 * 接口请求的标准返回值对象 接口的返回值均满足该对象
 */
export interface ApifoxModel<T> {
	/**
	 * 业务状态码, 1成功, 其他失败
	 */
	code: string;
	/**
	 * 响应消息
	 */
	msg: string;
	/**
	 * 响应结果
	 */
	result: T;
}
