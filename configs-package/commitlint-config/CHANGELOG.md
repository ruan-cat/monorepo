# @ruan-cat/commitlint-config

## 1.1.0

### Minor Changes

- 增加新的提交类型。🌐 i18n。

## 1.0.8

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.2

## 1.0.7

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.1

## 1.0.6

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.0

## 1.0.5

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。
- Updated dependencies
  - @ruan-cat/utils@4.2.2

## 1.0.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.1

## 1.0.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.0

## 1.0.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 1.0.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0

## 1.0.0

### Major Changes

1. 增加了标记 `publish` 。
2. 允许使用破坏性变更的标记。`markBreakingChangeMode`。

## 0.2.12

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.0.0

## 0.2.11

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.3.0

## 0.2.10

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.2.0

## 0.2.9

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.1.0

## 0.2.8

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.1

## 0.2.7

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@3.0.0

## 0.2.6

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.1

## 0.2.5

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@2.0.0

## 0.2.4

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.8.0

## 0.2.3

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.7.0

## 0.2.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.1

## 0.2.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.6.0

## 0.2.0

### Minor Changes

- 使用工具包提供的 pathChange 函数实现路径转换。

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@1.5.0

## 0.1.4

### Patch Changes

- 提供 keywords ，便于查找信息。

## 0.1.3

### Patch Changes

- 更新正确的包使用方式，避免出现类型识别错误。

```js
const config = require("@ruan-cat/commitlint-config").default;
module.exports = config;
```

## 0.1.2

### Patch Changes

- 对外导出的类型文件改写成 `index.d.cts` ，便于查询包的对应类型文件。

## 0.1.1

### Patch Changes

- 检查文件是否存在 `pnpm-workspace.yaml`，如果文件不存在，则返回默认的 scopes 。

## 0.1.0

### Minor Changes

- 提供 getUserConfig 函数，允许用户自己提供自定义的提交范围。

## 0.0.1

### Patch Changes

- 第一版。实现在当前 monorepo 内的文件工作域扫描，可以完成 cz 提交任务。
