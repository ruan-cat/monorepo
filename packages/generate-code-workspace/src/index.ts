import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

import { consola } from "consola";
import { isNil } from "lodash-es";
import { program } from "commander";
import { globSync } from "tinyglobby";
import yaml from "js-yaml";
import { parse as parseJSONC } from "jsonc-parser";
import { pathChange } from "@ruan-cat/utils/node-cjs";

import { type PackageJson } from "pkg-types";
import { type PnpmWorkspace } from "./types/pnpm-workspace.yaml.shim";

const defCodeWorkspaceFilename = <const>"vscode";

program
	.name("generate-code-workspace")
	// 生成文件的名称
	.option("--name <string>", `生成文件的名称。不提供则默认为 ${defCodeWorkspaceFilename}`)
	.parse();
const options = program.opts();

consola.info(" 查看命令行提供的参数 ", options);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 工作区文件的目录配置类型 */
interface Folder {
	name: string;
	path: string;
}

/**
 * 获取 vscode 的配置
 * @description
 * 读取 .vscode/settings.json 文件
 *
 * 如果不存在则返回 false
 */
function getVscodeSettings() {
	const vscodeSettingsPath = join(process.cwd(), ".vscode/settings.json");
	if (fs.existsSync(vscodeSettingsPath)) {
		const vscodeSettings = fs.readFileSync(vscodeSettingsPath, "utf8");
		const res = parseJSONC(vscodeSettings);
		// console.log("????", res);
		return res;
	} else {
		consola.warn(`${vscodeSettingsPath} does not exist.`);
		return false;
	}
}

/**
 * 根据名称，做字母排序
 */
function sortFolder(folders: Folder[]) {
	return folders.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 根据 pnpm-workspace.yaml 生成工作区配置数组
 * @description
 */
function getFolders() {
	// 读取 pnpm-workspace.yaml 文件 文件路径
	const workspaceConfigPath = join(process.cwd(), "pnpm-workspace.yaml");

	// 文件
	const workspaceFile = fs.readFileSync(workspaceConfigPath, "utf8");

	/**
	 * pnpm-workspace.yaml 的配置
	 */
	const workspaceConfig = <PnpmWorkspace>yaml.load(workspaceFile);

	/**
	 * packages配置 包的匹配语法
	 */
	const pkgPatterns = workspaceConfig.packages;

	// console.log(" ？ pkgPatterns ", pkgPatterns);

	/**
	 * 全部的 package.json 文件路径
	 */
	let pkgPaths: string[] = [];

	// 根据每个模式匹配相应的目录
	pkgPatterns!.map((pkgPattern) => {
		const matchedPath = pathChange(join(process.cwd(), pkgPattern, "package.json"));
		// console.log(" 检查拼接出来的路径： ", matchedPath);
		const matchedPaths = globSync(matchedPath, {
			ignore: ["**/node_modules/**"],
		});

		// 找到包路径，就按照顺序逐个填充准备
		pkgPaths = pkgPaths.concat(...matchedPaths);
		return matchedPaths;
	});

	// console.log("pkgPaths :>> ", pkgPaths);

	/**
	 * 目前项目的根目录
	 * @description
	 * 绝对路径
	 */
	const workspaceRoot = pathChange(process.cwd());

	const folders: Folder[] = pkgPaths.map(function (pkgJsonPath) {
		/**
		 * 包配置文件数据
		 */
		const pkgJson = <PackageJson>JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

		/** 包名 且不可能为空包名 */
		const pkgJsonName = <string>pkgJson.name;

		/** 相对路径 */
		const relativePath = pathChange(pkgJsonPath).replace(`${workspaceRoot}/`, "");

		/** 没有 package.json 的相对路径 */
		const relativePathWithNoPkgJson = relativePath.replace(/\/package\.json$/, "");

		/** 最终用于工作区配置的路径 */
		const pathForCodeWorkspace = `./${relativePathWithNoPkgJson}`;

		// console.log(" ? pathForCodeWorkspace ", pathForCodeWorkspace);

		return <Folder>{
			name: pkgJsonName,
			path: pathForCodeWorkspace,
		};

		// 如果确实存在该文件，就处理。否则不管了。
		// 我们不判断文件是否存在了，这些路径都是存在文件的，
		// if (fs.existsSync(pkgJsonPath)) {
		// 	return {
		// 		name: createLabelName(pkgJson),
		// 		value: createPackagescopes(pkgJson),
		// 	};
		// }
	});

	// 获得完目录后，随后对目录做排序
	sortFolder(folders);

	return folders;
}

/**
 * 默认的工作区文件夹配置
 * @description
 * 默认要把根目录准备好 要能够访问到根目录
 */
const defFolders: Folder[] = [
	{
		name: "root",
		path: "./",
	},
];

const folders = [...defFolders, ...getFolders()];

const codeWorkspaceContent = {
	folders,
	settings: getVscodeSettings() || {},
};

/**
 * 生成 vscode.code-workspace 文件
 */
export function generateCodeWorkspace(filename: string = defCodeWorkspaceFilename) {
	const postfix = <const>".code-workspace";
	const fullName = <const>`${filename}${postfix}`;

	const codeWorkspacePath = join(process.cwd(), fullName);
	fs.writeFileSync(codeWorkspacePath, JSON.stringify(codeWorkspaceContent, null, 2));
}

// 如果传递了有意义的命令行参数
if (!isNil(options.name)) {
	// 那就执行本函数 认定该函数以命令行的方式传参使用 并假定外面以全量的方式导入本库
	generateCodeWorkspace(options.name);
}
