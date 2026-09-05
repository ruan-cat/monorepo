#!/usr/bin/env tsx
import { installMemorixMcp, type InstallMcpOptions } from "../src/install-mcp.js";
import { DEFAULT_MCP_PLATFORMS } from "../src/platforms.js";

function printHelp(): void {
	console.log(`Usage: install-mcp.ts [options]

Options:
  -d, --dry-run          Preview mode; do not write any files
  -c, --config <path>    Additional MCP config file (can be used multiple times)
  -h, --help             Show this help message

Examples:
  tsx install-mcp.ts
  tsx install-mcp.ts --dry-run
  tsx install-mcp.ts -c ~/.my-tool/mcp.json -c ~/.my-tool/extra.toml
`);
}

function parseArgs(argv: string[]): { options: InstallMcpOptions; help: boolean } {
	const options: InstallMcpOptions = {};
	const extraConfigs: string[] = [];
	let help = false;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case "-d":
			case "--dry-run":
				options.dryRun = true;
				break;
			case "-c":
			case "--config": {
				const next = argv[++i];
				if (!next) {
					console.error(`Error: ${arg} requires a path argument.`);
					process.exit(1);
				}
				extraConfigs.push(next);
				break;
			}
			case "-h":
			case "--help":
				help = true;
				break;
			default:
				if (arg.startsWith("-")) {
					console.error(`Error: Unknown argument ${arg}`);
					process.exit(1);
				}
				break;
		}
	}

	if (extraConfigs.length) {
		options.extraConfigs = extraConfigs;
	}

	return { options, help };
}

function main(): void {
	const { options, help } = parseArgs(process.argv.slice(2));

	if (help) {
		printHelp();
		process.exit(0);
	}

	const results = installMemorixMcp(DEFAULT_MCP_PLATFORMS, options);

	for (const result of results) {
		console.log(JSON.stringify(result));
	}

	const hasError = results.some((r) => r.status === "error");
	if (hasError) {
		process.exit(1);
	}
}

main();
