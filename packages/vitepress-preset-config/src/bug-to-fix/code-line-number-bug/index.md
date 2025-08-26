# 代码行号显示故障

这个代码行号显示故障，我认为是 vitepress 本身的故障，对代码行数的拆分方案太浅显了。

但是实际去写小案例实验了一下，发现不是那么一回事。事情很复杂。

## 代码片段激活 twoslash 的写法

- `{ts twoslash}` 官方的 pr 支持了。点此阅读对应的 [issue](https://github.com/vuejs/vitepress/pull/4100) 。
- `#snipaste{ts twoslash}` 某个 issue 内支持这个写法。

## 复现故障

观察一下代码行数：

### 001 复杂度较低的 typescript 代码

::: details 直接导入代码段

<<< ./code/001/index.ts

:::

::: details 包含 twoslash 类型增强

这里的代码行数只有 4 行。

<<< ./code/001/index.ts{ts twoslash}

:::

### 002 复杂度较高的 typescript 代码

::: details 直接导入代码段

<<< ./code/002/index.ts

:::

::: details 包含 twoslash 类型增强

这里的代码行数只有 1 行。

<<< ./code/002/index.ts{ts twoslash}

:::

## 思考

通过阅读 vitepress 源码得知，vitepress 实现代码行号计算的逻辑是写了一个[内置的 markdown-it 插件](https://github.com/vuejs/vitepress/blob/main/src/node/markdown/plugins/lineNumbers.ts)。

注意到[这一段代码](https://github.com/vuejs/vitepress/blob/main/src/node/markdown/plugins/lineNumbers.ts#L27-L30)：

```ts
const code = rawCode.slice(rawCode.indexOf("<code>"), rawCode.indexOf("</code>"));
```

其中，rawCode 是 html 代码字符串，是典型的富文本。

个人认为是这一段代码写的太简单了，导致无法拆分正确的代码行数。但是实际阅读对比 rawCode 的输出和 twoslash 增强化的输出后，发现很难找到一个通用的替代写法。

### 001 例子的 rawCode 输出

::: details 不使用 twoslash 的输出结果

<<< ./code/001/raw-code.txt

:::

::: details 使用 twoslash 的输出结果

<<< ./code/001/raw-code-twoslash.txt

:::

### 002 例子的 rawCode 输出

::: details 不使用 twoslash 的输出结果

<<< ./code/002/raw-code.txt

:::

::: details 使用 twoslash 的输出结果

<<< ./code/002/raw-code-twoslash.txt

:::

### 基于 `<code>` 标签的代码拆分方案难以满足 twoslash 化的 rawCode 场景

因为 twoslash 化的 rawCode 场景会增加很多 `</code>` 标签，单纯的用这个标签去截断拆分字符串，是拆不准的。所以例子 1 的代码长度拆分长度只为 4，例子 2 的代码长度更加离谱，只能到 1 行。

## 暂且放弃

尽管知道问题的成因，但是暂时没有好的方案来解决这个问题。

### 尚未提交官方 issue 反馈问题

TODO: 去官方 issue 组织语言比较复杂，先放一放。

## shiki 对行号的解决方案

增加 css，而不是去重新计算行号。

- https://github.com/shikijs/shiki/issues/3#issuecomment-830564854

## 其他杂项

### 本项目为此额外增加的依赖

```bash
pnpm -F=@ruan-cat/vitepress-preset-config i -P markdown-it-async
```

### 最小化的测试复现仓库
