import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/**
 * 确保当前工作目录解析到的 consola 包已经应用 patches/consola.patch。
 *
 * 背景：consola@3.4.2 在 Node.js 24 的 ESM 解析路径下会回退到 legacyMainResolve 并失败。
 * pnpm patch 在部分 CI 场景（如 turbo 多次触发 prebuild、remote cache 恢复等）可能未稳定生效，
 * 因此在运行 automd 前显式校验并修复 consola 的 package.json。
 *
 * 注意：此脚本只重写 package.json 中的 main 与 exports 字段，不动 dist/lib 中的实际文件。
 */

// 与 patches/consola.patch 保持一致的目标字段
const TARGET_MAIN = "./dist/index.mjs";
const TARGET_EXPORTS = {
	".": {
		types: "./dist/index.d.mts",
		import: "./dist/index.mjs",
		require: "./lib/index.cjs",
		default: "./dist/index.mjs",
	},
	"./browser": {
		import: { types: "./dist/browser.d.mts", default: "./dist/browser.mjs" },
		require: { types: "./dist/browser.d.cts", default: "./dist/browser.cjs" },
	},
	"./basic": {
		import: { types: "./dist/basic.d.mts", default: "./dist/basic.mjs" },
		require: { types: "./dist/basic.d.cts", default: "./dist/basic.cjs" },
	},
	"./core": {
		import: { types: "./dist/core.d.mts", default: "./dist/core.mjs" },
		require: { types: "./dist/core.d.cts", default: "./dist/core.cjs" },
	},
	"./utils": {
		import: { types: "./dist/utils.d.mts", default: "./dist/utils.mjs" },
		require: { types: "./dist/utils.d.cts", default: "./dist/utils.cjs" },
	},
};

function resolveConsolaPackageJson(): string {
	const req = createRequire(join(process.cwd(), "package.json"));
	// consola 的 exports 没有显式导出 ./package.json，因此先解析入口再向上定位 package.json
	const entryPath = req.resolve("consola");
	const pkgPath = join(dirname(entryPath), "..", "package.json");
	return realpathSync(pkgPath);
}

function main() {
	const pkgPath = resolveConsolaPackageJson();
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

	const needsFix = pkg.main !== TARGET_MAIN || JSON.stringify(pkg.exports) !== JSON.stringify(TARGET_EXPORTS);

	if (needsFix) {
		pkg.main = TARGET_MAIN;
		pkg.exports = TARGET_EXPORTS;
		writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
		console.log(`[ensure-consola-patch] 已修复 consola/package.json: ${pkgPath}`);
	} else {
		console.log(`[ensure-consola-patch] consola/package.json 已正确: ${pkgPath}`);
	}
}

main();
