# 关于本站

## 多个访问地址

- [自建域名访问](https://java-pilot-base-doc.ruan-cat.com/)
- [vercel 域名访问](https://java-pilot-base-doc.vercel.app/)

<!-- -  https://ruanzhongnan.github.io/java-pilot-base-doc/ -->

## 使用的技术栈

在打包 vuepress-preset-config 时，我期望将依赖 rollup-plugin-visualizer 也打包进入到我的依赖内，期望在其他的monorepo子包内，避免重复安装 rollup-plugin-visualizer 依赖。

打包产物包含了`__dirname`和`__filename`，这不符合我的期望。

其他依赖 vuepress-preset-config 的子包，他们的 package.json 的type
