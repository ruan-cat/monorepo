<!-- TODO: 需要分析和思考 未来再说 -->

# 2026-02-13 package-linter 技能与 Node 包开发主流规范对比分析

本报告对 `.claude/skills/package-linter/SKILL.md` 所规定的包开发规范，与主流 Node.js 生态系统的最佳实践进行系统性对比分析。旨在识别本项目的特有约定、与主流规范的偏差点，以及潜在的改进方向。

---

## 一、总体评估

SKILL.md 是一份面向本 monorepo 项目的内部开发规范。它针对项目的实际情况做了大量务实的适配（如 `workspace:^` 协议、tsup 构建模式、monorepo 目录约定等），整体上是一份有效的项目级指导文档。

但与 Node.js 生态系统的主流最佳实践相比，存在 **12 处显著差异**，按影响程度可分为三个等级：

| 等级       | 含义                                     | 数量 |
| ---------- | ---------------------------------------- | ---- |
| **高影响** | 可能导致外部消费者使用失败或产生困惑     | 3 项 |
| **中影响** | 偏离主流约定，增加维护成本或降低优化空间 | 5 项 |
| **低影响** | 项目内部约定差异，不影响功能             | 4 项 |

---

## 二、高影响差异

### 2.1 `main`/`types` 指向 TypeScript 源码文件

**SKILL 规定：** 纯 ESM 库包的 `main` 和 `types` 指向 `./src/index.ts`。

**主流规范：** `main` 必须指向已编译的 JavaScript 文件（如 `./dist/index.js`）。`types` 应指向声明文件（如 `./dist/index.d.ts`）。

**影响分析：**

1. Node.js 运行时无法直接执行 `.ts` 文件。若外部用户执行 `import "@ruan-cat/utils"`，除非使用 tsx/ts-node 等加载器，否则会直接报错
2. `main` 字段是 Node.js 最早的模块解析入口，大量工具和运行时仅识别 `.js`/`.cjs`/`.mjs` 文件
3. 此做法仅在 monorepo 内部消费（通过 Vite/webpack 等打包器）时安全

**SKILL 现有的缓解：** 提供了 `main`/`types` 决策指南，指出 CJS、CLI、Vite 插件等场景应指向 dist。

**建议评估：** 如果包确实仅在 monorepo 内部消费且始终经过打包器，此做法可以接受。但一旦需要被外部项目或 Node.js 直接消费，必须改为指向 dist。建议在 SKILL 中明确标注此限制条件。

### 2.2 `moduleResolution: "node"` 搭配 `module: "ESNext"`

**SKILL 引用的 tsconfig.base.json 配置：**

```json
{
	"module": "ESNext",
	"moduleResolution": "node",
	"allowImportingTsExtensions": true
}
```

**主流规范（2025-2026）：**

- **Node.js 库：** 推荐 `module: "nodenext"` + `moduleResolution: "nodenext"`
- **打包器场景：** 推荐 `module: "esnext"` + `moduleResolution: "bundler"`
- **不推荐：** `moduleResolution: "node"` 是 Node.js 10 时代的传统算法

**影响分析：**

1. `moduleResolution: "node"` 不会解析 `package.json` 的 `exports` 字段。这意味着 TypeScript 类型检查时不会走 `exports` 条件导出路径，与实际运行时解析行为不一致
2. 无法正确处理 `.mts`/`.cts` 文件扩展名
3. 与 SKILL 中精心设计的 `exports` 条件导出形成矛盾 —— TypeScript 编译器在 `moduleResolution: "node"` 下会忽略 `exports` 字段

**建议评估：** 这是影响最深的配置差异。虽然 tsup 作为外部打包器不受 tsconfig 的 `moduleResolution` 影响，但本地开发的类型检查、IDE 智能提示会受到影响。建议评估迁移至 `moduleResolution: "bundler"` 的可行性（tsconfig.base.json 中已有注释掉的 `"moduleResolution": "Bundler"` 选项）。

### 2.3 发布的包同时包含 `src` 源码和 `dist` 构建产物

**SKILL 规定 `files` 字段：**

```json
["!**/.vercel/**", "!**/.vitepress/**", "src", "dist/**", "tsconfig.json", "README.md", ...]
```

**主流规范：** 仅发布构建产物。典型做法：

```json
"files": ["dist"]
```

**影响分析：**

1. 包体积增大：同时包含 `src`（TypeScript）和 `dist`（编译后 JS + 声明文件），体积可能翻倍
2. 暴露内部实现细节，增加安全面
3. 发布包内包含 `tsconfig.json` 也是非常规做法 —— 可能干扰消费者的 TypeScript 项目引用检测

**合理性：** 包含 `src` 的好处是允许消费者通过 source map 导航至原始 TypeScript 源码，便于调试。部分知名库（如 `type-fest`）也这样做。但这是少数派做法。

**建议评估：** 如果调试便利性是核心需求，可以保留 `src`。但应移除 `tsconfig.json`（消费者不需要它）。考虑是否可以仅在需要的包中包含 `src`，而非作为默认规范。

---

## 三、中影响差异

### 3.1 缺少 `sideEffects` 字段

**SKILL 未提及 `sideEffects` 字段。**

**主流规范：** 库包应声明 `"sideEffects": false`（纯工具库、无副作用的包）或 `"sideEffects": ["*.css", ...]`（有副作用的文件）。此字段被 Webpack、Rollup、Vite 用于 tree-shaking 优化。

**影响分析：**

1. 缺少此字段时，打包器无法确定模块是否有副作用，可能放弃 tree-shaking，导致消费者打包体积增大
2. 对于 `@ruan-cat/utils` 这类工具库尤其重要
3. Vercel 的 Conformance 规则甚至要求所有 npm 包必须声明此字段

**现状：** 检索确认所有已发布包均未声明 `sideEffects` 字段。

**建议评估：** 在 SKILL 的必填字段清单中增加 `sideEffects`，至少对工具类库包默认推荐 `"sideEffects": false`。

### 3.2 子包缺少 `engines` 字段

**SKILL 未将 `engines` 列入必填或推荐字段。**

**主流规范：** 发布的 npm 包如果依赖特定 Node.js 版本（如使用了 Node 18+/22+ 特性），应在 `engines` 中声明：

```json
"engines": { "node": ">=22.14.0" }
```

**影响分析：**

1. 根 `package.json` 声明了 `"engines": { "node": ">=22.14.0" }`，但所有子包均未继承或声明此约束
2. 外部消费者在低版本 Node.js 环境安装使用时，不会收到版本不兼容的警告
3. 如果包内使用了 Node 22 的新特性（如 `node:*` 模块、`--experimental-*` 特性），低版本环境直接运行会崩溃

**现状：** 检索确认无任何子包声明 `engines` 字段。

**建议评估：** 至少对包含 Node.js 运行时代码的子包（如 `vercel-deploy-tool`、`release-toolkit`、`claude-notifier`），推荐声明 `engines`。

### 3.3 `files` 字段大量使用否定模式

**SKILL 规定的 `files` 字段使用了复杂的否定模式：**

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

**主流规范：** `files` 作为白名单使用，尽量只写包含项：

```json
"files": ["dist", "src"]
```

或使用 `.npmignore` 进行排除。

**影响分析：**

1. 混合使用 include 和 `!` exclude 增加了认知复杂度和维护成本
2. `npm pack` 的处理方式：先收集所有正向匹配的文件，再移除否定匹配的文件。因此开头的 `!**/.vercel/**` 对默认包含集（package.json、README 等）生效，但 `.vercel` 目录本身不在默认包含集中，该规则实际上是冗余的
3. 如果 `src` 目录内包含需要排除的文件种类不断增多，否定规则列表会持续膨胀

**建议评估：** 如果保留发布 `src` 的做法，当前的否定模式是必要的。但如果改为仅发布 `dist`，可以大幅简化为 `"files": ["dist"]`。若保留现状，建议调整排列顺序：先列包含项，再列排除项，提高可读性。

### 3.4 默认发布至 `beta` 标签

**SKILL 规定 publishConfig：**

```json
{ "access": "public", "registry": "https://registry.npmjs.org/", "tag": "beta" }
```

**主流规范：** 默认发布至 `latest` 标签。`beta` 标签用于预发布版本（如 `1.0.0-beta.1`）。

**影响分析：**

1. 消费者必须显式指定 `npm install @ruan-cat/utils@beta` 才能安装到最新版本
2. 直接 `npm install @ruan-cat/utils` 可能安装不到任何版本，或安装到一个很旧的 `latest` 版本
3. 这是一个刻意的项目决策（表明所有包仍在 beta 阶段），但对不了解此约定的消费者造成困惑

**建议评估：** 这是项目维护者的有意选择，在项目稳定后应考虑切换至 `latest` 标签。建议在 SKILL 中补充说明此约定的原因和切换时机。

### 3.5 `exports` 条件导出在类型检查时失效

**SKILL 精心设计了多种 `exports` 模式（ESM only、ESM + CJS、CJS only、子路径导出等）。**

**但存在一个根本矛盾：** `tsconfig.base.json` 使用 `moduleResolution: "node"`，而 TypeScript 在 `moduleResolution: "node"` 或 `"node10"` 模式下 **完全忽略 `exports` 字段**。

**影响分析：**

1. 在 monorepo 内部开发时，TypeScript 编译器不会按照 `exports` 字段解析类型，而是回退到 `main`/`types` 字段
2. 如果 `main` 指向 `./src/index.ts`，类型解析恰好能工作（因为直接指向了 `.ts` 文件），但这掩盖了 `exports` 配置可能存在的错误
3. 只有实际 Node.js 运行时和打包器会使用 `exports` 字段，类型层面无法验证其正确性

**此问题与 2.2 节 `moduleResolution` 问题密切相关，是同一根因的不同表现。**

---

## 四、低影响差异

### 4.1 package.json 字段排序偏差

**SKILL 规定的排序：** name → version → description → type → main → types → homepage → bugs → repository → bin → scripts → exports → keywords → author → license → publishConfig → files → dependencies → devDependencies → peerDependencies

**sort-package-json 的标准排序：** name → version → private → description → keywords → homepage → bugs → repository → license → author → type → exports → main → types → bin → files → scripts → dependencies → devDependencies → peerDependencies → engines → publishConfig

**主要差异点：**

| 字段            | SKILL 位置                   | sort-package-json 位置    | 偏差 |
| --------------- | ---------------------------- | ------------------------- | ---- |
| `type`          | #4（在 main 之前）           | 在 author 之后            | 前移 |
| `main`/`types`  | #5-6（在 homepage 之前）     | 在 exports 之后           | 前移 |
| `exports`       | #12（在 scripts 之后）       | 在 main 之前              | 后移 |
| `keywords`      | #13（在 exports 之后）       | #5（在 description 之后） | 后移 |
| `files`         | #17（在 publishConfig 之后） | 在 bin 之后、scripts 之前 | 后移 |
| `publishConfig` | #16（在 license 之后）       | 几乎最末尾                | 前移 |

**影响分析：** 字段排序纯属约定，不影响功能。但如果使用 `sort-package-json` 工具进行格式化，会与 SKILL 规定的排序冲突。

**建议评估：** 考虑是否要引入 `sort-package-json` 进行自动排序。如果不引入，当前的自定义排序可以保留，但需注意不同工具的排序预期。

### 4.2 `description` 使用简体中文

**SKILL 规定：** `"description": "简体中文描述"`

**主流规范：** npm 生态系统约定使用英文描述。npm 搜索引擎对英文索引效果更好。

**影响分析：** 降低包在 npm 搜索中的国际可发现性。但对个人/团队项目而言，使用中文描述更便于维护者理解。

### 4.3 `prebuild` 脚本执行 `automd`

**SKILL 规定：** `"prebuild": "automd"`

**主流规范：** 大多数包没有 `prebuild` 步骤。`automd` 是一个自动生成 markdown 内容的工具，属于项目特有的约定。

**影响分析：** 不影响功能，但增加了构建步骤。如果 `automd` 未安装或执行失败，会阻塞 `build` 脚本。

### 4.4 根 `package.json` 声明所有子包的 `devDependencies`

**SKILL 规定：** 创建新的发布包后，必须在根 `package.json` 的 `devDependencies` 中添加 `"@ruan-cat/<new-package>": "workspace:^"`。

**主流规范：** 这不是通用做法。大多数 monorepo 项目不在根 package.json 中引用所有子包。通常由 turbo/nx 等工具直接管理包间依赖关系。

**影响分析：** 可能的用途是确保 pnpm 安装时所有子包都被链接到根 node_modules，便于根目录脚本访问。属于项目内部约定。

---

## 五、SKILL 中的良好实践

以下方面与主流规范保持一致或代表了先进实践：

| 实践                                        | 说明                                     |
| ------------------------------------------- | ---------------------------------------- |
| **`types` 在 `exports` 条件导出中优先**     | 符合 TypeScript 官方推荐的解析顺序       |
| **`workspace:^` 协议**                      | pnpm workspace 标准做法                  |
| **tsup 作为构建工具**                       | 主流、维护良好的 TypeScript 打包工具     |
| **`sourcemap: true`**                       | 便于消费者调试，属于良好实践             |
| **`dts: true`**                             | 自动生成类型声明，TypeScript 库标准做法  |
| **`clean: true`**                           | 构建前清理避免残留文件                   |
| **MIT 许可证**                              | 最主流的开源许可证                       |
| **明确的 `publishConfig.access: "public"`** | scoped 包必须显式声明 public             |
| **`entry` 与 `exports` 对应关系**           | 确保构建入口和导出路径一致，降低配置错误 |
| **提供完整的新包创建流程**                  | 从创建目录到验证构建，步骤清晰完整       |

---

## 六、差异汇总矩阵

| #   | 差异项                    | 影响等级 | SKILL 做法              | 主流做法                    | 改动难度 |
| --- | ------------------------- | -------- | ----------------------- | --------------------------- | -------- |
| 2.1 | main/types 指向 .ts       | 高       | `./src/index.ts`        | `./dist/index.js`           | 低       |
| 2.2 | moduleResolution          | 高       | `"node"`（传统）        | `"bundler"` 或 `"nodenext"` | 中       |
| 2.3 | files 包含 src + tsconfig | 高       | 同时发布源码和产物      | 仅 `dist`                   | 低       |
| 3.1 | 缺少 sideEffects          | 中       | 未提及                  | `"sideEffects": false`      | 低       |
| 3.2 | 子包缺 engines            | 中       | 未提及                  | 声明 Node 版本约束          | 低       |
| 3.3 | files 否定模式复杂        | 中       | 大量 `!` 排除           | 简洁白名单                  | 低       |
| 3.4 | 默认 beta 标签            | 中       | `"tag": "beta"`         | `latest`                    | 低       |
| 3.5 | exports 与类型检查不一致  | 中       | exports 在 tsc 中被忽略 | exports 参与类型解析        | 高       |
| 4.1 | 字段排序                  | 低       | 自定义排序              | sort-package-json 标准      | 低       |
| 4.2 | 中文 description          | 低       | 简体中文                | 英文                        | 低       |
| 4.3 | prebuild automd           | 低       | 构建前自动生成 md       | 无 prebuild                 | —        |
| 4.4 | 根包引用所有子包          | 低       | 必须声明                | 非通用做法                  | —        |

---

## 七、核心结论

1. **SKILL 是一份务实的项目内部规范**，针对 monorepo 内部消费场景做了合理适配。大部分偏差是有意为之（如 beta 标签、中文描述、源码发布），而非遗漏。

2. **最大的隐患是 `moduleResolution: "node"` 与 `exports` 字段的矛盾（第 2.2、3.5 节）。** 这导致 TypeScript 类型检查绕过了 exports 条件导出，`main` 指向 `.ts` 源码恰好掩盖了此问题。一旦迁移 `moduleResolution`，多个包可能暴露出类型解析错误。

3. **如果包仅限 monorepo 内部消费，大部分高影响差异可以接受。** 但如果目标是让外部用户（不使用打包器、直接 Node.js 运行）也能消费这些包，则需要逐步对齐主流规范。

4. **低成本改进建议**（不需要架构变更）：
   1. 在 SKILL 必填字段中添加 `sideEffects`（推荐 `false`）
   2. 为含 Node.js 运行时代码的包推荐声明 `engines`
   3. 考虑从 `files` 中移除 `tsconfig.json`
   4. 在 SKILL 中补充 `beta` 标签的使用原因和退出条件说明

5. **中等成本改进建议**（需要少量架构调整）：
   1. 评估 `moduleResolution` 迁移至 `"bundler"` 的可行性
   2. 如果迁移 `moduleResolution`，顺带验证所有 `exports` 配置的类型正确性
