import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const supportedExtensions = new Set([
	".js",
	".jsx",
	".ts",
	".tsx",
	".mts",
	".json",
	".css",
	".scss",
	".md",
	".yml",
	".yaml",
	".html",
]);

const prettierArgs = [
	"exec",
	"prettier",
	"--experimental-cli",
	"--write",
	"--no-parallel",
	"--ignore-path",
	"./.config/.prettierignore",
	"--ignore-path",
	".gitignore",
];

const maxChunkChars = 100_000;
const fileListName = "cloud-pr-prettier-files.zlist";

function requireEnvironment(name) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`缺少必要环境变量：${name}`);
	}
	return value;
}

function getPullRequestFiles(baseSha) {
	const output = execFileSync(
		"git",
		["diff", "--name-only", "-z", "--diff-filter=ACMR", `${baseSha}...HEAD`],
		{ encoding: "utf8" },
	);

	return output.split("\0").filter(Boolean);
}

function isPrettierCandidate(file) {
	const normalized = file.replaceAll("\\", "/");
	const segments = normalized.split("/");

	return supportedExtensions.has(extname(normalized)) && !segments.includes("snippets");
}

function selectPrettierFiles(prFiles) {
	return prFiles.filter(isPrettierCandidate);
}

function writePrettierFileList(runnerTemp, prettierFiles) {
	const fileListPath = join(runnerTemp, fileListName);
	const content = prettierFiles.map((file) => `${file}\0`).join("");
	writeFileSync(fileListPath, content, "utf8");
	return fileListPath;
}

function runPrettierChunk(files) {
	if (files.length === 0) return;

	const result = spawnSync("pnpm", [...prettierArgs, ...files], {
		stdio: "inherit",
	});

	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}

function formatPrettierFiles(prettierFiles) {
	let chunk = [];
	let chunkChars = 0;

	for (const file of prettierFiles) {
		const argument = `./${file}`;
		const argumentChars = Buffer.byteLength(argument) + 1;

		if (chunk.length > 0 && chunkChars + argumentChars > maxChunkChars) {
			runPrettierChunk(chunk);
			chunk = [];
			chunkChars = 0;
		}

		chunk.push(argument);
		chunkChars += argumentChars;
	}

	runPrettierChunk(chunk);
}

function printSummary(prFiles, prettierFiles, fileListPath) {
	console.log(`PR ACMR 文件数：${prFiles.length}`);
	console.log(`Prettier 精准候选文件数：${prettierFiles.length}`);
	console.log(`候选文件列表：${fileListPath}`);

	for (const file of prettierFiles) {
		console.log(`- ${file}`);
	}
}

function main() {
	const baseSha = requireEnvironment("BASE_SHA");
	const runnerTemp = requireEnvironment("RUNNER_TEMP");

	const prFiles = getPullRequestFiles(baseSha);
	const prettierFiles = selectPrettierFiles(prFiles);
	const fileListPath = writePrettierFileList(runnerTemp, prettierFiles);

	printSummary(prFiles, prettierFiles, fileListPath);
	formatPrettierFiles(prettierFiles);
}

main();
