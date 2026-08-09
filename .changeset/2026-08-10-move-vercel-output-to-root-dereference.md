---
"@ruan-cat/utils": patch
---

1. 为 `move-vercel-output-to-root` 增加 `--dereference` 参数和编程式 `dereference` 选项，可在复制 Vercel 构建产物时解引用符号链接与 Windows Junction，生成物理函数目录。
