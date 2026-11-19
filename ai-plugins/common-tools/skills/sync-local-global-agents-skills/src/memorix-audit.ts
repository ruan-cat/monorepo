import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const OFFICIAL_MEMORIX_SKILLS = [
	"memorix-git-memory",
	"memorix-memory",
	"memorix-mini-skills",
	"memorix-orchestrate",
	"memorix-reasoning",
	"memorix-sessions",
	"memorix-troubleshooting",
] as const;

export interface MemorixSkillAuditResult {
	skill: (typeof OFFICIAL_MEMORIX_SKILLS)[number];
	path: string;
	status: "present" | "missing" | "invalid";
	reason?: string;
}

function readFrontmatterName(skillFile: string): string | undefined {
	const text = readFileSync(skillFile, "utf8");
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return undefined;
	const nameLine = match[1].match(/^name:\s*"?([^"\r\n]+)"?\s*$/m);
	return nameLine?.[1]?.trim();
}

/**
 * 只读审计官方七个 Memorix skills。
 *
 * 只允许 exists / stat / 读取 SKILL.md frontmatter name。
 * 不联网、不调用 CLI、不复制、不改名、不删除、不备份、不写 metadata、不比较内容。
 */
export function auditOfficialMemorixSkills(skillsRoot?: string): MemorixSkillAuditResult[] {
	const root = skillsRoot ?? path.join(homedir(), ".agents", "skills");
	return OFFICIAL_MEMORIX_SKILLS.map((skill) => {
		const skillDir = path.join(root, skill);
		const skillFile = path.join(skillDir, "SKILL.md");
		if (!existsSync(skillDir)) return { skill, path: skillFile, status: "missing", reason: "directory-missing" };
		try {
			if (!statSync(skillDir).isDirectory()) {
				return { skill, path: skillFile, status: "invalid", reason: "not-a-directory" };
			}
		} catch {
			return { skill, path: skillFile, status: "invalid", reason: "stat-failed" };
		}
		if (!existsSync(skillFile)) return { skill, path: skillFile, status: "invalid", reason: "skill-md-missing" };
		let declared: string | undefined;
		try {
			declared = readFrontmatterName(skillFile);
		} catch {
			return { skill, path: skillFile, status: "invalid", reason: "skill-md-unreadable" };
		}
		if (!declared) return { skill, path: skillFile, status: "invalid", reason: "frontmatter-name-missing" };
		if (declared !== skill) {
			return { skill, path: skillFile, status: "invalid", reason: `frontmatter-name-mismatch:${declared}` };
		}
		return { skill, path: skillFile, status: "present" };
	});
}

export function summarizeMemorixAudit(results: MemorixSkillAuditResult[]): string {
	const counts = { present: 0, missing: 0, invalid: 0 };
	for (const result of results) counts[result.status] += 1;
	return `${counts.present} present, ${counts.missing} missing, ${counts.invalid} invalid`;
}
