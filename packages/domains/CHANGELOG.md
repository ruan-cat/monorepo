# 更新日志

## 0.8.2

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

## 0.8.1

### Patch Changes

- 更新 package.json 的 home 首页，改成对应包的 url 可访问地址。 ([`76117bd`](https://github.com/ruan-cat/monorepo/commit/76117bd689a3e17948f834c1a0e60dd4a74c8ff3))

## 0.8.0

### Minor Changes

- 增加 vercel部署工具 的域名 ([`bdbd85f`](https://github.com/ruan-cat/monorepo/commit/bdbd85fac28b602c31b09b9c9c62670637bf1cdb))

## 0.7.0

### Minor Changes

- 新增 10WMS 和 11智慧社区项目的前端文档域名配置。 ([`10c4b82`](https://github.com/ruan-cat/monorepo/commit/10c4b8274d4d4b275dfd36832ea4abc1db9a338b))

## 0.6.2

### Patch Changes

- 无意义的空包。测试用来触发 npx changelogithub 。

## 0.6.1

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

## 0.6.0

### Minor Changes

- 大项目 11智慧社区项目

## 0.5.0

### Minor Changes

- 重新设计了笔记项目域名的使用方式。废弃了notes变量。

## 0.4.1

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。

## 0.4.0

### Minor Changes

- 新增[vitepress-preset.ruancat6312.top](https://vitepress-preset.ruancat6312.top)域名。

## 0.3.0

### Minor Changes

- 新增[dm.ruan-cat.com](https://dm.ruan-cat.com)域名。

## 0.2.0

### Minor Changes

- 新增 `dm.ruancat6312.top` 和 `01s-10wms.ruancat6312.top` 域名。
  > - [dm.ruancat6312.top](https://dm.ruancat6312.top)
  > - [01s-10wms.ruancat6312.top](https://01s-10wms.ruancat6312.top)

## 0.1.4

### Patch Changes

- 提供 keywords ，便于查找信息。

## 0.1.3

### Patch Changes

- 增加 09OA 项目、01 星球、工具包、钻头文档的域名。

## 0.1.2

### Patch Changes

- 增加笔记项目域名。发包增加 readme 文件。

## 0.1.1

### Patch Changes

- 重新发包，处理 bug。疑似打包失败。

## 0.1.0

### Minor Changes

- 初始化项目。
