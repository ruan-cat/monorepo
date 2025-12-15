# @ruan-cat/generate-code-workspace 更新日志

## 0.7.2

### Patch Changes

- Updated dependencies [[`6423c34`](https://github.com/ruan-cat/monorepo/commit/6423c344e268852a91c8cffe5819d208e51a1cc0)]:
  - @ruan-cat/utils@4.20.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66)]:
  - @ruan-cat/utils@4.19.0

## 0.7.0

### Minor Changes

- 将 glob 依赖替换为 tinyglobby，提升文件匹配性能 ([`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd))
  - 替换所有包中的 `glob@^11.0.3` 依赖为 `tinyglobby@^0.2.15`
  - 更新代码导入：`import { sync } from "glob"` → `import { globSync } from "tinyglobby"`
  - 调整 `ignore` 选项格式：从字符串改为数组以符合 tinyglobby 的 API 要求
  - tinyglobby 是更轻量的替代方案，仅有 2 个子依赖（相比 glob 的 17 个），同时保持相同的功能

### Patch Changes

- Updated dependencies [[`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd)]:
  - @ruan-cat/utils@4.18.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3)]:
  - @ruan-cat/utils@4.17.0

## 0.6.0

### Minor Changes

- 发包配置不提供 `typesVersions` ，不再对外提供该配置。类型导出由其他的配置实现。 ([`57f5fb8`](https://github.com/ruan-cat/monorepo/commit/57f5fb89ad4ede261820547821c903461c783281))

## 0.5.0

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

## 0.4.16

### Patch Changes

- Updated dependencies [[`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1)]:
  - @ruan-cat/utils@4.15.0

## 0.4.15

### Patch Changes

- Updated dependencies [[`3cd2148`](https://github.com/ruan-cat/monorepo/commit/3cd2148ad896203508cc5e1ddc185683a7edaf83), [`bad3e51`](https://github.com/ruan-cat/monorepo/commit/bad3e51e4d6c914663032e93cc5cdcd9500233d0)]:
  - @ruan-cat/utils@4.14.0

## 0.4.14

### Patch Changes

- Updated dependencies [[`896d2eb`](https://github.com/ruan-cat/monorepo/commit/896d2eb7677b7887e36074a24146784377663e04)]:
  - @ruan-cat/utils@4.13.0

## 0.4.13

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

- Updated dependencies [[`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe)]:
  - @ruan-cat/utils@4.9.1

## 0.4.11

### Patch Changes

- 尝试触发发包。

## 0.4.10

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

## 0.4.9

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.8.0

## 0.4.8

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.7.0

## 0.4.7

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.6.0

## 0.4.6

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.5.0

## 0.4.5

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.4.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.2

## 0.4.3

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.1

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.0

## 0.4.1

### Patch Changes

- 处理标记错误版本号的 bug。

## 0.4.0

### Minor Changes

- 增加`tsx`作为显性提示的对等依赖。

## 0.3.18

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。
- Updated dependencies
  - @ruan-cat/utils@4.2.2

## 0.3.17

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.1

## 0.3.16

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.0

## 0.3.15

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 0.3.14

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0

## 0.3.13

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.0.0

## 0.3.12

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.3.0

## 0.3.11

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.2.0

## 0.3.10

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.1.0

## 0.3.9

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.1

## 0.3.8

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.0

## 0.3.7

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.1

## 0.3.6

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.0

## 0.3.5

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.8.0

## 0.3.4

### Patch Changes

- 处理文件导入路径错误的 bug。

## 0.3.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.7.0

## 0.3.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.1

## 0.3.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.0

## 0.3.0

### Minor Changes

- 使用工具包提供的 pathChange 函数实现路径转换。

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.5.0

## 0.2.3

### Patch Changes

- 测试性质发包。用于测试 github 上面是否出现 tag。

## 0.2.2

### Patch Changes

- readme 增加折叠栏。
  > 测试性质发包。用于测试 github 工作流是否预期工作。

## 0.2.1

### Patch Changes

- 重新发包。检查其他项目的生成工具是否失效。

## 0.2.0

### Minor Changes

- 对匹配出来的全部包名，做字母排序。现在生成出来的工作区目录，会先经过一次排序。其中 root 根目录不参与排序。

## 0.1.0

### Minor Changes

- 读取工作区的 settings.json 文件，实现配置同步。将 `.vscode\settings.json` 的文件读取并整合到工作区 `.code-workspace` 文件内。

## 0.0.1

### Patch Changes

- 初始化项目。
