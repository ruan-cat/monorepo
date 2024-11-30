import {
	// 文件是否存在
	existsSync,
	// 复制文件
	copyFileSync,
	// 复制目录
	cpSync,
	// 删除目录
	rmSync,
} from "node:fs";
import { resolve } from "node:path";
import cpy from "cpy";
import consola from "consola";

interface Params {
	/**
	 * 被复制粘贴的md文件路径
	 * @description
	 * 作为首页的md文件
	 *
	 * 包括文件名称全称。 index.md
	 */
	homePageMdPath: string;

	/**
	 * 文档源路径
	 * @description
	 * 一揽子md文件的目录
	 */
	docsSourcePath: string;

	/**
	 * 被文档框架使用的docs路径
	 * @description
	 * 最终被文档框架使用的路径，该路径下的md文件都是复制粘贴得来的，最终被文档框架使用
	 *
	 * 该目录应该被git忽略
	 */
	targetDocsPath: string;
}

const indexMdName = <const>`index.md`;

export function moveMdAsHomePage(params: Params) {
	const homePageMdPath = resolve(process.cwd(), params.homePageMdPath);
	const docsSourcePath = resolve(process.cwd(), params.docsSourcePath);
	const targetDocsPath = resolve(process.cwd(), params.targetDocsPath);

	const docsSourceHomePageMdPath = resolve(process.cwd(), params.docsSourcePath, indexMdName);

	if (!existsSync(homePageMdPath)) {
		consola.error(`未发现期望的 ${homePageMdPath} 首页文件，无法移动文件。 首页文件只识别 ${indexMdName} 名称。 `);
		return;
	}

	if (!existsSync(docsSourcePath)) {
		consola.error(`未发现期望的 ${docsSourcePath} 文档源路径，无法移动文件。`);
		return;
	}

	if (existsSync(targetDocsPath)) {
		// 删除目录
		rmSync(targetDocsPath, { recursive: true });
	}

	cpSync(docsSourcePath, targetDocsPath, { recursive: true });
	consola.success(`文档源路径已复制到 ${targetDocsPath}`);

	copyFileSync(homePageMdPath, docsSourceHomePageMdPath);
	consola.success(`首页文件已复制到 ${docsSourceHomePageMdPath}`);
}
