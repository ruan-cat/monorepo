import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import path from "node:path";
import type { McpPlatform } from "./platforms.js";

export interface InstallMcpOptions {
	dryRun?: boolean;
	extraConfigs?: string[];
}

export interface InstallMcpResult {
	platform: string;
	configFile: string;
	status: "updated" | "created" | "skipped" | "error";
	previousArgs?: string[];
	error?: string;
}

const MEMORIX_COMMAND = "memorix";
const MEMORIX_ARGS = ["serve", "--mode", "full"];

function hasFullModeArgs(args: string[] | undefined): boolean {
	if (!args || args.length < 3) return false;
	for (let i = 0; i < args.length - 1; i++) {
		if (args[i] === "--mode" && args[i + 1] === "full") return true;
	}
	return false;
}

// ---- JSON helpers ----

function installJsonMcp(
	filePath: string,
	dryRun: boolean,
): Pick<InstallMcpResult, "status" | "previousArgs" | "error"> {
	try {
		if (!existsSync(filePath)) {
			// 创建新 JSON 配置文件
			const config = {
				mcpServers: {
					memorix: {
						command: MEMORIX_COMMAND,
						args: MEMORIX_ARGS,
					},
				},
			};
			if (!dryRun) {
				const dir = dirname(filePath);
				if (!existsSync(dir)) {
					mkdirSync(dir, { recursive: true });
				}
				writeFileSync(filePath, JSON.stringify(config, null, "\t") + "\n", "utf-8");
			}
			return { status: "created" };
		}

		const content = readFileSync(filePath, "utf-8");
		const config = JSON.parse(content) as Record<string, unknown>;

		if (!config.mcpServers || typeof config.mcpServers !== "object") {
			config.mcpServers = {};
		}
		const mcpServers = config.mcpServers as Record<string, unknown>;

		if (mcpServers.memorix) {
			const existing = mcpServers.memorix as Record<string, unknown>;
			const previousArgs = Array.isArray(existing.args) ? (existing.args as string[]) : undefined;

			if (hasFullModeArgs(previousArgs)) {
				return { status: "skipped", previousArgs };
			}

			existing.command = MEMORIX_COMMAND;
			existing.args = MEMORIX_ARGS;
			if (!dryRun) {
				writeFileSync(filePath, JSON.stringify(config, null, "\t") + "\n", "utf-8");
			}
			return { status: "updated", previousArgs };
		}

		mcpServers.memorix = {
			command: MEMORIX_COMMAND,
			args: MEMORIX_ARGS,
		};
		if (!dryRun) {
			writeFileSync(filePath, JSON.stringify(config, null, "\t") + "\n", "utf-8");
		}
		return { status: "updated" };
	} catch (err) {
		return { status: "error", error: (err as Error).message };
	}
}

// ---- TOML helpers ----

/**
 * 将 TOML 数组字符串中的单引号替换为双引号，然后用 JSON.parse 解析。
 */
function formatTomlArgs(args: string[]): string {
	return `["${args.join('", "')}"]`;
}

function parseTomlArray(arrayStr: string): string[] {
	const normalized = arrayStr.replace(/'/g, '"');
	return JSON.parse(normalized) as string[];
}

/**
 * 在 TOML 内容中查找 `[mcpServers.memorix]` section，更新或插入 args。
 * 返回 { changed, newContent, previousArgs }；若 section 不存在返回 null。
 */
function updateTomlSection(
	content: string,
	newArgs: string[],
): { changed: boolean; newContent: string; previousArgs?: string[] } | null {
	const sectionRegex = /^\[mcpServers\.memorix\]\s*$/m;
	const sectionMatch = content.match(sectionRegex);
	if (!sectionMatch) return null;

	const sectionStart = sectionMatch.index!;
	const afterSection = content.slice(sectionStart + sectionMatch[0].length);

	// 找到下一个 [xxx] section 的位置，即当前 section 的结束位置
	const nextSectionRegex = /^\[[^\]]+\]\s*$/m;
	const nextMatch = nextSectionRegex.exec(afterSection);
	const sectionEnd = nextMatch !== null ? sectionStart + sectionMatch[0].length + nextMatch.index! : content.length;

	const before = content.slice(0, sectionStart);
	const sectionBody = content.slice(sectionStart, sectionEnd);
	const after = content.slice(sectionEnd);

	// 在 sectionBody 中查找 args = [...]
	const argsRegex = /args\s*=\s*(\[[^\]]*\])/m;
	const argsMatch = sectionBody.match(argsRegex);

	if (argsMatch) {
		const previousArgs = parseTomlArray(argsMatch[1]);
		if (hasFullModeArgs(previousArgs)) {
			return { changed: false, newContent: content, previousArgs };
		}
		const newSectionBody = sectionBody.replace(argsRegex, `args = ${formatTomlArgs(newArgs)}`);
		return { changed: true, newContent: before + newSectionBody + after, previousArgs };
	}

	// section 存在但没有 args，在 section 头部下方插入
	const lines = sectionBody.split("\n");
	// sectionHeader 是第一行 [mcpServers.memorix]
	const sectionHeader = lines.shift()!;
	const newSectionBody =
		sectionHeader + "\n" + `args = ${formatTomlArgs(newArgs)}` + (lines.length ? "\n" + lines.join("\n") : "");
	return { changed: true, newContent: before + newSectionBody + after };
}

function installTomlMcp(
	filePath: string,
	dryRun: boolean,
): Pick<InstallMcpResult, "status" | "previousArgs" | "error"> {
	try {
		if (!existsSync(filePath)) {
			// 创建新 TOML 配置文件
			const block = `[mcpServers.memorix]\ncommand = "${MEMORIX_COMMAND}"\nargs = ${formatTomlArgs(MEMORIX_ARGS)}\n`;
			if (!dryRun) {
				const dir = dirname(filePath);
				if (!existsSync(dir)) {
					mkdirSync(dir, { recursive: true });
				}
				writeFileSync(filePath, block, "utf-8");
			}
			return { status: "created" };
		}

		let content = readFileSync(filePath, "utf-8");
		const result = updateTomlSection(content, MEMORIX_ARGS);

		if (!result) {
			// 没有 [mcpServers.memorix] section，在文件末尾追加
			const block = `\n[mcpServers.memorix]\ncommand = "${MEMORIX_COMMAND}"\nargs = ${formatTomlArgs(MEMORIX_ARGS)}\n`;
			content = content.trimEnd() + block;
			if (!dryRun) {
				writeFileSync(filePath, content, "utf-8");
			}
			return { status: "updated" };
		}

		if (!result.changed) {
			return { status: "skipped", previousArgs: result.previousArgs };
		}

		if (!dryRun) {
			writeFileSync(filePath, result.newContent, "utf-8");
		}
		return {
			status: "updated",
			previousArgs: result.previousArgs,
		};
	} catch (err) {
		return { status: "error", error: (err as Error).message };
	}
}

// ---- Main entry ----

export function installMemorixMcp(platforms: McpPlatform[], options?: InstallMcpOptions): InstallMcpResult[] {
	const results: InstallMcpResult[] = [];
	const dryRun = options?.dryRun ?? false;

	// 把 --config 传入的额外路径追加为自定义平台
	const allPlatforms: McpPlatform[] = platforms.slice();
	if (options?.extraConfigs) {
		for (const extra of options.extraConfigs) {
			const format: McpPlatform["format"] = extra.endsWith(".toml") ? "toml" : "json";
			allPlatforms.push({
				name: `custom-${path.basename(extra)}`,
				configFiles: [extra],
				format,
			});
		}
	}

	for (const platform of allPlatforms) {
		if (platform.configFiles.length === 0) {
			results.push({
				platform: platform.name,
				configFile: "",
				status: "error",
				error: "No config files specified",
			});
			continue;
		}

		// 找到第一个存在的配置文件；如果都不存在，使用第一个候选路径创建
		const existingFile = platform.configFiles.find((f) => existsSync(f));
		const targetFile = existingFile ?? platform.configFiles[0];

		const res = platform.format === "json" ? installJsonMcp(targetFile, dryRun) : installTomlMcp(targetFile, dryRun);

		results.push({
			platform: platform.name,
			configFile: targetFile,
			...res,
		});
	}

	return results;
}
