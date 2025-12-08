# @ruan-cat/vercel-deploy-tool 更新日志

## 0.12.2

### Patch Changes

- Updated dependencies [[`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd)]:
  - @ruan-cat/utils@4.18.0

## 0.12.1

### Patch Changes

- Updated dependencies [[`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3)]:
  - @ruan-cat/utils@4.17.0

## 0.12.0

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

## 0.11.3

### Patch Changes

- Updated dependencies [[`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1)]:
  - @ruan-cat/utils@4.15.0

## 0.11.2

### Patch Changes

- Updated dependencies [[`3cd2148`](https://github.com/ruan-cat/monorepo/commit/3cd2148ad896203508cc5e1ddc185683a7edaf83), [`bad3e51`](https://github.com/ruan-cat/monorepo/commit/bad3e51e4d6c914663032e93cc5cdcd9500233d0)]:
  - @ruan-cat/utils@4.14.0

## 0.11.1

### Patch Changes

- Updated dependencies [[`896d2eb`](https://github.com/ruan-cat/monorepo/commit/896d2eb7677b7887e36074a24146784377663e04)]:
  - @ruan-cat/utils@4.13.0

## 0.11.0

### Minor Changes

- 增加发包配置 `!**/.vercel/**` 避免出现不小心把部署信息一起打包的情况。减少打包体积。 ([`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16))

### Patch Changes

- Updated dependencies [[`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16)]:
  - @ruan-cat/utils@4.10.0

## 0.10.1

### Patch Changes

- 1. 更新依赖。 ([`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27))
  2. 首页 README.md 增加了来自 automd 提供的标签，优化显示效果。
- Updated dependencies [[`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27)]:
  - @ruan-cat/utils@4.9.2

## 0.10.0

### Minor Changes

- 1. 不再从 `--env-path` 配置内获取环境变量。 ([`ca5d41d`](https://github.com/ruan-cat/monorepo/commit/ca5d41d31c6e8a7e77292b882522c9965eb16c6a))
  2. 不再从 `dotenvConfig` 函数内获取环境变量，一律从 `process.env` 内获取环境变量

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

- Updated dependencies [[`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe)]:
  - @ruan-cat/utils@4.9.1

## 0.9.4

### Patch Changes

- 更新 package.json 的 home 首页，改成对应包的 url 可访问地址。 ([`76117bd`](https://github.com/ruan-cat/monorepo/commit/76117bd689a3e17948f834c1a0e60dd4a74c8ff3))

## 0.9.3

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

## 0.9.2

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.8.0

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.7.0

## 0.9.0

### Minor Changes

- 每一个部署任务，都可以根据 `isNeedVercelBuild` 配置来决定要不要跳过 vercel 的默认 build 命令。
  > 在某些特殊情况下，用户会自动提供满足 vercel 部署的目录结构，故不需要额外运行 `vercel build` 命令。

## 0.8.18

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.6.0

## 0.8.17

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.5.0

## 0.8.16

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.4.0

## 0.8.15

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.2

## 0.8.14

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.1

## 0.8.13

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.0

## 0.8.12

### Patch Changes

- 删除不需要的 shx 依赖。

## 0.8.11

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。
- Updated dependencies
  - @ruan-cat/utils@4.2.2

## 0.8.10

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.1

## 0.8.9

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.0

## 0.8.8

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 0.8.7

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0

## 0.8.6

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.0.0

## 0.8.5

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.3.0

## 0.8.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.2.0

## 0.8.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.1.0

## 0.8.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.1

## 0.8.1

### Patch Changes

- 处理读取环境变量失败的 bug。

## 0.8.0

### Minor Changes

- 修复链接别名时，无法查询自定义域名的错误。
  > 在 vercel 的 alias 命令内指定 --scope 参数，传参为组织 id 即可。

## 0.7.5

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.0

## 0.7.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.1

## 0.7.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.0

## 0.7.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.8.0

## 0.7.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.7.0

## 0.7.0

### Minor Changes

- 移除输出命令的控制变量。现在部署工具默认总是将执行的命令输出出来。

## 0.6.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.1

## 0.6.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.0

## 0.6.2

### Patch Changes

- 处理 bug。部署任务不需要流式输出。

## 0.6.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.5.0

## 0.6.0

### Minor Changes

- 实现流式输出内容。现在运行部署命令时，各个子命令的输出结果会流式地展示出来。

## 0.5.9

### Patch Changes

- 提供 keywords ，便于查找信息。
- Updated dependencies
  - @ruan-cat/utils@1.4.2

## 0.5.8

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.4.1

## 0.5.7

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.4.0

## 0.5.6

### Patch Changes

- 锁死内部依赖 vercel 的版本号，尝试处理 vercel@39.4.2 安装失败的错误。
  - @ruan-cat/utils@1.3.5

## 0.5.5

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.3.5

## 0.5.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.3.4

## 0.5.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.3.3

## 0.5.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.3.2

## 0.5.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.3.1

## 0.5.0

### Minor Changes

- 增加 isShowCommand 命令。控制是否显示出目前正在运行的命令。
- 显示的命令为渐变彩色。使用和 turborepo 相同的渐变色。rgb(0, 153, 247) 到 rgb(241, 23, 18)。

## 0.4.2

### Patch Changes

- 输出部署信息。

## 0.4.1

### Patch Changes

- 输出部署任务的错误日志。

## 0.4.0

### Minor Changes

- 优化了 outputDirectory 的填写，不需要填写匹配语法了。

  之前的写法是：

  ```json
  {
  	"outputDirectory": "dist/**/*"
  }
  ```

  现在的写法是：

  ```json
  {
  	"outputDirectory": "dist"
  }
  ```

  不需要写额外的 glob 匹配语法了。

- 优化了包体积。

## 0.3.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.3.0

## 0.3.0

### Minor Changes

- 增加了 --env-path 环境变量地址配置。使用命令行运行项目时，可以手动传递环境变量的值。传递命令行的值即可。

举例如下：

```bash
tsx ./tests/config.test.ts --env-path=.env.test
```

传递 --env-path 变量，并提供地址即可。

## 0.2.0

### Minor Changes

- 提供 vercelJsonPath 配置。允许用户上传自定义的 vercel.json 文件。

## 0.1.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.2.0

## 0.1.0

### Minor Changes

- 优化文件移动的算法，加快执行效率。

## 0.0.13

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.1.1

## 0.0.12

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.1.0

## 0.0.11

### Patch Changes

- 优化控制台输出。

## 0.0.10

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.0.5

## 0.0.9

### Patch Changes

- 提供包索引，提供 readme 文档。
- Updated dependencies
  - @ruan-cat/utils@1.0.4

## 0.0.8

### Patch Changes

- 修复输出命令为 undefined 的错误。

## 0.0.7

### Patch Changes

- 更新路径别名。
- Updated dependencies
  - @ruan-cat/utils@1.0.3

## 0.0.6

### Patch Changes

- pnpm dlx 子命令安装依赖。

## 0.0.5

### Patch Changes

- 补充子依赖包。

## 0.0.4

### Patch Changes

- 补全依赖。

## 0.0.3

### Patch Changes

- 修复缺少依赖的 bug。

## 0.0.2

### Patch Changes

- 初始化部署工具。
