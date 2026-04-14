# commitlint.config.cjs 配置

<!-- automd:badges color="yellow" name="@ruan-cat/commitlint-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/commitlint-config?color=yellow)](https://npmjs.com/package/@ruan-cat/commitlint-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/commitlint-config?color=yellow)](https://npm.chart.dev/@ruan-cat/commitlint-config)

<!-- /automd -->

阮喵喵自用的 `commitlint.config.cjs` 的配置，是一个 `cjs` 的包。

## 功能

- 🚀 **一键初始化**：提供 CLI 命令，快速初始化项目的 `commitlint` 配置
- 📦 **自动识别包**：根据 `pnpm-workspace.yaml` 自动识别 monorepo 项目内的全部包。如果根目录不存在 `pnpm-workspace.yaml` 文件，则不会扫描整个工作区。
- 🎯 **自定义提交域**：用户可以自定义提交域，满足不同项目需求

### 自动识别包功能

根据提交内容的路径，组装出提交范围。如下图所示：

![2025-09-14-15-26-38](https://s2.loli.net/2025/09/14/9bYhej5cNnBPzdA.png)

### 智能 Glob 匹配功能

除了基础的包路径匹配，还支持基于 glob 模式的智能范围匹配：

- **叠加匹配**：保留原有的包路径匹配，同时根据文件路径匹配预定义的范围模式
- **多范围支持**：一个文件可以同时匹配多个范围，如 `turbo.json` 文件会同时匹配 `config` 和 `turbo` 范围
- **预设模式**：内置常用文件的匹配模式，如配置文件、提示词文件、路由文件等

示例：

- `configs-package/commitlint-config/prompts/test.md` → `commitlint-config` + `prompt`
- `packages/utils/turbo.json` → `utils` + `config` + `turbo`

## 安装

<!-- automd:pm-install name="@ruan-cat/commitlint-config" dev -->

```sh
# ✨ Auto-detect
npx nypm install -D @ruan-cat/commitlint-config

# npm
npm install -D @ruan-cat/commitlint-config

# yarn
yarn add -D @ruan-cat/commitlint-config

# pnpm
pnpm add -D @ruan-cat/commitlint-config

# bun
bun install -D @ruan-cat/commitlint-config

# deno
deno install --dev npm:@ruan-cat/commitlint-config
```

<!-- /automd -->

### 安装对等依赖

本库应当作为开发环境依赖。其中，`commitizen` 和 `cz-git` 为本包的**必需对等依赖**，需要同时安装：

```sh
# pnpm（推荐）
pnpm add -D @ruan-cat/commitlint-config commitizen cz-git

# npm
npm install -D @ruan-cat/commitlint-config commitizen cz-git

# yarn
yarn add -D @ruan-cat/commitlint-config commitizen cz-git
```

## 侧重点

本包的侧重点，在于面向 `commitizen` 和 `cz-git` 提供交互式配置，未来会逐步增加针对 `commitlint` 的配置。

## 快速初始化

**推荐使用方式**：无需手动安装，直接使用一行命令快速初始化配置文件：

> 尽管可以通过命令行的方式初始化配置，但是在具体项目应用时，还是应该安装好上述依赖。

```bash
# 使用 pnpm
pnpm dlx @ruan-cat/commitlint-config init

# 或使用 npm
npx @ruan-cat/commitlint-config init
```

该命令会自动在当前目录创建：

- `.czrc` - `commitizen` 配置文件
- `commitlint.config.cjs` - `commitlint` 配置文件

### 命令选项

```bash
# 基本用法
pnpm dlx @ruan-cat/commitlint-config init

# 强制覆盖已存在的文件（跳过警告提示）
pnpm dlx @ruan-cat/commitlint-config init --force
pnpm dlx @ruan-cat/commitlint-config init -f

# 查看帮助信息
pnpm dlx @ruan-cat/commitlint-config --help
pnpm dlx @ruan-cat/commitlint-config init --help

# 查看版本号
pnpm dlx @ruan-cat/commitlint-config --version
```

**选项说明：**

- `-f, --force` - 强制覆盖已存在的文件，跳过覆盖警告提示

> **注意**：如果目录中已存在同名配置文件，默认会显示警告信息。使用 `--force` 选项可以跳过警告直接覆盖。

## 使用方式

### 最简使用

直接导入默认的配置即可。

```js
// commitlint.config.cjs
/** @type {import('cz-git').UserConfig} */
module.exports = require("@ruan-cat/commitlint-config").default;
```

### 可拓展配置

可以使用 `getUserConfig` 函数来拓展配置。

<!-- automd:file src="./templates/commitlint.config.cjs" code -->

```cjs [commitlint.config.cjs]
// commitlint.config.cjs
/** @type {import('cz-git').UserConfig} */
module.exports = require("@ruan-cat/commitlint-config").getUserConfig({
	config: {
		// 推荐不打印提交范围
		isPrintScopes: false,
	},
});
```

<!-- /automd -->

### 类型标注

可以使用 `ScopesItemWithDesc` 类型来标注配置数组。

```js
// commitlint.config.cjs
// @ts-check
/**
 * @type { import("@ruan-cat/commitlint-config").ScopesItemWithDesc[] }
 */
const userScopes = [
	{ code: "process", value: "流程应用管理", desc: "流程应用管理" },
	{ code: "personal", value: "个人设置", desc: "个人设置" },
];
/** @type {import('cz-git').UserConfig} */
module.exports = require("@ruan-cat/commitlint-config").getUserConfig({
	userScopes,
	config: {
		isPrintScopes: false,
	},
});
```

## 类似功能的依赖包

- [@commitlint/config-pnpm-scopes](https://npm.im/@commitlint/config-pnpm-scopes)
- [commitlint-config-pnpm-workspace](https://npm.im/commitlint-config-pnpm-workspace)

## 被封装的配置文件

如下所示：

<details>

<summary>
被封装的配置文件
</summary>

<!-- prettier-ignore-start -->
<!-- automd:file src="./src/config.ts" code -->

```ts [config.ts]
import { type UserConfig } from "cz-git";
import { convertCommitTypesToCzGitFormat, getScopes, getTypes } from "./utils.ts";
import { getDefaultScope } from "./get-default-scope.ts";

/**
 * @description
 * 这个配置文件不能使用ts格式 ts不被支持
 *
 * 该配置没有 scopes 范围
 *
 * @see https://cz-git.qbb.sh/zh/config/#中英文对照模板
 * @see https://cz-git.qbb.sh/zh/recipes/#
 */
export const config: UserConfig = {
	/**
	 * @see https://blog.csdn.net/gitblog_00135/article/details/150699293
	 * @see https://commitlint.js.org/#/reference-rules
	 */
	rules: {
		// 提交类型做报错
		"type-enum": [2, "always", getTypes()],

		// 提交范围做警告
		"scope-enum": [1, "always", getScopes()],
	},

	prompt: {
		alias: { fd: "docs: fix typos" },

		messages: {
			type: "选择你要提交的类型 :",
			scope: "选择一个提交范围（可选）:",
			customScope: "请输入自定义的提交范围 :",
			subject: "填写简短精炼的变更描述 :\n",
			body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
			breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
			footerPrefixesSelect: "选择关联issue前缀（可选）:",
			customFooterPrefix: "输入自定义issue前缀 :",
			footer: "列举关联issue (可选) 例如: #31, #I3244 :\n",
			confirmCommit: "是否提交或修改commit ?",
		},

		/**
		 * 基于monorepo内项目，决定提交范围域
		 *
		 * 该配置可以用 getUserConfig 函数设置
		 */
		// scopes,

		// https://cz-git.qbb.sh/zh/recipes/#多选模式
		enableMultipleScopes: true,
		scopeEnumSeparator: ",",

		allowCustomScopes: true,
		allowEmptyScopes: true,
		customScopesAlign: "bottom",
		customScopesAlias: "custom",
		emptyScopesAlias: "empty",

		types: convertCommitTypesToCzGitFormat(),
		useEmoji: true,
		emojiAlign: "center",
		useAI: false,
		aiNumber: 1,
		themeColorCode: "",

		upperCaseSubject: false,
		/** 允许使用破坏性变更的标记 */
		markBreakingChangeMode: true,
		allowBreakingChanges: ["feat", "fix"],
		breaklineNumber: 100,
		breaklineChar: "|",
		skipQuestions: [],
		issuePrefixes: [
			// 如果使用 gitee 作为开发管理
			{ value: "link", name: "link:     链接 ISSUES 进行中" },
			{ value: "closed", name: "closed:   标记 ISSUES 已完成" },
		],
		customIssuePrefixAlign: "top",
		emptyIssuePrefixAlias: "skip",
		customIssuePrefixAlias: "custom",
		allowCustomIssuePrefix: true,
		allowEmptyIssuePrefix: true,
		confirmColorize: true,
		scopeOverrides: undefined,
		defaultBody: "",
		defaultIssues: "",
		defaultScope: getDefaultScope() || "",
		defaultSubject: "",
	},
};
```

<!-- /automd -->
<!-- prettier-ignore-end -->

## 提交类型 commit-types.ts

<!-- automd:file src="./src/commit-types.ts" code -->

```ts [commit-types.ts]
import { CommitType } from "./type.ts";

export const commitTypes: CommitType[] = [
	{
		emoji: "✨",
		type: "feat",
		semver: "minor",
		description: "新增功能",
		longDescription: "A new feature",
	},
	{
		emoji: "🐞",
		type: "fix",
		semver: "patch",
		description: "修复缺陷",
		longDescription: "A bug fix",
	},
	{
		emoji: "📃",
		type: "docs",
		description: "文档更新",
		longDescription: "Documentation only changes",
	},
	{
		emoji: "📦",
		type: "deps",
		semver: "patch",
		description: "依赖更新",
	},
	{
		emoji: "🧪",
		type: "test",
		description: "测试相关",
		longDescription: "Adding missing tests or correcting existing tests",
	},
	{
		emoji: "🔨",
		type: "build",
		semver: "patch",
		description: "构建相关",
		longDescription: "Changes that affect the build system or external dependencies",
	},
	{
		emoji: "🐎",
		type: "ci",
		description: "持续集成",
		longDescription: "Changes to our CI configuration files and scripts",
	},
	{
		emoji: "📢",
		type: "publish",
		description: "发布依赖包",
		longDescription: "依赖包发布版本。",
	},
	{
		emoji: "🦄",
		type: "refactor",
		semver: "patch",
		description: "代码重构",
		longDescription: "A code change that neither fixes a bug nor adds a feature",
	},
	{
		emoji: "🎈",
		type: "perf",
		semver: "patch",
		description: "性能提升",
		longDescription: "A code change that improves performance",
	},
	{
		emoji: "🎉",
		type: "init",
		semver: "patch",
		description: "初始化项目",
		longDescription: "项目初始化。",
	},
	{
		emoji: "🔧",
		type: "config",
		semver: "patch",
		description: "更新配置",
		longDescription: "配置更新。通用性的配置更新。",
	},
	{
		emoji: "🐳",
		type: "chore",
		semver: "patch",
		description: "其他修改",
		longDescription: "Other changes that do not modify src or test files",
	},
	{
		emoji: "🔙",
		type: "revert",
		description: "回退代码",
		longDescription: "Revert to a commit",
	},
	{
		emoji: "🔪",
		type: "delete",
		description: "删除垃圾",
		longDescription: "删除无意义的东西，注释，文件，代码段等。",
	},
	{
		emoji: "🌐",
		type: "i18n",
		description: "国际化",
		longDescription: "专门设置国际化的翻译文本。",
	},
	{
		emoji: "🌈",
		type: "style",
		description: "代码格式",
		longDescription: "Changes that do not affect the meaning of the code",
	},
	{
		emoji: "🤔",
		type: "save-file",
		description: "保存文件",
		longDescription: "仅仅是为了保存文件。",
	},
	// 暂不需要该提交类型。
	// {
	// 	emoji: "✋",
	// 	type: "main-pull-update",
	// 	description: "主分支拉取更新",
	// 	longDescription: "主分支拉取更新。",
	// },
	// {
	// 	emoji: "⏩",
	// 	type: "mark-progress",
	// 	description: "标记进度",
	// 	longDescription: "标记进度。",
	// },
];
```

<!-- /automd -->

## 常用提交范围 common-scopes.ts

<!-- automd:file src="./src/common-scopes.ts" code -->

```ts [common-scopes.ts]
/**
 * 用户自己额外配置的范围项 拆分出表述文本的配置项
 * @description
 */
export type ScopesItemWithDesc = {
	/** 输入时的提示词 */
	code: string;

	/**
	 * 最终显示在 git commit 的文本
	 * @description
	 * 即 git commit 的 scope 值。
	 */
	value: string;

	/** 表述文本 */
	desc: string;

	/**
	 * 生成git提交范围用的 glob 匹配路径
	 * @description
	 * 如果 glob 存在，则表示该范围的提交范围，会根据 glob 的匹配结果，进行范围的合并。
	 */
	glob?: string[];
};

/**
 * 常用的范围配置
 * @description
 * 该配置是为了提供更多的范围配置，以便于更好的管理提交范围。
 *
 * 这里罗列一些高频更改配置的文件，并定位为专门的提交范围。
 *
 * 这些配置范围，大多数是从具体项目中 不断提炼出来的常用范围
 */
export const commonScopes: ScopesItemWithDesc[] = [
	// 根目录
	{
		code: "root",
		value: "root",
		desc: "根目录",
		glob: [
			// === 基础点配置文件 ===
			".gitignore",
			".gitattributes",
			".czrc",
			".nvmrc",
			".npmrc",
			".editorconfig",

			// Prettier 配置
			".prettierrc",
			".prettierrc.js",
			".prettierrc.cjs",
			".prettierrc.mjs",
			".prettierrc.json",
			".prettierrc.yaml",
			".prettierrc.yml",
			".prettierignore",

			// ESLint 配置（根目录的）
			".eslintrc",
			".eslintrc.js",
			".eslintrc.cjs",
			".eslintrc.json",
			".eslintrc.yaml",
			".eslintrc.yml",
			".eslintignore",

			// === 文档文件 ===
			"README",
			"README.md",
			"README.txt",
			"LICENSE",
			"LICENSE.md",
			"LICENSE.txt",
			"CHANGELOG",
			"CHANGELOG.md",
			"CONTRIBUTING",
			"CONTRIBUTING.md",
			"CODE_OF_CONDUCT",
			"CODE_OF_CONDUCT.md",
			"SECURITY",
			"SECURITY.md",

			// === 根目录脚本 ===
			"*.sh", // Shell 脚本
			"*.bat", // Windows 批处理
			"*.ps1", // PowerShell 脚本
			"*.cmd", // Windows 命令脚本

			// === 其他常见根目录配置 ===
			"Makefile",
			"Dockerfile",
			".dockerignore",
		],
	},

	// 配置文件
	{
		code: "config",
		value: "config",
		desc: "各种配置文件",
		glob: [
			"**/*.config.js",
			"**/*.config.ts",
			"**/*.config.cjs",
			"**/*.config.mjs",
			"**/*.config.json",
			".config/**",
			"**/turbo.json",
		],
	},

	// 任务调度器
	{
		code: "turbo",
		value: "turbo",
		desc: "任务调度器",
		glob: ["**/turbo.json"],
	},

	// 包配置
	{
		code: "package.json",
		value: "package.json",
		desc: "包配置",
		glob: ["**/package.json", "pnpm-workspace.yaml"],
	},

	// vite打包工具配置
	{
		code: "vite.config.js/ts",
		value: "vite",
		desc: "vite打包工具配置",
		glob: ["**/vite.config.js", "**/vite.config.ts"],
	},

	// vitepress文档工具配置
	{
		code: "vitepress",
		value: "vitepress",
		desc: "vitepress文档工具配置",
		glob: ["**/.vitepress/config.mts", "**/.vitepress/config.ts", "**/.vitepress/theme/index.ts"],
	},

	// cz配置，即git提交工具的配置
	{
		code: "commitlint.config.cjs",
		value: "commitlint",
		desc: "cz配置，即git提交工具的配置",
		glob: ["**/commitlint.config.cjs"],
	},

	// typescript项目配置
	{
		code: "tsconfig",
		value: "tsc",
		desc: "typescript项目配置",
		glob: ["**/tsconfig*.json"],
	},

	// server 服务端接口
	{
		code: "server",
		value: "server",
		desc: "服务端接口",
		glob: ["**/server/**/*.ts", "**/servers/**/*.ts"],
	},

	// 路由
	{
		code: "router",
		value: "router",
		desc: "路由配置",
		glob: ["**/router/**/*.ts", "**/routers/**/*.ts"],
	},

	// vscode配置
	{
		code: "vscode/settings.json",
		value: "vsc",
		desc: "vscode配置",
		glob: ["**/.vscode/**"],
	},

	// 国际化
	{
		code: "i18n",
		value: "i18n",
		desc: "国际化",
		glob: [
			"**/locales/**",
			"**/lang/**",
			"**/i18n/**",
			"**/i18n.config.{js,ts,cjs,mjs}",
			"**/i18n.{js,ts,cjs,mjs}",
			"**/plugins/i18n.{js,ts,cjs,mjs}",
		],
	},

	// 提示词
	{
		code: "prompt",
		value: "prompt",
		desc: "提示词。特指和AI协作使用的提示词文件。",
		glob: ["**/prompts/**/*.md", ".github/prompts/**/*.md"],
	},

	// API接口
	{
		code: "api",
		value: "api",
		desc: "API接口",
	},

	// openspec 提示词文档配置
	{
		code: "openspec",
		value: "openspec",
		desc: "openspec提示词文档配置。特指高强度在 openspec 目录内迭代更新的任务说明文档。",
		glob: ["**/openspec/**/*.md"],
	},

	// claude code的配置
	{
		code: "claude",
		value: "claude",
		desc: "claude code的配置。特指在claude code生成或使用的文件。包括配置、提示词、代理、记忆文件等。",
		glob: ["**/.claude/**", "**/.claude-plugin/**", "**/CLAUDE*.md"],
	},
];
```

<!-- /automd -->

</details>

## 其他参考

本包经常用于给阮喵喵维护的项目初始化简单的 `cz` 配置，这里提供[阮喵喵常用的 cz 配置笔记](https://notes.ruan-cat.com/cz)，便于阅读。
