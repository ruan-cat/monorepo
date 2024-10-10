# typedoc-api

你好，这里是文档。自动生成的文档。

## 文件移动

请使用 node 包 rimraf 和 cpx 编写一段命令，完成以下需求：

1. 清空文件夹 `.vercel/output/static`
2. 文件内容移动 `src/.vuepress/dist` 到 `.vercel/output/static`
3. 输出列表 `.vercel/output/static`

注意事项如下：

1. 这段命令最终会运行到 github action 内，请确保该命令可以在 window 系统和 linux 系统内均可运行。
2. 这段命令要封装在 package.json 的 copy-dist 命令内。
3. 如果 `.vercel/output/static` 不存在，请新建文件夹，并确保上述命令不会出错。

## 树形图

请优化上述的命令，确保以树形图的方式输出整个 `.vercel/output/static` 文件夹内的全部文件。

1. 请使用 linux 和 window 系统下都能够成功运行的命令。

## 优化命令

这个工作流有很多的 ./packages/monorepo-3 变量，请为我优化写法。

1. 把路径值全部提取出来，作为一个变量，便于复用。
2. 未来我会把 packages 下面全部的 monorepo 项目，都用类似的方式部署，请改造工作流，便于我传递项目的位置变量。
