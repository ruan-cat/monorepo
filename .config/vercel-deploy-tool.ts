import { type Config } from "@ruan-cat/vercel-deploy-tool/config.ts";
export default <Config>{
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",

	afterBuildTasks: ["pnpm run turbo build:docs"],

	deployTargets: [
		{
			type: "userCommands",
			targetCWD: "./packages/docs-01-star",
			url: ["docs-01-star.ruancat6312.top"],
			outputDirectory: "docs/.vitepress/dist/**/*",
			userCommands: ["pnpm -C=./packages/docs-01-star build:docs"],
		},

		// {
		// 	type: "userCommands",
		// 	targetCWD: "./packages/monorepo-5",
		// 	outputDirectory: "src/.vuepress/dist/**/*",
		// 	url: ["monorepo-5.ruancat6312.top", "monorepo5.ruan-cat.com"],
		// 	userCommands: ["pnpm -C=./packages/monorepo-5 build:docs"],
		// },

		// {
		// 	type: "static",
		// 	targetCWD: "./demos/gh.HFIProgramming.mikutap",
		// 	url: ["mikutap.ruancat6312.top"],
		// 	// 测试类型约束是否到位。
		// 	// userCommands: ["echo 'mikutap1'", "echo 'mikutap2'", "echo 'mikutap3'"],
		// },
	],
};
