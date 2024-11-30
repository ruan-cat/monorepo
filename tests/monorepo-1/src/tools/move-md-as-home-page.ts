import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

export function moveMdAsHomePage(targetMd: string, targetSrcDir: string) {
	const indexPath = resolve(process.cwd(), targetMd);
	const targetPath = resolve(process.cwd(), targetSrcDir, "index.md");

	if (!existsSync(indexPath)) {
		console.log(`未发现期望的 ${targetMd} 首页文件，无法移动文件。`);
		return;
	}

	copyFileSync(indexPath, targetPath);
	console.log(`文件已复制到 ${targetPath}`);
}
