# @ruan-cat/generate-code-workspace 更新日志

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

- 处理标记错误版本号的bug。

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
