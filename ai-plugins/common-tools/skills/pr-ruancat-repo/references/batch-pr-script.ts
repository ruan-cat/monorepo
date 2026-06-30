#!/usr/bin/env npx tsx
/**
 * batch-pr.ts — 跨仓库批量 PR 自动化脚本
 *
 * 由 pr-ruancat-repo 技能根据具体任务自动生成，用于替代 AI 逐仓库调用 gh CLI / GitHub MCP。
 * 建议在头部注释中补充本次任务的简要说明（例如：统一升级 setup-node 至 Node.js 24.18.0）。
 * 执行前请确保：
 *   1. Node.js >= 18，且已安装 tsx（`npm i -g tsx`）或使用 npx tsx
 *   2. gh CLI 已安装并认证（`gh auth status`）
 *   3. 目标仓库已克隆到本地，且可正常 push
 *
 * **零外部依赖**：使用 Node.js 22 内置的 fs.globSync，无需任何 npm 包。
 * 仅需 npx tsx 运行。
 *
 * 用法：
 *   npx tsx batch-pr.ts [--workdir <path>] [--dry-run] [--parallel <N>]
 *   npx tsx batch-pr.ts merge [--workdir <path>] [--admin] [--parallel <N>]
 *
 * --workdir <path>: 工作目录，存放 pr-config.json、pr-body.md、commit-message.txt 等
 *                   默认：脚本自身所在目录（推荐将本脚本与配置放在同一目录）
 * --dry-run:        仅打印将要执行的操作，不实际修改任何文件
 * --parallel <N>:   同时处理 N 个仓库（默认 1，即串行）
 * merge:            合并已创建的 PR（rebase 方式），并清理远程/本地分支
 * --admin:          merge 模式下，强制合并未通过检查的 PR
 *
 * 文件变换支持：
 *   工作目录下的 pr-transform.json（可选）指定 inline 搜索替换规则，
 *   替代仅整文件拷贝的有限能力。规则优先于 changes/ 目录执行。
 *
 * Per-repo 差异化：
 *   工作目录下可选存在 per-repo 覆盖文件，优先级高于通用文件：
 *     commit-message--<repo_safe>.txt  覆盖该仓库的 commit message
 *     pr-body--<repo_safe>.md           覆盖该仓库的 PR 正文
 *     changes/<repo_safe>/              覆盖该仓库的文件变更
 *   <repo_safe> = owner__name（repo 中的 / 替换为 __）
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { fileURLToPath } from "node:url";

/* ============================================================
 * 类型定义
 * ============================================================ */
interface RepoConfig {
	/** GitHub repo 标识，格式 owner/name */
	repo: string;
	/** 本地仓库绝对路径 */
	localPath: string;
	/** 来源分支名（所有仓库统一） */
	sourceBranch: string;
}

interface PRConfig {
	repos: RepoConfig[];
	/** PR 标题 */
	prTitle: string;
	/** 来源分支名（全局统一，也在 RepoConfig 中引用） */
	sourceBranch: string;
}

/** 搜索替换转换规则 */
interface TransformationRule {
	/** 人类可读的描述 */
	description: string;
	/** 匹配文件的 glob 模式（相对于仓库根目录） */
	glob: string;
	/** 搜索正则（不含 / 定界符，自动编译为 RegExp） */
	search: string;
	/** 替换字符串（支持 $1 等捕获组引用） */
	replace: string;
}

interface TransformConfig {
	transformations: TransformationRule[];
}

/** 被修改文件记录 */
interface FileChangeRecord {
	file: string;
	transformDescription: string;
	searchCount: number;
	replacedCount: number;
}

interface RepoResult {
	repo: string;
	localPath: string;
	status: "success" | "skipped" | "failed";
	targetBranch: string | null;
	prUrl: string | null;
	reason: string | null;
	changes: FileChangeRecord[];
}

interface MergeResult {
	repo: string;
	localPath: string;
	status: "success" | "skipped" | "failed";
	targetBranch: string | null;
	prNumber: number | null;
	prUrl: string | null;
	branchDeleted: boolean;
	reason: string | null;
}

/* ============================================================
 * 工具函数
 * ============================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function exec(command: string, cwd: string, dryRun = false): { stdout: string; stderr: string } {
	if (dryRun) {
		console.log(`  [dry-run] cd ${cwd} && ${command}`);
		return { stdout: "", stderr: "" };
	}
	try {
		const result = execSync(command, {
			cwd,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		return { stdout: String(result ?? "").trim(), stderr: "" };
	} catch (error: unknown) {
		const execError = error as {
			stdout?: Buffer | string;
			stderr?: Buffer | string;
			message?: string;
		};
		return {
			stdout: (execError.stdout ? String(execError.stdout) : "").trim(),
			stderr: (execError.stderr ? String(execError.stderr) : String(execError.message ?? "")).trim(),
		};
	}
}

function runOrExit(command: string, cwd: string, dryRun = false): { stdout: string; stderr: string } {
	const result = exec(command, cwd, dryRun);
	if (result.stderr && !dryRun) {
		console.error(`  ⚠  stderr: ${result.stderr}`);
	}
	return result;
}

/**
 * 探测目标分支：优先 dev → main → master
 */
function detectTargetBranch(localPath: string, dryRun = false): string | null {
	for (const candidate of ["dev", "main", "master"]) {
		const { stdout } = exec(`git rev-parse --verify origin/${candidate}`, localPath, dryRun);
		if (stdout && stdout.length > 0) {
			return candidate;
		}
	}
	return null;
}

/**
 * 检查 gh CLI 是否已认证
 */
function checkGhAuth(): boolean {
	try {
		execSync("gh auth status", { encoding: "utf-8", stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

/* ============================================================
 * glob 匹配器（使用 Node.js 22 内置 fs.globSync）
 * ============================================================ */

/**
 * 使用 Node.js 内置 globSync 匹配文件
 * 支持：* ** ? {a,b} [abc] 等标准 glob 语法
 * 返回相对于 baseDir 的路径数组
 */
function resolveGlob(pattern: string, baseDir: string): string[] {
	try {
		const result = fs.globSync(pattern, { cwd: baseDir });
		return result ?? [];
	} catch {
		return [];
	}
}

/* ============================================================
 * 文件变换模块（inline 搜索替换）
 * ============================================================ */

/**
 * 加载 pr-transform.json 文件
 */
function loadTransformations(workdir: string): TransformConfig | null {
	const transformPath = path.join(workdir, "pr-transform.json");
	if (!fs.existsSync(transformPath)) {
		return null;
	}
	return JSON.parse(fs.readFileSync(transformPath, "utf-8")) as TransformConfig;
}

/**
 * 对指定仓库应用转换规则
 * 返回被修改的文件记录列表
 */
function applyTransformations(
	transformCfg: TransformConfig,
	localPath: string,
	repo: string,
	dryRun: boolean,
): FileChangeRecord[] {
	const changes: FileChangeRecord[] = [];

	console.log(`  🔧 应用转换规则 (${transformCfg.transformations.length} 条)...`);

	for (const rule of transformCfg.transformations) {
		let matchedFiles: string[];
		try {
			matchedFiles = resolveGlob(rule.glob, localPath);
		} catch {
			console.log(`    ⚠  glob 匹配失败: ${rule.glob}，跳过此规则`);
			continue;
		}

		if (matchedFiles.length === 0) {
			console.log(`    ${rule.description} → 未匹配到文件 (glob: ${rule.glob})`);
			continue;
		}

		// 编译正则
		let regex: RegExp;
		try {
			regex = new RegExp(rule.search, "g");
		} catch {
			console.log(`    ⚠ 正则编译失败: /${rule.search}/，跳过此规则`);
			continue;
		}

		for (const rawFile of matchedFiles) {
			const file = rawFile.replace(/\\/g, "/");
			const filePath = path.join(localPath, file);

			if (!fs.existsSync(filePath)) {
				continue;
			}

			const originalContent = fs.readFileSync(filePath, "utf-8");
			const originalMatches = originalContent.match(regex);
			const searchCount = originalMatches ? originalMatches.length : 0;

			if (searchCount === 0) {
				continue; // 无匹配，跳过该文件
			}

			if (dryRun) {
				console.log(`    [dry-run] ${file}: 匹配 ${searchCount} 处`);
				changes.push({
					file,
					transformDescription: rule.description,
					searchCount,
					replacedCount: searchCount,
				});
				continue;
			}

			const newContent = originalContent.replace(regex, rule.replace);
			fs.writeFileSync(filePath, newContent, "utf-8");
			console.log(`    ✅ ${file}: 替换 ${searchCount} 处 — ${rule.description}`);

			changes.push({
				file,
				transformDescription: rule.description,
				searchCount,
				replacedCount: searchCount,
			});
		}
	}

	return changes;
}

/* ============================================================
 * 工作目录与 per-repo 差异化
 * ============================================================ */

/**
 * 将 repo 标识转为安全的文件名字段
 * "ruan-cat/notes" → "ruan-cat__notes"
 */
function repoToSafeName(repo: string): string {
	return repo.replace("/", "__");
}

/**
 * 获取某个仓库的 commit message（优先 per-repo 覆盖）
 */
function resolveCommitMessage(workdir: string, repo: string, defaultMessage: string): string {
	const overridePath = path.join(workdir, `commit-message--${repoToSafeName(repo)}.txt`);
	if (fs.existsSync(overridePath)) {
		const content = fs.readFileSync(overridePath, "utf-8").trim();
		if (content) {
			console.log(`  📄 使用差异化 commit message: commit-message--${repoToSafeName(repo)}.txt`);
			return content;
		}
	}
	return defaultMessage;
}

/**
 * 获取某个仓库的 PR body（优先 per-repo 覆盖）
 */
function resolvePrBody(workdir: string, repo: string, defaultBody: string): string {
	const overridePath = path.join(workdir, `pr-body--${repoToSafeName(repo)}.md`);
	if (fs.existsSync(overridePath)) {
		const content = fs.readFileSync(overridePath, "utf-8").trim();
		if (content) {
			console.log(`  📄 使用差异化 PR body: pr-body--${repoToSafeName(repo)}.md`);
			return content;
		}
	}
	return defaultBody;
}

/**
 * 获取某个仓库的 changes 目录路径（优先 per-repo）
 */
function resolveChangesDir(workdir: string, repo: string): string | null {
	// 优先 per-repo changes
	const perRepoDir = path.join(workdir, "changes", repoToSafeName(repo));
	if (fs.existsSync(perRepoDir)) {
		return perRepoDir;
	}
	// 回退到通用 changes（旧命名格式）
	const legacyDir = path.join(workdir, "changes", repo.replace("/", "__"));
	if (fs.existsSync(legacyDir)) {
		return legacyDir;
	}
	return null;
}

/* ============================================================
 * 主逻辑
 * ============================================================ */

async function main(): Promise<void> {
	// ---- 解析命令行参数 ----
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const workdirIndex = args.indexOf("--workdir");
	// 默认使用脚本自身所在目录作为工作目录，确保 cd 到任意位置执行都不会读错配置
	const workdir: string =
		workdirIndex >= 0 && workdirIndex + 1 < args.length
			? path.resolve(args[workdirIndex + 1])
			: __dirname;

	const parallelArg = args.find((a) => a.startsWith("--parallel="));
	const parallelCount = parallelArg ? Number.parseInt(parallelArg.split("=")[1], 10) : 1;
	const mergeMode = args[0] === "merge";
	const useAdmin = args.includes("--admin");

	// ---- 读取配置文件 ----
	const configPath = path.join(workdir, "pr-config.json");
	if (!fs.existsSync(configPath)) {
		console.error(`❌ 未找到配置文件: ${configPath}`);
		console.error("   请确保工作目录下包含 pr-config.json、pr-body.md、commit-message.txt");
		console.error(`   当前工作目录: ${workdir}`);
		console.error("   可通过 --workdir 参数指定");
		process.exit(1);
	}

	const config: PRConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

	// ---- 读取转换规则（可选） ----
	const transformCfg = loadTransformations(workdir);
	if (transformCfg) {
		console.log(`  📋 加载 ${transformCfg.transformations.length} 条转换规则`);
	}

	// ---- 读取 PR body（默认） ----
	const bodyPath = path.join(workdir, "pr-body.md");
	const defaultPrBody = fs.existsSync(bodyPath) ? fs.readFileSync(bodyPath, "utf-8").trim() : "";

	// ---- 读取 commit message（默认） ----
	const commitMsgPath = path.join(workdir, "commit-message.txt");
	const defaultCommitMessage = fs.existsSync(commitMsgPath) ? fs.readFileSync(commitMsgPath, "utf-8").trim() : "";

	console.log("=".repeat(60));
	console.log(
		mergeMode
			? "  批量 PR 合并脚本"
			: "  批量 PR 执行脚本",
	);
	console.log(`  PR 标题: ${config.prTitle}`);
	console.log(`  来源分支: ${config.sourceBranch}`);
	console.log(`  仓库数: ${config.repos.length}`);
	console.log(`  工作目录: ${workdir}`);
	if (mergeMode) {
		console.log(`  模式: 合并 PR + 清理分支${useAdmin ? "（--admin 强制）" : ""}`);
	} else {
		console.log(`  模式: ${dryRun ? "DRY-RUN（仅预览）" : "实际执行"}`);
	}
	console.log("=".repeat(60));
	console.log();

	// ---- 列出 per-repo 差异化文件 ----
	const overrideFiles: string[] = [];
	for (const repo of config.repos) {
		const safe = repoToSafeName(repo.repo);
		if (fs.existsSync(path.join(workdir, `commit-message--${safe}.txt`))) {
			overrideFiles.push(`commit-message--${safe}.txt`);
		}
		if (fs.existsSync(path.join(workdir, `pr-body--${safe}.md`))) {
			overrideFiles.push(`pr-body--${safe}.md`);
		}
	}
	if (overrideFiles.length > 0) {
		console.log(`  📋 发现 ${overrideFiles.length} 个 per-repo 差异化文件:`);
		for (const f of overrideFiles) {
			console.log(`     ${f}`);
		}
		console.log();
	}

	// ---- 环境检查 ----
	if (!dryRun) {
		console.log("🔍 环境检查...");
		const ghOk = checkGhAuth();
		if (!ghOk) {
			console.error("❌ gh CLI 未认证，请运行: gh auth login");
			console.error("   或设置 GITHUB_TOKEN 环境变量");
			process.exit(1);
		}
		console.log("  ✅ gh CLI 已认证");
		console.log();
	}

	// ---- 逐仓库执行 ----
	if (mergeMode) {
		const mergeResults: MergeResult[] = [];

		const batches: RepoConfig[][] = [];
		for (let i = 0; i < config.repos.length; i += parallelCount) {
			batches.push(config.repos.slice(i, i + parallelCount));
		}

		for (const batch of batches) {
			const batchPromises = batch.map(async (repoCfg) => mergeRepo(repoCfg, useAdmin, dryRun));
			const batchResults = await Promise.all(batchPromises);
			mergeResults.push(...batchResults);
		}

		generateMergeSummary(config, mergeResults, workdir);

		const failedCount = mergeResults.filter((r) => r.status === "failed").length;
		if (failedCount > 0) {
			console.error(`\n❌ ${failedCount} 个仓库合并失败，请检查 ${path.join(workdir, "merge-summary.md")}`);
			process.exit(1);
		}
		console.log("\n✅ 全部仓库合并成功！");
		return;
	}

	const results: RepoResult[] = [];

	const batches: RepoConfig[][] = [];
	for (let i = 0; i < config.repos.length; i += parallelCount) {
		batches.push(config.repos.slice(i, i + parallelCount));
	}

	for (const batch of batches) {
		const batchPromises = batch.map(async (repoCfg) => {
			// 每个仓库解析自己的差异化 commit/body
			const commitMessage = resolveCommitMessage(workdir, repoCfg.repo, defaultCommitMessage);
			const prBody = resolvePrBody(workdir, repoCfg.repo, defaultPrBody);
			return processRepo(repoCfg, config, prBody, commitMessage, dryRun, transformCfg, workdir);
		});

		// 同一批仓库真正并发执行
		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);
	}

	// ---- 生成汇总报告 ----
	generateSummary(config, results, dryRun, workdir);

	// ---- 判断最终退出码 ----
	const failedCount = results.filter((r) => r.status === "failed").length;
	if (failedCount > 0) {
		console.error(`\n❌ ${failedCount} 个仓库执行失败，请检查 ${path.join(workdir, "execution-summary.md")}`);
		process.exit(1);
	}
	console.log("\n✅ 全部仓库执行成功！");
}

async function processRepo(
	repoCfg: RepoConfig,
	config: PRConfig,
	prBody: string,
	commitMessage: string,
	dryRun: boolean,
	transformCfg: TransformConfig | null,
	workdir: string,
): Promise<RepoResult> {
	const { repo, localPath, sourceBranch } = repoCfg;
	const repoChanges: FileChangeRecord[] = [];
	console.log(`\n── ${repo} ──`);
	console.log(`  本地路径: ${localPath}`);

	if (!fs.existsSync(localPath)) {
		console.log(`  ⏭  跳过：本地路径不存在`);
		return {
			repo,
			localPath,
			status: "skipped",
			targetBranch: null,
			prUrl: null,
			reason: "本地路径不存在",
			changes: [],
		};
	}

	// 1. 探测目标分支（只读操作，dry-run 下也实际执行）
	console.log(`  🔍 探测目标分支...`);
	const targetBranch = detectTargetBranch(localPath, false);
	if (!targetBranch) {
		console.log(`  ⏭  跳过：无法确定目标分支（dev/main/master 均不存在）`);
		return {
			repo,
			localPath,
			status: "skipped",
			targetBranch: null,
			prUrl: null,
			reason: "无法确定目标分支",
			changes: [],
		};
	}
	console.log(`  目标分支: ${targetBranch}`);

	// 1.5 确保回到目标分支（避免上次失败遗留停留在来源分支）
	const currentBranch = exec("git branch --show-current", localPath, false).stdout.trim();
	if (currentBranch !== targetBranch) {
		console.log(`  🔄 当前分支为 ${currentBranch || "(detached)"}，切回 ${targetBranch}`);
		runOrExit(`git checkout "${targetBranch}"`, localPath, dryRun);
	}

	// 1.6 清理本次任务遗留的未提交改动（仅当未提交文件全部被转换规则覆盖时）
	const { stdout: preStatus } = exec("git status --porcelain", localPath, false);
	if (preStatus && transformCfg && transformCfg.transformations.length > 0) {
		const dirtyFiles = preStatus
			.split("\n")
			.map((line) => line.slice(3).trim())
			.filter(Boolean);

		const allRuleFiles = new Set<string>();
		for (const rule of transformCfg.transformations) {
			for (const f of resolveGlob(rule.glob, localPath)) {
				allRuleFiles.add(f.replace(/\\/g, "/"));
			}
		}

		const allCovered = dirtyFiles.every((f) => allRuleFiles.has(f.replace(/\\/g, "/")));
		if (allCovered) {
			console.log(`  🧹 清理 ${dirtyFiles.length} 个任务相关残留改动`);
			runOrExit("git reset --hard HEAD", localPath, dryRun);
		}
	}

	// 2. 检查工作树是否干净（只读操作，dry-run 下也实际执行）
	const { stdout: statusOut } = exec("git status --porcelain", localPath, false);
	if (statusOut) {
		console.log(`  ⏭  跳过：工作树不干净，请先提交或 stash 本地改动`);
		return {
			repo,
			localPath,
			status: "skipped",
			targetBranch,
			prUrl: null,
			reason: "工作树不干净，存在未提交改动",
			changes: [],
		};
	}

	// 3. 检查是否已存在同源分支的开放 PR（只读操作，dry-run 下也实际执行）
	const { stdout: existingPr } = exec(
		`gh pr list --head "${sourceBranch}" --base "${targetBranch}" --state open --json url --jq ".[0].url"`,
		localPath,
		false,
	);
	if (existingPr && existingPr.startsWith("https://")) {
		console.log(`  ⏭  跳过：来源分支 ${sourceBranch} 到 ${targetBranch} 已存在开放 PR`);
		return {
			repo,
			localPath,
			status: "skipped",
			targetBranch,
			prUrl: existingPr,
			reason: "已有开放 PR",
			changes: [],
		};
	}

	// 4. 从远程更新本地
	console.log(`  📡 获取远程更新...`);
	runOrExit("git fetch origin", localPath, dryRun);

	// 5. 清理并创建来源分支
	console.log(`  🌿 创建来源分支: ${sourceBranch}`);
	const localBranchExists = exec(`git rev-parse --verify "${sourceBranch}"`, localPath, false).stdout.length > 0;
	if (localBranchExists) {
		console.log(`  🧹 删除已存在的本地来源分支`);
		runOrExit(`git branch -D "${sourceBranch}"`, localPath, dryRun);
	}
	runOrExit(`git checkout -b "${sourceBranch}" "origin/${targetBranch}"`, localPath, dryRun);

	// 6a. 执行 inline 转换规则（优先于整文件拷贝）
	if (transformCfg) {
		const transformChanges = applyTransformations(transformCfg, localPath, repo, dryRun);
		repoChanges.push(...transformChanges);
	}

	// 6b. 执行 per-repo 差异化文件拷贝
	const resolvedChangesDir = resolveChangesDir(workdir, repo);
	if (!dryRun && resolvedChangesDir) {
		console.log(`  📝 应用整文件拷贝...`);
		fs.cpSync(resolvedChangesDir, localPath, { recursive: true, force: true });
	} else if (dryRun && resolvedChangesDir) {
		console.log(`  [dry-run] 将拷贝 ${resolvedChangesDir} → ${localPath}`);
	}

	// 7. git add + commit
	console.log(`  💾 提交改动...`);
	runOrExit("git add .", localPath, dryRun);

	// 使用文件传递 commit message，避免 shell 转义问题
	const commitMsgFile = path.join(localPath, ".batch-pr-commit-msg.txt");
	if (!dryRun) {
		fs.writeFileSync(commitMsgFile, commitMessage, "utf-8");
	}
	const { stdout: commitOut, stderr: commitErr } = runOrExit(
		`git commit --no-verify -F "${commitMsgFile}"`,
		localPath,
		dryRun,
	);
	if (!dryRun && fs.existsSync(commitMsgFile)) {
		fs.unlinkSync(commitMsgFile);
	}

	const nothingToCommit = commitOut.includes("nothing to commit") || commitErr.includes("nothing to commit");
	if (nothingToCommit && !dryRun) {
		console.log(`  ⏭  无变更可提交`);
		// 回退分支
		runOrExit(`git checkout "${targetBranch}"`, localPath, dryRun);
		runOrExit(`git branch -D "${sourceBranch}"`, localPath, dryRun);
		return {
			repo,
			localPath,
			status: "skipped",
			targetBranch,
			prUrl: null,
			reason: "无变更可提交",
			changes: repoChanges,
		};
	}

	// 检测 commit 是否真正成功（跳过 hook 后仍有失败可能）
	if (!dryRun) {
		const { stdout: postCommitStatus } = exec("git status --porcelain", localPath, false);
		if (postCommitStatus) {
			console.log(`  ❌ commit 失败，暂存区仍有内容`);
			runOrExit(`git checkout "${targetBranch}"`, localPath, false);
			runOrExit(`git branch -D "${sourceBranch}"`, localPath, false);
			return {
				repo,
				localPath,
				status: "failed",
				targetBranch,
				prUrl: null,
				reason: `commit 失败: ${commitErr || commitOut}`,
				changes: repoChanges,
			};
		}
	}

	// 8. push 来源分支（使用 --force-with-lease 安全覆盖此前重跑残留的远程分支）
	console.log(`  📤 推送分支...`);
	const pushResult = runOrExit(`git push --force-with-lease origin "${sourceBranch}"`, localPath, dryRun);
	if (pushResult.stderr && pushResult.stderr.includes("rejected")) {
		return {
			repo,
			localPath,
			status: "failed",
			targetBranch,
			prUrl: null,
			reason: `推送被拒绝，可能需要 force push 或远程分支已存在: ${pushResult.stderr}`,
			changes: repoChanges,
		};
	}

	// 9. 创建 PR
	console.log(`  🔀 创建 PR...`);

	// 使用文件传递 PR body，避免 shell 转义问题
	const prBodyFile = path.join(localPath, ".batch-pr-body.md");
	if (!dryRun) {
		fs.writeFileSync(prBodyFile, prBody, "utf-8");
	}

	if (dryRun) {
		console.log(
			`  [dry-run] gh pr create --title "${config.prTitle}" --body-file "${prBodyFile}" --base "${targetBranch}" --head "${sourceBranch}"`,
		);
		return {
			repo,
			localPath,
			status: "success",
			targetBranch,
			prUrl: "(dry-run)",
			reason: null,
			changes: repoChanges,
		};
	}

	const prResult = runOrExit(
		`gh pr create --title "${config.prTitle.replace(/"/g, '\\"')}" --body-file "${prBodyFile}" --base "${targetBranch}" --head "${sourceBranch}"`,
		localPath,
		false,
	);
	if (fs.existsSync(prBodyFile)) {
		fs.unlinkSync(prBodyFile);
	}
	const prUrl = prResult.stdout;

	if (prUrl && prUrl.startsWith("https://")) {
		console.log(`  ✅ PR 创建成功: ${prUrl}`);
		return {
			repo,
			localPath,
			status: "success",
			targetBranch,
			prUrl,
			reason: null,
			changes: repoChanges,
		};
	}

	return {
		repo,
		localPath,
		status: "failed",
		targetBranch,
		prUrl: null,
		reason: `PR 创建失败: ${prResult.stderr}`,
		changes: repoChanges,
	};
}

/**
 * 合并单个仓库的 PR 并清理分支
 */
async function mergeRepo(repoCfg: RepoConfig, useAdmin: boolean, dryRun = false): Promise<MergeResult> {
	const { repo, localPath, sourceBranch } = repoCfg;
	console.log(`\n── ${repo} ──`);
	console.log(`  本地路径: ${localPath}`);

	if (!fs.existsSync(localPath)) {
		console.log(`  ⏭  跳过：本地路径不存在`);
		return { repo, localPath, status: "skipped", targetBranch: null, prNumber: null, prUrl: null, branchDeleted: false, reason: "本地路径不存在" };
	}

	// 1. 探测目标分支
	const targetBranch = detectTargetBranch(localPath, false);
	if (!targetBranch) {
		console.log(`  ⏭  跳过：无法确定目标分支`);
		return { repo, localPath, status: "skipped", targetBranch: null, prNumber: null, prUrl: null, branchDeleted: false, reason: "无法确定目标分支" };
	}
	console.log(`  目标分支: ${targetBranch}`);

	// 2. 查找开放 PR（只读，dry-run 也实际执行）
	const prListResult = exec(
		`gh pr list --head "${sourceBranch}" --base "${targetBranch}" --state open --json number,url --jq ".[0]"`,
		localPath,
		false,
	);
	let prInfo: { number?: number; url?: string } | null = null;
	try {
		prInfo = prListResult.stdout ? (JSON.parse(prListResult.stdout) as { number: number; url: string }) : null;
	} catch {
		prInfo = null;
	}

	if (!prInfo || !prInfo.number) {
		console.log(`  ⏭  跳过：未找到 ${sourceBranch} → ${targetBranch} 的开放 PR`);
		return { repo, localPath, status: "skipped", targetBranch, prNumber: null, prUrl: null, branchDeleted: false, reason: "未找到开放 PR" };
	}

	console.log(`  [dry-run] 将合并 PR #${prInfo.number}: ${prInfo.url}${useAdmin ? " （--admin 强制）" : ""}`);
	if (dryRun) {
		return {
			repo,
			localPath,
			status: "success",
			targetBranch,
			prNumber: prInfo.number,
			prUrl: prInfo.url,
			branchDeleted: true,
			reason: null,
		};
	}

	console.log(`  🔀 合并 PR #${prInfo.number}: ${prInfo.url}`);

	// 3. 执行 rebase 合并并请求删除分支
	const mergeCmd = `gh pr merge ${prInfo.number} --rebase --delete-branch${useAdmin ? " --admin" : ""}`;
	const mergeResult = runOrExit(mergeCmd, localPath, false);
	if (mergeResult.stderr && !mergeResult.stderr.toLowerCase().includes("already merged")) {
		console.log(`  ⚠  gh merge 可能失败: ${mergeResult.stderr}`);
	}

	// 4. 通过 GitHub API 验证远程分支是否已删除
	const [owner, name] = repo.split("/");
	let branchStillExists = false;
	try {
		const checkResult = exec(`gh api repos/${owner}/${name}/branches/${sourceBranch} --jq ".name"`, localPath, false);
		branchStillExists = checkResult.stdout.trim() === sourceBranch;
	} catch {
		branchStillExists = false;
	}

	// 5. 兜底删除远程分支
	if (branchStillExists) {
		console.log(`  🧹 远程分支仍存在，执行兜底删除`);
		const deleteResult = runOrExit(`git push origin --delete "${sourceBranch}"`, localPath, false);
		if (deleteResult.stderr && !deleteResult.stderr.includes("remote ref does not exist")) {
			console.error(`  ⚠  删除远程分支失败: ${deleteResult.stderr}`);
		}
	}

	// 6. 清理本地跟踪分支并同步目标分支
	runOrExit(`git fetch --prune origin`, localPath, false);
	runOrExit(`git checkout "${targetBranch}"`, localPath, false);
	runOrExit(`git pull origin "${targetBranch}"`, localPath, false);
	try {
		runOrExit(`git branch -D "${sourceBranch}"`, localPath, false);
	} catch {
		// 本地分支可能不存在，忽略
	}

	// 7. 二次验证远程分支
	let finalBranchExists = false;
	try {
		const finalCheck = exec(`gh api repos/${owner}/${name}/branches/${sourceBranch} --jq ".name"`, localPath, false);
		finalBranchExists = finalCheck.stdout.trim() === sourceBranch;
	} catch {
		finalBranchExists = false;
	}

	if (finalBranchExists) {
		return {
			repo,
			localPath,
			status: "failed",
			targetBranch,
			prNumber: prInfo.number,
			prUrl: prInfo.url,
			branchDeleted: false,
			reason: "合并后远程分支仍无法删除",
		};
	}

	console.log(`  ✅ 合并完成，远程/本地分支已清理`);
	return {
		repo,
		localPath,
		status: "success",
		targetBranch,
		prNumber: prInfo.number,
		prUrl: prInfo.url,
		branchDeleted: true,
		reason: null,
	};
}

/* ============================================================
 * 汇总报告
 * ============================================================ */

function generateSummary(config: PRConfig, results: RepoResult[], dryRun: boolean, workdir: string): void {
	const summaryLines: string[] = [];
	const successCount = results.filter((r) => r.status === "success").length;
	const skippedCount = results.filter((r) => r.status === "skipped").length;
	const failedCount = results.filter((r) => r.status === "failed").length;

	summaryLines.push("# 批量 PR 执行汇总报告");
	summaryLines.push("");
	summaryLines.push(dryRun ? "> **DRY-RUN 模式** — 仅预览，未实际执行" : "");
	summaryLines.push("");
	summaryLines.push("## 统一内容");
	summaryLines.push(`- **PR 标题**: ${config.prTitle}`);
	summaryLines.push(`- **来源分支**: ${config.sourceBranch}`);
	summaryLines.push(`- **工作目录**: ${workdir}`);
	summaryLines.push(`- **commit**:`);
	summaryLines.push("  ```txt");
	const commitMsgPath = path.join(workdir, "commit-message.txt");
	const commitMsg = fs.existsSync(commitMsgPath) ? fs.readFileSync(commitMsgPath, "utf-8").trim() : "";
	summaryLines.push(`  ${commitMsg}`);
	summaryLines.push("  ```");
	summaryLines.push("");
	summaryLines.push("## 执行结果");
	summaryLines.push(`- ✅ 成功: ${successCount}`);
	summaryLines.push(`- ⏭  跳过: ${skippedCount}`);
	summaryLines.push(`- ❌ 失败: ${failedCount}`);
	summaryLines.push("");

	summaryLines.push("| 仓库 | 状态 | 目标分支 | PR 链接 | 说明 |");
	summaryLines.push("| :--- | :--: | :------ | :------ | :--- |");

	for (const r of results) {
		const statusIcon = r.status === "success" ? "✅" : r.status === "skipped" ? "⏭" : "❌";
		summaryLines.push(
			`| \`${r.repo}\` | ${statusIcon} ${r.status} | ${r.targetBranch ?? "—"} | ${r.prUrl ?? "—"} | ${r.reason ?? "—"} |`,
		);
	}

	summaryLines.push("");

	// ---- 文件变更明细 ----
	const allChanges = results.filter((r) => r.changes && r.changes.length > 0);
	if (allChanges.length > 0) {
		summaryLines.push("## 文件变更明细");
		summaryLines.push("");
		for (const r of allChanges) {
			summaryLines.push(`### \`${r.repo}\``);
			summaryLines.push("");
			summaryLines.push("| 文件 | 转换规则 | 匹配处 | 替换处 |");
			summaryLines.push("| :--- | :------- | :----: | :----: |");
			for (const c of r.changes) {
				summaryLines.push(`| \`${c.file}\` | ${c.transformDescription} | ${c.searchCount} | ${c.replacedCount} |`);
			}
			summaryLines.push("");
		}
	}

	summaryLines.push("");

	const summaryContent = summaryLines.filter((l) => l !== "").join("\n");
	fs.writeFileSync(path.join(workdir, "execution-summary.md"), summaryContent, "utf-8");
	console.log(`\n📄 汇总报告已写入: ${path.join(workdir, "execution-summary.md")}`);
}

function generateMergeSummary(config: PRConfig, results: MergeResult[], workdir: string): void {
	const summaryLines: string[] = [];
	const successCount = results.filter((r) => r.status === "success").length;
	const skippedCount = results.filter((r) => r.status === "skipped").length;
	const failedCount = results.filter((r) => r.status === "failed").length;

	summaryLines.push("# 批量 PR 合并汇总报告");
	summaryLines.push("");
	summaryLines.push("> **合并模式** — rebase 合并 + 分支清理");
	summaryLines.push("");
	summaryLines.push("## 统一内容");
	summaryLines.push(`- **来源分支**: ${config.sourceBranch}`);
	summaryLines.push("");
	summaryLines.push("## 执行结果");
	summaryLines.push(`- ✅ 成功: ${successCount}`);
	summaryLines.push(`- ⏭  跳过: ${skippedCount}`);
	summaryLines.push(`- ❌ 失败: ${failedCount}`);
	summaryLines.push("");

	summaryLines.push("| 仓库 | 状态 | 目标分支 | PR | 分支已删除 | 说明 |");
	summaryLines.push("| :--- | :--: | :------ | --- | :--------: | :--- |");

	for (const r of results) {
		const statusIcon = r.status === "success" ? "✅" : r.status === "skipped" ? "⏭" : "❌";
		const prLink = r.prUrl ? `[#${r.prNumber}](${r.prUrl})` : "—";
		const deletedIcon = r.branchDeleted ? "✅" : r.status === "skipped" ? "—" : "❌";
		summaryLines.push(
			`| \`${r.repo}\` | ${statusIcon} ${r.status} | ${r.targetBranch ?? "—"} | ${prLink} | ${deletedIcon} | ${r.reason ?? "—"} |`,
		);
	}

	const summaryContent = summaryLines.filter((l) => l !== "").join("\n");
	fs.writeFileSync(path.join(workdir, "merge-summary.md"), summaryContent, "utf-8");
	console.log(`\n📄 合并汇总报告已写入: ${path.join(workdir, "merge-summary.md")}`);
}

/* ============================================================
 * 入口
 * ============================================================ */
main().catch((err) => {
	console.error("❌ 脚本异常退出:", err);
	process.exit(1);
});
