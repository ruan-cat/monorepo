# commitlint.config.cjs 配置

<!-- automd:badges color="yellow" name="@ruan-cat/commitlint-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/commitlint-config?color=yellow)](https://npmjs.com/package/@ruan-cat/commitlint-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/commitlint-config?color=yellow)](https://npm.chart.dev/@ruan-cat/commitlint-config)

<!-- /automd -->

阮喵喵自用的 commitlint.config.cjs 的配置，是一个 cjs 的包。

## 功能

- 根据 pnpm-workspace.yaml 自动识别 monorepo 项目内的全部包。如果根目录不存在 pnpm-workspace.yaml 文件，则不会扫描整个工作区。
- 用户可以自定义提交域。

## 安装

```bash
pnpm i -D commitizen cz-git @ruan-cat/commitlint-config
```

本库应当作为开发环境依赖。其中，commitizen 和 cz-git 为本依赖包的对等依赖。

## 使用方式

### 最简使用

直接导入默认的配置即可。

```js
// commitlint.config.cjs
// @ts-check
module.exports = require("@ruan-cat/commitlint-config").default;
```

### 可拓展配置

可以使用 `getUserConfig` 函数来拓展配置。

```js
// commitlint.config.cjs
// @ts-check
module.exports = require("@ruan-cat/commitlint-config").getUserConfig({
	config: {
		// 推荐不打印提交范围
		isPrintScopes: false,
	},
});
```

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
	rules: {
		// @see: https://commitlint.js.org/#/reference-rules
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

		types: [
			{ value: "✨ feat", name: "✨ feat:     新增功能 | A new feature" },
			{ value: "🐞 fix", name: "🐞 fix:      修复缺陷 | A bug fix" },
			{ value: "📃 docs", name: "📃 docs:     文档更新 | Documentation only changes" },
			{ value: "🧪 test", name: "🧪 test:     测试相关 | Adding missing tests or correcting existing tests" },
			{
				value: "🔧 build",
				name: "🔧 build:    构建相关 | Changes that affect the build system or external dependencies",
			},
			{ value: "🐎 ci", name: "🐎 ci:       持续集成 | Changes to our CI configuration files and scripts" },
			{ value: "📢 publish", name: "📢 publish:  发包 | 依赖包发布版本。" },
			{
				value: "🦄 refactor",
				name: "🦄 refactor: 代码重构 | A code change that neither fixes a bug nor adds a feature",
			},
			{ value: "🎈 perf", name: "🎈 perf:     性能提升 | A code change that improves performance" },
			{ value: "🎉 init", name: "🎉 init:     初始化 | 项目初始化。" },
			{ value: "⚙️ config", name: "⚙️ config:    更新配置 | 配置更新。通用性的配置更新。" },

			{ value: "🐳 chore", name: "🐳 chore:    其他修改 | Other changes that do not modify src or test files" },
			{ value: "↩ revert", name: "↩ revert:   回退代码 | Revert to a commit" },
			{ value: "🗑 del", name: "🗑 del:    删除垃圾 | 删除无意义的东西，注释，文件，代码段等。" },
			{ value: "🌐 i18n", name: "🌐 i18n:    国际化 | 专门设置国际化的翻译文本。" },
			{ value: "🌈 style", name: "🌈 style:    代码格式 | Changes that do not affect the meaning of the code" },
			{
				value: "🤔 save-file",
				name: "🤔 save-file:    保存文件 | 文件保存类型。仅仅是为了保存文件。有时候会需要紧急提交，并快速切换分支。此时就需要提交代码。并保存文件。",
			},
			{ value: "✋ main-pull-update", name: "✋ main-pull-update:    主分支拉取更新 | 主分支拉取更新。" },
			{ value: "⏩ mark-progress", name: "⏩ mark-progress:    标记进度 | 标记进度。" },
		],
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
		defaultScope: "",
		defaultSubject: "",
	},
};
```

<!-- /automd -->
<!-- prettier-ignore-end -->

</details>

## 其他参考

本包经常用于给阮喵喵维护的项目初始化简单的 cz 配置，这里提供[阮喵喵常用的cz配置笔记](https://notes.ruan-cat.com/cz)，便于阅读。

## 路线图

TODO: 做一个自动识别 git 提交区文件的工具，识别文件的修改范围，而不是自己选择范围。每当 git add . 之后，就用 glob 库自主识别这些文件所属的提交区范围。然后至顶区提供已经索引好的，字母排序的提交区范围。
