import path from "node:path";
import { existsSync } from "node:fs";

/**
 * 查找资源目录的通用函数
 *
 * 尝试多个可能的路径，选择存在的那个：
 * 1. dist/{resourceType} (生产环境 - tsup publicDir 复制后的位置)
 * 2. dist/config/../{resourceType} (生产环境 - 如果 config 在子目录)
 * 3. src/assets/{resourceType} (开发环境)
 * 4. src/config/../assets/{resourceType} (开发环境 - 如果 config 在子目录)
 * 5. dist/../../src/assets/{resourceType} (备用降级路径)
 *
 * @param currentDirname - 当前模块的 __dirname
 * @param resourceType - 资源类型（如 "icons", "sounds"）
 * @returns 资源目录的绝对路径
 *
 * @example
 * ```ts
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 * const iconsDir = findResourceDir(__dirname, "icons");
 * const soundsDir = findResourceDir(__dirname, "sounds");
 * ```
 */
export function findResourceDir(currentDirname: string, resourceType: string): string {
	const possiblePaths = [
		path.join(currentDirname, resourceType), // dist/icons or dist/sounds
		path.join(currentDirname, "..", resourceType), // dist/config -> dist/icons
		path.join(currentDirname, "assets", resourceType), // dist/assets/icons (备用)
		path.join(currentDirname, "..", "assets", resourceType), // src/config -> src/assets/icons
		path.join(currentDirname, "..", "..", "src", "assets", resourceType), // dist -> src/assets/icons (备用)
	];

	for (const p of possiblePaths) {
		if (existsSync(p)) {
			return p;
		}
	}

	// 如果都不存在，返回默认路径
	return path.join(currentDirname, "..", "assets", resourceType);
}
