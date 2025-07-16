import { defineConfig } from "taze";

export const defaultConfig: Parameters<typeof defineConfig>["0"] = {
	// fetch latest package info from registry without cache
	force: true,

	// write to package.json
	write: true,

	// run `npm install` or `yarn install` right after bumping
	/**
	 * 不主动执行安装依赖的行为 升级版本号 但是不升级
	 * 要求用户随后主动运行安装依赖的命令。
	 */
	install: false,

	// ignore paths for looking for package.json in monorepo
	ignorePaths: ["**/node_modules/**", "**/test/**"],

	// ignore package.json that in other workspaces (with their own .git,pnpm-workspace.yaml,etc.)
	ignoreOtherWorkspaces: true,

	// override with different bumping mode for each package
	packageMode: {
		codemirror: "ignore",
		cropperjs: "ignore",
		vite: "ignore",
		// regex starts and ends with '/'

		/** 阮喵喵系列的依赖包 都升级到最新版 */
		"/@ruan-cat/": "latest",

		// 以下依赖包的最新版的tag标签是next 而不是常见的latest 故需要专门声明
		"/@form-create/": "next",
		"/@wangeditor/": "next",
	},

	// disable checking for "overrides" package.json field
	depFields: {
		overrides: false,
	},
};
