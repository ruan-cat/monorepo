# @ruan-cat/vuepress-preset-config 更新日志

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
