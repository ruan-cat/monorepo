#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { ZCODE_APPROVAL_TOKEN, applyZCodeInstall, planZCodeInstall } from "../src/golden-set/zcode-install.mjs";

const USAGE = `Usage: install-zcode-hook.mjs --project-root <path> [--apply --approval-token ${ZCODE_APPROVAL_TOKEN}]

规划或执行 ZCode 检索候选捕获安装：
  - 只向 .zcode/config.json 的 hooks.events.PostToolUse 追加一个条目；
  - 写入项目 tracked 薄启动器 .zcode/hooks/use-memorix-retrieval.mjs；
  - 确保 .gitignore 含 .memorix/golden-set/.local/。

默认只输出 preview，不写文件。已有带 canonical marker 的启动器可无条件升级；无 marker 的文件永不覆盖。
本命令不安装 Memorix、不修改全局配置、不调用 shell。`;

function parse(args) {
	const parsed = { apply: false };
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
		if (!arg.startsWith("--")) throw new Error(`unknown-argument:${arg}`);
		const value = args[index + 1];
		if (value === undefined || value.startsWith("--")) throw new Error(`missing-value:${arg}`);
		parsed[arg.slice(2)] = value;
		index += 1;
	}
	return parsed;
}

export function runInstallZCodeHook(argv, io) {
	const parsed = parse(argv);
	if (parsed.help) {
		io.stdout(USAGE);
		return 0;
	}
	if (!parsed["project-root"]) {
		io.stdout(JSON.stringify({ status: "error", code: "missing-project-root" }));
		return 2;
	}
	const plan = planZCodeInstall(parsed["project-root"]);
	const preview = {
		command: "install-zcode-hook",
		apply: false,
		blocked: plan.blocked,
		launcherOnly: plan.launcherOnly,
		requiresApproval: plan.requiresApproval,
		writes: plan.writes.map((write) => ({ path: write.path, existed: write.before !== null })),
	};
	if (!parsed.apply) {
		io.stdout(JSON.stringify(preview, null, 2));
		return 0;
	}
	if (plan.blocked.length) {
		io.stdout(JSON.stringify({ status: "error", code: `blocked:${plan.blocked.join(",")}` }));
		return 2;
	}
	applyZCodeInstall(plan, parsed["approval-token"]);
	io.stdout(JSON.stringify({ ...preview, apply: true }, null, 2));
	return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		const code = runInstallZCodeHook(process.argv.slice(2), {
			stdout: (text) => process.stdout.write(`${text}\n`),
		});
		process.exit(code);
	} catch (error) {
		process.stdout.write(`${JSON.stringify({ status: "error", code: String(error.message).slice(0, 200) })}\n`);
		process.exit(2);
	}
}
