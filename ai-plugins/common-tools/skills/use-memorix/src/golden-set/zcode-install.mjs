import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const LAUNCHER_MARKER = "// use-memorix:zcode-retrieval-launcher:v1";
export const ZCODE_APPROVAL_TOKEN = "INSTALL_ZCODE_RETRIEVAL_CAPTURE";
export const GITIGNORE_LINE = ".memorix/golden-set/.local/";
const CONFIG_RELATIVE = ".zcode/config.json";
const LAUNCHER_RELATIVE = ".zcode/hooks/use-memorix-retrieval.mjs";

const templateRoot = fileURLToPath(new URL("../../templates/zcode/", import.meta.url));

export function canonicalLauncher() {
	return readFileSync(join(templateRoot, "retrieval-capture-launcher.mjs"), "utf8");
}

function canonicalFragment() {
	return JSON.parse(readFileSync(join(templateRoot, "config.fragment.json"), "utf8"));
}

function usesLauncher(entry) {
	return JSON.stringify(entry ?? "").includes(".zcode/hooks/use-memorix-retrieval.mjs");
}

function mergeConfig(config) {
	const next = config && typeof config === "object" && !Array.isArray(config) ? structuredClone(config) : {};
	next.hooks = next.hooks && typeof next.hooks === "object" ? next.hooks : {};
	if (next.hooks.enabled === undefined) next.hooks.enabled = true;
	next.hooks.events = next.hooks.events && typeof next.hooks.events === "object" ? next.hooks.events : {};
	const existing = Array.isArray(next.hooks.events.PostToolUse) ? next.hooks.events.PostToolUse : [];
	const already = existing.some((entry) => usesLauncher(entry));
	const merged = already ? existing : [...existing, ...canonicalFragment().hooks.events.PostToolUse];
	next.hooks.events.PostToolUse = merged;
	const changed = JSON.stringify(next) !== JSON.stringify(config);
	return { value: next, changed };
}

function planGitignore(projectRoot, writes) {
	const path = join(projectRoot, ".gitignore");
	const before = existsSync(path) ? readFileSync(path, "utf8") : null;
	if (before !== null && before.split(/\r?\n/).includes(GITIGNORE_LINE)) return;
	const prefix = before === null || before.length === 0 ? "" : before.endsWith("\n") ? before : `${before}\n`;
	writes.push({ path, content: `${prefix}${GITIGNORE_LINE}\n`, before });
}

/**
 * 规划 ZCode 检索捕获安装：只合并 PostToolUse 条目，保留全部未知字段。
 *
 * - 无 launcher：首次安装，需 approval token。
 * - 有 marker：只允许无条件替换该 launcher；其他文件仍需按计划写入。
 * - 无 marker：永不覆盖，blocked。
 */
export function planZCodeInstall(projectRoot) {
	const writes = [];
	const blocked = [];
	const configPath = join(projectRoot, CONFIG_RELATIVE);
	const launcherPath = join(projectRoot, LAUNCHER_RELATIVE);
	const configBefore = existsSync(configPath) ? readFileSync(configPath, "utf8") : null;
	const launcherBefore = existsSync(launcherPath) ? readFileSync(launcherPath, "utf8") : null;

	let config = {};
	if (configBefore !== null) {
		try {
			config = JSON.parse(configBefore);
		} catch {
			blocked.push("config-invalid-json");
		}
	}
	if (launcherBefore !== null && !launcherBefore.includes(LAUNCHER_MARKER)) {
		blocked.push("launcher-marker-missing");
	}
	if (blocked.length) return { writes: [], blocked, launcherOnly: false, requiresApproval: true };

	const merged = mergeConfig(config);
	if (merged.changed) {
		writes.push({ path: configPath, content: `${JSON.stringify(merged.value, null, "\t")}\n`, before: configBefore });
	}
	writes.push({ path: launcherPath, content: canonicalLauncher(), before: launcherBefore });
	planGitignore(projectRoot, writes);

	const launcherOnly = writes.length === 1 && writes[0].path === launcherPath;
	return { writes, blocked, launcherOnly, requiresApproval: launcherBefore === null };
}

export function applyZCodeInstall(plan, approvalToken) {
	if (plan.blocked.length) throw new Error(`zcode-install-blocked: ${plan.blocked.join(",")}`);
	if (plan.requiresApproval && approvalToken !== ZCODE_APPROVAL_TOKEN) {
		throw new Error("zcode-install-requires-approval-token");
	}
	for (const write of plan.writes) {
		mkdirSync(dirname(write.path), { recursive: true });
		writeFileSync(write.path, write.content, "utf8");
	}
}
