import { spawnSync } from "node:child_process";

/** 包的信息 */
export interface PackageInfo {
	/** 包名 */
	name: string;
	/** 包的描述 */
	description: string;
	/** 带有包名的官方镜像源地址 */
	url: `https://npm.im/${string}`;
}

/**
 * 获得阮喵喵全部的包信息
 * @description
 * 这是一个node环境下的函数，用于获取阮喵喵的所有包的信息。
 *
 * 使用的是node的child_process模块，调用pnpm命令获取包信息。
 *
 * - 默认仅考虑pnpm包
 * - 在node环境下运行
 */
export async function getRuanCatPkgInfo() {
	return new Promise<PackageInfo[]>((resolve, reject) => {
		/**
		 * pnpm s @ruan-cat/* --registry https://registry.npmmirror.com/ --json
		 * 仅查询淘宝源的数据
		 */
		const result = spawnSync("pnpm", ["s", "@ruan-cat/*", "--registry", "https://registry.npmmirror.com/", "--json"], {
			encoding: "utf-8",
		});

		if (result.error) {
			console.error(`Error executing command: ${result.error.message}`);
			reject(result.error);
			return;
		}
		if (result.stderr) {
			console.error(`Error in output: ${result.stderr}`);
			reject(new Error(result.stderr));
			return;
		}

		const packages = <unknown[]>JSON.parse(result.stdout);
		const res = packages.map(
			(pkg: any) =>
				({
					name: pkg.name,
					description: pkg.description,
					url: `https://npm.im/${pkg.name}`,
				}) satisfies PackageInfo,
		);
		// const res = packages;
		resolve(res);
	});
}
