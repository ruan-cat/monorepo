# @ruan-cat/commitlint-config 更新日志

## 3.2.2

### Patch Changes

- Updated dependencies [[`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1)]:
  - @ruan-cat/utils@4.15.0

## 3.2.1

### Patch Changes

- Updated dependencies [[`3cd2148`](https://github.com/ruan-cat/monorepo/commit/3cd2148ad896203508cc5e1ddc185683a7edaf83), [`bad3e51`](https://github.com/ruan-cat/monorepo/commit/bad3e51e4d6c914663032e93cc5cdcd9500233d0)]:
  - @ruan-cat/utils@4.14.0

## 3.2.0

### Minor Changes

- 更改处理 monorepo 项目的识别逻辑 ([`bdf7ee0`](https://github.com/ruan-cat/monorepo/commit/bdf7ee01a7ecbee3a7a5a1681f7ae3049e07d242))

  ## 新增功能
  - **新增独立的 monorepo 判别函数** `isMonorepoProject()`
    - 统一了 monorepo 项目的识别逻辑，避免代码重复
    - 位置：`src/utils.ts`，可通过包导出使用

  ## 判别逻辑优化

  更严格的 monorepo 识别标准，同时满足以下三个条件：
  1. 项目根目录存在 `pnpm-workspace.yaml` 文件
  2. `pnpm-workspace.yaml` 中的 `packages` 字段存在且不为空数组
  3. **至少能匹配到一个 `package.json` 文件**（新增条件）

  以下情况不再认定为有效的 monorepo 项目：
  - `packages: []`（空数组配置）
  - `packages: ['!**/*']`（仅包含排除模式）
  - 配置的 glob 模式匹配不到任何 `package.json` 文件

  ## 代码重构
  - 重构 `getPackagesNameAndDescription()` 使用新的判别函数
  - 重构 `getPackagePathToScopeMapping()` 使用新的判别函数
  - 减少重复代码，提高可维护性

  ## 错误处理改进
  - 当 `pnpm-workspace.yaml` 格式错误时，会抛出包含详细错误信息的异常
  - 帮助开发者更快定位配置问题

  ## 测试覆盖
  - 新增 9 个测试用例覆盖 monorepo 识别逻辑
  - 测试文件：`src/tests/check-monorepo.test.ts`
  - 包括集成测试、边界情况测试和错误处理测试

  ## 破坏性变更

  ⚠️ **更严格的识别逻辑**：如果项目的 `pnpm-workspace.yaml` 配置的 packages 匹配不到任何文件，现在会被识别为非 monorepo 项目（之前仅检查文件是否存在）。这种情况在实际项目中极少出现，如果遇到说明配置本身存在问题。

## 3.1.1

### Patch Changes

- Updated dependencies [[`896d2eb`](https://github.com/ruan-cat/monorepo/commit/896d2eb7677b7887e36074a24146784377663e04)]:
  - @ruan-cat/utils@4.13.0

## 3.1.0

### Minor Changes

- ## 添加基于 glob 模式的智能范围匹配功能 ([`d9e70a5`](https://github.com/ruan-cat/monorepo/commit/d9e70a54a7a82af7cc37b726cbe9567dd6e8965a))

  新增功能:
  - 支持根据 commonScopes 配置中的 glob 字段自动匹配文件路径
  - 当文件匹配到 glob 模式时，自动添加对应的提交范围
  - 保留现有的包路径匹配逻辑，实现范围的叠加匹配

  示例:
  - `configs-package/commitlint-config/prompts/test.md` → 匹配到 `commitlint-config` + `prompt`
  - `packages/utils/turbo.json` → 匹配到 `utils` + `config` + `turbo`

  ## 优化输出范围的提示效果

  用盒子的形式输出打印效果。

  ### v3.0.0 的显示效果

  ![2025-09-14-22-40-41](https://s2.loli.net/2025/09/14/dIPfJXxEjOFolDC.png)

  ### v3.1.0 的显示效果

  ![2025-09-14-22-40-59](https://s2.loli.net/2025/09/14/gP7zMLdxXR1ep5U.png)

  ## 修复 git 路径识别的错误

  修复了识别路径包含了`非暂存区`的文件。现在只会识别`暂存区`的文件了。

### Patch Changes

- Updated dependencies [[`dffc0bf`](https://github.com/ruan-cat/monorepo/commit/dffc0bf29bf4be5f7f419a36e6882b1a6332d89b)]:
  - @ruan-cat/utils@4.11.0

## 3.0.0

### Major Changes

- ## 默认范围控制 ([`ac7ed5d`](https://github.com/ruan-cat/monorepo/commit/ac7ed5d52bd15aff0b786b44b93f90e68680edcb))
  - 提供默认的提交范围。提交配置的 defaultScope 取决于 `git status` 命令。
  - 提供工具函数 `getDefaultScope` 。

  > 做一个自动识别 git 提交区文件的工具，识别文件的修改范围，而不是自己选择范围。每当 git add . 之后，就用 glob 库自主识别这些文件所属的提交区范围。然后至顶区提供已经索引好的，字母排序的提交区范围。

  ## 规则校验

  提供规则校验。正式对接使用 `commitlint` 提交校验工具。

## 2.1.1

### Patch Changes

- 更新 cli 命令行提示要安装的命令行。更新为正确的 `pnpm i -D commitizen cz-git @ruan-cat/commitlint-config` 命令。 ([`547b099`](https://github.com/ruan-cat/monorepo/commit/547b099b7de5507eab4c3d7d31c370fb8470a94d))

## 2.1.0

### Minor Changes

- feat: 新增 CLI 初始化命令，支持 Commander.js 完整命令行体验 ([`8ae1a16`](https://github.com/ruan-cat/monorepo/commit/8ae1a16cfa2b8c72829fa65675d390b7cc0ba50f))

  ## 🚀 核心功能
  - **一键初始化**：添加 `init` 命令，支持快速初始化 commitlint 配置文件
  - **零安装使用**：支持通过 `pnpm dlx @ruan-cat/commitlint-config init` 或 `npx @ruan-cat/commitlint-config init` 直接使用
  - **智能文件管理**：自动复制 `.czrc` 和 `commitlint.config.cjs` 模板文件到当前目录
  - **中英双语支持**：提供友好的双语控制台输出和操作提示

  ## ⚙️ 命令行选项
  - **`-f, --force`**：强制覆盖已存在的文件，跳过覆盖警告提示
  - **`--help`**：显示完整的帮助信息和使用示例
  - **`--version`**：显示当前版本号（动态读取 package.json）

  ## 🎯 交互式体验
  - **专业帮助系统**：集成 Commander.js 提供结构化的帮助信息
  - **智能警告机制**：检测文件冲突并提供覆盖警告，支持 `--force` 跳过
  - **美观输出界面**：使用 consola.box 显示初始化结果和后续操作指南
  - **完整错误处理**：友好的错误提示和异常处理机制

  ## 🛠️ 技术实现
  - **Commander.js 集成**：替代原始参数解析，提供专业的 CLI 框架
  - **动态版本管理**：自动从 package.json 读取版本号
  - **模板系统**：基于 templates 目录的文件复制机制
  - **完整的中文注释**：所有代码包含详细的中文说明和文档

## 2.0.0

### Major Changes

- - 废弃 `main-pull-update` 和 `mark-progress` 这两个款提交类型。 ([`57f3122`](https://github.com/ruan-cat/monorepo/commit/57f3122daacfe70572ecefdcebe524c147055270))
  - 重构项目的代码实现方案。将提交类型单独拆分出一个文件。
  - 文档增加所拆分出来的类型和范围。

- - 删除 types-extractor 的打包出口，本包不提供 types-extractor 的处理逻辑。 ([`3bfeae6`](https://github.com/ruan-cat/monorepo/commit/3bfeae6693f5441811b1240d351cc4c23c8735e7))

## 1.5.0

### Minor Changes

- 新增提交类型 deps 。 ([0099581](https://github.com/ruan-cat/monorepo/commit/009958124282d0996b50040849544e70e9faefd9))

## 1.4.0

### Minor Changes

- 添加 claude 相关的配置项，描述其在代码生成和使用中的作用。 ([`6018d05`](https://github.com/ruan-cat/monorepo/commit/6018d059b8e5b793ce1602316bb220d179ec30db))

## 1.3.1

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

- Updated dependencies []:
  - @ruan-cat/utils@4.8.1

## 1.3.0

### Minor Changes

- 1. 处理 getUserConfig 重复执行 2 次的 bug。现在本工具不会重复执行两次获取用户配置函数了。
  2. 拓展 getUserConfig 的传参，允许使用 isPrintScopes 来打印可用的提交范围。默认是打印全部范围的。

## 1.2.0

### Minor Changes

- 允许 getUserConfig 用户配置函数，直接导入用户的业务配置数组。

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.8.0

## 1.1.4

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.7.0

## 1.1.3

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.6.0

## 1.1.2

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.5.0

## 1.1.1

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.4.0

## 1.1.0

### Minor Changes

- 增加新的提交类型。🌐 i18n。

## 1.0.8

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.2

## 1.0.7

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.1

## 1.0.6

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.0

## 1.0.5

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。
- Updated dependencies
  - @ruan-cat/utils@4.2.2

## 1.0.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.1

## 1.0.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.0

## 1.0.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 1.0.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0

## 1.0.0

### Major Changes

1. 增加了标记 `publish` 。
2. 允许使用破坏性变更的标记。`markBreakingChangeMode`。

## 0.2.12

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.0.0

## 0.2.11

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.3.0

## 0.2.10

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.2.0

## 0.2.9

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.1.0

## 0.2.8

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.1

## 0.2.7

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.0

## 0.2.6

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.1

## 0.2.5

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.0

## 0.2.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.8.0

## 0.2.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.7.0

## 0.2.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.1

## 0.2.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.0

## 0.2.0

### Minor Changes

- 使用工具包提供的 pathChange 函数实现路径转换。

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.5.0

## 0.1.4

### Patch Changes

- 提供 keywords ，便于查找信息。

## 0.1.3

### Patch Changes

- 更新正确的包使用方式，避免出现类型识别错误。

```js
const config = require("@ruan-cat/commitlint-config").default;
module.exports = config;
```

## 0.1.2

### Patch Changes

- 对外导出的类型文件改写成 `index.d.cts` ，便于查询包的对应类型文件。

## 0.1.1

### Patch Changes

- 检查文件是否存在 `pnpm-workspace.yaml`，如果文件不存在，则返回默认的 scopes 。

## 0.1.0

### Minor Changes

- 提供 getUserConfig 函数，允许用户自己提供自定义的提交范围。

## 0.0.1

### Patch Changes

- 第一版。实现在当前 monorepo 内的文件工作域扫描，可以完成 cz 提交任务。
