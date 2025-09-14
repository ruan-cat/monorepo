import { describe, test, expect } from "vitest";
import { parseGitStatusOutput } from "../get-default-scope.ts";

describe("parseGitStatusOutput", () => {
	describe("git status --porcelain 解析测试", () => {
		interface GitStatusTestCase {
			name: string;
			gitOutput: string;
			expectedFiles: string[];
			description: string;
		}

		const gitStatusTestCases: GitStatusTestCase[] = [
			{
				name: "处理暂存区和工作目录都有修改的文件",
				gitOutput: "M  packages/utils/src/print.ts\n M packages/utils/src/prompts/print-list.md",
				expectedFiles: ["packages/utils/src/print.ts"],
				description: "只应该包含暂存区的文件，工作目录修改的文件应被过滤",
			},
			{
				name: "处理混合状态文件（包含未跟踪文件）",
				gitOutput:
					"M  packages/utils/src/print.ts\n M packages/utils/src/prompts/print-list.md\n?? configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md",
				expectedFiles: ["packages/utils/src/print.ts"],
				description: "应过滤掉工作目录修改和未跟踪的文件",
			},
			{
				name: "处理复合状态文件",
				gitOutput:
					"AM configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md\nM  packages/utils/src/print.ts\n M packages/utils/src/prompts/print-list.md",
				expectedFiles: [
					"configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md",
					"packages/utils/src/print.ts",
				],
				description: "应正确解析复合状态（AM）和单一状态的暂存区文件",
			},
			{
				name: "处理仅未跟踪文件的情况",
				gitOutput: "?? new-file.txt\n?? another-untracked.js",
				expectedFiles: [],
				description: "未跟踪文件应全部被过滤掉",
			},
			{
				name: "处理仅工作目录修改的情况",
				gitOutput: " M working-dir-only.txt\n D deleted-in-working-dir.js",
				expectedFiles: [],
				description: "仅工作目录修改的文件应全部被过滤掉",
			},
			{
				name: "处理多种暂存区状态",
				gitOutput:
					"A  new-staged-file.txt\nM  modified-staged-file.js\nD  deleted-staged-file.css\nR  renamed-file.html",
				expectedFiles: [
					"new-staged-file.txt",
					"modified-staged-file.js",
					"deleted-staged-file.css",
					"renamed-file.html",
				],
				description: "应正确解析各种暂存区状态（新增、修改、删除、重命名）",
			},
			{
				name: "处理空输出",
				gitOutput: "",
				expectedFiles: [],
				description: "空输出应返回空数组",
			},
		];

		gitStatusTestCases.forEach(({ name, gitOutput, expectedFiles, description }) => {
			test(name, () => {
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual(expectedFiles);
			});
		});

		describe("边界情况测试", () => {
			test("处理格式异常的行（没有空格分隔）", () => {
				const gitOutput = "M\nAM normal-file.txt";
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual(["normal-file.txt"]);
			});

			test("处理多个连续空格的情况", () => {
				const gitOutput = "M   file-with-spaces.txt\nA  normal-file.txt";
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual(["file-with-spaces.txt", "normal-file.txt"]);
			});

			test("处理文件名包含空格的情况", () => {
				const gitOutput = "M  path with spaces/file name.txt";
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual(["path with spaces/file name.txt"]);
			});

			test("处理包含制表符的情况", () => {
				const gitOutput = "M\tfile-with-tab.txt";
				const result = parseGitStatusOutput(gitOutput);
				// 虽然不太现实，但如果第二个字符是制表符，从第3个字符开始提取仍然可以得到文件名
				expect(result).toEqual(["file-with-tab.txt"]);
			});
		});

		describe("实际场景测试", () => {
			test("模拟用户描述的错误例子1", () => {
				const gitOutput = "M  packages/utils/src/print.ts\n M packages/utils/src/prompts/print-list.md";
				const result = parseGitStatusOutput(gitOutput);

				// 应该正确解析为完整路径，而不是截取错误的路径
				expect(result).toEqual(["packages/utils/src/print.ts"]);
				expect(result[0]).not.toBe("ackages/utils/src/print.ts"); // 确保不会错误截取
			});

			test("模拟用户描述的错误例子2", () => {
				const gitOutput =
					"M  packages/utils/src/print.ts\n M packages/utils/src/prompts/print-list.md\n?? configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md";
				const result = parseGitStatusOutput(gitOutput);

				// 应该只包含暂存区文件，不包含未跟踪文件
				expect(result).toEqual(["packages/utils/src/print.ts"]);
				expect(result).not.toContain("configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md");
			});

			test("模拟用户描述的错误例子3", () => {
				const gitOutput =
					"AM configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md\nM  packages/utils/src/print.ts\n M packages/utils/src/prompts/print-list.md";
				const result = parseGitStatusOutput(gitOutput);

				// 应该包含两个暂存区文件，路径应该完整
				expect(result).toEqual([
					"configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md",
					"packages/utils/src/print.ts",
				]);
				// 确保路径没有被错误截取
				expect(result.find((path) => path.startsWith("ackages"))).toBeUndefined();
			});
		});

		describe("新增测试用例支持", () => {
			test("处理 Windows 风格的路径", () => {
				const gitOutput = "M  configs-package\\\\commitlint-config\\\\src\\\\utils.ts";
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual(["configs-package\\\\commitlint-config\\\\src\\\\utils.ts"]);
			});

			test("处理非常长的文件路径", () => {
				const longPath = "very/long/path/with/many/directories/and/subdirectories/file.txt";
				const gitOutput = `M  ${longPath}`;
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual([longPath]);
			});

			test("处理特殊字符文件名", () => {
				const specialFile = "file-with-特殊字符-and-émojis.txt";
				const gitOutput = `A  ${specialFile}`;
				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual([specialFile]);
			});

			test("处理多种状态混合的复杂场景", () => {
				const gitOutput = [
					"M  modified-staged.js",
					" M modified-working.js",
					"A  added-staged.ts",
					" D deleted-working.css",
					"D  deleted-staged.html",
					"?? untracked.md",
					"AM added-and-modified.vue",
					"MM modified-both.tsx",
				].join("\n");

				const result = parseGitStatusOutput(gitOutput);
				expect(result).toEqual([
					"modified-staged.js",
					"added-staged.ts",
					"deleted-staged.html",
					"added-and-modified.vue",
					"modified-both.tsx",
				]);
			});
		});
	});
});
