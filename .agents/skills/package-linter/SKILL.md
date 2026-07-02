---
name: package-linter
description: 校验和规范化 monorepo 中 Node 包的 package.json、tsup.config.ts、tsconfig.json 配置。在创建新包、修改包配置、审查包规范合规性、初始化新的工作区子包时使用。触发关键词：新建包、创建包、package.json、tsup 配置、包校验、包规范、初始化子包。
---

# Package Linter - Monorepo 包规范校验

本技能用于确保 monorepo 中所有 Node 包遵循统一的配置规范。适用于创建新包、修改现有包配置、审查包合规性等场景。

## 使用场景

- 在 monorepo 中创建全新的子包
- 审查现有包的 `package.json` 是否符合规范
- 修改包的构建配置（tsup、tsconfig）
- 检查工作区依赖声明是否正确
- 确保发布配置的一致性

## 校验流程

执行包校验时，按以下步骤检查：

```plain
Task Progress:
- [ ] Step 1: 确认包类型（发布包/私有包）
- [ ] Step 2: 校验 package.json 必填字段
- [ ] Step 3: 校验字段排序
- [ ] Step 4: 校验统一字段值（author/bugs/repo/publishConfig/files）
- [ ] Step 5: 校验 exports 和构建入口一致性
- [ ] Step 6: 校验 tsup.config.ts 配置
- [ ] Step 7: 校验 tsconfig.json 继承
- [ ] Step 8: 校验目录结构
- [ ] Step 9: 确认根 package.json 已声明工作区引用
```

## 包类型判定

根据包所在目录判定类型：

| 目录                                               | 类型        | 命名格式                       | private |
| -------------------------------------------------- | ----------- | ------------------------------ | ------- |
| `packages/*`                                       | 核心发布包  | `@ruan-cat/<name>`             | false   |
| `configs-package/*`                                | 配置包      | `@ruan-cat/<tool>-config`      | false   |
| `vite-plugins/*`                                   | Vite 插件包 | `@ruan-cat/vite-plugin-<name>` | false   |
| `demos/*`                                          | 示例应用    | 无命名空间短名                 | true    |
| `tests/*`                                          | 测试包      | `@test/<name>`                 | true    |
| `docs/*`、`fork/*`、`learn-create-compoents-lib/*` | 辅助工作区  | 无固定格式                     | true    |

> 新包通常只应创建在 `packages/*`、`configs-package/*`、`vite-plugins/*` 三个发布工作区中。`demos/*` 和 `tests/*` 用于测试目的。其他辅助工作区不用于创建常规新包。

## package.json 规范

### 字段排序（发布包）

严格按以下顺序排列：

1. `name`
2. `version`
3. `description`
4. `type`
5. `main`
6. `types`
7. `homepage`
8. `bugs`
9. `repository`
10. `bin`（CLI 包）
11. `scripts`
12. `exports`
13. `keywords`
14. `author`
15. `license`
16. `publishConfig`
17. `files`
18. `dependencies`
19. `devDependencies`
20. `peerDependencies`
21. `peerDependenciesMeta`

### 必填字段（发布包）

```jsonc
{
	"name": "@ruan-cat/<package-name>",
	"version": "0.1.0",
	"description": "简体中文描述",
	"type": "module",
	"main": "./src/index.ts", // 纯 ESM 库包指向源码（见下方决策指南）
	"types": "./src/index.ts", // 纯 ESM 库包指向源码（见下方决策指南）
	"homepage": "https://github.com/ruan-cat/monorepo/tree/main/<workspace-dir>/<package-name>",
	"bugs": {
		"url": "https://github.com/ruan-cat/monorepo/issues",
	},
	"repository": {
		"type": "git",
		"url": "git+https://github.com/ruan-cat/monorepo.git",
		"directory": "<workspace-dir>/<package-name>",
	},
	"scripts": {
		"build": "tsup",
		"prebuild": "automd",
	},
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"import": "./dist/index.js",
		},
	},
	"keywords": ["至少一个关键词"],
	"author": {
		"name": "ruan-cat",
		"email": "1219043956@qq.com",
		"url": "https://github.com/ruan-cat",
	},
	"license": "MIT",
	"publishConfig": {
		"access": "public",
		"registry": "https://registry.npmjs.org/",
		"tag": "beta",
	},
	"files": [
		"!**/.vercel/**",
		"!**/.vitepress/**",
		"src",
		"dist/**",
		"tsconfig.json",
		"README.md",
		"!src/**/docs/**",
		"!src/**/tests/**",
		"!*.test.*",
		"!src/**/*.md",
	],
}
```

### 统一字段值

以下字段在所有发布包中保持一致，**不允许自定义**：

**author**：

```json
{ "name": "ruan-cat", "email": "1219043956@qq.com", "url": "https://github.com/ruan-cat" }
```

**bugs**：

```json
{ "url": "https://github.com/ruan-cat/monorepo/issues" }
```

**publishConfig**：

```json
{ "access": "public", "registry": "https://registry.npmjs.org/", "tag": "beta" }
```

**license**：`"MIT"`

**type**：`"module"`

### main/types 指向决策指南

`main` 和 `types` 字段可以指向源码或构建产物，取决于包的类型：

**指向源码**（`./src/index.ts`）— 适用于纯 ESM 库包，消费者都在 monorepo 内部或使用打包器：

- `@ruan-cat/utils`、`@ruan-cat/release-toolkit`、`@ruan-cat/domains`、`@ruan-cat/generate-code-workspace`

**指向 dist**（`./dist/index.js` + `./dist/index.d.ts`）— 适用于以下场景：

- CJS 输出的包：`./dist/index.cjs` + `./dist/index.d.cts`（如 commitlint-config、claude-notifier）
- CLI 工具包：消费者直接使用构建产物（如 vercel-deploy-tool）
- Vite 插件包：不暴露源码（如 vite-plugin-ts-alias）

**新包默认建议**：如果不确定，**指向源码**。后续需要时再改为 dist。

### homepage 两种模式

**自定义子域名**（包有独立文档站点时）：

- `https://utils.ruancat6312.top`
- `https://ccntf.ruan-cat.com`

**GitHub 链接**（无独立站点时）：

- `https://github.com/ruan-cat/monorepo/tree/main/<workspace-dir>/<package-name>`

### repository.directory 规则

`directory` 值必须与包在 monorepo 中的实际相对路径一致：

- `packages/utils` → `"directory": "packages/utils"`
- `configs-package/commitlint-config` → `"directory": "configs-package/commitlint-config"`
- `vite-plugins/vite-plugin-ts-alias` → `"directory": "vite-plugins/vite-plugin-ts-alias"`

### files 字段变体

**基本模式**（大多数包）：

```json
[
	"!**/.vercel/**",
	"!**/.vitepress/**",
	"src",
	"dist/**",
	"tsconfig.json",
	"README.md",
	"!src/**/docs/**",
	"!src/**/tests/**",
	"!*.test.*",
	"!src/**/*.md"
]
```

**含模板文件**（CLI 配置工具包，如 commitlint-config、taze-config、claude-notifier）：

```json
[
	"!**/.vercel/**",
	"!**/.vitepress/**",
	"src",
	"dist/**",
	"tsconfig.json",
	"README.md",
	"!src/**/docs/**",
	"!src/**/tests/**",
	"!*.test.*",
	"!src/**/*.md",
	"templates/**"
]
```

**纯构建产物**（Vite 插件包，不包含 src）：

```json
[
	"!**/.vercel/**",
	"!**/.vitepress/**",
	"dist/**",
	"tsconfig.json",
	"README.md",
	"!src/**/docs/**",
	"!src/**/tests/**",
	"!*.test.*",
	"!src/**/*.md"
]
```

**VuePress 包**（额外排除 VuePress 缓存和构建目录）：

```json
[
	"!**/.vercel/**",
	"!**/.vitepress/**",
	"src",
	"dist/**",
	"tsconfig.json",
	"README.md",
	"!src/**/docs/**",
	"!src/**/tests/**",
	"!*.test.*",
	"!src/**/*.md",
	"!**/.vuepress/cache",
	"!**/.vuepress/dist"
]
```

### 工作区依赖

内部包引用统一使用 `workspace:^` 协议：

```json
{
	"dependencies": { "@ruan-cat/utils": "workspace:^" },
	"devDependencies": { "@ruan-cat/vitepress-preset-config": "workspace:^" }
}
```

### exports 字段规范

**条件导出中 `types` 始终放在第一位**（TypeScript 官方推荐的解析顺序，确保类型正确匹配）。

> 注意：部分历史包的 exports 中 `types` 未放在首位，这属于待修正的历史遗留，新包必须遵循此规则。

主入口（ESM only）：

```json
{ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }
```

主入口（ESM only，源码导出）：

```json
{ ".": { "types": "./src/index.ts", "import": "./src/index.ts" } }
```

主入口（ESM + CJS）：

```json
{ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" } }
```

主入口（CJS only，配置包使用）：

```json
{ ".": { "types": "./dist/index.d.cts", "require": "./dist/index.cjs", "default": "./dist/index.cjs" } }
```

子路径导出：

```json
{ "./config": { "types": "./src/config.mts", "import": "./dist/config.mjs" } }
```

源码和构建产物访问（可选，按需添加）：

```json
{ "./src/*": "./src/*", "./dist/*": "./dist/*" }
```

### bin 字段（CLI 包）

bin 指向的文件扩展名必须与 tsup 的 `format` 配置一致：

- `format: ["cjs"]` → `.cjs`
- `format: ["esm"]` → `.js`

CLI 包（CJS 格式，如 commitlint-config、claude-notifier）：

```json
{ "bin": { "@ruan-cat/<package-name>": "./dist/cli.cjs" } }
```

CLI 包（ESM 格式，如 taze-config）：

```json
{ "bin": { "@ruan-cat/<package-name>": "./dist/cli.js" } }
```

CLI 工具包（支持简写别名，如 vercel-deploy-tool）：

```json
{
	"bin": {
		"<short-name>": "./dist/cli.js",
		"@ruan-cat/<package-name>": "./dist/cli.js"
	}
}
```

### scripts 命名规范

| 脚本名       | 用途       | 示例                                 |
| ------------ | ---------- | ------------------------------------ |
| `build`      | 构建       | `tsup`                               |
| `prebuild`   | 构建前处理 | `automd`                             |
| `dev`        | 开发模式   | `tsup --watch`                       |
| `test`       | 运行测试   | `vitest run`                         |
| `test:watch` | 监听测试   | `vitest`                             |
| `test:cli`   | CLI 测试   | `node dist/cli.cjs init`             |
| `docs:dev`   | 文档开发   | `vitepress dev src/docs --port 8080` |
| `build:docs` | 文档构建   | `vitepress build src/docs`           |

### 必要的 devDependencies

使用 tsup 构建的发布包，以下开发依赖应在包**本地** devDependencies 中声明（不要仅依赖根包的提升）：

```json
{
	"devDependencies": {
		"automd": "^0.4.3",
		"tsup": "^8.5.0",
		"typescript": "^5.9.3"
	}
}
```

- `tsup`：构建工具，`build` 脚本依赖（必须本地声明）
- `automd`：文档自动生成，`prebuild` 脚本依赖（必须本地声明）
- `typescript`：类型检查（可选，许多包依赖根包提升的 typescript，如不需要特定版本可省略）

如果包有文档站点，还需添加：

```json
{
	"devDependencies": {
		"vitepress": "^1.6.4",
		"@ruan-cat/vitepress-preset-config": "workspace:^"
	}
}
```

### 私有包（demo/test）最小字段

```json
{
	"name": "<name>",
	"private": true,
	"version": "0.0.0",
	"type": "module",
	"scripts": { "dev": "vite", "build": "vite build" },
	"devDependencies": {}
}
```

## tsup.config.ts 规范

### 基本模板（ESM 单入口）

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts"],
	outDir: "dist",
	format: ["esm"],
	clean: true,
	dts: true,
	sourcemap: true,
});
```

### 常用配置选项

| 选项        | 默认值   | 说明                                       |
| ----------- | -------- | ------------------------------------------ |
| `entry`     | 必填     | 入口文件数组                               |
| `outDir`    | `"dist"` | 输出目录，统一为 `dist`                    |
| `format`    | 必填     | `["esm"]` 或 `["esm", "cjs"]` 或 `["cjs"]` |
| `clean`     | `true`   | 构建前清理                                 |
| `dts`       | `true`   | 生成类型声明                               |
| `sourcemap` | `true`   | 生成 sourcemap                             |
| `splitting` | `false`  | 代码分割（多入口时建议关闭）               |
| `shims`     | -        | Node.js 环境垫片（Node 专用包使用）        |
| `target`    | -        | 目标环境（如 `"node18"`）                  |

### 配置模式选择

**创建新包时？** → 使用"ESM 单入口"模板

**需要 CJS 兼容？** → 设置 `format: ["esm", "cjs"]`

**有 CLI 入口？** → 添加 `entry: ["./src/index.ts", "./src/cli.ts"]`，设置 `splitting: false`

**Node.js 专用包？** → 添加 `shims: true` 和 `target: "node18"`

**Vite 插件？** → 添加 `external: ["vite"]` 和 `skipNodeModulesBundle: true`

### entry 与 exports 对应关系

tsup 的 `entry` 数组中每个入口文件必须在 `package.json` 的 `exports` 中有对应的导出路径。

示例对应：

- `entry: ["./src/index.ts"]` → `".": { "import": "./dist/index.js" }`
- `entry: ["./src/cli.ts"]` → `bin` 字段指向 `./dist/cli.js`（ESM）或 `./dist/cli.cjs`（CJS），取决于 `format`
- `entry: ["./src/plugins/foo.ts"]` → `"./plugins/foo": { "import": "./dist/plugins/foo.js" }`

## tsconfig.json 规范

### 标准继承模式

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"rootDir": "./src"
	}
}
```

根目录 `tsconfig.base.json` 已预设：`composite`、`incremental`、`declaration`、`declarationMap`、`emitDeclarationOnly`、`strict`、`target: "ESNext"`、`module: "ESNext"`、`moduleResolution: "node"`、`allowImportingTsExtensions: true`、`allowJs: true`。

### 独立配置模式

部分复杂包（如 `@ruan-cat/utils`）可使用独立配置，但必须保持核心选项与 `tsconfig.base.json` 一致。

## 目录结构规范

### 标准包目录

```plain
<workspace-dir>/<package-name>/
├── src/                    # 源代码（必需）
│   ├── index.ts           # 主入口
│   ├── cli.ts             # CLI 入口（如有）
│   ├── tests/             # 测试（可选，放 src 内）
│   └── docs/              # 文档站点（可选，如 claude-notifier、vercel-deploy-tool）
├── tests/                  # 测试（可选，放根目录）
├── docs/                   # 文档站点（可选，如 domains 放在根目录）
├── dist/                   # 构建输出（.gitignore）
├── templates/              # 模板文件（CLI 配置工具包）
├── package.json            # 必需
├── tsconfig.json           # 必需
├── tsup.config.ts          # 使用 tsup 构建时必需
└── README.md               # 必需
```

文档站点有两种位置：`src/docs/`（推荐，如 claude-notifier）或 `docs/`（如 domains），对应的 scripts 路径也不同：

- `src/docs/` → `"docs:dev": "vitepress dev src/docs --port 8080"`
- `docs/` → `"docs:dev": "vitepress dev docs"`

## 根 package.json 同步

创建新的发布包后，**必须**在根 `package.json` 的 `devDependencies` 中添加引用：

```json
{
	"devDependencies": {
		"@ruan-cat/<new-package>": "workspace:^"
	}
}
```

## 创建新包的完整流程

1. 在合适的工作区目录创建包目录
2. 创建 `package.json`（按上述规范填写所有必填字段）
3. 创建 `tsconfig.json`（继承 `tsconfig.base.json`）
4. 创建 `tsup.config.ts`（选择合适的配置模式）
5. 创建 `src/index.ts` 主入口文件
6. 创建 `README.md`
7. 在根 `package.json` 的 `devDependencies` 中添加 `workspace:^` 引用
8. 运行 `pnpm install` 链接工作区包
9. 运行 `pnpm build` 验证构建
