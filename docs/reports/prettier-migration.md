# prettier 3.7 版本与插件迁移流程

请把本项目的 Prettier 配置迁移为与模板一致，按步骤执行并给出修改文件列表：

1. 依赖版本（devDependencies）：

```json
{
	"prettier": "^3.7.4",
	"@prettier/plugin-oxc": "^0.1.3",
	"prettier-plugin-lint-md": "^1.0.1"
}
```

2. prettier.config.mjs 规则：
   - `import * as prettierPluginOxc from "@prettier/plugin-oxc"`;
   - plugins: ["prettier-plugin-lint-md"]
   - overrides：
     a. `"**/*.{js,mjs,cjs,jsx}" 使用 parser: "oxc"，plugins: [prettierPluginOxc]`
     b. `"**/*.{ts,mts,cts,tsx}" 使用 parser: "oxc-ts"，plugins: [prettierPluginOxc]`
   - 统一格式选项：

```json
{
	"printWidth": 120,
	"semi": true,
	"singleQuote": false,
	"jsxSingleQuote": true,
	"useTabs": true,
	"tabWidth": 2,
	"endOfLine": "auto",
	"space-around-alphabet": true,
	"space-around-number": true,
	"no-empty-code-lang": false,
	"no-empty-code": false
}
```

3. package.json 的 format 脚本（Prettier 3 实验 CLI）：

```bash
prettier --experimental-cli --write "**/*.{js,jsx,ts,tsx,mts,json,css,scss,md,yml,yaml,html}"
```

4. 验证与风险提示：
   - 迁移后运行一次 pnpm format 覆盖全仓。
   - `@prettier/plugin-oxc` 历史上对个别 TS 语法有崩溃记录`（Cannot read properties of undefined (reading 'value')）`。如遇问题，先记录触发文件/语法，可临时回退到官方 parser 再定位。

请严格按上述版本与配置修改，完成后总结修改的文件与命令执行情况。
