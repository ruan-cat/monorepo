#!/usr/bin/env tsx
import { refreshMemorixSkills, type RefreshOptions } from "../src/memorix.js";

function parseArgs(): RefreshOptions {
	const args = process.argv.slice(2);
	const opts: RefreshOptions & { help?: boolean } = {};
	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case "--target":
				opts.targetDir = args[++i];
				break;
			case "--agent":
				opts.agent = args[++i];
				break;
			case "--source":
				opts.source = args[++i] as RefreshOptions["source"];
				break;
			case "--github-ref":
				opts.githubRef = args[++i];
				break;
			case "--dry-run":
				opts.dryRun = true;
				break;
			case "--force":
				opts.force = true;
				break;
			case "--no-backup":
				opts.backup = false;
				break;
			case "--help":
				opts.help = true;
				break;
			default:
				console.error(`未知参数: ${args[i]}`);
				process.exit(1);
		}
	}
	return opts;
}

function showHelp(): void {
	console.log(`
用法: tsx scripts/fetch-memorix-skills.ts [选项]

从 memorix 官方仓库刷新内部 skills 到本地 ~/.agents/skills/ 目录。

选项:
  --target <path>      目标 skills 目录（默认: ~/.agents/skills）
  --agent <agent>      agent 来源（默认: cursor，可选: claude, codex）
  --source <source>    来源策略（默认: auto，可选: github, local, cli）
  --github-ref <ref>   GitHub ref（默认: v1.1.5）
  --dry-run            只输出计划，不写入文件
  --force              覆盖已存在的 skill 目录
  --no-backup          覆盖时不备份
  --help               显示此帮助信息
`);
}

async function main(): Promise<void> {
	const opts = parseArgs();
	if ((opts as any).help) {
		showHelp();
		process.exit(0);
	}
	try {
		const results = await refreshMemorixSkills(opts);
		let created = 0,
			updated = 0,
			skipped = 0,
			errors = 0;
		for (const r of results) {
			switch (r.status) {
				case "created":
					created++;
					break;
				case "updated":
					updated++;
					break;
				case "skipped":
					skipped++;
					break;
				case "error":
					errors++;
					console.error(`[ERROR] ${r.skill}: ${r.error}`);
					break;
			}
		}
		console.log(`Done: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
	} catch (error) {
		console.error("刷新失败:", error);
		process.exit(1);
	}
}

main();
