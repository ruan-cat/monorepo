# 更新日志

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
