import { defineConfig } from "@ruan-cat/vercel-deploy-tool";
import { getDomains } from "@ruan-cat/domains";

export default defineConfig({
	// v0 时代曾使用 isShowCommand 控制命令输出，v1 已默认展示，若需可在工具层调整
	vercelProjectName: "vercel-monorepo-test-1-zn20",
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "team_cUeGw4TtOCLp0bbuH8kA7BYH",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "prj_THvaBaRzKye5CMlL72WMlvQLtFlB",
	// afterBuildTasks: ["pnpm turbo build:docs"],
	// FIXME: execa运行的turbo命令，不会使用cache缓存，导致了重复构建。
	// 下方保留了旧版的各类示例目标，便于后续需要时启用：
	// 1号项目
	// {
	// 	type: "userCommands",
	// 	targetCWD: "./tests/monorepo-1",
	// 	outputDirectory: "dist",
	// 	url: ["monorepo-1.ruancat6312.top"],
	// 	userCommands: ["pnpm -C=./tests/monorepo-1 build:docs"],
	// },
	// 2号项目（多域名）
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
	// 3号项目
	// {
	// 	type: "userCommands",
	// 	targetCWD: "./packages/monorepo-3",
	// 	outputDirectory: "src/.vuepress/dist/**/*",
	// 	url: ["monorepo-3.ruancat6312.top"],
	// 	userCommands: ["pnpm -C=./packages/monorepo-3 build:docs"],
	// },
	// 4号项目
	// {
	// 	type: "userCommands",
	// 	targetCWD: "./packages/monorepo-4",
	// 	outputDirectory: "src/.vuepress/dist/**/*",
	// 	url: ["monorepo-4.ruancat6312.top"],
	// 	userCommands: ["pnpm -C=./packages/monorepo-4 build:docs"],
	// },
	// 5号项目
	// {
	// 	type: "userCommands",
	// 	targetCWD: "./packages/monorepo-5",
	// 	outputDirectory: "src/.vuepress/dist/**/*",
	// 	url: ["monorepo-5.ruancat6312.top", "monorepo5.ruan-cat.com"],
	// 	userCommands: ["pnpm -C=./packages/monorepo-5 build:docs"],
	// },
	// mikutap项目（纯静态）
	// {
	// 	type: "static",
	// 	targetCWD: "./demos/gh.HFIProgramming.mikutap",
	// 	url: ["mikutap.ruancat6312.top"],
	// 	// userCommands: ["echo 'mikutap1'", "echo 'mikutap2'", "echo 'mikutap3'"],
	// },
	deployTargets: [
		// 工具包文档项目
		{
			type: "static",
			targetCWD: "./packages/utils/src/.vitepress/dist",
			url: getDomains("utils"),
			// outputDirectory: "src/.vitepress/dist",
			// userCommands: ["pnpm -C=./packages/utils build:docs"],
		},

		// vitepress预设配置文档
		{
			type: "static",
			targetCWD: "./packages/vitepress-preset-config/src/docs/.vitepress/dist",
			url: getDomains("vitepress-preset"),
			// outputDirectory: "src/.vitepress/dist",
			// userCommands: ["pnpm -C=./packages/vitepress-preset-config build:docs"],
		},

		// claude code 通知工具文档
		{
			type: "static",
			targetCWD: "./packages/claude-notifier/src/docs/.vitepress/dist",
			url: getDomains("claude-notifier"),
		},

		// 域名列表
		{
			type: "static",
			targetCWD: "./packages/domains/docs/.vitepress/dist",
			url: getDomains("domain"),
			// outputDirectory: "docs/.vitepress/dist",
			// userCommands: ["pnpm -C=./packages/domains build:docs"],
		},

		// vercel部署工具
		{
			type: "static",
			targetCWD: "./packages/vercel-deploy-tool/docs/.vitepress/dist",
			url: getDomains("vercel-deploy-tool"),
		},
	],
});
