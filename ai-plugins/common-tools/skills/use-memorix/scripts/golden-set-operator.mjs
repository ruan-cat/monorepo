#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { acceptCandidate, cleanupCandidates, exportBundle, planGoldenSetInit } from "../src/golden-set/operator.mjs";

const TOKENS = {
	init: "INIT_GOLDEN_SET",
	accept: "ACCEPT_CANDIDATE",
	cleanup: "CLEANUP_CANDIDATES",
	export: "EXPORT_BUNDLE",
};

const USAGE = `Usage: golden-set-operator.mjs <command> [options]

Commands:
  init     --project-root <path> --repository <owner/repo> [--apply --approval-token ${TOKENS.init}]
  accept   --project-root <path> --candidate <inbox.json> --rerun-json <json> --expected-json <json> \\
           --id <case-id> [--apply --approval-token ${TOKENS.accept}]
  cleanup  --project-root <path> [--apply --approval-token ${TOKENS.cleanup}]
  export   --project-root <path> --case-id <id> --project-id <id> --source-commit <sha> --out <path> \\
           [--apply --approval-token ${TOKENS.export}]

默认全部只输出 preview，不写任何文件；只有 --apply 且 approval token 精确匹配才落盘。
本命令不调用 Memorix，复跑结果必须由调用方以结构化 JSON 提供。`;

function parse(args) {
	const parsed = { apply: false, _: [] };
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === "-h" || arg === "--help") {
			parsed.help = true;
			continue;
		}
		if (arg === "--apply") {
			parsed.apply = true;
			continue;
		}
		if (!arg.startsWith("--")) {
			parsed._.push(arg);
			continue;
		}
		const value = args[index + 1];
		if (value === undefined || value.startsWith("--")) throw new Error(`missing-value:${arg}`);
		parsed[arg.slice(2)] = value;
		index += 1;
	}
	return parsed;
}

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
}

function requireApply(parsed, command) {
	if (!parsed.apply) return false;
	if (parsed["approval-token"] !== TOKENS[command]) throw new Error("approval-token-required");
	return true;
}

function inboxDir(projectRoot) {
	return join(projectRoot, ".memorix/golden-set/.local/inbox");
}

function run(argv, io) {
	const parsed = parse(argv);
	if (parsed.help || parsed._.length === 0) {
		io.stdout(USAGE);
		return 0;
	}
	const command = parsed._[0];
	const projectRoot = parsed["project-root"];
	if (!projectRoot) throw new Error("missing-project-root");

	if (command === "init") {
		const plan = planGoldenSetInit({ projectRoot, repository: parsed.repository });
		const apply = requireApply(parsed, "init");
		if (!apply) {
			io.stdout(JSON.stringify({ command, apply: false, plan }, null, 2));
			return 0;
		}
		if (plan.blocked.length) throw new Error(`init-blocked:${plan.blocked.join(",")}`);
		for (const write of plan.writes) {
			mkdirSync(dirname(write.path), { recursive: true });
			writeFileSync(write.path, write.content, "utf8");
		}
		io.stdout(JSON.stringify({ command, apply: true, written: plan.writes.map((write) => write.path) }, null, 2));
		return 0;
	}

	if (command === "accept") {
		const candidate = readJson(parsed.candidate);
		const rerun = readJson(parsed["rerun-json"]);
		const expected = readJson(parsed["expected-json"]);
		const casesPath = join(projectRoot, ".memorix/golden-set/cases.json");
		const goldenSet = readJson(casesPath);
		const next = acceptCandidate({
			goldenSet,
			candidate,
			rerun,
			expected,
			id: parsed.id,
			capturedAt: parsed["captured-at"] ?? new Date().toISOString(),
		});
		const apply = requireApply(parsed, "accept");
		if (!apply) {
			io.stdout(JSON.stringify({ command, apply: false, goldenSet: next }, null, 2));
			return 0;
		}
		writeJson(casesPath, next);
		const promoted = join(projectRoot, ".memorix/golden-set/.local/promoted");
		mkdirSync(promoted, { recursive: true });
		renameSync(parsed.candidate, join(promoted, `${parsed.id}.json`));
		io.stdout(JSON.stringify({ command, apply: true, caseId: parsed.id }, null, 2));
		return 0;
	}

	if (command === "cleanup") {
		const dir = inboxDir(projectRoot);
		const names = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".json")) : [];
		const candidates = names.map((name) => {
			const path = join(dir, name);
			return { path, capturedAt: readJson(path).capturedAt };
		});
		const plan = cleanupCandidates({ now: new Date().toISOString(), candidates });
		const apply = requireApply(parsed, "cleanup");
		if (!apply) {
			io.stdout(JSON.stringify({ command, apply: false, plan }, null, 2));
			return 0;
		}
		for (const path of plan.remove) unlinkSync(path);
		io.stdout(JSON.stringify({ command, apply: true, removed: plan.remove.length }, null, 2));
		return 0;
	}

	if (command === "export") {
		const goldenSet = readJson(join(projectRoot, ".memorix/golden-set/cases.json"));
		const bundle = exportBundle({
			goldenSet,
			caseId: parsed["case-id"],
			projectId: parsed["project-id"],
			sourceCommit: parsed["source-commit"],
			exportedAt: new Date().toISOString(),
		});
		const apply = requireApply(parsed, "export");
		if (!apply) {
			io.stdout(JSON.stringify({ command, apply: false, bundle }, null, 2));
			return 0;
		}
		writeJson(parsed.out, bundle);
		io.stdout(JSON.stringify({ command, apply: true, out: parsed.out }, null, 2));
		return 0;
	}

	throw new Error(`unknown-command:${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		const code = run(process.argv.slice(2), { stdout: (text) => process.stdout.write(`${text}\n`) });
		process.exit(code);
	} catch (error) {
		process.stdout.write(`${JSON.stringify({ status: "error", code: String(error.message).slice(0, 200) })}\n`);
		process.exit(2);
	}
}

export { run };
