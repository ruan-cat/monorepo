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
}
