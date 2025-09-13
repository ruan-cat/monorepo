import { type UserConfig } from "cz-git";
import { convertCommitTypesToCzGitFormat, getDefaultScope } from "./utils.ts";

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
