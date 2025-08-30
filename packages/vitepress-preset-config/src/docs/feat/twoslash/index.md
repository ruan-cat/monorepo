# twoslash 类型提示功能

## typescript 类型提示

类型提示来自于 `@shikijs/vitepress-twoslash` 包。

::: details 封装好的 config.mts 配置

<<< ../../../config.mts#snipaste{ts twoslash}

:::

编写语法如下：

```markdown
<<< ../../../config.mts#snipaste{ts twoslash}
```

这里是按照相对路径的方式导入文档的。

在 vitepress [导入代码块](https://vitepress.dev/zh/guide/markdown#import-code-snippets)的基础上，增加后面的尾缀 `#snipaste{ts twoslash}` 即可。
