# taze.config.ts 配置

阮喵喵自用的 taze.config.ts 的配置。目的是用预设的 taze 配置，实现依赖升级。

本依赖包仅仅是对外单纯地导出一个 ts 配置文件。

## 安装

```bash
pnpm i -D @ruan-cat/taze-config taze
```

taze 作为对等依赖，可以安装。

## 使用方式

### 配置文件

在项目根目录内新建 `taze.config.ts` 文件。

```ts
// taze.config.ts
import { defineConfig } from "taze";
import { defaultConfig } from "@ruan-cat/taze-config";
export default defineConfig(defaultConfig);
```

在使用配置文件时，项目必须安装 taze 依赖。

### 准备运行命令

```bash
npx taze -r
```

### 在monorepo内的推荐命令

推荐在 monorepo 项目内，使用以下命令完成升级：

```bash
pnpm -w up @ruan-cat/taze-config -L && npx taze -r
```

1. 先在单仓根包内，单独升级此包。确保拿到最新的配置文件。
2. 然后再使用 taze 升级全部依赖。

## 被封装的配置文件

如下所示：

<details>

<summary>
被封装的配置文件
</summary>

<!-- prettier-ignore-start -->
<!-- automd:file src="./src/taze.config.ts" code -->

```ts [taze.config.ts]
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
		"/@ruan-cat/": "latest",
		"/@form-create/": "next",
		"/@wangeditor/": "next",
	},

	// disable checking for "overrides" package.json field
	depFields: {
		overrides: false,
	},
};
```

<!-- /automd -->
<!-- prettier-ignore-end -->

</details>
