#!/usr/bin/env tsx

import { homedir } from "node:os";
import path from "node:path";
import { DEFAULT_PLATFORMS } from "../src/platforms.ts";
import { syncSkills } from "../src/sync.ts";
import { refreshMemorixSkills, type RefreshOptions } from "../src/memorix.js";

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const options = parseArgs(args);

	if (options.help) {
		printHelp();
		return;
	}

	const sourceDir = options.source ?? path.join(homedir(), ".agents", "skills");

	// Refresh memorix skills before platform sync
	if (!options.skipMemorixRefresh) {
		try {
			const refreshOpts: RefreshOptions = {
				source: options.memorixSource,
				agent: options.memorixAgent,
				dryRun: options.dryRun,
				force: options.forceMemorixRefresh,
			};

			const memorixResults = await refreshMemorixSkills(refreshOpts);

			const created = memorixResults.filter((r) => r.status === "created").length;
			const updated = memorixResults.filter((r) => r.status === "updated").length;
			const skipped = memorixResults.filter((r) => r.status === "skipped").length;
			const errors = memorixResults.filter((r) => r.status === "error").length;

			console.log(`\n[memorix] ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);

			if (memorixResults.length > 0 && memorixResults.every((r) => r.status === "error")) {
				console.warn("[memorix] Warning: All memorix skills failed to refresh, continuing with platform sync...");
			}

			for (const mr of memorixResults.filter((r) => r.status === "error")) {
				console.warn(`[memorix]   ${mr.skill}: ${mr.error ?? "unknown error"}`);
			}
		} catch (err) {
			console.warn(`[memorix] Warning: Memorix refresh failed: ${err instanceof Error ? err.message : String(err)}`);
			console.warn("[memorix] Continuing with platform sync...");
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
  --help                          Show this help message
  --skip-memorix-refresh          Skip memorix skills refresh before platform sync
  --force-memorix-refresh         Force overwrite memorix skills (ignores SHA-256 comparison)
  --memorix-source <source>       Memorix data source: github, local, cli, or auto (default: auto)
  --memorix-agent <agent>         Memorix agent platform name (default: cursor)
`.trim(),
	);
}

interface ParsedArgs {
	source?: string;
	dryRun?: boolean;
	backup?: boolean;
	help?: boolean;
	skipMemorixRefresh?: boolean;
	forceMemorixRefresh?: boolean;
	memorixSource?: "github" | "local" | "cli" | "auto";
	memorixAgent?: string;
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
			case "--skip-memorix-refresh":
				result.skipMemorixRefresh = true;
				break;
			case "--force-memorix-refresh":
				result.forceMemorixRefresh = true;
				break;
			case "--memorix-source": {
				const sourceValue = args[++i];
				if (sourceValue === undefined) {
					throw new Error("--memorix-source requires a value");
				}
				if (!["github", "local", "cli", "auto"].includes(sourceValue)) {
					throw new Error(`Invalid memorix source: ${sourceValue}. Must be one of: github, local, cli, auto`);
				}
				result.memorixSource = sourceValue as "github" | "local" | "cli" | "auto";
				break;
			}
			case "--memorix-agent": {
				const agentValue = args[++i];
				if (agentValue === undefined) {
					throw new Error("--memorix-agent requires a value");
				}
				result.memorixAgent = agentValue;
				break;
			}
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return result;
}

main();
