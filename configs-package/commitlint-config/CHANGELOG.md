# @ruan-cat/commitlint-config 更新日志

## 4.9.4

### Patch Changes

- Updated dependencies [[`abf9c57`](https://github.com/ruan-cat/monorepo/commit/abf9c577bc4a1663894cf455319820598fe68961)]:
  - @ruan-cat/utils@4.22.0

## 4.9.3

### Patch Changes

- Updated dependencies [[`16cada1`](https://github.com/ruan-cat/monorepo/commit/16cada15096f374829759755261018dd54c36adc)]:
  - @ruan-cat/utils@4.21.0

## 4.9.2

### Patch Changes

- 1. 修复默认模板的 TypeScript 类型报错问题，将 `@ts-check` 替换为 JSDoc 类型注释 ([`23570fa`](https://github.com/ruan-cat/monorepo/commit/23570fa553b310b9d7b50c1240f19186765a37c4))
  2. 更新 README 文档中的所有配置示例，使用正确的类型注释格式
  3. 更新模板文件 `templates/commitlint.config.cjs`，确保开箱即用无类型错误

## 4.9.1

### Patch Changes

- 移除多余的输出 ([`7a492e8`](https://github.com/ruan-cat/monorepo/commit/7a492e855342e564ad6f6c20a4ab8bbf5b7b1d0c))

## 4.9.0

### Minor Changes

- 1. 新增 `changelogen-use-types.ts` 文件，为 `@ruan-cat/commitlint-config` 包提供 changelogen 工具集成支持 ([`6aef058`](https://github.com/ruan-cat/monorepo/commit/6aef058722e61024833e0cabdf85b7b02a047241))
  2. 导出 `ChangelogogenUseTypes` 类型和 `changelogogenUseTypes` 常量对象，将现有的 `commitTypes` 转换为 changelogen 所需的格式
  3. 筛选特定提交类型（feat、fix、refactor、build、config），为每个类型提供 emoji、描述和版本号信息，优化 changelog 生成体验

## 4.8.0

### Minor Changes

- 1. 在 commonScopes 中新增 `server`（服务端接口）提交范围，支持匹配 `**/server/**/*.ts` 和 `**/servers/**/*.ts` 文件路径。 ([`4ab6b57`](https://github.com/ruan-cat/monorepo/commit/4ab6b5714614eab4e33ca1640bfb92003c5c0285))
  2. 简化 `router` 范围的描述注释，从"路由配置"改为"路由"。

## 4.7.1

### Patch Changes

- Updated dependencies [[`6423c34`](https://github.com/ruan-cat/monorepo/commit/6423c344e268852a91c8cffe5819d208e51a1cc0)]:
  - @ruan-cat/utils@4.20.0

## 4.7.0

### Minor Changes

- 为 `commitlint` 范围规则添加更多匹配项。 ([`cae58ce`](https://github.com/ruan-cat/monorepo/commit/cae58ce56de4b10332ce0c64a0ada7daf8f5cc93))
  - 为 `openspec` 提示词文档配置添加新的范围支持（glob: `**/openspec/**/*.md`）
  - 为 `vitepress` 配置增加 `config.ts` 文件匹配（之前只支持 `config.mts`）
  - 为 `claude` 配置增加 `.claude-plugin/**` 和 `CLAUDE*.md` 匹配规则（之前只支持 `.claude/**` 和 `CLAUDE.md`）

## 4.6.0

### Minor Changes

- 修复 negation pattern 处理错误 ([`a4c91b7`](https://github.com/ruan-cat/monorepo/commit/a4c91b7d3190634e87b5d584349f5b2b5f120fca))

  **核心修复：**
  - 在 `src/utils.ts` 和 `src/get-default-scope.ts` 中添加对 negation patterns（以 `!` 开头）的过滤逻辑
  - negation patterns 由 pnpm 自身处理，不应传递给 glob 工具

  **防御性改进：**
  - 添加文件路径验证，确保匹配结果以 `package.json` 结尾
  - 添加 JSON 内容验证，确保文件内容以 `{` 开头
  - 使用 try-catch 包装 `JSON.parse()` 调用，防止解析非 JSON 文件时崩溃
  - 使用 consola 输出详细的警告和错误信息

  **测试覆盖：**
  - 新增 `src/tests/negation-pattern.test.ts` 测试文件
  - 验证 negation patterns 过滤逻辑
  - 验证防御性检查的有效性

  此修复解决了在包含 negation patterns 的 `pnpm-workspace.yaml` 配置中，使用 `cz` 命令时出现的 JSON 解析错误问题。

## 4.5.1

### Patch Changes

- 添加 cz-git 配置验证测试用例，确保配置能正常加载和序列化，防止 JSON 解析错误 ([`ee135ad`](https://github.com/ruan-cat/monorepo/commit/ee135adccc5a83d5845db8b7f576e3b91b59869d))

- Updated dependencies [[`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66)]:
  - @ruan-cat/utils@4.19.0

## 4.5.0

### Minor Changes

- 将 glob 依赖替换为 tinyglobby，提升文件匹配性能 ([`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd))
  - 替换所有包中的 `glob@^11.0.3` 依赖为 `tinyglobby@^0.2.15`
  - 更新代码导入：`import { sync } from "glob"` → `import { globSync } from "tinyglobby"`
  - 调整 `ignore` 选项格式：从字符串改为数组以符合 tinyglobby 的 API 要求
  - tinyglobby 是更轻量的替代方案，仅有 2 个子依赖（相比 glob 的 17 个），同时保持相同的功能

### Patch Changes

- Updated dependencies [[`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd)]:
  - @ruan-cat/utils@4.18.0

## 4.4.0

### Minor Changes

- 内部代码重构 ([`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3))
  - 将 `isMonorepoProject` 函数迁移至 `@ruan-cat/utils` 包
  - 现在从 `@ruan-cat/utils/node-cjs` 导入 `isMonorepoProject` 函数
  - 相关测试用例也已迁移至 `@ruan-cat/utils` 包

### Patch Changes

- Updated dependencies [[`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3)]:
  - @ruan-cat/utils@4.17.0

## 4.3.0

### Minor Changes

- 优化没有包范围时的输出效果。 ([`ac9c8e6`](https://github.com/ruan-cat/monorepo/commit/ac9c8e697ed28cf28c7da5af9aeb358335b91e11))

## 4.2.0

### Minor Changes

- **重构 root 范围识别机制，避免滥用** ([`093abe7`](https://github.com/ruan-cat/monorepo/commit/093abe7cd2e13038e61417c00defb58fc758788a))

  **破坏性变更：**
  - root 范围不再作为默认兜底范围，仅当文件匹配特定 glob 模式时才被识别为 root 范围
  - 不匹配任何范围的文件将返回 `undefined`，需要用户手动选择提交范围

  **主要更改：**
  - 为 root 范围添加明确的 glob 匹配规则（根目录配置文件、文档、脚本等）
  - 移除 `getPackagePathToScopeMapping` 和 `getDefaultScope` 中的默认 root 映射
  - `.XXX/` 文件夹下的文件不会被识别为 root 范围（如 `.vscode/`, `.github/` 等）
  - 子包中的配置文件（如 `packages/utils/.gitignore`）不会被识别为 root 范围

## 4.1.0

### Minor Changes

- 为提交类型配置添加语义化版本号支持 ([`431e30c`](https://github.com/ruan-cat/monorepo/commit/431e30c66ac7872cdca213b41c9faf13446c3fa3))

  **新增功能**
  - 新增 `changelogen` 依赖，用于语义化版本号管理
  - 在 `CommitType` 接口中添加 `semver` 字段，支持指定版本号 bump 类型
  - 为各个提交类型配置了对应的语义化版本号策略：
    - `feat` → `minor`（次版本号）
    - `fix`, `deps`, `build`, `refactor`, `perf`, `init`, `config`, `chore` → `patch`（修订号）

  **技术细节**
  - 导入 `SemverBumpType` 类型定义从 `changelogen`
  - `semver` 字段为可选字段，保持向后兼容性
  - 支持与 changelogen 工具的集成，实现自动化版本号管理

## 4.0.0

### Major Changes

- # 重大破坏性变更：提交类型结构重构 ([`b6cf2ef`](https://github.com/ruan-cat/monorepo/commit/b6cf2efd8f96e6e61ef113d2b13e98b26765b412))

  本次更新对 `@ruan-cat/commitlint-config` 包进行了重大重构，包含多个破坏性变更。

  ## 💥 破坏性变更

  ### 1. 类型定义变更
  - **CommitType 接口**新增 `longDescription` 可选字段
  - **`description` 字段语义变更**：从原来的"中文 | 英文"混合格式，改为纯中文描述
  - **`longDescription` 字段**：新增用于存储英文长描述

  **迁移指南**：

  ```typescript
  // 旧格式
  {
    type: "feat",
    description: "新增功能 | A new feature"
  }

  // 新格式
  {
    type: "feat",
    description: "新增功能",
    longDescription: "A new feature"
  }
  ```

  ### 2. 提交类型名称变更
  - `del` → `delete`（删除垃圾）

  **影响**：使用 `del` 类型的项目需要更新为 `delete`

  ### 3. Emoji 图标变更

  以下提交类型的 emoji 图标已更改：
  - **build**: `🔧` → `🔨`
  - **config**: `⚙️` → `🔧`
  - **revert**: `↩` → `🔙`
  - **delete** (原 del): `🗑` → `🔪`

  **影响**：已有的提交历史中的 emoji 显示可能与新版本不一致

  ### 4. cz-git 格式化输出变更

  `convertCommitTypesToCzGitFormat()` 函数完全重写：
  - **新增四层对齐机制**：
    1. Emoji 图标固定对齐（占 3 个字符宽度）
    2. Type 提交类型字段对齐
    3. Description 描述字段对齐
    4. LongDescription 长描述的竖线 `|` 对齐
  - **输出格式变更**：

    ```plain
    旧格式: emoji type:     description
    新格式: emoji type: description | longDescription
    ```

  - **新增宽度计算函数** `getDisplayWidth()`：精确计算中文、emoji 等宽字符的显示宽度

  **影响**：cz-git 的提交选择界面显示格式将完全改变

  ### 5. 描述文本微调

  部分提交类型的描述进行了优化：
  - `publish`: "发包" → "发布依赖包"
  - `init`: "初始化" → "初始化项目"
  - `save-file`: 简化了冗长的描述文本

  ## ⚠️ 升级注意事项
  1. **不兼容旧版配置**：如果你的项目直接依赖 `commitTypes` 数组结构，需要更新相关代码
  2. **Git 历史兼容性**：旧提交中的 emoji 可能与新规范不匹配
  3. **团队协作**：建议整个团队同步升级，避免提交规范不一致
  4. **自定义配置**：如果扩展了 `commitTypes`，需要按新格式更新

  ## ✨ 改进
  - 更精确的字符宽度计算，完美支持中英文混排和 emoji
  - 更清晰的视觉对齐，提升 cz-git 界面可读性
  - 描述文本国际化分离，便于多语言支持
  - 更直观的 emoji 选择

## 3.3.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

### Patch Changes

- Updated dependencies [[`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9)]:
  - @ruan-cat/utils@4.16.0

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
