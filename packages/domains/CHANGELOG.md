# 更新日志

## 1.3.1

### Patch Changes

- a6b2bdc: 更新文档。对 `ruan-cat-notes` 项目下的域名做更新说明。

## 1.3.0

### Minor Changes

- - `getDomains` 获取域名函数，实现多态，支持通过项目别名查询域名。 ([`5dd81be`](https://github.com/ruan-cat/monorepo/commit/5dd81bed1f6d509965b03361f78be130a25f3e67))
  - 项目 `ruan-cat-notes` 的域名调换，子域名 `notes` 现在换回 `vercel` 平台，而不是 `cloudflare worker` 平台实现部署。预期将恢复全套的 git 修改日志。

  ## getDomains 函数支持通过项目别名查询域名

  ### 新增功能
  - 为 `getDomains` 函数新增了函数重载支持，现在可以传入对象参数
  - 新增 `GetDomainsParamsWithAlias` 接口，支持通过 `projectName` 和 `projectAlias` 查询域名
  - 当指定 `projectAlias` 时，函数会精确返回对应别名的域名配置
  - 当找不到指定的 `projectAlias` 时，会通过 consola 输出警告并返回项目的所有域名

  ### 原有功能保留
  - 完全保留了原有的 `getDomains(projectName: string)` 用法，确保向后兼容

  ### 新增测试
  - 使用 vitest 编写了完整的单元测试，覆盖所有使用场景
  - 测试包括：字符串参数、对象参数、有效别名、无效别名、边界情况等

  ### 依赖变更
  - 新增 `vitest` 作为开发依赖
  - 将 `consola` 从开发依赖移至生产依赖

  ### 使用示例

  ```ts
  // 原有用法（保持不变）
  const domains1 = getDomains("ruan-cat-notes");
  // 返回: ["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]

  // 新用法：不带别名
  const domains2 = getDomains({ projectName: "ruan-cat-notes" });
  // 返回: ["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]

  // 新用法：带别名
  const domains3 = getDomains({
  	projectName: "ruan-cat-notes",
  	projectAlias: "notesCloudflare",
  });
  // 返回: ["notes.ruan-cat.com"]
  ```

  ## 域名 `notes.ruan-cat.com` 重返 vercel 平台

  得益于在 vercel 平台内关闭 preview 预览分支的监听部署设置，现在大多数项目都不会占用，滥用，浪费掉宝贵的免费用户每日 100 次构建次数额度。

  这使得我可以把全部的额度都用于文档项目的 dev 分支，实现高频高速的部署，且保证工作流环境提供 git 信息，使得每一个文章都能获取到历史修改记录。

## 1.2.0

### Minor Changes

- 设置语义化的，统一规范的，便于记忆的域名。`https://01s-doc.ruan-cat.com/` 。 ([`69d3aae`](https://github.com/ruan-cat/monorepo/commit/69d3aaecaa634fc954bdf9cdfce04088a5456a8c))

## 1.1.1

### Patch Changes

- 处理导入依赖找不到变量的故障。更新依赖包的导出范围，补充导出 `src/**/*.ts` 下面的全部 ts 文件。 ([`8c0b8b2`](https://github.com/ruan-cat/monorepo/commit/8c0b8b2632037b77b8e9ec8b0de1636b6d4b7619))

## 1.1.0

### Minor Changes

- 增加杂项项目，用来存储各种不常用的域名。 ([`652862c`](https://github.com/ruan-cat/monorepo/commit/652862ce9bf378beb996663444068b72e693eea5))

## 1.0.0

### Major Changes

- 1. 废弃掉 `projectNames` 常量和 `Domains` 类型。 ([`1422cfb`](https://github.com/ruan-cat/monorepo/commit/1422cfb62558c89f86884e3deea67046976b52c9))
  2. 更新默认导出的入口，不再是 `main.ts` ，而是 `src/index.ts` 。
  3. 开发新函数 `getDomains` ，代替之前直接获取域名对象。

## 0.10.0

### Minor Changes

- 增加域名 [rmmv-api-doc.ruancat6312.top](https://rmmv-api-doc.ruancat6312.top) 和 [rmmv-api-doc.ruan-cat.com](https://rmmv-api-doc.ruan-cat.com) 。 ([`05e1bf7`](https://github.com/ruan-cat/monorepo/commit/05e1bf79029dd502df89900f07c9d8b24606b0e9))

## 0.9.0

### Minor Changes

- 增加发包配置 `!**/.vercel/**` 避免出现不小心把部署信息一起打包的情况。减少打包体积。 ([`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16))

## 0.8.2

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

## 0.8.1

### Patch Changes

- 更新 package.json 的 home 首页，改成对应包的 url 可访问地址。 ([`76117bd`](https://github.com/ruan-cat/monorepo/commit/76117bd689a3e17948f834c1a0e60dd4a74c8ff3))

## 0.8.0

### Minor Changes

- 增加 vercel 部署工具 的域名 ([`bdbd85f`](https://github.com/ruan-cat/monorepo/commit/bdbd85fac28b602c31b09b9c9c62670637bf1cdb))

## 0.7.0

### Minor Changes

- 新增 10WMS 和 11 智慧社区项目的前端文档域名配置。 ([`10c4b82`](https://github.com/ruan-cat/monorepo/commit/10c4b8274d4d4b275dfd36832ea4abc1db9a338b))

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

- 大项目 11 智慧社区项目

## 0.5.0

### Minor Changes

- 重新设计了笔记项目域名的使用方式。废弃了 notes 变量。

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
