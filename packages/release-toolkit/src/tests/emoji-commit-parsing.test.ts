/**
 * 测试 changelogen 的 emoji commit 解析功能
 * 
 * 验证各种提交格式是否能够被正确解析：
 * - gitmoji 代码格式: :sparkles: feat: description
 * - Unicode emoji 格式: ✨ feat: description  
 * - 带作用域: 🐞 fix(scope): description
 * - 标准格式: feat(scope): description
 */

// 简单的测试断言函数
function assert(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(`❌ Test failed: ${message}`);
	}
}

function assertEqual<T>(actual: T, expected: T, message: string) {
	if (actual !== expected) {
		throw new Error(`❌ Test failed: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
	}
}

// changelogen 的提交解析正则表达式（从源码复制）
const ConventionalCommitRegex = /(?<emoji>:.+:|(\uD83C[\uDF00-\uDFFF])|(\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF])|[\u2600-\u2B55])?( *)?(?<type>[a-z]+)(\((?<scope>.+)\))?(?<breaking>!)?: (?<description>.+)/i;

interface CommitMatch {
	emoji?: string;
	type: string;
	scope?: string;
	breaking?: string;
	description: string;
}

/**
 * 解析提交消息并返回匹配的组
 */
function parseCommitMessage(commit: string): CommitMatch | null {
	const match = commit.match(ConventionalCommitRegex);
	if (!match || !match.groups) {
		return null;
	}

	const { emoji, type, scope, breaking, description } = match.groups;
	return {
		emoji: emoji || undefined,
		type,
		scope: scope || undefined,
		breaking: breaking || undefined,
		description,
	};
}

/**
 * 测试各种 emoji 提交格式的解析
 */
function testEmojiCommitParsing() {
	console.log("🧪 Testing Emoji Commit Message Parsing...\n");

	const testCommits = [
		{
			commit: ":sparkles: feat(auth): 新增用户认证功能",
			expected: {
				emoji: ":sparkles:",
				type: "feat",
				scope: "auth",
				description: "新增用户认证功能",
			},
		},
		{
			commit: "✨ feat(auth): 新增用户认证功能",
			expected: {
				emoji: "✨",
				type: "feat",
				scope: "auth", 
				description: "新增用户认证功能",
			},
		},
		{
			commit: "🐞 fix(api): 修复数据获取错误",
			expected: {
				emoji: "🐞",
				type: "fix",
				scope: "api",
				description: "修复数据获取错误",
			},
		},
		{
			commit: "📝 docs: 更新API文档",
			expected: {
				emoji: "📝",
				type: "docs",
				description: "更新API文档",
			},
		},
		{
			commit: "🔧 build(deps): 升级依赖包版本",
			expected: {
				emoji: "🔧",
				type: "build",
				scope: "deps",
				description: "升级依赖包版本",
			},
		},
		{
			commit: "📦 chore: 更新构建配置",
			expected: {
				emoji: "📦",
				type: "chore",
				description: "更新构建配置",
			},
		},
		{
			commit: "feat(api): 新增数据导出功能",
			expected: {
				type: "feat",
				scope: "api",
				description: "新增数据导出功能",
			},
		},
	];

	let passedTests = 0;
	testCommits.forEach(({ commit, expected }, index) => {
		try {
			const result = parseCommitMessage(commit);
			
			assert(result !== null, `Commit should be parseable: "${commit}"`);
			assertEqual(result!.type, expected.type, `Type mismatch for commit: "${commit}"`);
			assertEqual(result!.scope, expected.scope, `Scope mismatch for commit: "${commit}"`);
			assertEqual(result!.emoji, expected.emoji, `Emoji mismatch for commit: "${commit}"`);
			assertEqual(result!.description, expected.description, `Description mismatch for commit: "${commit}"`);
			
			console.log(`✅ Test #${index + 1} passed: "${commit}"`);
			console.log(`   → Type: ${result!.type}, Scope: ${result!.scope || 'none'}, Emoji: ${result!.emoji || 'none'}`);
			console.log(`   → Description: ${result!.description}\n`);
			passedTests++;
		} catch (error) {
			console.error(`❌ Test #${index + 1} failed: "${commit}"`);
			console.error(`   → ${error.message}\n`);
		}
	});

	return passedTests;
}

/**
 * 测试无效的提交消息
 */
function testInvalidCommitMessages() {
	console.log("🧪 Testing Invalid Commit Messages...\n");

	const invalidCommits = [
		"just a random message",
		"feat without colon",
		"123: starts with number (no type)",
	];

	let passedTests = 0;
	invalidCommits.forEach((commit, index) => {
		try {
			const result = parseCommitMessage(commit);
			assert(result === null, `Invalid commit should return null: "${commit}"`);
			console.log(`✅ Invalid test #${index + 1} passed: "${commit}" → null`);
			passedTests++;
		} catch (error) {
			console.error(`❌ Invalid test #${index + 1} failed: "${commit}"`);
			console.error(`   → ${error.message}`);
		}
	});

	return passedTests;
}

/**
 * 测试 breaking changes 解析
 */
function testBreakingChanges() {
	console.log("\n🧪 Testing Breaking Changes...\n");

	const breakingCommit = "🔥 feat!: remove deprecated API";
	
	try {
		const result = parseCommitMessage(breakingCommit);
		
		assert(result !== null, "Breaking commit should be parseable");
		assertEqual(result!.type, "feat", "Breaking change type should be feat");
		assertEqual(result!.breaking, "!", "Breaking change marker should be !");
		assertEqual(result!.description, "remove deprecated API", "Breaking change description should match");
		
		console.log(`✅ Breaking change test passed: "${breakingCommit}"`);
		console.log(`   → Type: ${result!.type}, Breaking: ${result!.breaking}, Description: ${result!.description}`);
		
		return 1;
	} catch (error) {
		console.error(`❌ Breaking change test failed: "${breakingCommit}"`);
		console.error(`   → ${error.message}`);
		return 0;
	}
}

/**
 * 测试带有 PR 引用的提交
 */
function testPullRequestReferences() {
	console.log("\n🧪 Testing Pull Request References...\n");

	const commitWithPR = "✨ feat(auth): add OAuth support (#123)";
	
	try {
		const result = parseCommitMessage(commitWithPR);
		
		assert(result !== null, "PR commit should be parseable");
		assertEqual(result!.type, "feat", "PR commit type should be feat");
		assertEqual(result!.scope, "auth", "PR commit scope should be auth");
		assertEqual(result!.description, "add OAuth support (#123)", "PR commit description should include PR reference");
		
		console.log(`✅ PR reference test passed: "${commitWithPR}"`);
		console.log(`   → Type: ${result!.type}, Scope: ${result!.scope}, Description: ${result!.description}`);
		
		return 1;
	} catch (error) {
		console.error(`❌ PR reference test failed: "${commitWithPR}"`);
		console.error(`   → ${error.message}`);
		return 0;
	}
}

/**
 * 验证所有支持的格式
 */
function testSupportedFormats() {
	console.log("\n🧪 Testing Supported Format Coverage...\n");

	const supportedFormats = [
		"gitmoji 代码格式: :sparkles: type: description",
		"Unicode emoji 格式: ✨ type: description", 
		"带作用域: 🐞 type(scope): description",
		"标准格式: type(scope): description",
	];

	const testCases = [
		":sparkles: feat: new feature",
		"✨ feat: new feature",
		"🐞 fix(api): bug fix",
		"feat(api): standard format",
	];

	let passedTests = 0;
	testCases.forEach((commit, index) => {
		try {
			const result = parseCommitMessage(commit);
			assert(result !== null, `Supported format should be parseable: "${commit}"`);
			console.log(`✅ Format ${index + 1} supported: ${supportedFormats[index]}`);
			console.log(`   → Parsed: "${commit}" → Type: ${result!.type}\n`);
			passedTests++;
		} catch (error) {
			console.error(`❌ Format ${index + 1} failed: ${supportedFormats[index]}`);
			console.error(`   → ${error.message}\n`);
		}
	});

	return passedTests;
}

/**
 * 运行所有测试
 */
export function runAllTests() {
	console.log("🚀 Starting Emoji Commit Parsing Tests\n");
	console.log("=" .repeat(50));
	
	const results = {
		emojiParsing: testEmojiCommitParsing(),
		invalidMessages: testInvalidCommitMessages(),
		breakingChanges: testBreakingChanges(),
		prReferences: testPullRequestReferences(),
		supportedFormats: testSupportedFormats(),
	};
	
	console.log("=" .repeat(50));
	console.log("📊 Test Results Summary:");
	console.log(`✅ Emoji parsing: ${results.emojiParsing}/7 tests passed`);
	console.log(`✅ Invalid messages: ${results.invalidMessages}/3 tests passed`);
	console.log(`✅ Breaking changes: ${results.breakingChanges}/1 tests passed`);
	console.log(`✅ PR references: ${results.prReferences}/1 tests passed`);
	console.log(`✅ Supported formats: ${results.supportedFormats}/4 tests passed`);
	
	const totalPassed = Object.values(results).reduce((sum, count) => sum + count, 0);
	const totalTests = 16;
	
	console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed / totalTests * 100)}%)`);
	
	if (totalPassed === totalTests) {
		console.log("🎉 All tests passed! Emoji commit parsing is working correctly.");
	} else {
		console.log("⚠️  Some tests failed. Please check the implementation.");
	}
	
	return totalPassed === totalTests;
}