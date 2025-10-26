<!--
	一次性提示词
	已完成
 -->

# 配置 turbo 的任务

帮助我配置 turbo 的任务调度。

我现在在配置 do-build-01star-doc 任务，这个任务的依赖关系是这样的：

1. 先完成 @ruan-cat/utils 依赖包的 build 任务。
2. 再完成 @ruan-cat/vitepress-preset-config 依赖包的 build 任务。
3. 最后完成 @docs/docs-01-star 依赖包的 build:docs 任务，完成文档构建。

我现在已经完成一部分的根包 turbo.json 配置了，请帮助我配置正确的 turbo 任务配置。
