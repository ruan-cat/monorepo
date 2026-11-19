#!/usr/bin/env tsx
import { OFFICIAL_MEMORIX_SKILLS, auditOfficialMemorixSkills, summarizeMemorixAudit } from "../src/memorix-audit.ts";

function printHelp(): void {
	console.log(`Usage: audit-memorix-skills.ts [options]

Options:
  --skills-root <path>   Skills root to inspect (default: ~/.agents/skills)
  --json                 Print the full audit result as JSON
  -h, --help             Show this help message

只读审计官方七个 Memorix skills 的 present / missing / invalid 状态。
本命令不联网、不安装、不复制、不修改任何文件；缺失或非法时只提示官方 setup/升级。
`);
}

function main(): void {
	const args = process.argv.slice(2);
	let skillsRoot: string | undefined;
	let asJson = false;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === "-h" || arg === "--help") {
			printHelp();
			return;
		}
		if (arg === "--json") {
			asJson = true;
			continue;
		}
		if (arg === "--skills-root") {
			skillsRoot = args[++index];
			if (!skillsRoot) {
				console.error("Error: --skills-root requires a path argument.");
				process.exit(1);
			}
			continue;
		}
		console.error(`Error: Unknown argument ${arg}`);
		process.exit(1);
	}

	const results = auditOfficialMemorixSkills(skillsRoot);
	if (asJson) {
		console.log(JSON.stringify({ summary: summarizeMemorixAudit(results), results }, null, 2));
	} else {
		console.log(`[memorix-audit] ${summarizeMemorixAudit(results)}`);
		for (const result of results) {
			const detail = result.reason ? ` (${result.reason})` : "";
			console.log(`${result.status.padEnd(7)} ${result.skill}${detail}`);
		}
		console.log(
			`[memorix-audit] 官方 skills 的安装与升级只由 Memorix 官方 setup/升级负责；本次未修改任何文件。已检查 ${OFFICIAL_MEMORIX_SKILLS.length} 个技能。`,
		);
	}
}

main();
