import { existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function moveMdAsHomePage(targetSrcDir: string) {
	const indexPath = resolve(__dirname, "index.md");
	const targetPath = resolve(process.cwd(), targetSrcDir, "index.md");

	if (!existsSync(indexPath)) {
		console.log(`未发现期望的 ${__dirname}/index.md 首页文件，无法移动文件。`);
		return;
	}

	copyFileSync(indexPath, targetPath);
	console.log(`文件已复制到 ${targetPath}`);
}

// 示例调用
moveMdAsHomePage("./docs");
