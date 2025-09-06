# twoslash 类型提示功能

## typescript 类型提示

类型提示来自于 `@shikijs/vitepress-twoslash` 包。

::: details 封装好的 config.mts 配置

<!--
	FIXME: 在 config.mts 以相对路径导入其他模块时，出现 twoslash 识别错误。
	<<< ../../../config.mts#snipaste{ts twoslash}
	这里只能一个简单的例子 来展示该功能。
 -->

<<< ./twoslash-example-code.ts{ts twoslash}

:::

编写语法如下：

```markdown
<<< ./twoslash-example-code.ts{ts twoslash}
```

这里是按照相对路径的方式导入文档的。

在 vitepress [导入代码块](https://vitepress.dev/zh/guide/markdown#import-code-snippets)的基础上，增加后面的尾缀即可。

## 尾缀选择

有两种尾缀可以触发 twoslash 。

- `{ts twoslash}` 推荐使用。这是官方提供的方案。
- `#snipaste{ts twoslash}` https://github.com/shikijs/shiki/ 仓库的某个 issue 提供的方案。
