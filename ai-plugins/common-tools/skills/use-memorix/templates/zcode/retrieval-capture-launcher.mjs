// use-memorix:zcode-retrieval-launcher:v1
// 本文件是项目内薄启动器：只定位全局 runtime 并转发 stdio，不复制捕获算法。
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const runtime = join(homedir(), ".agents", "skills", "use-memorix", "scripts", "zcode-retrieval-capture.mjs");

try {
	const module = await import(pathToFileURL(runtime).href);
	if (typeof module.main === "function") await module.main({});
} catch {
	// fail-open：捕获失败不得阻断宿主的原搜索或主任务。
}

process.exit(0);
