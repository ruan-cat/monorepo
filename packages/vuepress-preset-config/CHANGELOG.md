# @ruan-cat/vuepress-preset-config 更新日志

## 0.4.1

### Patch Changes

- Updated dependencies [[`7c8b64c`](https://github.com/ruan-cat/monorepo/commit/7c8b64c7bf229e6453b4704f1d9cb6742b94e299)]:
  - @ruan-cat/utils@4.25.1

## 0.4.0

### Minor Changes

- 1. **全部子包已升级依赖**（工作区内各发布包同步刷新 `dependencies` / `devDependencies` 等声明，与当前 lockfile 对齐）。 ([`af5aa60`](https://github.com/ruan-cat/monorepo/commit/af5aa603fcdd2a5b8f5caa8b3f74bcb996500120))
  2. 根工作区同步升级 `packageManager`（pnpm）版本，便于团队统一工具链。

### Patch Changes

- Updated dependencies [[`af5aa60`](https://github.com/ruan-cat/monorepo/commit/af5aa603fcdd2a5b8f5caa8b3f74bcb996500120)]:
  - @ruan-cat/utils@4.25.0

## 0.3.8

### Patch Changes

- Updated dependencies [[`a81405d`](https://github.com/ruan-cat/monorepo/commit/a81405d22d92cdbb96866b6f643547d869d4ce37)]:
  - @ruan-cat/utils@4.24.0

## 0.3.7

### Patch Changes

- Updated dependencies [[`ab773a2`](https://github.com/ruan-cat/monorepo/commit/ab773a2e87afb2021fa1ccddd67ae562c0a7cd15)]:
  - @ruan-cat/utils@4.23.0

## 0.3.6

### Patch Changes

- Updated dependencies [[`abf9c57`](https://github.com/ruan-cat/monorepo/commit/abf9c577bc4a1663894cf455319820598fe68961)]:
  - @ruan-cat/utils@4.22.0

## 0.3.5

### Patch Changes

- Updated dependencies [[`16cada1`](https://github.com/ruan-cat/monorepo/commit/16cada15096f374829759755261018dd54c36adc)]:
  - @ruan-cat/utils@4.21.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`6423c34`](https://github.com/ruan-cat/monorepo/commit/6423c344e268852a91c8cffe5819d208e51a1cc0)]:
  - @ruan-cat/utils@4.20.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66)]:
  - @ruan-cat/utils@4.19.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd)]:
  - @ruan-cat/utils@4.18.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3)]:
  - @ruan-cat/utils@4.17.0

## 0.3.0

### Minor Changes

- 发包配置不提供 `typesVersions` ，不再对外提供该配置。类型导出由其他的配置实现。 ([`57f5fb8`](https://github.com/ruan-cat/monorepo/commit/57f5fb89ad4ede261820547821c903461c783281))

## 0.2.0

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

## 0.1.43

### Patch Changes

- Updated dependencies [[`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1)]:
  - @ruan-cat/utils@4.15.0

## 0.1.42

### Patch Changes

- Updated dependencies [[`3cd2148`](https://github.com/ruan-cat/monorepo/commit/3cd2148ad896203508cc5e1ddc185683a7edaf83), [`bad3e51`](https://github.com/ruan-cat/monorepo/commit/bad3e51e4d6c914663032e93cc5cdcd9500233d0)]:
  - @ruan-cat/utils@4.14.0

## 0.1.41

### Patch Changes

- Updated dependencies [[`896d2eb`](https://github.com/ruan-cat/monorepo/commit/896d2eb7677b7887e36074a24146784377663e04)]:
  - @ruan-cat/utils@4.13.0

## 0.1.40

### Patch Changes

- 1. 更新依赖。 ([`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27))
  2. 首页 README.md 增加了来自 automd 提供的标签，优化显示效果。
- Updated dependencies [[`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27)]:
  - @ruan-cat/utils@4.9.2

## 0.1.39

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

- Updated dependencies [[`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe)]:
  - @ruan-cat/utils@4.9.1

## 0.1.38

### Patch Changes

- [`e23108e`](https://github.com/ruan-cat/monorepo/commit/e23108ee2eda803e3536fa23d3f2074679d16557) Thanks [@ruan-cat](https://github.com/ruan-cat)! - 编写 vuepress 预设包的文档。

## 0.1.33

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

## 0.1.32

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.8.0

## 0.1.31

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.7.0

## 0.1.30

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.6.0

## 0.1.29

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.5.0

## 0.1.28

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.4.0

## 0.1.27

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.2

## 0.1.26

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.1

## 0.1.25

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.0

## 0.1.24

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。
- Updated dependencies
  - @ruan-cat/utils@4.2.2

## 0.1.23

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.1

## 0.1.22

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.0

## 0.1.21

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 0.1.20

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0

## 0.1.19

### Patch Changes

- 提供 keywords ，便于查找信息。

## 0.1.18

### Patch Changes

- 升级内部依赖，尝试处理打包报错问题。

## 0.1.17

### Patch Changes

- 按照报错要求，重新安装 `@vuepress/plugin-slimsearch` 依赖包。
  > vuepress-theme-hope: ✖ @vuepress/plugin-slimsearch is not installed!

## 0.1.16

### Patch Changes

- 按照通知要求，移除掉 `@vuepress/plugin-slimsearch` 依赖包。
  > You are not allowed to use plugin "@vuepress/plugin-slimsearch" yourself in vuepress config file.
  > Set "plugins.slimsearch" in theme options to customize it.
- 迁移调整 markdown 的配置。

## 0.1.15

### Patch Changes

- 升级依赖。

## 0.1.14

### Patch Changes

- 处理搜索栏 bug。处理生产环境无法搜索的 bug。并使用 @vuepress/plugin-slimsearch 插件处理。

## 0.1.13

### Patch Changes

- 升级依赖。

## 0.1.12

### Patch Changes

- 拓展 css 匹配的范围。补全漏掉的样式。让部分侧边栏标题补全了序号。

## 0.1.11

### Patch Changes

- 升级依赖。

## 0.1.10

### Patch Changes

- 提供基础的 md 配置，提供能够识别的 md 层级。
- 提供 ruancatHopeThemeConfig 作为 hope 主题的默认配置对象，允许在用户端自主组合使用。

## 0.1.9

### Patch Changes

- 🔧 build: 将 vue 作为项目的依赖

## 0.1.8

### Patch Changes

- ✨ feat: 调整 sass-embedded 为 dependencies

## 0.1.7

### Patch Changes

- 🐞 fix: 修复了右侧侧边栏指示标签的移动位置。位置对齐了。

## 0.1.6

### Patch Changes

- 调整小爱丽丝风格的面包屑导航栏，不使用箭头了。

## 0.1.5

### Patch Changes

- 补充安装依赖。

## 0.1.4

### Patch Changes

- 不提供打包报告配置。

## 0.1.3

### Patch Changes

- 补发 src 。

## 0.1.2

### Patch Changes

- 修改包对外导出的内容。

## 0.1.1

### Patch Changes

- 初始化部署预设工具。
