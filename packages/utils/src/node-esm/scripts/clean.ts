import { generateSpawnSync } from "../../node-cjs/index";

type GlobString = `**/{${string}}`;

export const defaultCleanTargets = <const>[
	// node常见文件
	"node_modules",
	"yarn.lock",
	"pnpm-lock.yaml",
	"package-lock.json",

	// 项目常见文件
	"dist",

	//
	".turbo",
	".vercel",

	// vuepress
	".cache",
	".temp",
];

/**
 * 删除node项目的依赖项便于重新安装依赖，也包括常见的各种垃圾文件。
 * @description
 */
export async function clean(
	/**
	 * 被清除的目标文件夹 也包括文件
	 */
	targets?: string[],
) {
	const cleanTargets = targets ?? defaultCleanTargets;
	const glob: GlobString = `**/{${cleanTargets.join()}}`;

	console.log(" 当前运行地址 process.cwd() ", process.cwd());

	const doClean = generateSpawnSync({
		command: "rimraf",
		parameters: ["-g", glob],
	});

	await doClean();
}
