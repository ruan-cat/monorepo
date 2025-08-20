#!/usr/bin/env tsx

/**
 * GitHub Release 同步脚本
 * 用于在 GitHub Actions 工作流中调用
 */

import { runSync } from "@ruan-cat/release-toolkit/dist/scripts/sync-github-release.js";

// 直接运行同步函数
runSync().catch((error) => {
	console.error("Sync failed:", error);
	process.exit(1);
});
