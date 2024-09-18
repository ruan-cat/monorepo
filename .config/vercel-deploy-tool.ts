import { type Config } from "@ruan-cat/vercel-deploy-tool/config.ts";
export default <Config>{
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",

	afterBuildTasks: ["pnpm run turbo build:docs"],

	deployTargets: [
		// 01星球建议笔记
		{
			type: "userCommands",
			targetCWD: "./packages/docs-01-star",
			url: ["docs-01-star.ruancat6312.top"],
			outputDirectory: "docs/.vitepress/dist/**/*",
			userCommands: ["pnpm -C=./packages/docs-01-star build:docs"],
		},

		// 1号项目
		{
			type: "userCommands",
			targetCWD: "./packages/monorepo-1",
			outputDirectory: "src/.vuepress/dist/**/*",
			url: ["monorepo-1.ruancat6312.top"],
			userCommands: ["pnpm -C=./packages/monorepo-1 build:docs"],
		},

		// 2号项目
		{
			type: "userCommands",
			targetCWD: "./packages/proj-2-vp2-custom-components",
			outputDirectory: "src/.vuepress/dist/**/*",
			url: ["monorepo-2.ruancat6312.top", "m2.ruan-cat.com", "m2.ruancat6312.top"],
			userCommands: ["pnpm -C=./packages/proj-2-vp2-custom-components build:docs"],
		},

		// 3号项目
		{
			type: "userCommands",
			targetCWD: "./packages/monorepo-3",
			outputDirectory: "src/.vuepress/dist/**/*",
			url: ["monorepo-3.ruancat6312.top"],
			userCommands: ["pnpm -C=./packages/monorepo-3 build:docs"],
		},

		// 4号项目
		{
			type: "userCommands",
			targetCWD: "./packages/monorepo-4",
			outputDirectory: "src/.vuepress/dist/**/*",
			url: ["monorepo-4.ruancat6312.top"],
			userCommands: ["pnpm -C=./packages/monorepo-4 build:docs"],
		},

		// 5号项目
		{
			type: "userCommands",
			targetCWD: "./packages/monorepo-5",
			outputDirectory: "src/.vuepress/dist/**/*",
			url: ["monorepo-5.ruancat6312.top", "monorepo5.ruan-cat.com"],
			userCommands: ["pnpm -C=./packages/monorepo-5 build:docs"],
		},

		// mikutap项目
		{
			type: "static",
			targetCWD: "./demos/gh.HFIProgramming.mikutap",
			url: ["mikutap.ruancat6312.top"],
			// 测试类型约束是否到位。
			// userCommands: ["echo 'mikutap1'", "echo 'mikutap2'", "echo 'mikutap3'"],
		},
	],
};
