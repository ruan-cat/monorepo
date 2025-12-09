# 处理匹配故障

阅读以下信息：

```log
cz
cz-cli@4.3.1, cz-git@1.12.0

Unexpected token '*', "[*.{js,jsx,"... is not valid JSON
```

在新的项目内，使用 @ruan-cat/commitlint-config 来触发提交，结果出现以上的错误。

可以大致得知，是最近的依赖 `@ruan-cat/utils` 和 `tinyglobby` 导致的故障。

现在我已经修复了 `@ruan-cat/utils` 的问题，但是我不清楚 `tinyglobby` 会不会还有故障。进而导致我在其他项目使用 cz 也会导致故障。

请你帮我新建基于 vitest 的测试用例，测试在运行 cz 时，项目能否正常的完成 cz 交互式提交的触发？

最后请编写简要的发版日志，发版标签为 patch。
