#!/usr/bin/env tsx

import { consola } from "consola";

async function simpleTest() {
	consola.info("🧪 简单测试开始");

	try {
		// 测试基本导入
		const { generateChangelogFromGitHistory } = await import("../plugins/changelog-with-changelogen.js");
		consola.success("✅ 成功导入插件");

		// 简单功能测试
		const result = await generateChangelogFromGitHistory("HEAD~3", "HEAD", {
			repo: "ruan-cat/monorepo",
			groupByType: false,
			includeAuthors: false,
		});

		if (result) {
			console.log("生成的变更日志:");
			console.log(result);
		} else {
			consola.warn("未生成变更日志");
		}
	} catch (error) {
		consola.error("测试失败:", error);
	}
}

simpleTest();
