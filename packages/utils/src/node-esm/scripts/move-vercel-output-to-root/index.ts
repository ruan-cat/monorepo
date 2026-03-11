import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import consola from "consola";
import { findMonorepoRoot } from "../../../monorepo";

export interface MoveVercelOutputToRootOptions {
	/**
	 * 运行目录。
	 * 默认值为 `process.cwd()`。
	 */
	cwd?: string;

	/**
	 * monorepo 根目录。
	 * 不传时会从 `cwd` 开始，向上查找 `pnpm-workspace.yaml`。
	 */
	rootDir?: string;

	/**
	 * 子包内构建产物目录。
	 * 相对路径基于 `cwd` 解析。
	 *
	 * @default ".vercel/output"
	 */
	sourceDir?: string;

	/**
	 * monorepo 根目录内的目标输出目录。
	 * 相对路径基于 monorepo 根目录解析。
	 *
	 * @default ".vercel/output"
	 */
	targetDir?: string;

	/**
	 * 是否跳过目标目录清理。
	 *
	 * @default false
	 */
	skipClean?: boolean;

	/**
	 * 仅打印解析结果，不实际复制文件。
	 *
	 * @default false
	 */
	dryRun?: boolean;
}

export interface ResolvedMoveVercelOutputToRootOptions {
	cwd: string;
	monorepoRoot: string;
	sourceDir: string;
	targetDir: string;
	skipClean: boolean;
	dryRun: boolean;
}

export interface MoveVercelOutputToRootResult extends ResolvedMoveVercelOutputToRootOptions {
	copied: boolean;
}

/**
 * 将路径解析为绝对路径。
 */
function resolvePathFromBase(baseDir: string, inputPath: string) {
	if (path.isAbsolute(inputPath)) {
		return path.normalize(inputPath);
	}

	return path.resolve(baseDir, inputPath);
}

/**
 * 解析 monorepo 根目录。
 */
function resolveMonorepoRoot(cwd: string, rootDir?: string) {
	if (rootDir) {
		const resolvedRoot = resolvePathFromBase(cwd, rootDir);
		const workspaceConfigPath = path.join(resolvedRoot, "pnpm-workspace.yaml");
		if (!fs.existsSync(workspaceConfigPath)) {
			throw new Error(`指定的 rootDir 不是有效的 monorepo 根目录：${resolvedRoot}。缺少 pnpm-workspace.yaml。`);
		}
		return resolvedRoot;
	}

	const detectedRoot = findMonorepoRoot(cwd);
	if (detectedRoot) {
		return detectedRoot;
	}

	throw new Error(`无法从当前目录向上定位 monorepo 根目录：${cwd}。请显式传入 --root-dir 参数。`);
}

/**
 * 解析脚本所需的全部路径。
 */
export function resolveMoveVercelOutputToRootOptions(
	options: MoveVercelOutputToRootOptions = {},
): ResolvedMoveVercelOutputToRootOptions {
	const cwd = path.resolve(options.cwd ?? process.cwd());
	const monorepoRoot = resolveMonorepoRoot(cwd, options.rootDir);
	const sourceDir = resolvePathFromBase(cwd, options.sourceDir ?? ".vercel/output");
	const targetDir = resolvePathFromBase(monorepoRoot, options.targetDir ?? ".vercel/output");

	if (sourceDir === targetDir) {
		throw new Error(`源目录和目标目录解析到了同一路径：${sourceDir}。请调整 sourceDir 或 targetDir。`);
	}

	return {
		cwd,
		monorepoRoot,
		sourceDir,
		targetDir,
		skipClean: options.skipClean ?? false,
		dryRun: options.dryRun ?? false,
	};
}

/**
 * 复制目录内容，而不是把源目录本身嵌套复制进去。
 */
function copyDirectoryContents(sourceDir: string, targetDir: string) {
	fs.mkdirSync(targetDir, { recursive: true });

	for (const entryName of fs.readdirSync(sourceDir)) {
		const sourceEntry = path.join(sourceDir, entryName);
		const targetEntry = path.join(targetDir, entryName);
		fs.cpSync(sourceEntry, targetEntry, {
			force: true,
			recursive: true,
		});
	}
}

/**
 * 将当前子包内的 `.vercel/output` 移动到 monorepo 根目录。
 * @description
 * 该函数服务于 Vercel 在 monorepo 场景下的部署：
 * 1. 构建仍在子包目录内执行
 * 2. 产物默认出现在子包的 `.vercel/output`
 * 3. Vercel 却要求在 monorepo 根目录下读取 `.vercel/output`
 */
export function moveVercelOutputToRoot(options: MoveVercelOutputToRootOptions = {}): MoveVercelOutputToRootResult {
	const resolvedOptions = resolveMoveVercelOutputToRootOptions(options);

	if (!fs.existsSync(resolvedOptions.sourceDir)) {
		throw new Error(`源目录不存在，无法搬运 Vercel 构建产物：${resolvedOptions.sourceDir}。请先在子包内完成构建。`);
	}

	if (!fs.statSync(resolvedOptions.sourceDir).isDirectory()) {
		throw new Error(`源路径不是目录：${resolvedOptions.sourceDir}`);
	}

	consola.info("move-vercel-output-to-root 解析结果");
	consola.log(`- cwd: ${resolvedOptions.cwd}`);
	consola.log(`- monorepoRoot: ${resolvedOptions.monorepoRoot}`);
	consola.log(`- sourceDir: ${resolvedOptions.sourceDir}`);
	consola.log(`- targetDir: ${resolvedOptions.targetDir}`);
	consola.log(`- skipClean: ${resolvedOptions.skipClean}`);
	consola.log(`- dryRun: ${resolvedOptions.dryRun}`);

	if (resolvedOptions.dryRun) {
		consola.info("dry-run 模式：仅输出路径信息，不执行复制。");
		return {
			...resolvedOptions,
			copied: false,
		};
	}

	if (!resolvedOptions.skipClean) {
		fs.rmSync(resolvedOptions.targetDir, {
			force: true,
			recursive: true,
		});
	}

	copyDirectoryContents(resolvedOptions.sourceDir, resolvedOptions.targetDir);

	consola.success(`已将 ${resolvedOptions.sourceDir} 搬运到 ${resolvedOptions.targetDir}`);

	return {
		...resolvedOptions,
		copied: true,
	};
}

/**
 * 解析命令行参数。
 */
export function parseMoveVercelOutputToRootCliArgs(args: string[]): MoveVercelOutputToRootOptions & { help?: boolean } {
	const options: MoveVercelOutputToRootOptions & { help?: boolean } = {};
	const readFlagValue = (flagName: string, currentIndex: number) => {
		const value = args[currentIndex + 1];
		if (!value || value.startsWith("--")) {
			throw new Error(`参数 ${flagName} 缺少对应的值。`);
		}

		return value;
	};

	for (let index = 0; index < args.length; index += 1) {
		const currentArg = args[index];

		switch (currentArg) {
			case "--root-dir":
				options.rootDir = readFlagValue(currentArg, index);
				index += 1;
				break;
			case "--source-dir":
				options.sourceDir = readFlagValue(currentArg, index);
				index += 1;
				break;
			case "--target-dir":
				options.targetDir = readFlagValue(currentArg, index);
				index += 1;
				break;
			case "--skip-clean":
				options.skipClean = true;
				break;
			case "--dry-run":
				options.dryRun = true;
				break;
			case "--help":
			case "-h":
				options.help = true;
				break;
			default:
				throw new Error(`不支持的参数：${currentArg}`);
		}
	}

	return options;
}

/**
 * CLI 帮助信息。
 */
export function getMoveVercelOutputToRootHelpText() {
	return [
		"tsx @ruan-cat/utils/move-vercel-output-to-root [options]",
		"",
		"选项：",
		"  --root-dir <path>    显式指定 monorepo 根目录",
		"  --source-dir <path>  指定子包内构建产物目录，默认 .vercel/output",
		"  --target-dir <path>  指定根目录内目标目录，默认 .vercel/output",
		"  --skip-clean         跳过目标目录清理",
		"  --dry-run            仅打印路径解析结果，不执行复制",
		"  -h, --help           查看帮助信息",
	].join("\n");
}

/**
 * 执行 CLI。
 */
export function runMoveVercelOutputToRootCli(args: string[] = process.argv.slice(2)) {
	const cliOptions = parseMoveVercelOutputToRootCliArgs(args);

	if (cliOptions.help) {
		console.log(getMoveVercelOutputToRootHelpText());
		return;
	}

	moveVercelOutputToRoot(cliOptions);
}

function isRunningAsCli() {
	const currentFilePath = fileURLToPath(import.meta.url);
	const entryPath = process.argv[1];

	if (!entryPath) {
		return false;
	}

	return path.resolve(entryPath) === currentFilePath;
}

if (isRunningAsCli()) {
	try {
		runMoveVercelOutputToRootCli();
	} catch (error) {
		consola.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
