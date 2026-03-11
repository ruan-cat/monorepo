---
order: 8000
---

# 提示词

这里仅仅是罗列出开发本包所用到的提示词，仅作为参考。

## 001 制作 `copyClaudeAgents` 函数

请深度思考。

1. 阅读 `packages\utils\src\node-esm\scripts\copy-changelog.ts` 文件。
2. 模仿该文件，模仿 `copyChangelogMd` 函数的设计思想。制作一个 `copyClaudeAgents` 函数。入参仅一个 target: string ，目标文件夹。
3. 在相似的位置内，制作该文件。
4. 在 `.changeset` 内编写发版日志。发版标记为 minor 。

### 01 处理 `.claude/agents` 的寻址问题

针对 `const res = fs.existsSync(path.resolve(process.cwd(), ".claude/agents"));` 逻辑。

1. 阅读 `packages\utils\src\node-esm\scripts\copy-claude-agents.ts` 文件。
2. 实际运行时，在深度嵌入的子目录下面运行 `process.cwd()` 指向的是子项目的根目录，不是期望的 monorepo 项目根目录。在 monorepo 项目内运行 hasClaudeAgents 函数时，寻址定位的是 `子项目的根目录` ，不是整个 monorepo 项目的根目录。
3. 请深度思考。并为我解决这样的寻址问题。你不需要考虑任何向后兼容的设计，允许你做出破坏性的写法。请先设计一个合适的方案，和我沟通后再修改实施。
4. 如果有疑惑，请询问我。

#### 01 回答 AI 的问题

1. 我的 monorepo 用的是 pnpm，请你根据 pnpm-workspace.yaml 来判断。
2. `.claude/agents` 确实位于 monorepo 根目录。不会存在子项目拥有自己独立的 `.claude/agents` 。整个 monorepo 项目的根目录，有且只存在唯一一个 `.claude/agents` 目录。
3. 需要制作显式传入 rootDir 的选项。届时，我会在 rootDir 内传入相对路径。预期是一大串的 `../../../` 相对路径写法。我会用这种方式来指示在 monorepo 子项目内，如何定位到根目录。
4. 在你实现 rootDir 时，其 jsdoc 注释必须写清楚其用法，其用法就是传入一大串的相对路径。
5. rootDir 参数是非必填项。且支持完全自动检测。

#### 02

大体同意该方案。

copyClaudeAgents(target) 函数的参数，改成 copyClaudeAgents(options?) 的写法，copyClaudeAgents 函数传入一个配置对象，将 target 路径也放到 options 配置对象内。

请实施该方案。

### 02 发布处理 `.claude/agents` 的寻址问题的更新日志

为刚才的处理 `.claude/agents` 的寻址问题，编写更新日志，发版标签为 patch。

### 03 <!-- TODO: --> 设计一个实现在 monorepo 项目内，子包将构建产物移动到根目录下以便解决 vercel 平台部署问题的 typescript 脚本

1. 首先你阅读这个文档，了解清楚相关的故障和设计缘故 https://juejin.cn/post/7610816257119354915 。
2. 其次，请你阅读 D:\code\github-desktop-store\gh.notes\docs\my-pull-requests\package.json 的处理方式。了解清楚基于命令实现的构建产物的移动方案。
3. 我很不喜欢这个方案，我希望实现一个基于 typescript，用 tsx 运行的脚本。我希望 `packages\utils\package.json` 这个包在 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root` 目录内，提供一个脚本，实现在 monorepo 项目内的子包将构建产物移动到项目根目录内。

这个脚本在 `packages\utils\package.json` 内要提供一个快捷入口，在 exports 内提供一个快捷入口，实现直接使用这个 node 脚本。

这个脚本会在 monorepo 的子包内运行。

这个脚本预期会使用 `tsx @ruan-cat/utils/move-vercel-output-to-root` 的方式，直接在对应的 monorepo 子包内运行。

由于不清楚 monorepo 包的深度问题，所以允许你设计出额外的脚本运行参数和解析逻辑，实现路径识别。但是我希望你使用本包提供的 monorepo 函数，实现根目录的定位。

在 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root` 目录内，新建脚本、使用说明文档、和测试用例。
