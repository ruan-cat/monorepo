#!/usr/bin/env tsx

import { homedir } from "node:os";
import path from "node:path";
import { DEFAULT_PLATFORMS } from "../src/platforms.ts";
import { syncSkills } from "../src/sync.ts";

function main(): void {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		printHelp();
		return;
	}

	const sourceDir = options.source ?? path.join(homedir(), ".agents", "skills");

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
  --source <path>   Source skills directory (default: ~/.agents/skills)
  --dry-run         Print the plan without modifying the filesystem
  --no-backup       Do not backup existing directories before replacing
  --help            Show this help message
`.trim(),
	);
}

interface ParsedArgs {
	source?: string;
	dryRun?: boolean;
	backup?: boolean;
	help?: boolean;
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
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return result;
}

main();
