#!/usr/bin/env tsx

/**
 * 简单的测试运行器
 *
 * 运行方式：
 * - pnpm exec tsx src/tests/run-tests.ts
 * - node dist/tests/run-tests.js (构建后)
 */

import { runAllTests } from "./emoji-commit-parsing.test.ts";

async function main() {
	try {
		console.log("🧪 Release Toolkit - Emoji Commit Parsing Tests");
		console.log("================================================\n");

		const success = runAllTests();

		if (success) {
			console.log("\n✅ All tests completed successfully!");
			process.exit(0);
		} else {
			console.log("\n❌ Some tests failed!");
			process.exit(1);
		}
	} catch (error) {
		console.error("\n💥 Test runner error:", error);
		process.exit(1);
	}
}

// 如果直接执行此文件则运行测试
// 简化的模块检测，直接运行测试
main();
