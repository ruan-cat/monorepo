import { describe, test, expect } from "vitest";
import { formatCommitToChangelogLine } from "../plugins/changelog-with-changelogen";
import type { GitCommit } from "changelogen";

// Helper to create mock commit
function createMockCommit(overrides: Partial<GitCommit>): GitCommit {
	return {
		shortHash: "abc1234",
		message: "test message",
		description: "test description",
		type: "feat",
		scope: "",
		isBreaking: false,
		authors: [],
		references: [],
		body: "",
		...overrides,
	} as GitCommit;
}

describe("changelog-parsing-verification", () => {
	describe("Requirement: 解析标准 Conventional Commits", () => {
		test("Scenario: 解析带作用域的标准提交", () => {
			const commit = createMockCommit({
				type: "feat",
				scope: "auth",
				description: "add login support",
			});
			const line = formatCommitToChangelogLine(commit);

			expect(line).toContain("**feat**");
			expect(line).toContain("(auth)");
			expect(line).toContain("add login support");
		});

		test("Scenario: 解析无作用域的标准提交", () => {
			const commit = createMockCommit({
				type: "fix",
				scope: "",
				description: "crash on startup",
			});
			const line = formatCommitToChangelogLine(commit);

			expect(line).toContain("**fix**");
			expect(line).not.toContain("()");
			expect(line).toContain("crash on startup");
		});
	});

	describe("Requirement: 解析 Breaking Changes", () => {
		test("Scenario: 解析感叹号标记的 Breaking Change", () => {
			const commit = createMockCommit({
				type: "feat",
				description: "remove legacy api",
				isBreaking: true,
			});
			const line = formatCommitToChangelogLine(commit);

			expect(line).toContain("**BREAKING**: ");
			expect(line).toContain("remove legacy api");
		});
	});

	describe("Requirement: 生成链接", () => {
		test("Scenario: 包含提交哈希链接", () => {
			const commit = createMockCommit({
				shortHash: "def5678",
				description: "update docs",
				type: "docs",
			});
			const repoUrl = "https://github.com/ruan-cat/monorepo";

			const line = formatCommitToChangelogLine(commit, repoUrl);

			expect(line).toContain("([def5678](https://github.com/ruan-cat/monorepo/commit/def5678))");
		});

		test("Scenario: 不提供 repoUrl 时不生成链接", () => {
			const commit = createMockCommit({
				shortHash: "def5678",
				description: "update docs",
				type: "docs",
			});

			const line = formatCommitToChangelogLine(commit); // No repoUrl

			expect(line).not.toContain("([def5678]");
			expect(line).not.toContain("http");
		});
	});
});
