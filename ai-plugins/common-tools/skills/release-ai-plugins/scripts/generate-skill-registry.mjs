import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const registryRelativePath = "ai-plugins/skill-registry.json";
const roots = [
	{ plugin: "common-tools", relative: "ai-plugins/common-tools/skills" },
	{ plugin: "dev-skills", relative: "ai-plugins/dev-skills/skills" },
	{
		plugin: "low-frequency-skill",
		relative: "ai-plugins/low-frequency-skill/skills",
	},
];

function fail(message) {
	console.error(`[ERROR] ${message}`);
	process.exit(1);
}

function info(message) {
	console.log(`[INFO]  ${message}`);
}

function ok(message) {
	console.log(`[OK]    ${message}`);
}

function compareAscii(a, b) {
	return a < b ? -1 : a > b ? 1 : 0;
}

function reportFirstDifference(actual, expected) {
	const actualLines = actual.split("\n");
	const expectedLines = expected.split("\n");
	const lineCount = Math.max(actualLines.length, expectedLines.length);

	for (let i = 0; i < lineCount; i += 1) {
		if (actualLines[i] === expectedLines[i]) continue;
		console.error(`[DIFF]  first mismatch at line ${i + 1}`);
		console.error(`[DIFF]  actual:   ${JSON.stringify(actualLines[i] ?? "<EOF>")}`);
		console.error(`[DIFF]  expected: ${JSON.stringify(expectedLines[i] ?? "<EOF>")}`);
		return;
	}
}

function findRepoRoot() {
	let current = dirname(fileURLToPath(import.meta.url));
	for (let i = 0; i < 15; i += 1) {
		if (existsSync(join(current, "pnpm-workspace.yaml")) || existsSync(join(current, ".git"))) {
			return current;
		}
		const parent = dirname(current);
		if (parent === current) break;
		current = parent;
	}
	fail("无法定位仓库根目录");
}

function unquoteYamlScalar(value) {
	let result = value.trim();
	if (result.length < 2) return result;

	const first = result[0];
	const last = result.at(-1);
	if (!((first === '"' && last === '"') || (first === "'" && last === "'"))) {
		return result;
	}

	result = result.slice(1, -1);
	return first === '"' ? result.replaceAll('\\"', '"') : result.replaceAll("''", "'");
}

function foldDescription(lines) {
	const parts = [];
	let sawBlank = false;

	for (const line of lines) {
		if (line.trim() === "") {
			sawBlank = true;
			continue;
		}
		if (sawBlank && parts.length > 0) parts.push("\n");
		parts.push(line.trim());
		sawBlank = false;
	}

	// Registry 既有契约会折叠所有 description block；空段落保留一个换行标记。
	return parts.join(" ").trim();
}

function parseFrontmatter(path) {
	const text = readFileSync(path, "utf8")
		.replace(/^\uFEFF/, "")
		.replace(/\r\n?/g, "\n");
	const lines = text.split("\n");

	if (lines.length < 3 || lines[0] !== "---") {
		fail(`SKILL.md 缺少 YAML frontmatter: ${path}`);
	}

	const close = lines.indexOf("---", 1);
	if (close < 0) fail(`SKILL.md frontmatter 未闭合: ${path}`);

	let name;
	let description;
	let version;
	let inMetadata = false;

	for (let i = 1; i < close; i += 1) {
		const line = lines[i];

		const nameMatch = line.match(/^name:\s*(.*?)\s*$/);
		if (nameMatch) {
			name = unquoteYamlScalar(nameMatch[1]);
			inMetadata = false;
			continue;
		}

		const descriptionMatch = line.match(/^description:\s*(.*?)\s*$/);
		if (descriptionMatch) {
			const raw = descriptionMatch[1];
			const blockMatch = raw.match(/^([>|])[+-]?\s*$/);
			if (!blockMatch) {
				description = unquoteYamlScalar(raw);
				inMetadata = false;
				continue;
			}

			const blockLines = [];
			i += 1;
			while (i < close && (/^\s{2,}/.test(lines[i]) || lines[i].trim() === "")) {
				blockLines.push(lines[i].replace(/^\s{2}/, ""));
				i += 1;
			}
			i -= 1;

			// 为避免迁移时改变已发布 registry 的 discovery 文本，>| 与 | 均沿用既有折叠语义。
			description = foldDescription(blockLines);
			inMetadata = false;
			continue;
		}

		if (/^metadata:\s*$/.test(line)) {
			inMetadata = true;
			continue;
		}

		if (inMetadata) {
			const versionMatch = line.match(/^\s+version:\s*"?([^"\s]+)"?\s*$/);
			if (versionMatch) {
				version = versionMatch[1];
				continue;
			}
			if (line.trim() !== "" && !/^\s+/.test(line)) inMetadata = false;
		}
	}

	if (!name?.trim()) fail(`Skill 缺少 name: ${path}`);
	if (!description?.trim()) fail(`Skill 缺少 description: ${path}`);
	if (!version?.trim()) fail(`Skill 缺少 metadata.version: ${path}`);
	if (!/^\d+\.\d+\.\d+$/.test(version)) {
		fail(`Skill metadata.version 非法: ${path} = ${version}`);
	}

	return { name, description, version };
}

function collectSkills(repoRoot) {
	const entries = [];
	const seen = new Map();

	for (const rootInfo of roots) {
		const rootPath = join(repoRoot, rootInfo.relative);
		if (!existsSync(rootPath)) fail(`Skill root 不存在: ${rootInfo.relative}`);

		const directories = readdirSync(rootPath, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.sort((a, b) => compareAscii(a.name, b.name));

		for (const directory of directories) {
			const id = directory.name;
			if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
				fail(`Skill 目录名非法: ${rootInfo.relative}/${id}`);
			}
			if (seen.has(id)) {
				fail(`Duplicate skill id ${id} found in ${seen.get(id)} and ${rootInfo.plugin}.`);
			}

			const skillPath = join(rootPath, id, "SKILL.md");
			if (!existsSync(skillPath)) fail(`Skill 缺少 SKILL.md: ${skillPath}`);

			const frontmatter = parseFrontmatter(skillPath);
			const entry = `${rootInfo.relative}/${id}/SKILL.md`;
			if (!existsSync(join(repoRoot, ...entry.split("/")))) {
				fail(`Registry entry 不存在: ${entry}`);
			}

			seen.set(id, rootInfo.plugin);
			entries.push({
				id,
				plugin: rootInfo.plugin,
				name: frontmatter.name,
				description: frontmatter.description,
				version: frontmatter.version,
				entry,
			});
		}
	}

	return entries.sort((a, b) => compareAscii(a.id, b.id));
}

function canonicalJson(value) {
	// JSON.stringify 的缩进与转义是唯一 canonical authority；显式追加一个 LF。
	return `${JSON.stringify(value, null, 2)}\n`;
}

const cliArgs = process.argv.slice(2);
for (const arg of cliArgs) {
	if (arg !== "--check" && arg !== "--apply") fail(`未知参数: ${arg}`);
}

const check = cliArgs.includes("--check");
const apply = cliArgs.includes("--apply");
if (check && apply) fail("不能同时指定 --check 与 --apply");

const repoRoot = findRepoRoot();
const registryPath = join(repoRoot, registryRelativePath);
const skills = collectSkills(repoRoot);
const registry = {
	schemaVersion: "1",
	roots: roots.map((item) => item.relative),
	skills,
};
const expected = canonicalJson(registry);

for (const rootInfo of roots) {
	const count = skills.filter((entry) => entry.plugin === rootInfo.plugin).length;
	info(`${rootInfo.plugin} skills: ${count}`);
}
info(`total skills: ${skills.length}`);

if (apply) {
	writeFileSync(registryPath, expected, "utf8");
	const actual = readFileSync(registryPath, "utf8");
	if (actual !== expected) {
		reportFirstDifference(actual, expected);
		fail("写入后的 skill-registry.json 与 canonical output 不一致");
	}
	ok("skill-registry.json 已生成（Node JSON.stringify / UTF-8 / LF）");
	process.exit(0);
}

if (!existsSync(registryPath)) {
	fail(
		"skill-registry.json 不存在。Run: node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply",
	);
}

const actual = readFileSync(registryPath, "utf8");
if (actual !== expected) {
	reportFirstDifference(actual, expected);
	fail(
		"skill-registry.json 已过期或不是 Node canonical output。Run: node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply",
	);
}

ok("skill-registry.json is current");
