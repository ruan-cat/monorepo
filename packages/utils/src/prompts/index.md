# 提示词

这里仅仅是罗列出开发本包所用到的提示词，仅作为参考。

## 01 制作 `copyClaudeAgents` 函数

请深度思考。

1. 阅读 `packages\utils\src\node-esm\scripts\copy-changelog.ts` 文件。
2. 模仿该文件，模仿 `copyChangelogMd` 函数的设计思想。制作一个 `copyClaudeAgents` 函数。入参仅一个 target: string ，目标文件夹。
3. 在相似的位置内，制作该文件。
4. 在 `.changeset` 内编写发版日志。发版标记为 minor 。
