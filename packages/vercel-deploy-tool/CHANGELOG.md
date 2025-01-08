# @ruan-cat/vercel-deploy-tool

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
node --import=tsx ./tests/config.test.ts --env-path=.env.test
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
