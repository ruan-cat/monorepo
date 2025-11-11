import type { SemverBumpType } from "changelogen";

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

	/**
	 * 语义化版本号 bump 类型
	 * @description
	 * 用于决定 changelogen 生成的语义化版本号 bump 类型
	 */
	semver?: SemverBumpType;
}
