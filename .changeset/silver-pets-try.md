---
"@ruan-cat/commitlint-config": major
---

## 默认范围控制

- 提供默认的提交范围。提交配置的 defaultScope 取决于 `git status` 命令。
- 提供工具函数 `getDefaultScope` 。

> 做一个自动识别 git 提交区文件的工具，识别文件的修改范围，而不是自己选择范围。每当 git add . 之后，就用 glob 库自主识别这些文件所属的提交区范围。然后至顶区提供已经索引好的，字母排序的提交区范围。

## 规则校验

提供规则校验。正式对接使用 `commitlint` 提交校验工具。
