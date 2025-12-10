# prettier 3.7 版本与插件迁移流程

请把本项目的 Prettier 配置迁移为与模板一致，按步骤执行并给出修改文件列表：

## 1. 依赖版本（devDependencies）：

```json
{
	"prettier": "^3.7.4",
	"@prettier/plugin-oxc": "^0.1.3",
	"prettier-plugin-lint-md": "^1.0.1"
}
```

请你升级依赖到上述版本，缺少依赖就在根包内新增该依赖。

## 2. prettier.config.mjs 规则：

直接用以下代码覆盖。

```mjs
import * as prettierPluginOxc from "@prettier/plugin-oxc";

/** @type {import("prettier").Config} */
const config = {
	plugins: ["prettier-plugin-lint-md"],
	overrides: [
		{
			files: "**/*.{js,mjs,cjs,jsx}",
			parser: "oxc",
			plugins: [prettierPluginOxc],
		},
		{
			files: "**/*.{ts,mts,cts,tsx}",
			parser: "oxc-ts",
			plugins: [prettierPluginOxc],
		},
	],
	printWidth: 120,
	semi: true,
	singleQuote: false,
	jsxSingleQuote: true,
	useTabs: true,
	tabWidth: 2,
	endOfLine: "auto",
	"space-around-alphabet": true,
	"space-around-number": true,
	"no-empty-code-lang": false,
	"no-empty-code": false,
};

export default config;
```

1. 配置文件必须是 `mjs` 格式，不允许使用 `js` 格式。

## 3. package.json 的 format 脚本（Prettier 3 实验 CLI）：

```bash
prettier --experimental-cli --write '**/*.{js,jsx,ts,tsx,mts,json,css,scss,md,yml,yaml,html}'
```

1. 在 package.json 的 format 脚本，要写成单引号，不要写双引号。

## 4. 验证与风险提示：

- 迁移后运行一次 pnpm format 覆盖全仓。
- `@prettier/plugin-oxc` 历史上对个别 TS 语法有崩溃记录`（Cannot read properties of undefined (reading 'value')）`。如遇问题，先记录触发文件/语法，可临时回退到官方 parser 再定位。

请严格按上述版本与配置修改，完成后总结修改的文件与命令执行情况。
