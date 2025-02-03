# @ruan-cat/commitlint-config

## 0.1.1

### Patch Changes

- 检查文件是否存在 `pnpm-workspace.yaml`，如果文件不存在，则返回默认的 scopes 。

## 0.1.0

### Minor Changes

- 提供 getUserConfig 函数，允许用户自己提供自定义的提交范围。

## 0.0.1

### Patch Changes

- 第一版。实现在当前 monorepo 内的文件工作域扫描，可以完成 cz 提交任务。
