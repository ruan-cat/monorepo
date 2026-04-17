# @ruan-cat/taze-config

## 1.1.1

### Patch Changes

- Updated dependencies [[`7c8b64c`](https://github.com/ruan-cat/monorepo/commit/7c8b64c7bf229e6453b4704f1d9cb6742b94e299)]:
  - @ruan-cat/utils@4.25.1

## 1.1.0

### Minor Changes

- 1. **全部子包已升级依赖**（工作区内各发布包同步刷新 `dependencies` / `devDependencies` 等声明，与当前 lockfile 对齐）。 ([`af5aa60`](https://github.com/ruan-cat/monorepo/commit/af5aa603fcdd2a5b8f5caa8b3f74bcb996500120))
  2. 根工作区同步升级 `packageManager`（pnpm）版本，便于团队统一工具链。

### Patch Changes

- Updated dependencies [[`af5aa60`](https://github.com/ruan-cat/monorepo/commit/af5aa603fcdd2a5b8f5caa8b3f74bcb996500120)]:
  - @ruan-cat/utils@4.25.0

## 1.0.6

### Patch Changes

- Updated dependencies [[`a81405d`](https://github.com/ruan-cat/monorepo/commit/a81405d22d92cdbb96866b6f643547d869d4ce37)]:
  - @ruan-cat/utils@4.24.0

## 1.0.5

### Patch Changes

- Updated dependencies [[`ab773a2`](https://github.com/ruan-cat/monorepo/commit/ab773a2e87afb2021fa1ccddd67ae562c0a7cd15)]:
  - @ruan-cat/utils@4.23.0

## 1.0.4

### Patch Changes

- Updated dependencies [[`abf9c57`](https://github.com/ruan-cat/monorepo/commit/abf9c577bc4a1663894cf455319820598fe68961)]:
  - @ruan-cat/utils@4.22.0

## 1.0.3

### Patch Changes

- Updated dependencies [[`16cada1`](https://github.com/ruan-cat/monorepo/commit/16cada15096f374829759755261018dd54c36adc)]:
  - @ruan-cat/utils@4.21.0

## 1.0.2

### Patch Changes

- Updated dependencies [[`6423c34`](https://github.com/ruan-cat/monorepo/commit/6423c344e268852a91c8cffe5819d208e51a1cc0)]:
  - @ruan-cat/utils@4.20.0

## 1.0.1

### Patch Changes

- **修复：更新 `isMonorepoProject` 导入路径以适配 `@ruan-cat/utils` 的变更** ([`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66))

  ## 变更说明

  为了适配 `@ruan-cat/utils` 包的重构（`isMonorepoProject` 函数不再从主入口导出），更新了导入路径。

  ## 具体修改

  ```typescript
  // 修改前
  import { isMonorepoProject } from "@ruan-cat/utils";

  // 修改后
  import { isMonorepoProject } from "@ruan-cat/utils/node-esm";
  ```

  ## 影响范围

  此变更仅影响内部实现，不影响包的对外 API 和功能。用户无需做任何调整。

- Updated dependencies [[`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66)]:
  - @ruan-cat/utils@4.19.0

## 1.0.0

### Major Changes

- 🚀🚀🚀 添加 init 命令用于快速初始化配置。 🎉🎉🎉 ([`d7323f7`](https://github.com/ruan-cat/monorepo/commit/d7323f73129455cf44129aff75f1c703f03a0463))
  - 新增 CLI 工具，提供 `init` 命令快速初始化 taze 配置
  - 自动创建 `taze.config.ts` 配置文件
  - 智能识别项目类型（monorepo 或标准项目）
  - 根据项目类型自动在 `package.json` 的 `scripts` 中添加对应的 `up-taze` 命令
    - Monorepo 项目：`pnpm -w up @ruan-cat/taze-config -L && npx taze -r`
    - 标准项目：`pnpm up @ruan-cat/taze-config -L && npx taze -r`
  - `up-taze` 命令自动插入到 `scripts` 对象的第一行
  - 支持 `--force` 选项强制覆盖已存在的文件
  - 新增完整的测试用例，覆盖两种项目类型的文件复制和命令写入

## 0.3.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

## 0.2.0

### Minor Changes

- unplugin-\* 规则的依赖包，均升级到 latest 最新版。 ([`dd30b17`](https://github.com/ruan-cat/monorepo/commit/dd30b1753a797b99b5dce88a1bdabe7c47ee2c0d))

## 0.1.0

### Minor Changes

- 初始化 taze 包。 ([`815a34a`](https://github.com/ruan-cat/monorepo/commit/815a34af862307a79038f8b13a548edb1c08529a))
