#!/usr/bin/env tsx

import { homedir } from "node:os";
import path from "node:path";
import { summarizeMemorixAudit, auditOfficialMemorixSkills } from "../src/memorix-audit.ts";
import { DEFAULT_PLATFORMS } from "../src/platforms.ts";
import { syncSkills } from "../src/sync.ts";

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		printHelp();
		return;
	}

	const sourceDir = options.source ?? path.join(homedir(), ".agents", "skills");

	// 官方 Memorix skills 只做只读审计：安装、升级与修复都属于官方 setup/升级职责。
	if (!options.skipMemorixAudit) {
		try {
			const audit = auditOfficialMemorixSkills(sourceDir);
			console.log(`\n[memorix-audit] ${summarizeMemorixAudit(audit)}`);
			for (const result of audit) {
				if (result.status === "present") continue;
				const detail = result.reason ? ` (${result.reason})` : "";
				console.warn(`[memorix-audit]   ${result.skill}: ${result.status}${detail}`);
			}
			if (audit.some((result) => result.status !== "present")) {
				console.warn(
					"[memorix-audit] 缺失或非法的官方 skills 不在本同步器修复范围内；请使用 Memorix 官方 setup/升级命令。",
				);
			}
		} catch (error) {
			console.warn(
				`[memorix-audit] 审计未完成：${error instanceof Error ? error.message : String(error)}；继续执行平台链接同步。`,
			);
		}
	}

	const results = syncSkills(sourceDir, DEFAULT_PLATFORMS, {
		dryRun: options.dryRun,
		backup: options.backup,
	});

	for (const result of results) {
		console.log(JSON.stringify(result));
	}
}

function printHelp(): void {
	console.log(
		`
Usage: sync.ts [options]

Options:
  --source <path>                 Source skills directory (default: ~/.agents/skills)
  --dry-run                       Print the plan without modifying the filesystem
  --no-backup                     Do not backup existing directories before replacing
  --skip-memorix-audit            Skip the read-only official Memorix skills audit
  --help                          Show this help message

官方七个 Memorix skills 只做只读审计（present / missing / invalid）。本命令不下载、不覆盖、
不备份官方 skills；安装与升级请使用 Memorix 官方 setup/升级。
`.trim(),
	);
}

interface ParsedArgs {
	source?: string;
	dryRun?: boolean;
	backup?: boolean;
	help?: boolean;
	skipMemorixAudit?: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
	const result: ParsedArgs = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		switch (arg) {
			case "--source":
			case "-s": {
				const value = args[++i];
				if (value === undefined) {
					throw new Error("--source requires a value");
				}
				result.source = value;
				break;
			}
			case "--dry-run":
			case "-d":
				result.dryRun = true;
				break;
			case "--no-backup":
				result.backup = false;
				break;
			case "--help":
			case "-h":
				result.help = true;
				break;
			case "--skip-memorix-audit":
				result.skipMemorixAudit = true;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return result;
}

main();
