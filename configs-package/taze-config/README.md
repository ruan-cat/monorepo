# taze.config.ts 配置

<!-- automd:badges color="yellow" name="@ruan-cat/taze-config" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/taze-config?color=yellow)](https://npmjs.com/package/@ruan-cat/taze-config)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/taze-config?color=yellow)](https://npm.chart.dev/@ruan-cat/taze-config)

<!-- /automd -->

阮喵喵自用的 taze.config.ts 的配置。目的是用预设的 taze 配置，实现依赖升级。

## 功能

- 🚀 **一键初始化**：提供 CLI 命令，快速初始化项目的 taze 配置
- 📦 **智能识别项目类型**：自动识别 monorepo 项目，并提供对应的 `up-taze` 命令
- ⚙️ **预设配置**：提供经过优化的 taze 配置，开箱即用

## 快速初始化

**推荐使用方式**：无需手动安装，直接使用一行命令快速初始化配置文件：

> 尽管可以通过命令行的方式初始化配置，但是在具体项目应用时，还是应该安装好相关依赖。

```bash
# 使用 pnpm
pnpm dlx @ruan-cat/taze-config init

# 或使用 npm
npx @ruan-cat/taze-config init
```

该命令会自动：

- 创建 `taze.config.ts` 配置文件
- 根据项目类型（monorepo 或标准项目）在 `package.json` 中添加对应的 `up-taze` 脚本
- 将 `up-taze` 命令插入到 `scripts` 的第一行

### 命令选项

```bash
# 基本用法
pnpm dlx @ruan-cat/taze-config init

# 强制覆盖已存在的文件（跳过警告提示）
pnpm dlx @ruan-cat/taze-config init --force
pnpm dlx @ruan-cat/taze-config init -f

# 查看帮助信息
pnpm dlx @ruan-cat/taze-config --help
pnpm dlx @ruan-cat/taze-config init --help

# 查看版本号
pnpm dlx @ruan-cat/taze-config --version
```

**选项说明：**

- `-f, --force` - 强制覆盖已存在的文件，跳过覆盖警告提示

> **注意**：如果目录中已存在同名配置文件，默认会显示警告信息。使用 `--force` 选项可以跳过警告直接覆盖。

## 安装

<!-- automd:pm-install name="@ruan-cat/taze-config" dev -->

```sh
# ✨ Auto-detect
npx nypm install -D @ruan-cat/taze-config

# npm
npm install -D @ruan-cat/taze-config

# yarn
yarn add -D @ruan-cat/taze-config

# pnpm
pnpm add -D @ruan-cat/taze-config

# bun
bun install -D @ruan-cat/taze-config

# deno
deno install --dev npm:@ruan-cat/taze-config
```

<!-- /automd -->

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

### 在 monorepo 内的推荐命令

推荐在 monorepo 项目内，使用以下命令完成升级：

```bash
pnpm -w up @ruan-cat/taze-config -L && npx taze -r
```

建议在 package.json 内将命令命名为 `up-taze` 。

```json
{
	"up-taze": "pnpm -w up @ruan-cat/taze-config -L && npx taze -r"
}
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

		/** 阮喵喵系列的依赖包 都升级到最新版 */
		"/@ruan-cat/": "latest",

		"/unplugin-/": "latest",

		// 以下依赖包的最新版的tag标签是next 而不是常见的latest 故需要专门声明
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

## 动机：限制依赖包可用的升级范围

之前使用以下命令来给依赖做升级：

```bash
pnpm up -L
# monorepo
pnpm -r up -L
```

有几个包升级到最新版的时候，破坏性太大，而且表意不明。破坏性变更说明的少，为了避免自己使用野鸡依赖包时莫名其妙地赤石，故希望有某种方式约束依赖包升级的版本号范围。

### 最新版依赖标签不对导致安装了低版本的依赖

有些包的最新版，打的标签不是 latest，而是 next，这导致升级最新版依赖时，往往升级到低版本了。

比如：

- @form-create/designer
- @form-create/element-ui
- @wangeditor/editor
- @wangeditor/editor-for-vue

目前（2025-7-4）的处理方式是，手动屏蔽掉这些包。但这种写法很不优雅，还有没有更好的方案去升级依赖？

```json
{
	"up": "pnpm up '!@wangeditor/' '!@form-create/'"
}
```

### 某些依赖跨大版本升级时，没有破坏性变更说明

有部分依赖升级后，官方文档没有说清楚有什么变更。有些依赖不想花费精力去看清楚变更细节，能用就行，故不希望升级后出现任何故障。

比如：

- codemirror 限定到 5 版本。因为 6 版本没有说明清楚变更了什么。况且我也不想花时间迁移配置。
- cropperjs 限定到 1 版本。尽管有完整的[迁移日志](https://fengyuanchen.github.io/cropperjs/migration.html)，但是我不想花时间在这个包上面。

这些依赖需要被锁定范围。

### 某些依赖需要使用严格的 overrides 覆盖

某些依赖包被明确的说明，特定版本存在严重的 bug，需要用低版本覆盖掉最新版本。

比如：

```yaml
# pnpm-workspace.yaml
overrides:
  "css-select@^5.2.1": "5.2.0"
```

css-select ，需要严格约束到 5.2.0 版本。
