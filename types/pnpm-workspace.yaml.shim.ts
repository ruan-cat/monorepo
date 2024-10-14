/**
 * pnpm-workspace.yaml 文件的类型声明
 * @description
 * 设计理由
 *
 * 主要是为了让该文件被解析后，能够有一个基础的类型声明
 *
 * 按理说这个东西应该有别人封装好的类型的，肯定因为我没找到。
 *
 * 未来应该找到这样的类型声明库，直接复用别人的就好了，不要自己写了。
 */
export interface PnpmWorkspace {
	/**
	 * 包的匹配语法字符串
	 *
	 * @example
	 * ["packages/**", "demos/**", "utils"]
	 */
	packages?: string[];

	catalog?: string[];
}
