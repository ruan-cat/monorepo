import { type Config } from "@ruan-cat/vercel-deploy-tool/src/config.ts";

import { domains } from "@ruan-cat/domains";

export default <Config>{
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "",
	vercelOrgId: "team_cUeGw4TtOCLp0bbuH8kA7BYH",
	vercelProjectId: "prj_THvaBaRzKye5CMlL72WMlvQLtFlB",

	isShowCommand: true,
	// afterBuildTasks: ["pnpm turbo build:docs"],

	// FIXME: execa运行的turbo命令，不会使用cache缓存，导致了重复构建。
	deployTargets: [
		// 01星球建议笔记
		{
			type: "userCommands",
			targetCWD: "./docs/docs-01-star",
			url: domains["01s-doc"] as unknown as string[],
			outputDirectory: "config/.vitepress/dist",
			userCommands: ["pnpm -C=./docs/docs-01-star build:docs"],
		},

		// 1号项目
		// {
		// 	type: "userCommands",
		// 	targetCWD: "./tests/monorepo-1",
		// 	outputDirectory: "dist",
		// 	url: ["monorepo-1.ruancat6312.top"],
		// 	userCommands: ["pnpm -C=./tests/monorepo-1 build:docs"],
		// },

		// 2号项目 通过测试 多域名可以实现部署
		// {
		// 	type: "userCommands",
		// 	targetCWD: "./packages/proj-2-vp2-custom-components",
		// 	outputDirectory: "src/.vuepress/dist/**/*",
		// 	url: ["monorepo-2.ruancat6312.top", "m2.ruan-cat.com", "m2.ruancat6312.top"],
		// 	userCommands: [
		// 		// "pnpm -C=./packages/proj-2-vp2-custom-components build:docs"
		// 		// "pnpm -C='./' turbo build:docs",
		// 		// "pnpm turbo build:docs",
		// 	],
		// },
		// 3号项目 通过测试
		// {
		// 	type: "userCommands",
		// 	targetCWD: "./packages/monorepo-3",
		// 	outputDirectory: "src/.vuepress/dist/**/*",
		// 	url: ["monorepo-3.ruancat6312.top"],
		// 	userCommands: ["pnpm -C=./packages/monorepo-3 build:docs"],
		// },
		// 4号项目 通过测试
		// {
		// 	type: "userCommands",
		// 	targetCWD: "./packages/monorepo-4",
		// 	outputDirectory: "src/.vuepress/dist/**/*",
		// 	url: ["monorepo-4.ruancat6312.top"],
		// 	userCommands: ["pnpm -C=./packages/monorepo-4 build:docs"],
		// },
		// 5号项目 通过测试
		// {
		// 	type: "userCommands",
		// 	targetCWD: "./packages/monorepo-5",
		// 	outputDirectory: "src/.vuepress/dist/**/*",
		// 	url: ["monorepo-5.ruancat6312.top", "monorepo5.ruan-cat.com"],
		// 	userCommands: ["pnpm -C=./packages/monorepo-5 build:docs"],
		// },
		// mikutap项目 测试通过
		// mikutap项目是一个原生H5项目 是一堆纯静态文件 所以没必要频繁部署
		// {
		// 	type: "static",
		// 	targetCWD: "./demos/gh.HFIProgramming.mikutap",
		// 	url: ["mikutap.ruancat6312.top"],
		// 	// 测试类型约束是否到位。
		// 	// userCommands: ["echo 'mikutap1'", "echo 'mikutap2'", "echo 'mikutap3'"],
		// },

		// 工具包文档项目
		{
			type: "userCommands",
			targetCWD: "./packages/utils",
			outputDirectory: "docs/.vuepress/dist",
			url: domains.utils as unknown as string[],
			userCommands: ["pnpm -C=./packages/utils build:docs"],
		},

		// 域名列表
		{
			type: "userCommands",
			targetCWD: "./packages/domains",
			outputDirectory: "docs/.vuepress/dist",
			url: domains.domain as unknown as string[],
			userCommands: ["pnpm -C=./packages/domains build:docs"],
		},
	],
};
