#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import {
	buildCandidate,
	candidatePath,
	isSupportedHost,
	normalizeStructuredSearchResult,
} from "../src/golden-set/capture.mjs";
import { validateRetrievalCandidate } from "../src/golden-set/contracts.mjs";
import { redactQuery } from "../src/golden-set/redaction.mjs";

const APPROVAL_TOKEN = "CAPTURE_INTERACTIVE_CANDIDATE";

const USAGE = `Usage: capture-interactive.mjs --host <host> --project-root <path> --repository <owner/repo> \\
  --query "<text>" --result-json <path> [--apply --approval-token ${APPROVAL_TOKEN}]

默认只输出脱敏 candidate preview，不写文件。只有 --apply 且 approval token 精确匹配时才写入
<project-root>/.memorix/golden-set/.local/inbox/<candidateId>.json。
本命令不安装 hook、不调用 Memorix、不运行 shell。`;

const FLAGS = new Set(["--host", "--project-root", "--repository", "--query", "--result-json", "--approval-token"]);

function parseArgs(args) {
	const parsed = { apply: false };
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === "-h" || arg === "--help") return { help: true };
		if (arg === "--apply") {
			parsed.apply = true;
			continue;
		}
		if (!FLAGS.has(arg)) return { error: `unknown-argument:${arg}` };
		const value = args[index + 1];
		if (typeof value !== "string" || value.startsWith("--")) return { error: `missing-value:${arg}` };
		parsed[arg.slice(2)] = value;
		index += 1;
	}
	if (!parsed.host) return { error: "missing-host" };
	if (!isSupportedHost(parsed.host)) return { error: "unsupported-host" };
	if (!parsed["project-root"]) return { error: "missing-project-root" };
	if (!parsed.repository) return { error: "missing-repository" };
	if (!parsed.query) return { error: "missing-query" };
	if (!parsed["result-json"]) return { error: "missing-result-json" };
	return parsed;
}

function fail(io, code) {
	io.stdout(JSON.stringify({ status: "error", code }));
	return 2;
}

/**
 * 非 ZCode 宿主的交互式候选采集。
 *
 * 结构和判定与 ZCode 自动入口完全一致：只接受结构化 JSON，缺字段即 fail-open。
 */
export async function runInteractiveCapture(args, io) {
	const parsed = parseArgs(args);
	if (parsed.help) {
		io.stdout(USAGE);
		return 0;
	}
	if (parsed.error) return fail(io, parsed.error);

	let raw;
	try {
		raw = JSON.parse(io.readText(parsed["result-json"]));
	} catch {
		return fail(io, "invalid-result-json");
	}

	const normalized = normalizeStructuredSearchResult(raw);
	const redacted = redactQuery(parsed.query, {
		homeDir: homedir(),
		projectRoot: parsed["project-root"],
	});
	const candidate = buildCandidate({
		host: parsed.host,
		captureMode: "interactive",
		sourceProject: parsed.repository,
		toolName: "capture-interactive",
		query: redacted,
		capturedAt: io.now().toISOString(),
		normalized,
	});

	if (!candidate) {
		io.stdout(
			JSON.stringify({
				status: "no-candidate",
				enabledRules: normalized.enabledRules,
				disabledRules: normalized.disabledRules,
			}),
		);
		return 0;
	}

	if (!parsed.apply) {
		io.stdout(JSON.stringify(candidate, null, 2));
		return 0;
	}

	if (parsed["approval-token"] !== APPROVAL_TOKEN) return fail(io, "approval-token-required");

	const validation = validateRetrievalCandidate(candidate);
	if (!validation.ok) return fail(io, `invalid-candidate:${validation.errors.join("|")}`);

	const target = candidatePath(parsed["project-root"], candidate.candidateId);
	if (existsSync(target)) {
		io.stdout(JSON.stringify({ status: "skipped", candidateId: candidate.candidateId }));
		return 0;
	}
	io.writeText(target, `${JSON.stringify(candidate, null, "\t")}\n`);
	io.stdout(JSON.stringify({ status: "written", candidateId: candidate.candidateId }));
	return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const code = await runInteractiveCapture(process.argv.slice(2), {
		now: () => new Date(),
		readText: (path) => readFileSync(path, "utf8"),
		writeText: (path, text) => writeFileSync(path, text, "utf8"),
		stdout: (text) => process.stdout.write(`${text}\n`),
	});
	process.exit(code);
}
