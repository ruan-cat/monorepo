import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import path from "node:path";
import { DEFAULT_SERVER_PATH, type McpPlatform } from "./platforms.js";

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

/** 目标 memorix mode：低上下文消耗配置，详见 docs/memorix/2026-10-1-low-cost-config/ */
const MEMORIX_COMMAND = "memorix";
const MEMORIX_MODE = "micro";
const MEMORIX_ARGS = ["serve", "--mode", MEMORIX_MODE];

/**
 * 判断已有 args 是否已经是目标 mode。
 * 裸 `serve`（无 --mode）等价于 micro——`memorix serve` 的 `--mode` 默认值就是 micro
 * （v1.9.3 实测：`--mode  Tool profile to expose (micro, lite, team, full; default: micro)`），
 * 因此视为已满足，避免产生无谓 diff。
 */
function hasTargetModeArgs(args: string[] | undefined): boolean {
	if (!args || args.length === 0) return false;
	if (!args.includes("serve")) return false;
	for (let i = 0; i < args.length - 1; i++) {
		if (args[i] === "--mode") return args[i + 1] === MEMORIX_MODE;
	}
	// 没有 --mode 参数时，memorix 默认即 micro
	return true;
}

/**
 * 只调整 args 中的 mode，保留启动器前缀。
 *
 * Codex 的 entry 是 `command = "cmd"` + `args = ["/c", "memorix.cmd", "serve", "--mode", "team"]`。
 * 直接整体替换 args 会把 `cmd /c memorix.cmd` 启动器弄丢，Windows 上就起不来了。
 * 所以这里只改 `--mode` 的值。
 */
function withTargetMode(args: string[]): string[] {
	const out = args.slice();
	const modeIndex = out.indexOf("--mode");
	if (modeIndex !== -1) {
		if (modeIndex + 1 < out.length) {
			out[modeIndex + 1] = MEMORIX_MODE;
		} else {
			out.push(MEMORIX_MODE);
		}
		return out;
	}
	const serveIndex = out.indexOf("serve");
	if (serveIndex !== -1) {
		out.splice(serveIndex + 1, 0, "--mode", MEMORIX_MODE);
		return out;
	}
	return out.concat(MEMORIX_ARGS);
}

/** 按 `serverPath` 取出（必要时逐级创建）存放 server 定义的对象。 */
function ensureServerContainer(root: Record<string, unknown>, serverPath: readonly string[]): Record<string, unknown> {
	let cursor = root;
	for (const key of serverPath) {
		const next = cursor[key];
		if (!next || typeof next !== "object" || Array.isArray(next)) {
			cursor[key] = {};
		}
		cursor = cursor[key] as Record<string, unknown>;
	}
	return cursor;
}

/** 按 `serverPath` 读取存放 server 定义的对象；路径不存在时返回 undefined（**不创建**）。 */
function readServerContainer(
	root: Record<string, unknown>,
	serverPath: readonly string[],
): Record<string, unknown> | undefined {
	let cursor: unknown = root;
	for (const key of serverPath) {
		if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return undefined;
		cursor = (cursor as Record<string, unknown>)[key];
	}
	if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return undefined;
	return cursor as Record<string, unknown>;
}

/** 探测原文件的缩进风格（取第一个缩进行的前导空白）。 */
function detectIndent(content: string): string {
	const matched = content.match(/^([ \t]+)\S/m);
	return matched ? matched[1] : "\t";
}

/** 探测原文件的行尾风格。 */
function detectEol(content: string): string {
	return content.includes("\r\n") ? "\r\n" : "\n";
}

/**
 * 按**原文件的缩进与行尾**序列化，避免把一个 100KB 的配置整文件重排
 * （默认 `JSON.stringify(..., "\t")` 会把 2 空格缩进的文件全部改成制表符）。
 */
function stringifyLike(content: string, config: unknown): string {
	const indent = detectIndent(content);
	const eol = detectEol(content);
	const body = JSON.stringify(config, null, indent).split("\n").join(eol);
	// 原文件结尾没有换行时不要补一个，否则会产生无意义的尾行 diff。
	return content.endsWith("\n") ? body + eol : body;
}

// ---- JSON helpers ----

function installJsonMcp(
	filePath: string,
	dryRun: boolean,
	serverPath: readonly string[],
): Pick<InstallMcpResult, "status" | "previousArgs" | "error"> {
	try {
		if (!existsSync(filePath)) {
			// 创建新 JSON 配置文件
			const config: Record<string, unknown> = {};
			const container = ensureServerContainer(config, serverPath);
			container.memorix = {
				command: MEMORIX_COMMAND,
				args: MEMORIX_ARGS,
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

		// 已存在的 entry：只校准 mode，**不动 command**——
		// Codex 之类平台用 `cmd /c memorix.cmd` 启动器，覆盖 command 会破坏启动链。
		const existingContainer = readServerContainer(config, serverPath);
		const existing = existingContainer?.memorix as Record<string, unknown> | undefined;

		if (existing) {
			const previousArgs = Array.isArray(existing.args) ? (existing.args as string[]) : undefined;

			if (hasTargetModeArgs(previousArgs)) {
				return { status: "skipped", previousArgs };
			}

			existing.args = withTargetMode(previousArgs ?? []);
			if (!dryRun) {
				writeFileSync(filePath, stringifyLike(content, config), "utf-8");
			}
			return { status: "updated", previousArgs };
		}

		const container = ensureServerContainer(config, serverPath);
		container.memorix = {
			command: MEMORIX_COMMAND,
			args: MEMORIX_ARGS,
		};
		if (!dryRun) {
			writeFileSync(filePath, stringifyLike(content, config), "utf-8");
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
 * 在 TOML 内容中查找 `[<table>.memorix]` section，更新或插入 args。
 * 返回 { changed, newContent, previousArgs }；若 section 不存在返回 null。
 *
 * `table` 由平台决定：Codex 是 `mcp_servers`（下划线），不是 `mcpServers`。
 */
function updateTomlSection(
	content: string,
	table: string,
): { changed: boolean; newContent: string; previousArgs?: string[] } | null {
	const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const sectionRegex = new RegExp(`^\\[${escapedTable}\\.memorix\\]\\s*$`, "m");
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
		if (hasTargetModeArgs(previousArgs)) {
			return { changed: false, newContent: content, previousArgs };
		}
		// 只改 mode，保留 `["/c", "memorix.cmd", ...]` 这类启动器前缀
		const nextArgs = withTargetMode(previousArgs);
		const newSectionBody = sectionBody.replace(argsRegex, `args = ${formatTomlArgs(nextArgs)}`);
		return { changed: true, newContent: before + newSectionBody + after, previousArgs };
	}

	// section 存在但没有 args，在 section 头部下方插入
	const lines = sectionBody.split("\n");
	// sectionHeader 是第一行 [<table>.memorix]
	const sectionHeader = lines.shift()!;
	const newSectionBody =
		sectionHeader +
		"\n" +
		`args = ${formatTomlArgs([...MEMORIX_ARGS])}` +
		(lines.length ? "\n" + lines.join("\n") : "");
	return { changed: true, newContent: before + newSectionBody + after };
}

function installTomlMcp(
	filePath: string,
	dryRun: boolean,
	table: string,
): Pick<InstallMcpResult, "status" | "previousArgs" | "error"> {
	try {
		if (!existsSync(filePath)) {
			// 创建新 TOML 配置文件
			const block = `[${table}.memorix]\ncommand = "${MEMORIX_COMMAND}"\nargs = ${formatTomlArgs(MEMORIX_ARGS)}\n`;
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
		const result = updateTomlSection(content, table);

		if (!result) {
			// 没有 [<table>.memorix] section，在文件末尾追加
			const block = `\n[${table}.memorix]\ncommand = "${MEMORIX_COMMAND}"\nargs = ${formatTomlArgs(MEMORIX_ARGS)}\n`;
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

		const serverPath = platform.serverPath ?? DEFAULT_SERVER_PATH;
		const res =
			platform.format === "json"
				? installJsonMcp(targetFile, dryRun, serverPath)
				: installTomlMcp(targetFile, dryRun, serverPath.join("."));

		results.push({
			platform: platform.name,
			configFile: targetFile,
			...res,
		});
	}

	return results;
}
