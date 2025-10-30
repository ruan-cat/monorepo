import fs from "node:fs";
import path from "node:path";
import consola from "consola";

/**
 * Claude 文件夹名称类型
 */
export type ClaudeFolderName = "agents" | "commands";

/**
 * 从当前工作目录向上查找 monorepo 根目录
 * @returns monorepo 根目录的绝对路径，如果找不到则返回 null
 * @description
 * 通过查找 pnpm-workspace.yaml 文件来定位 monorepo 根目录。
 * 从 process.cwd() 开始向上遍历，直到找到该文件或到达文件系统根目录。
 */
function findMonorepoRoot(): string | null {
	let currentDir = process.cwd();
	const root = path.parse(currentDir).root;

	while (currentDir !== root) {
		const workspaceFile = path.join(currentDir, "pnpm-workspace.yaml");
		if (fs.existsSync(workspaceFile)) {
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}

	// 检查根目录本身
	const workspaceFile = path.join(root, "pnpm-workspace.yaml");
	if (fs.existsSync(workspaceFile)) {
		return root;
	}

	return null;
}

/**
 * 解析根目录路径
 * @param rootDir - 根目录路径，支持相对路径（如 `../../../`）或绝对路径
 * @returns 解析后的绝对路径
 * @description
 * 路径解析优先级：
 * 1. 如果传入 rootDir，将相对路径基于 process.cwd() 解析为绝对路径
 * 2. 如果未传入 rootDir，自动向上查找包含 pnpm-workspace.yaml 的 monorepo 根目录
 * 3. 如果自动查找失败，回退到 process.cwd()
 */
function resolveRootDir(rootDir?: string): string {
	if (rootDir) {
		// 将相对路径或绝对路径解析为绝对路径
		return path.resolve(process.cwd(), rootDir);
	}

	// 自动查找 monorepo 根目录
	const monorepoRoot = findMonorepoRoot();
	if (monorepoRoot) {
		return monorepoRoot;
	}

	// 回退到当前工作目录
	return process.cwd();
}

/**
 * 检查指定根目录是否存在指定的 Claude 文件夹
 * @param folderPath - Claude 文件夹的相对路径（如 '.claude/agents' 或 '.claude/commands'）
 * @param options - 配置选项
 * @param options.rootDir - 可选的根目录路径，支持相对路径（如 `../../../` 表示向上三级目录）。
 *                          如果不传入，将自动向上查找包含 pnpm-workspace.yaml 的 monorepo 根目录。
 *                          相对路径会基于当前工作目录 (process.cwd()) 解析为绝对路径。
 * @returns 是否存在指定的 Claude 文件夹
 * @internal 该函数为内部使用，不对外暴露
 */
function hasClaudeFolder(folderPath: string, options?: { rootDir?: string }): boolean {
	const root = resolveRootDir(options?.rootDir);
	const claudeFolderPath = path.join(root, folderPath);
	const exists = fs.existsSync(claudeFolderPath);

	if (!exists) {
		consola.log("检测的根目录为：", root);
		consola.warn(`该根目录不存在 ${folderPath} 文件夹`);
	}

	return exists;
}

/**
 * 将 .claude 相关文件夹复制到指定位置的配置选项
 */
export interface CopyClaudeFilesOptions {
	/**
	 * 目标父文件夹路径（必须是相对路径，相对于当前工作目录）
	 * @description
	 * **重要**：此参数仅接受相对路径，不接受绝对路径（禁止以 `/` 或盘符如 `C:\` 开头）。
	 * 使用绝对路径会抛出错误，这是为了防止意外覆盖系统目录。
	 *
	 * 该地址是写相对路径的 不能写绝对路径，容易导致意外。
	 * vitepress 命令运行在 apps/admin 目录内，该地址是相对于该运行目录的。
	 * 比如期望将 `.claude/agents` 和 `.claude/commands` 复制到 `apps/admin/src/docs/prompts/` 文件夹下。
	 * 则写 `src/docs/prompts` 即可，最终会生成：
	 *   - `apps/admin/src/docs/prompts/agents/`
	 *   - `apps/admin/src/docs/prompts/commands/`
	 *
	 * @throws {Error} 当传入绝对路径时抛出错误
	 * @example
	 * // ✅ 正确：相对路径
	 * "src/docs/prompts"
	 * "dist"
	 * "./public/claude"
	 *
	 * @example
	 * // ❌ 错误：绝对路径（会抛出错误）
	 * "/var/www/claude"           // Unix 绝对路径
	 * "C:\\Users\\claude"         // Windows 绝对路径
	 */
	target: string;

	/**
	 * 可选的根目录路径，支持相对路径（如 `../../../` 表示向上三级目录）
	 * @description
	 * - 如果不传入，将自动向上查找包含 pnpm-workspace.yaml 的 monorepo 根目录
	 * - 相对路径会基于当前工作目录 (process.cwd()) 解析为绝对路径
	 * - 绝对路径将直接使用
	 * @example
	 * // 相对路径：向上三级目录
	 * '../../../'
	 *
	 * // 绝对路径
	 * '/absolute/path/to/monorepo'
	 */
	rootDir?: string;

	/**
	 * 要复制的 Claude 文件夹列表
	 * @description
	 * 指定要复制的文件夹名称数组。如果不传入，默认复制所有文件夹（'agents' 和 'commands'）。
	 * 对于不存在的文件夹，会打印警告并跳过，不会影响其他文件夹的复制。
	 *
	 * @default ['agents', 'commands']
	 * @example
	 * // 只复制 agents 文件夹
	 * items: ['agents']
	 *
	 * // 只复制 commands 文件夹
	 * items: ['commands']
	 *
	 * // 复制所有文件夹（默认行为）
	 * items: ['agents', 'commands']
	 */
	items?: ClaudeFolderName[];
}

/**
 * 将 .claude 相关文件夹（agents 和 commands）复制到指定位置
 * @param options - 配置选项
 * @throws {Error} 当 `options.target` 为绝对路径时抛出错误
 * @description
 * 该函数会将指定的 `.claude` 文件夹（默认为 `agents` 和 `commands`）复制到目标位置的子目录中。
 * 从根目录的 .claude 文件夹复制到目标位置，自动创建对应的子文件夹。
 *
 * **安全限制**：`target` 参数必须是相对路径，禁止使用绝对路径，以防止意外覆盖系统目录。
 *
 * @example
 * // ✅ 自动检测 monorepo 根目录，复制所有文件夹到当前目录的 dist 文件夹
 * // 会生成：dist/agents/ 和 dist/commands/
 * copyClaudeFiles({ target: 'dist' })
 *
 * // ✅ 只复制 agents 文件夹
 * copyClaudeFiles({
 *   target: 'dist',
 *   items: ['agents']
 * })
 *
 * // ✅ 手动指定根目录为向上三级，复制到 build 文件夹
 * copyClaudeFiles({
 *   target: 'build',
 *   rootDir: '../../../'
 * })
 *
 * // ✅ 使用绝对路径指定根目录（rootDir 允许绝对路径）
 * copyClaudeFiles({
 *   target: 'dist',  // target 必须是相对路径
 *   rootDir: '/absolute/path/to/monorepo'  // rootDir 可以是绝对路径
 * })
 *
 * @example
 * // ❌ 错误用法：target 使用绝对路径会抛出错误
 * copyClaudeFiles({ target: '/var/www/claude' })  // 抛出 Error
 * copyClaudeFiles({ target: 'C:\\Windows\\claude' })  // 抛出 Error
 */
export function copyClaudeFiles(options: CopyClaudeFilesOptions): void {
	// 验证 target 不能是绝对路径
	if (path.isAbsolute(options.target)) {
		const errorMessage = [
			`target 参数不允许使用绝对路径，这可能导致意外的文件覆盖。`,
			`当前传入的路径: "${options.target}"`,
			`请使用相对路径，例如: "src/docs/prompts"`,
		].join("\n");

		consola.error(errorMessage);
		throw new Error(errorMessage);
	}

	const root = resolveRootDir(options.rootDir);

	// 确定要处理的文件夹列表，默认为所有文件夹
	const itemsToProcess = options.items ?? ["agents", "commands"];

	// 记录成功复制的文件夹数量
	let successCount = 0;

	// 遍历每个要处理的文件夹
	for (const folderName of itemsToProcess) {
		const claudeFolderPath = `.claude/${folderName}`;

		// 使用 hasClaudeFolder 检查文件夹是否存在
		// 如果不存在，hasClaudeFolder 会自动打印警告
		if (!hasClaudeFolder(claudeFolderPath, { rootDir: options.rootDir })) {
			continue; // 跳过不存在的文件夹
		}

		// 构建源路径和目标路径
		const source = path.join(root, claudeFolderPath);
		const destination = path.resolve(process.cwd(), options.target, folderName);

		// 确保目标文件夹的父目录存在
		fs.mkdirSync(path.dirname(destination), { recursive: true });

		// 递归复制文件夹
		fs.cpSync(source, destination, { recursive: true });

		consola.success(`已成功复制 ${claudeFolderPath} 到 ${destination}`);
		successCount++;
	}

	// 如果没有成功复制任何文件夹，给出提示
	if (successCount === 0) {
		consola.warn("没有成功复制任何 .claude 文件夹");
	}
}
