import { commitTypes } from "./commit-types.ts";
import { join } from "node:path";
import * as fs from "node:fs";
import { sync } from "glob";
import { load } from "js-yaml";
import { isUndefined } from "lodash";
import { pathChange, isMonorepoProject } from "@ruan-cat/utils/node-cjs";
import { type PackageJson } from "pkg-types";
import { type PnpmWorkspace } from "@ruan-cat/utils";
import { type ScopesType } from "cz-git";

export type ScopesTypeItem = Exclude<ScopesType[number], string>;

export const defScopes: ScopesTypeItem[] = [
	{
		name: "root | 根目录",
		value: "root",
	},
	{
		name: "utils | 工具包",
		value: "utils",
	},
	{
		name: "demo | 测试项目",
		value: "demo",
	},
];

/**
 * 创建标签名称
 */
function createLabelName(packageJson: PackageJson) {
	const { name, description } = packageJson;
	const noneDesc = `该依赖包没有描述。`;
	const desc = isUndefined(description) ? noneDesc : description;
	return `${name ?? "bug：极端情况，这个包没有配置name名称"}    >>|>>    ${desc}`;
}

/**
 * 创建包范围取值
 */
export function createPackagescopes(packageJson: PackageJson) {
	const { name } = packageJson;
	const names = name?.split("/");
	/**
	 * 含有业务名称的包名
	 * @description
	 * 如果拆分的数组长度大于1 说明包是具有前缀的。取用后面的名称。
	 *
	 * 否则包名就是单纯的字符串，直接取用即可。
	 */
	// @ts-ignore 默认 name 名称总是存在的 不做undefined校验
	const packageNameWithBusiness = names?.length > 1 ? names?.[1] : names?.[0];
	return `${packageNameWithBusiness}`;
}

/**
 * 根据 pnpm-workspace.yaml 配置的monorepo有意义的包名，获取包名和包描述
 * @description
 * 根据 pnpm-workspace.yaml 配置的monorepo有意义的包名，获取包名和包描述
 */
export function getPackagesNameAndDescription() {
	// 判断是否是 monorepo 项目
	if (!isMonorepoProject()) {
		return defScopes;
	}

	// 读取 pnpm-workspace.yaml 文件
	const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");
	const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");
	const workspaceConfig = <PnpmWorkspace>load(workspaceFile);

	/**
	 * packages配置 包的匹配语法
	 * @description
	 * 此时已经通过 isMonorepoProject() 验证，packages 一定存在且有效
	 */
	const pkgPatterns = workspaceConfig.packages!;

	/**
	 * 全部的 package.json 文件路径
	 */
	let pkgPaths: string[] = [];

	// 根据每个模式匹配相应的目录
	pkgPatterns.map((pkgPattern) => {
		// 在进程运行的根目录下，执行匹配。 一般来说是项目的根目录
		const matchedPath = pathChange(join(process.cwd(), pkgPattern, "package.json"));

		const matchedPaths = sync(matchedPath, {
			ignore: "**/node_modules/**",
		});

		// 找到包路径，就按照顺序逐个填充准备
		pkgPaths = pkgPaths.concat(...matchedPaths);
		return matchedPaths;
	});

	// console.log("pkgPaths :>> ", pkgPaths);

	const czGitScopesType = pkgPaths.map(function (pkgJsonPath) {
		// 如果确实存在该文件，就处理。否则不管了。
		if (fs.existsSync(pkgJsonPath)) {
			/**
			 * 包配置文件数据
			 */
			const pkgJson = <PackageJson>JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
			return <ScopesTypeItem>{
				// 标签名称 对外展示的标签名称
				name: createLabelName(pkgJson),
				// 取值
				value: createPackagescopes(pkgJson),
			};
		}

		return <ScopesTypeItem>{
			name: "警告，没找到包名，请查看这个包路径是不是故障了：",
			value: "pkgJsonPath",
		};
	});

	// console.log("czGitScopesType :>> ", czGitScopesType);

	return czGitScopesType;
}

/**
 * 计算字符串的显示宽度（考虑中文、emoji 等宽字符）
 * @description
 * 使用更精确的方式计算字符显示宽度：
 * - Emoji 和特殊符号通常占 2 个显示宽度
 * - 中文字符占 2 个显示宽度
 * - ASCII 字符占 1 个显示宽度
 * @param str 要计算的字符串
 * @returns 字符串的显示宽度
 */
function getDisplayWidth(str: string): number {
	let width = 0;
	// 使用正则表达式匹配不同类型的字符
	const chars = Array.from(str);

	for (const char of chars) {
		const code = char.codePointAt(0) || 0;

		// Emoji 和特殊符号（占 2 宽度）
		if (
			(code >= 0x1f300 && code <= 0x1f9ff) || // Emoji 主要范围
			(code >= 0x2600 && code <= 0x26ff) || // 杂项符号
			(code >= 0x2700 && code <= 0x27bf) || // 装饰符号
			(code >= 0xfe00 && code <= 0xfe0f) || // 变体选择器
			(code >= 0x1f000 && code <= 0x1f02f) || // 麻将牌
			(code >= 0x1f0a0 && code <= 0x1f0ff) || // 扑克牌
			(code >= 0x1f100 && code <= 0x1f64f) || // 符号和图形
			(code >= 0x1f680 && code <= 0x1f6ff) || // 交通和地图
			(code >= 0x1f900 && code <= 0x1f9ff) || // 补充符号和图形
			// 中文字符（占 2 宽度）
			(code >= 0x4e00 && code <= 0x9fff) || // CJK 统一汉字
			(code >= 0x3000 && code <= 0x303f) || // CJK 符号和标点
			(code >= 0xff00 && code <= 0xffef) // 全角字符
		) {
			width += 2;
		} else {
			// ASCII 和其他字符（占 1 宽度）
			width += 1;
		}
	}

	return width;
}

/**
 * 将 commitTypes 转换为 cz-git 格式
 * @description
 * 将内部定义的 CommitType 数组转换为 cz-git 库所需的格式，
 *
 * 实现四层对齐机制，确保提交类型选择界面的美观性：
 * 1. emoji 图标靠左对齐（最前面，固定占3个字符宽度）
 * 2. type 提交类型字段对齐
 * 3. description 描述字段对齐
 * 4. longDescription 长描述字段的竖线 `|` 对齐
 * @returns 包含 value 和 name 字段的对象数组，用于 cz-git 配置
 */
export function convertCommitTypesToCzGitFormat() {
	// ===== 第一步：计算各字段的最大宽度 =====

	// 为 emoji 设置固定宽度（大多数 emoji 显示为2个字符宽度，加1个空格=3）
	const EMOJI_FIXED_WIDTH = 3;

	// 计算每个 type 的长度
	const maxTypeLength = Math.max(...commitTypes.map((commitType) => commitType.type.length));

	// 计算每个 description 的显示宽度
	const maxDescriptionWidth = Math.max(...commitTypes.map((commitType) => getDisplayWidth(commitType.description)));

	// ===== 第二步：为每个提交类型生成对齐后的格式 =====

	return commitTypes.map((commitType) => {
		// 【第1层对齐】emoji 固定占 3 个字符位置
		const emojiPart = commitType.emoji + " ".repeat(Math.max(0, EMOJI_FIXED_WIDTH - getDisplayWidth(commitType.emoji)));

		// 【第2层对齐】type 后面添加空格使冒号对齐
		const typeSpaces = " ".repeat(maxTypeLength - commitType.type.length);

		// 【第3层对齐】description 后面添加空格使竖线对齐
		const descWidth = getDisplayWidth(commitType.description);
		const descSpaces = " ".repeat(maxDescriptionWidth - descWidth);

		// ===== 第三步：构建最终的对齐文本 =====
		// 格式说明：
		// emoji<固定3字符> type:<空格对齐> description<空格对齐> | longDescription
		//   ↑                ↑    ↑            ↑            ↑
		// 靠左固定宽       第2层  冒号后      第3层        第4层

		const name = commitType.longDescription
			? `${emojiPart}${commitType.type}:${typeSpaces} ${commitType.description}${descSpaces} | ${commitType.longDescription}`
			: `${emojiPart}${commitType.type}:${typeSpaces} ${commitType.description}`;

		return {
			value: `${commitType.emoji} ${commitType.type}`,
			name,
		};
	});
}

/**
 * 获取所有提交类型
 * @description
 * 获取所有提交类型，用于 commitlint 的 `type-enum` 规则
 * @returns 返回提交类型数组
 */
export function getTypes() {
	return commitTypes.map((commitType) => commitType.type);
}

/**
 * 获取所有提交范围
 * @description
 * 获取所有提交范围，用于 commitlint 的 `scope-enum` 规则
 * @returns 返回提交范围数组
 */
export function getScopes() {
	return getPackagesNameAndDescription().map(
		(scope) =>
			// 优先从 value 取值，如果 value 不存在，则从 name 取值。 value 才是包名，才是 scope 提交范围。
			scope.value ?? scope.name,
	);
}
