# @ruan-cat/utils 更新日志

## 4.19.0

### Minor Changes

- **修复：将 `isMonorepoProject` 函数限制为仅在 Node.js 环境中使用** ([`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66))

  ## 问题说明

  在 4.18.0 版本中，`isMonorepoProject` 函数从主入口 (`@ruan-cat/utils`) 导出，导致在浏览器环境的构建中引入了 Node.js 特定的依赖（`tinyglobby`、`node:path`、`node:fs`）。这会导致 Vite/Nitro 构建失败，报错：`"createRequire" is not exported by "__vite-browser-external"`。

  详细的故障分析请参考：[Nitro 构建故障报告](https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-12-09-nitro-build-ruan-cat-utils-version-fix.md)

  ## 重大变更
  - **从主入口移除 `isMonorepoProject` 导出**：主入口 (`@ruan-cat/utils`) 不再导出 `isMonorepoProject` 函数，避免在浏览器环境中引入 Node.js 特定代码
  - **仅在 Node.js 专用路径导出**：`isMonorepoProject` 现在只能从以下路径导入：
    - `@ruan-cat/utils/node-esm` - 适用于 Node.js ESM 环境
    - `@ruan-cat/utils/node-cjs` - 适用于 Node.js CommonJS 环境

  ## 迁移指南

  如果你之前从主入口导入 `isMonorepoProject`：

  ```typescript
  // ❌ 旧的导入方式（不再支持）
  import { isMonorepoProject } from "@ruan-cat/utils";
  ```

  请改为从 Node.js 专用路径导入：

  ```typescript
  // ✅ Node.js ESM 环境
  import { isMonorepoProject } from "@ruan-cat/utils/node-esm";

  // ✅ Node.js CommonJS 环境
  import { isMonorepoProject } from "@ruan-cat/utils/node-cjs";
  ```

  ## 构建产物验证
  - 主入口 `dist/index.js` 不再包含 `tinyglobby`、`node:path`、`node:fs` 等 Node.js 特定代码
  - `isMonorepoProject` 函数仍然在 `dist/node-esm/index.js` 和 `dist/node-cjs/index.cjs` 中正常导出

  ## 文档

  新增 `packages/utils/src/monorepo/index.md` 文档，详细说明了 `isMonorepoProject` 的正确使用方式。

## 4.18.0

### Minor Changes

- 将 glob 依赖替换为 tinyglobby，提升文件匹配性能 ([`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd))
  - 替换所有包中的 `glob@^11.0.3` 依赖为 `tinyglobby@^0.2.15`
  - 更新代码导入：`import { sync } from "glob"` → `import { globSync } from "tinyglobby"`
  - 调整 `ignore` 选项格式：从字符串改为数组以符合 tinyglobby 的 API 要求
  - tinyglobby 是更轻量的替代方案，仅有 2 个子依赖（相比 glob 的 17 个），同时保持相同的功能

## 4.17.0

### Minor Changes

- 新增 `isMonorepoProject` monorepo 检测工具函数 ([`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3))
  - 新增 `monorepo.ts` 模块，提供 `isMonorepoProject` 函数用于检测当前项目是否为 pnpm monorepo 项目
  - 该工具函数在默认环境（ESM）以及 CJS 环境内均可使用
  - 从 `@ruan-cat/utils` 或 `@ruan-cat/utils/node-cjs` 均可导入使用
  - 新增 `glob` 依赖以支持 workspace 包匹配功能

## 4.16.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

## 4.15.0

### Minor Changes

- 标记 writeYaml2md 被废弃。未来应该独立使用 gray-matter 库来实现相关的更改。 ([`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1))

## 4.14.0

### Minor Changes

- 重构：移除 VitePress 文档管理相关函数 ([`bad3e51`](https://github.com/ruan-cat/monorepo/commit/bad3e51e4d6c914663032e93cc5cdcd9500233d0))

  将所有用于支持 VitePress 预设包的文档管理工具函数迁移至 `@ruan-cat/vitepress-preset-config` 包，实现更合理的职责分离：

  **删除的函数**：
  - `addChangelog2doc` - 将变更日志添加到文档目录
  - `copyChangelogMd` / `hasChangelogMd` - 复制和检查 CHANGELOG.md 文件
  - `copyClaudeAgents` / `hasClaudeAgents` - 复制 .claude/agents 文件夹到文档目录
  - `copyReadmeMd` / `hasReadmeMd` / `hasCapitalReadmeMd` / `hasLowerCaseReadmeMd` - README 文件复制和检查相关函数

  **结构优化**：
  - 将 `yaml-to-md.ts` 从 `scripts/` 子目录提升至 `node-esm/` 目录
  - 移除了大量注释代码，保持代码整洁

  **影响范围**：
  这些函数现已迁移到 `@ruan-cat/vitepress-preset-config` 包中，原有使用这些函数的项目需要从新的包中导入。

  **迁移指南**：

  ```typescript
  // 旧导入方式（已废弃）
  import { addChangelog2doc, copyReadmeMd } from "@ruan-cat/utils/node-esm";

  // 新导入方式
  import { addChangelog2doc, copyReadmeMd } from "@ruan-cat/vitepress-preset-config";
  ```

### Patch Changes

- 修复 package.json 中 types 字段路径拼写错误 ([`3cd2148`](https://github.com/ruan-cat/monorepo/commit/3cd2148ad896203508cc5e1ddc185683a7edaf83))

  ## 问题描述

  在 `exports` 字段中，主入口的 `types` 路径存在拼写错误，导致 TypeScript 编译器无法正确定位类型声明文件。

  ## 修复内容

  将 `types` 字段路径从 `./dsit/index.d.ts` 更正为 `./dist/index.d.ts`

  ## 影响范围

  此修复解决了依赖 `@ruan-cat/utils` 包的其他包（如 `@ruan-cat/vitepress-preset-config`）在构建时出现的类型声明文件找不到的错误。

## 4.13.0

### Minor Changes

- **安全增强**：为 `copyClaudeAgents` 函数添加路径安全验证 ([`896d2eb`](https://github.com/ruan-cat/monorepo/commit/896d2eb7677b7887e36074a24146784377663e04))

  修改位置：`packages/utils/src/node-esm/scripts/copy-claude-agents.ts`

  **主要改进**：
  1. **路径安全验证**：`target` 参数现在禁止使用绝对路径
     - 使用 `path.isAbsolute()` 进行跨平台路径检测
     - 当传入绝对路径时会抛出明确的错误信息
     - 防止意外覆盖系统目录（如 `/etc`, `C:\Windows` 等）
  2. **改进的 TypeScript 类型定义**：
     - 更新 `CopyClaudeAgentsOptions` 接口文档
     - 明确标注 `target` 必须是相对路径
     - 添加 `@throws` 标签说明错误情况
     - 提供正确和错误的使用示例
  3. **更清晰的错误提示**：
     ```plain
     target 参数不允许使用绝对路径，这可能导致意外的文件覆盖。
     当前传入的路径: "/path/to/dir"
     请使用相对路径，例如: "src/docs/prompts/agents"
     ```

  **影响范围**：
  - ✅ 不影响现有正确使用相对路径的代码
  - ⚠️ 如果之前使用了绝对路径，现在会抛出错误（这是预期行为，可防止潜在风险）

  **升级指南**：
  如果你的代码中使用了绝对路径作为 `target`，请改为相对路径：

  ```typescript
  // ❌ 旧代码（不再支持）
  copyClaudeAgents({ target: "/absolute/path/agents" });

  // ✅ 新代码（推荐）
  copyClaudeAgents({ target: "dist/agents" });
  ```

## 4.12.1

### Patch Changes

- 修复 `copy-claude-agents.ts` 中的 monorepo 寻址问题 ([`a318579`](https://github.com/ruan-cat/monorepo/commit/a31857991e967f245d53f28b356e0258b29f9b34))

  **问题描述**：
  在 monorepo 子项目中运行脚本时，`process.cwd()` 指向子项目根目录而非 monorepo 根目录，导致 `.claude/agents` 目录查找失败。

  **解决方案**：
  - 新增 `findMonorepoRoot()` 函数：通过向上查找 `pnpm-workspace.yaml` 自动定位 monorepo 根目录
  - 新增 `resolveRootDir()` 函数：支持手动指定根目录路径（支持相对路径如 `../../../`）
  - 重构 `hasClaudeAgents()` 和 `copyClaudeAgents()` 函数：支持可选的 `rootDir` 参数
  - 新增 `CopyClaudeAgentsOptions` 接口：规范化配置选项

  **API 变更**：
  - `hasClaudeAgents()` → `hasClaudeAgents(options?: { rootDir?: string })`
  - `copyClaudeAgents(target: string)` → `copyClaudeAgents(options: CopyClaudeAgentsOptions)`

  路径解析优先级：显式 `rootDir` > 自动检测 monorepo 根目录 > `process.cwd()` 回退

## 4.12.0

### Minor Changes

- d24437c: 新增 `copyClaudeAgents` 函数，用于复制 `.claude/agents` 文件夹到指定目标位置。该函数模仿 `copyChangelogMd` 的设计思想实现。

## 4.11.0

### Minor Changes

- 新增 `printList` 函数，用于格式化输出字符串数组。该函数提供： ([`dffc0bf`](https://github.com/ruan-cat/monorepo/commit/dffc0bf29bf4be5f7f419a36e6882b1a6332d89b))
  - 自动生成编号列表格式
  - 支持字符串标题或动态标题函数
  - 使用 consola.box 美化输出显示
  - 完整的 TypeScript 类型支持

  该功能主要用于在开发工具和测试场景中美化列表数据的输出显示。

## 4.10.0

### Minor Changes

- 增加发包配置 `!**/.vercel/**` 避免出现不小心把部署信息一起打包的情况。减少打包体积。 ([`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16))

## 4.9.2

### Patch Changes

- 1. 更新依赖。 ([`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27))
  2. 首页 README.md 增加了来自 automd 提供的标签，优化显示效果。

## 4.9.1

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

## 4.9.0

### Minor Changes

- 提供针对 Readme 文件的检查与移动函数。 ([`cce2a9e`](https://github.com/ruan-cat/monorepo/commit/cce2a9ede596409e0b84575beff8975f49cf76c5))
  - hasCapitalReadmeMd 检查当前运行的根目录 是否存在文件名大写的 `README.md` 文件
  - hasLowerCaseReadmeMd 检查当前运行的根目录 是否存在文件名小写的 `readme.md` 文件
  - hasReadmeMd 检查当前运行的根目录 是否存在任意一个大小写命名的 README.md 文件
  - copyReadmeMd 将 README.md 文件移动到指定要求的位置内，并重命名为 index.md

## 4.8.1

### Patch Changes

- 杂项变更，发包仓库地址改名。

  发包时，其 `repository.url` 从 `git+https://github.com/ruan-cat/vercel-monorepo-test.git` 更改成 `git+https://github.com/ruan-cat/monorepo.git` 。以便适应仓库名称改名的需求。

  现在发包的 package.json 内，其 url 地址如下：

  ```json
  {
  	"repository": {
  		"url": "git+https://github.com/ruan-cat/monorepo.git"
  	}
  }
  ```

## 4.8.0

### Minor Changes

1. 允许在 cjs 模式下，导出绝大多数常用的普通工具函数。
   > 这会增加包的体积。

## 4.7.0

### Minor Changes

1. `useRequestIn01s` 请求函数，在内部废弃掉 `setDataByHttpParamWay` 函数。
2. `useRequestIn01s` ，准备要废弃 HttpParamWay 类型和 httpParamWay 配置。
3. `@vueuse/integrations` 升级依赖到 13 版本。
4. `useAxiosWrapper` 和 `useRequestIn01s` 请求函数，增加泛型类型。

## 4.6.0

### Minor Changes

- 增加 请求码与请求响应文本的映射表。

## 4.5.0

### Minor Changes

- 新建工具函数 printFormat 来格式化打印内容。

## 4.4.0

### Minor Changes

- 封装`01s`项目集常用的接口请求工具。

## 4.3.2

### Patch Changes

- 升级依赖 unplugin-vue-router 到最新版。

## 4.3.1

### Patch Changes

- 补全导出路由处理函数。

## 4.3.0

### Minor Changes

- 为 unplugin-vue-router 提供处理脏数据的 disposalAutoRouter 函数。

## 4.2.2

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。

## 4.2.1

### Patch Changes

- 处理 cjs 在 import 模式下的导入 bug。

## 4.2.0

### Minor Changes

破坏性变更：

1. 本库不再对外直接提供 ts 文件。内部的类型声明跳转只能跳转到纯粹的.d.ts 文件，而不是原来的 ts 源码。
2. 内部做重构，不再提供显性的 ts 尾缀导入。

## 4.1.1

### Patch Changes

- 处理 `hasChangelogMd` 提示错误的 bug。

## 4.1.0

### Minor Changes

- 增加工具 `addChangelog2doc` 函数，为其他的文档配置预设项目，提供基础的工具函数。

## 4.0.0

### Major Changes

- 正式使用第二版本的接口请求工具。

## 3.3.0

### Minor Changes

- 增加 `UseAxiosWrapperParams2` 和 `useAxiosWrapper2` 工具。提供实验版本的接口请求工具。未来将会在 4.0 内正式使用该工具。

## 3.2.0

### Minor Changes

- 增加类型工具 `RemoveUrlMethod` ，用于处理 useAxios 工具的类型约束。

## 3.1.0

### Minor Changes

- 删掉冗余的 rmmv-class-expand-tools ，避免出现其他项目出现 typedoc 生成失败的错误。

## 3.0.1

### Patch Changes

- 处理缺失 lodash-es 产生的报错。安装 lodash-es 作为生产环境依赖。
- 处理 cjs 环境下错误导入额外的 esm 依赖的 bug。

## 3.0.0

### Major Changes

- 重构文件导入体系。

  > 凡是二次封装使用外部依赖的，全部使用单独的路径使用。一律只提供纯 ts 文件，不做打包。

  目前提供的路径如下：
  - `unplugin-vue-router`
  - `vite-plugin-autogeneration-import-file`
  - `vueuse`

## 2.0.1

### Patch Changes

- 处理在 vite esm 模式下，打包失败的 bug。避免直接使用 node 的函数。

## 2.0.0

### Major Changes

- 废除单独的 node 导出地址。现在项目提供两款 node 导出地址。分别是 node-esm 和 node-cjs。用于在不同场景下使用 node 的工具函数。

## 1.8.0

### Minor Changes

- 针对 vite-plugin-autogeneration-import-file 插件，提供二次封装的函数。便于在 vite 项目内使用。

## 1.7.0

### Minor Changes

- 提供专门的 node 路径。可以在专门的 node 路径内使用直接供给给 node 环境使用的函数。

## 1.6.1

### Patch Changes

- 修复 isShowCommand 必填项的错误。

## 1.6.0

### Minor Changes

- 增加生成简单的执行命令函数，`generateSpawnSync`。

## 1.5.0

### Minor Changes

- 提供 pathChange 函数，用于实现路径变更。

## 1.4.2

### Patch Changes

- 提供 keywords ，便于查找信息。

## 1.4.1

### Patch Changes

- 仅查询淘宝源的数据。

## 1.4.0

### Minor Changes

- 获得阮喵喵全部的包信息。`getRuanCatPkgInfo()`。

## 1.3.5

### Patch Changes

- 重新调整了整个 monorepo 的 turbo 构建任务，严格控制发包前先完成打包。试图处理发包时文件缺失的故障。

## 1.3.4

### Patch Changes

- 增加 `dist/index.js` 配置，处理文件缺失丢失的问题。

## 1.3.3

### Patch Changes

- 修复依赖缺失的问题。将依赖声明为 dependencies 依赖。

  > Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vueuse/integrations' imported from /home/runner/work/RPGMV-dev-notes/RPGMV-dev-notes/node_modules/.pnpm/@ruan-cat+utils@1.3.2_axios@1.7.9_typescript@5.7.2/node_modules/@ruan-cat/utils/src/vueuse/useAxios.ts

  目前，`@vueuse/integrations` 和 `axios` 均为生产环境依赖。预期将会自动安装到项目内。

## 1.3.2

### Patch Changes

- 提供 js 打包文件。

## 1.3.1

### Patch Changes

- 内部调整文件位置。以便测试 files 对应的 glob 语法是否正常，是否能够排除忽略掉不需要的 test 文件。
  > https://docs.npmjs.com/cli/v6/configuring-npm/package-json#files

## 1.3.0

### Minor Changes

- 提供异步任务的工具函数。

## 1.2.0

### Minor Changes

- 提供了针对 pnpm 工作区文件的类型声明。

## 1.1.1

### Patch Changes

- 对外导出 unplugin-vue-router 的插件；集中导出。

## 1.1.0

### Minor Changes

- ✨ feat(utils): 为 unplugin-vue-router 编写 getRouteName 函数，以便于实现自定义的路由名称；

## 1.0.5

### Patch Changes

- 更新文档。

## 1.0.4

### Patch Changes

- 提供包索引，提供 readme 文档。

## 1.0.3

### Patch Changes

- 更新路径别名。

## 1.0.2

### Patch Changes

- 开发全新的 rmmv-class-expand-tools 工具。

  用于实现 rmmv 插件的合并，让编写 mv 插件更加简单，避免写很多 es5 的 prototype。

## 1.0.1

### Patch Changes

- 发包

## 1.0.0

### Major Changes

- d36eaf0: 你好。要发包了。
