import { sync as globSync } from "glob";
import yaml from "js-yaml";
import lodash from "lodash";

import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defScopes = [
	"root|根目录",
	"vuepress-preset-config|vp2预设配置",
	"vercel-deploy-tool|vc部署工具",
	"utils|工具包",
	"demo|测试项目",
];

/**
 * 路径转换工具
 * @param { string } path 路径
 * @returns { string } 改造后的路径
 */
function pathChange(path) {
	return path.replace(/\\/g, "/");
}

/**
 * 创建标签名称
 * @param { import("pkg-types").PackageJson } packageJson package.json数据
 * @returns { string }
 */
function createLabelName(packageJson) {
	const { name, description } = packageJson;
	const noneDesc = `该依赖包没有描述。`;
	const desc = lodash.isUndefined(description) ? noneDesc : description;
	return `${name ?? "bug：极端情况，这个包没有配置name名称"}    >>|>>    ${desc}`;
}

/**
 * 创建包范围取值
 * @param { import("pkg-types").PackageJson } packageJson package.json数据
 * @returns { string }
 */
function createPackagescopes(packageJson) {
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
 *
 * Array<{name: string, description: string}>
 * Promise<import("cz-git").ScopesType>
 * @return { import("cz-git").ScopesType }
 */
function getPackagesNameAndDescription() {
	// 读取 pnpm-workspace.yaml 文件 文件路径
	const workspaceConfigPath = join(__dirname, "../pnpm-workspace.yaml");

	// 文件
	const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");

	/**
	 * pnpm-workspace.yaml 的配置
	 * @type { import("./types/pnpm-workspace.yaml.shim.ts").PnpmWorkspace }
	 */
	// @ts-ignore 忽略unknown的警告
	const workspaceConfig = yaml.load(workspaceFile);

	/**
	 * packages配置 包的匹配语法
	 */
	const pkgPatterns = workspaceConfig.packages;

	// 如果没查询到packages配置，返回默认的scopes
	if (lodash.isUndefined(pkgPatterns)) {
		return defScopes;
	}

	/**
	 * 全部的 package.json 文件路径
	 * @type { string[] }
	 */
	let pkgPaths = [];

	// 根据每个模式匹配相应的目录
	pkgPatterns.map((pkgPattern) => {
		const matchedPath = pathChange(join(__dirname, pkgPattern, "package.json"));

		const matchedPaths = globSync(matchedPath, {
			ignore: "**/node_modules/**",
		});

		// 找到包路径，就按照顺序逐个填充准备
		pkgPaths = pkgPaths.concat(...matchedPaths);
		return matchedPaths;
	});

	console.log("pkgPaths :>> ", pkgPaths);

	/**
	 * @returns { import("cz-git").ScopesType }
	 */
	const czGitScopesType = pkgPaths.map(function (pkgJsonPath) {
		// 如果确实存在该文件，就处理。否则不管了。
		if (fs.existsSync(pkgJsonPath)) {
			/**
			 * 包配置文件数据
			 * @type { import("pkg-types").PackageJson }
			 */
			const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
			return {
				// 标签名称 对外展示的标签名称
				name: createLabelName(pkgJson),
				// 取值
				value: createPackagescopes(pkgJson),
			};
		}

		return {
			name: "警告，没找到包名，请查看这个包路径是不是故障了：",
			value: "pkgJsonPath",
		};
	});

	return czGitScopesType;
}

/** @type { import("cz-git").ScopesType } */
let scopes = defScopes;
scopes = getPackagesNameAndDescription();

// console.log(" scopes ", scopes);

const example = {
	folders: [
		{
			name: "root",
			path: "../",
		},
		{
			name: "@ruan-cat-vercel-monorepo-test/monorepo-3",
			path: "../packages/monorepo-3",
		},
		{
			name: "@ruan-cat/utils",
			path: "../utils",
		},
		{
			name: "@ruan-cat-test/vite-plugin-autogeneration-import-file-test-app-1",
			path: "../vite-plugin-autogeneration-import-file/app",
		},
	],
};
