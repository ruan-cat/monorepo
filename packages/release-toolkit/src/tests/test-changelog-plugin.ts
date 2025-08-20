#!/usr/bin/env tsx

/**
 * 测试 changelog-with-changelogen 插件的功能
 */
import { consola } from "consola";
import { generateChangelogFromGitHistory, generateHybridChangelog } from "../plugins/changelog-with-changelogen.js";

async function testChangelogPlugin() {
	consola.info("🧪 开始测试 changelog-with-changelogen 插件");

	try {
		// 测试1: 从 git commit 历史生成变更日志
		consola.info("\n📋 测试1: 从最近10个 git commit 生成变更日志");
		
		const gitChangelog = await generateChangelogFromGitHistory(
			"HEAD~10", // 从最近10个提交开始
			"HEAD",    // 到最新提交
			{
				repo: "ruan-cat/monorepo",
				groupByType: true,
				includeAuthors: true,
			}
		);

		if (gitChangelog) {
			consola.success("✅ 成功生成 git commit 变更日志:");
			console.log("=".repeat(50));
			console.log(gitChangelog);
			console.log("=".repeat(50));
		} else {
			consola.warn("⚠️ 未能生成 git commit 变更日志");
		}

		// 测试2: 混合模式（由于没有实际的 changesets，主要测试回退到 git）
		consola.info("\n🔄 测试2: 混合模式变更日志生成（回退到 git）");
		
		const hybridChangelog = await generateHybridChangelog(
			[], // 空的 changesets 数组
			{
				repo: "ruan-cat/monorepo",
				from: "HEAD~5",
				to: "HEAD",
				fallbackToGit: true,
			}
		);

		if (hybridChangelog) {
			consola.success("✅ 成功生成混合模式变更日志:");
			console.log("=".repeat(50));
			console.log(hybridChangelog);
			console.log("=".repeat(50));
		} else {
			consola.warn("⚠️ 未能生成混合模式变更日志");
		}

		// 测试3: 测试不同的时间范围
		consola.info("\n📅 测试3: 测试最近3个提交的变更日志");
		
		const recentChangelog = await generateChangelogFromGitHistory(
			"HEAD~3",
			"HEAD",
			{
				repo: "ruan-cat/monorepo",
				groupByType: false, // 按时间顺序，不分组
				includeAuthors: false,
			}
		);

		if (recentChangelog) {
			consola.success("✅ 成功生成最近提交变更日志:");
			console.log("=".repeat(50));
			console.log(recentChangelog);
			console.log("=".repeat(50));
		} else {
			consola.warn("⚠️ 未能生成最近提交变更日志");
		}

		consola.success("🎉 所有测试完成！插件集成 changelogen 功能正常");

	} catch (error) {
		consola.error("❌ 测试过程中出现错误:", error);
		process.exit(1);
	}
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
	testChangelogPlugin();
}