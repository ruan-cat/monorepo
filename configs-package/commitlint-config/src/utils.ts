import { commitTypes } from "./commit-types.ts";

/**
 * 将 commitTypes 转换为 cz-git 格式
 * @description
 * 将内部定义的 CommitType 数组转换为 cz-git 库所需的格式，
 *
 * 并实现描述文本的智能对齐，确保提交类型选择界面的美观性
 * @returns  包含 value 和 name 字段的对象数组，用于 cz-git 配置
 */
export function convertCommitTypesToCzGitFormat() {
	// 找到最长的 type 长度
	const maxTypeLength = Math.max(...commitTypes.map((commitType) => commitType.type.length));

	return commitTypes.map((commitType) => {
		// 计算当前 type 需要的空格数来对齐
		const spacesNeeded = maxTypeLength - commitType.type.length + 5; // 5 是基础空格数
		const spaces = " ".repeat(spacesNeeded);

		return {
			value: `${commitType.emoji} ${commitType.type}`,
			name: `${commitType.emoji} ${commitType.type}:${spaces}${commitType.description}`,
		};
	});
}
