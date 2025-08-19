# @ruan-cat/utils 更新日志

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

- 提供针对Readme文件的检查与移动函数。 ([`cce2a9e`](https://github.com/ruan-cat/monorepo/commit/cce2a9ede596409e0b84575beff8975f49cf76c5))
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

- 处理cjs在import模式下的导入bug。

## 4.2.0

### Minor Changes

破坏性变更：

1. 本库不再对外直接提供ts文件。内部的类型声明跳转只能跳转到纯粹的.d.ts文件，而不是原来的ts源码。
2. 内部做重构，不再提供显性的ts尾缀导入。

## 4.1.1

### Patch Changes

- 处理 `hasChangelogMd` 提示错误的bug。

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
