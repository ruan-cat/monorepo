/**
 * 数据分页的返回对象
 * @description
 *
 * `01s` 项目统一的数据返回格式
 */
export interface PageDTO<T> {
	/**
	 * 当前页码
	 */
	pageIndex: number;

	/**
	 * 每页显示最大数据条数
	 */

	pageSize: number;

	/**
	 * 总条数
	 */
	total: number;

	/**
	 * 总页数
	 */
	pages: number;

	/**
	 * 当前页数据列表
	 */
	rows: T[];
}
