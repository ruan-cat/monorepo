# typedoc-api

你好，这里是文档。自动生成的文档。

## 文件移动

请使用 node包 rimraf 和 cpx 编写一段命令，完成以下需求：

1. 清空文件夹 `.vercel/output/static`
2. 文件内容移动 `src/.vuepress/dist` 到 `.vercel/output/static`
3. 输出列表 `.vercel/output/static`

注意事项如下：

1. 这段命令最终会运行到github action内，请确保该命令可以在window系统和linux系统内均可运行。
2. 这段命令要封装在package.json的copy-dist命令内。
3. 如果 `.vercel/output/static` 不存在，请新建文件夹，并确保上述命令不会出错。

## 树形图

请优化上述的命令，确保以树形图的方式输出整个 `.vercel/output/static` 文件夹内的全部文件。

1. 请使用linux和window系统下都能够成功运行的命令。
