import fs from "node:fs";
import path from "node:path";
import consola from "consola";

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
 * 检查指定根目录是否存在 .claude/agents 文件夹
 * @param options - 配置选项
 * @param options.rootDir - 可选的根目录路径，支持相对路径（如 `../../../` 表示向上三级目录）。
 *                          如果不传入，将自动向上查找包含 pnpm-workspace.yaml 的 monorepo 根目录。
 *                          相对路径会基于当前工作目录 (process.cwd()) 解析为绝对路径。
 * @returns 是否存在 .claude/agents 文件夹
 * @example
 * // 自动检测 monorepo 根目录
 * hasClaudeAgents()
 *
 * // 手动指定相对路径（从当前工作目录向上三级）
 * hasClaudeAgents({ rootDir: '../../../' })
 *
 * // 手动指定绝对路径
 * hasClaudeAgents({ rootDir: '/path/to/monorepo' })
 */
export function hasClaudeAgents(options?: { rootDir?: string }): boolean {
	const root = resolveRootDir(options?.rootDir);
	const claudeAgentsPath = path.join(root, ".claude/agents");
	const exists = fs.existsSync(claudeAgentsPath);

	if (!exists) {
		consola.log("检测的根目录为：", root);
		consola.warn("该根目录不存在 .claude/agents 文件夹");
	}

	return exists;
}

/**
 * 将 .claude/agents 文件夹复制到指定位置的配置选项
 */
export interface CopyClaudeAgentsOptions {
	/**
	 * 目标文件夹路径（必须是相对路径，相对于当前工作目录）
	 * @description
	 * **重要**：此参数仅接受相对路径，不接受绝对路径（禁止以 `/` 或盘符如 `C:\` 开头）。
	 * 使用绝对路径会抛出错误，这是为了防止意外覆盖系统目录。
	 *
	 * 该地址是写相对路径的 不能写绝对路径，容易导致意外。
	 * vitepress 命令运行在 apps/admin 目录内，该地址是相对于该运行目录的。
	 * 比如期望将 `.claude/agents` 复制到 `apps/admin/src/docs/prompts/agents` 文件夹。
	 * 则写 `src/docs/prompts/agents` 即可。
	 *
	 * @throws {Error} 当传入绝对路径时抛出错误
	 * @example
	 * // ✅ 正确：相对路径
	 * "src/docs/prompts/agents"
	 * "dist/agents"
	 * "./public/claude"
	 *
	 * @example
	 * // ❌ 错误：绝对路径（会抛出错误）
	 * "/var/www/agents"           // Unix 绝对路径
	 * "C:\\Users\\agents"         // Windows 绝对路径
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
}

/**
 * 将 .claude/agents 文件夹复制到指定位置
 * @param options - 配置选项
 * @throws {Error} 当 `options.target` 为绝对路径时抛出错误
 * @description
 * 该函数相当于实现 `cpx .claude/agents <target>` 命令。
 * 从根目录的 .claude/agents 复制到目标位置。
 *
 * **安全限制**：`target` 参数必须是相对路径，禁止使用绝对路径，以防止意外覆盖系统目录。
 *
 * @example
 * // ✅ 自动检测 monorepo 根目录，复制到当前目录的 dist 文件夹
 * copyClaudeAgents({ target: 'dist' })
 *
 * // ✅ 手动指定根目录为向上三级，复制到 build 文件夹
 * copyClaudeAgents({
 *   target: 'build',
 *   rootDir: '../../../'
 * })
 *
 * // ✅ 使用绝对路径指定根目录（rootDir 允许绝对路径）
 * copyClaudeAgents({
 *   target: 'dist',  // target 必须是相对路径
 *   rootDir: '/absolute/path/to/monorepo'  // rootDir 可以是绝对路径
 * })
 *
 * @example
 * // ❌ 错误用法：target 使用绝对路径会抛出错误
 * copyClaudeAgents({ target: '/var/www/agents' })  // 抛出 Error
 * copyClaudeAgents({ target: 'C:\\Windows\\agents' })  // 抛出 Error
 */
export function copyClaudeAgents(options: CopyClaudeAgentsOptions): void {
	// 验证 target 不能是绝对路径
	if (path.isAbsolute(options.target)) {
		const errorMessage = [
			`target 参数不允许使用绝对路径，这可能导致意外的文件覆盖。`,
			`当前传入的路径: "${options.target}"`,
			`请使用相对路径，例如: "src/docs/prompts/agents"`,
		].join("\n");

		consola.error(errorMessage);
		throw new Error(errorMessage);
	}

	// 检查源目录是否存在
	if (!hasClaudeAgents({ rootDir: options.rootDir })) {
		return;
	}

	const root = resolveRootDir(options.rootDir);
	const source = path.join(root, ".claude/agents");
	const destination = path.resolve(process.cwd(), options.target);

	// 确保目标文件夹的父目录存在
	fs.mkdirSync(path.dirname(destination), { recursive: true });

	// 递归复制文件夹
	fs.cpSync(source, destination, { recursive: true });

	consola.success(`已成功复制 .claude/agents 到 ${destination}`);
}
