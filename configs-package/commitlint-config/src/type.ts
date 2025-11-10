/**
 * 提交类型
 * @description
 * 从 commitlint-config 中提取commit类型配置
 * 用于与 changelogen 集成
 */

export interface CommitType {
	emoji: string;
	type: string;
	description: string;
	/** 长描述 用于说明清楚这个提交类型是做什么的 */
	longDescription?: string;
}
