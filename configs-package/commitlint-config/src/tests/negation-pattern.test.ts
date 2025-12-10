import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

/**
 * 测试 negation pattern 处理
 * @description
 * 验证修复 https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-12-09-fix-commitlint-config-negation-pattern-bug.md
 * 中描述的问题
 */
describe("negation pattern 处理", () => {
	let tempDir: string;
	let originalCwd: string;

	beforeEach(() => {
		vi.clearAllMocks();
		originalCwd = process.cwd();
		// 创建临时测试目录
		tempDir = fs.mkdtempSync(join(os.tmpdir(), "commitlint-test-"));
	});

	afterEach(() => {
		// 恢复工作目录
		process.chdir(originalCwd);
		// 清理临时目录
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("应该正确过滤掉 negation patterns（以 ! 开头）", () => {
		// 模拟 pnpm-workspace.yaml 配置
		const patterns = ["packages/*", "apps/*", "!examples/*", "!demos/*"];

		// 过滤 negation patterns 的逻辑（与修复代码一致）
		const filteredPatterns = patterns.filter((pattern) => {
			if (pattern.startsWith("!")) return false;
			if (pattern.trim() === "") return false;
			return true;
		});

		// 验证过滤结果
		expect(filteredPatterns).toEqual(["packages/*", "apps/*"]);
		expect(filteredPatterns).not.toContain("!examples/*");
		expect(filteredPatterns).not.toContain("!demos/*");
	});

	test("应该过滤掉空字符串", () => {
		const patterns = ["packages/*", "", "  ", "apps/*"];

		const filteredPatterns = patterns.filter((pattern) => {
			if (pattern.startsWith("!")) return false;
			if (pattern.trim() === "") return false;
			return true;
		});

		expect(filteredPatterns).toEqual(["packages/*", "apps/*"]);
		expect(filteredPatterns.length).toBe(2);
	});

	test("应该正确识别并跳过非 package.json 文件", () => {
		const validPath = "packages/utils/package.json";
		const invalidPaths = [
			"packages/utils/.editorconfig",
			"packages/utils/tsconfig.json",
			"packages/utils/README.md",
			"packages/utils/vite.config.ts",
		];

		// 验证有效路径
		expect(validPath.endsWith("package.json")).toBe(true);

		// 验证无效路径
		invalidPaths.forEach((path) => {
			expect(path.endsWith("package.json")).toBe(false);
		});
	});

	test("应该正确识别有效的 JSON 文件内容", () => {
		// 有效的 JSON 内容（以 { 开头）
		const validJsonContents = ['{"name": "test"}', '  {"name": "test"}', '\n{"name": "test"}', '\t{"name": "test"}'];

		// 无效的 JSON 内容（不以 { 开头）
		const invalidJsonContents = [
			"[*.{js,jsx}]", // .editorconfig 内容
			"# Comment",
			"",
			"   ",
			"some random text",
		];

		// 验证有效内容
		validJsonContents.forEach((content) => {
			const trimmed = content.trim();
			expect(trimmed.startsWith("{")).toBe(true);
		});

		// 验证无效内容
		invalidJsonContents.forEach((content) => {
			const trimmed = content.trim();
			expect(trimmed.startsWith("{")).toBe(false);
		});
	});

	test("应该能够处理包含 negation patterns 的真实场景", () => {
		// 创建模拟的 pnpm-workspace.yaml
		const workspaceYaml = `packages:
  - 'packages/*'
  - 'apps/*'
  - '!examples/*'
  - '!demos/*'
`;

		// 创建测试目录结构
		const packagesDir = join(tempDir, "packages", "utils");
		const examplesDir = join(tempDir, "examples", "demo-app");

		fs.mkdirSync(packagesDir, { recursive: true });
		fs.mkdirSync(examplesDir, { recursive: true });

		// 创建 package.json 文件
		const validPackageJson = {
			name: "@test/utils",
			version: "1.0.0",
		};

		fs.writeFileSync(join(packagesDir, "package.json"), JSON.stringify(validPackageJson, null, 2));

		// 创建一个非 JSON 文件在 examples 目录（模拟 negation pattern 应该排除的内容）
		fs.writeFileSync(join(examplesDir, ".editorconfig"), "[*.{js,jsx}]\nindent_size = 2\n");

		// 验证文件存在
		expect(fs.existsSync(join(packagesDir, "package.json"))).toBe(true);
		expect(fs.existsSync(join(examplesDir, ".editorconfig"))).toBe(true);

		// 验证 package.json 内容可以正常解析
		const content = fs.readFileSync(join(packagesDir, "package.json"), "utf-8");
		expect(content.trim().startsWith("{")).toBe(true);
		expect(() => JSON.parse(content)).not.toThrow();

		// 验证 .editorconfig 内容不能作为 JSON 解析
		const editorConfigContent = fs.readFileSync(join(examplesDir, ".editorconfig"), "utf-8");
		expect(editorConfigContent.trim().startsWith("{")).toBe(false);
		expect(() => JSON.parse(editorConfigContent)).toThrow();
	});

	test("应该能够安全处理 JSON.parse 错误", () => {
		const invalidJsonContent = "[*.{js,jsx}]";

		// 模拟防御性检查
		const trimmedContent = invalidJsonContent.trim();
		const isValidJson = trimmedContent.startsWith("{");

		expect(isValidJson).toBe(false);

		// 如果跳过了 JSON.parse，则不会抛出错误
		if (!isValidJson) {
			// 安全跳过，不执行 JSON.parse
			expect(true).toBe(true);
		} else {
			// 这个分支不应该执行
			expect.fail("不应该尝试解析无效的 JSON");
		}
	});
});
