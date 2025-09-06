---
order: 100
---

# 经验教训

这里的内容与库本身无关，仅仅是作者本人的经验教训。

## 找不到主题的错误

在单独的项目内使用该库，会出现主题找不到的错误。是因为`主题配置`应该直接使用 ts 文件，使用 js 文件会报错。

## 文档配置无法识别 ts 后缀

`文档配置`和`主题配置`不同，文档配置必须要用 js 文件，否则会出现报错。

## 不能直接将全部的模块放到一个 index.ts 内导出

在 `文档配置` 内，是无法识别 css 后缀的文件的。所以包含 css 导入的 `主题配置`，不能和包含纯 ts 模块的 `文档配置` 放在一起导出。

所以该写法是无效的：

<<< ../../index.ts

因此，在 package.json 包内，配置依赖包导出是不对的。

<<< ./package-not-export-all-code.json

## vite-plugin-vercel 在 vitepress 项目内打包产物不一致

TODO: 疑似 bug ，需要反馈给 vite-plugin-vercel 插件。

![2025-06-16-00-18-13](https://s2.loli.net/2025/06/16/ZjpGyahSeO5MFzc.png)

## vitepress-plugin-llms 可能导致动态路由识别失败
