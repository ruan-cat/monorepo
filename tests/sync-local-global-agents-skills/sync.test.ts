import {
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readlinkSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test, afterEach } from "vitest";
import type { AgentPlatform } from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/platforms.ts";
import { syncSkills } from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/sync.ts";

/**
 * 测试运行过程中创建的所有临时目录都会被记录到 tempDirs 中，
 * 由 afterEach 统一清理，避免多个测试用例之间产生目录污染。
 */
const tempDirs: string[] = [];

/**
 * 创建一个临时目录，用于模拟真实的 skills 目录结构。
 *
 * 该函数使用 os.tmpdir() 作为根目录，并用 mkdtempSync 生成
 * 以 prefix 开头的唯一目录名。创建完成后，目录会被记录到 tempDirs
 * 中，确保测试结束后自动删除。
 *
 * @param prefix - 临时目录名称前缀，例如 "source-" 或 "target-"
 * @returns 生成的临时目录绝对路径
 */
function createTempDir(prefix: string): string {
	const dir = mkdtempSync(path.join(tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

/**
 * 每个测试用例结束后执行清理。
 *
 * 删除本测试用例及之前的测试用例中创建的全部临时目录，并清空
 * tempDirs 数组，为下一个测试用例准备干净环境。
 */
afterEach(() => {
	for (const dir of tempDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	tempDirs.length = 0;
});

/**
 * 构造一个模拟的本地 agent 平台对象。
 *
 * 该函数不会创建真实的 skills 目录，只返回一个 AgentPlatform 对象，
 * 其中的 skillsDir 指向 baseDir 下的 <name>/skills 子目录。
 *
 * @param baseDir - 该平台的根目录，通常由 createTempDir("target-") 生成
 * @param name - 平台名称，例如 "platform-a"、"workbuddy" 等
 * @returns 模拟的本地 agent 平台定义
 */
function createPlatform(baseDir: string, name: string): AgentPlatform {
	return {
		name,
		skillsDir: path.join(baseDir, name, "skills"),
	};
}

/**
 * syncSkills 单元测试套件。
 *
 * 该测试套件覆盖 syncSkills 的核心路径：
 * 1. 首次同步：目标目录不存在时，应为每个平台创建指向源目录的目录级符号链接。
 * 2. 幂等性：再次执行同步时，若目标目录已指向正确源目录，应直接跳过。
 * 3. 真实目录已存在：目标位置是真实目录时，应备份原目录并替换为符号链接。
 * 4. 错误符号链接已存在：目标位置是指向其他位置的符号链接时，应直接替换为正确链接。
 * 5. 空运行（dry-run）模式：只返回计划结果，不修改文件系统。
 * 6. 源目录不存在：应抛出异常，提示源目录无效。
 */
describe("syncSkills", () => {
	test("creates directory symlinks for all platforms", () => {
		// 构造一个源 skills 目录和一组目标平台目录。
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		// 执行同步：首次运行时，目标目录不存在，应创建目录级符号链接。
		const results = syncSkills(sourceDir, platforms);

		// 断言：只处理了一个平台，且状态为 created。
		expect(results).toHaveLength(1);
		expect(results[0].status).toBe("created");

		// 断言：目标 skills 目录必须存在，并且是一个符号链接。
		expect(existsSync(platforms[0].skillsDir)).toBe(true);
		expect(lstatSync(platforms[0].skillsDir).isSymbolicLink()).toBe(true);

		// 断言：该符号链接指向正确的源目录。
		expect(readlinkSync(platforms[0].skillsDir)).toBe(sourceDir);
	});

	test("is idempotent when links already correct", () => {
		// 构造一个源目录和一组目标平台。
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		// 先执行一次同步，创建符号链接。
		syncSkills(sourceDir, platforms);

		// 再次执行同步：此时目标链接已经指向正确的源目录，应直接跳过。
		const results = syncSkills(sourceDir, platforms);

		expect(results[0].status).toBe("skipped");
	});

	test("backs up and replaces an existing directory", () => {
		// 构造源目录和目标平台。
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		// 在目标位置预先创建一个真实目录，并写入一个旧文件，
		// 模拟“目标平台已有一个真实的 skills 目录，需要被替换”的场景。
		mkdirSync(platforms[0].skillsDir, { recursive: true });
		writeFileSync(path.join(platforms[0].skillsDir, "old.txt"), "old");

		// 执行同步：应备份原目录，然后替换为指向源目录的符号链接。
		const results = syncSkills(sourceDir, platforms);

		// 断言：原目录被替换，且状态为 replaced。
		expect(results[0].status).toBe("replaced");
		expect(results[0].previousType).toBe("directory");

		// 断言：备份路径已生成，且备份目录真实存在。
		expect(results[0].backupPath).toBeDefined();
		expect(existsSync(results[0].backupPath!)).toBe(true);

		// 断言：目标位置现在是指向源目录的符号链接。
		expect(readlinkSync(platforms[0].skillsDir)).toBe(sourceDir);
	});

	test("replaces an incorrect symlink without backup", () => {
		// 构造源目录、错误目标目录和一组目标平台。
		const sourceDir = createTempDir("source-");
		const otherDir = createTempDir("other-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		// 在目标位置创建一个指向错误位置的符号链接，
		// 模拟“目标平台此前指向了错误的 skills 源目录”的场景。
		mkdirSync(path.dirname(platforms[0].skillsDir), { recursive: true });
		try {
			// Windows 优先尝试创建原生目录级符号链接。
			symlinkSync(otherDir, platforms[0].skillsDir, "dir");
		} catch {
			// 若当前进程没有管理员权限，则退而求其次使用 junction（Windows 目录联接）。
			symlinkSync(otherDir, platforms[0].skillsDir, "junction");
		}

		// 执行同步：应删除错误链接，创建指向正确源目录的符号链接。
		const results = syncSkills(sourceDir, platforms);

		// 断言：错误链接被替换，且状态为 replaced。
		expect(results[0].status).toBe("replaced");
		expect(results[0].previousType).toBe("symlink");

		// 断言：目标链接现在指向正确的源目录。
		expect(readlinkSync(platforms[0].skillsDir)).toBe(sourceDir);
	});

	test("dryRun does not modify filesystem", () => {
		// 构造源目录和目标平台，但本次使用 dryRun 模式。
		const sourceDir = createTempDir("source-");
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		// 执行空运行：只返回计划结果，不应在文件系统上创建任何链接。
		const results = syncSkills(sourceDir, platforms, { dryRun: true });

		// 断言：返回结果仍显示会创建链接，但实际文件系统中不应存在该链接。
		expect(results[0].status).toBe("created");
		expect(existsSync(platforms[0].skillsDir)).toBe(false);
	});

	test("throws when source directory does not exist", () => {
		// 构造目标平台，但源目录故意使用一个不存在路径。
		const targetBase = createTempDir("target-");
		const platforms = [createPlatform(targetBase, "platform-a")];

		// 断言：当源目录不存在时，syncSkills 应抛出包含提示信息的错误。
		expect(() => syncSkills("/nonexistent/source", platforms)).toThrow("Source directory does not exist");
	});
});
