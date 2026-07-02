#!/usr/bin/env node
/**
 * automd 的 CJS wrapper。
 *
 * 背景：automd@0.4.3 的 CLI 入口 dist/cli.mjs 会静态导入 consola，而 consola@3.4.2
 * 在 Node.js 24 的 ESM 解析下会触发 legacyMainResolve fallback 到 consola/index.js，
 * 导致 ERR_MODULE_NOT_FOUND。automd 的 API 入口 dist/index.mjs 不依赖 consola，
 * 因此用 CommonJS 的 require() 加载 automd API，然后调用 automd() 即可绕过该问题。
 */

const { automd } = require("automd");

const dir = process.argv[2] || process.cwd();

(async () => {
	try {
		const { results, time } = await automd({ dir });

		const issues = results.filter((r) => r.hasIssues);

		if (results.length === 0) {
			console.error(`[run-automd] 未处理任何文件: ${dir}`);
			process.exit(1);
		}

		if (issues.length > 0) {
			console.error(`[run-automd] ${issues.length} 个文件处理时出现 issues`);
			process.exit(1);
		}

		const changed = results.filter((r) => r.hasChanged);
		if (changed.length > 0) {
			console.log(`[run-automd] 已更新 ${changed.length} 个文件 (${Math.round(time)}ms)`);
		} else {
			console.log(`[run-automd] 已是最新`);
		}
	} catch (error) {
		console.error("[run-automd] 失败:", error?.message || error);
		process.exit(1);
	}
})();
