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

## 002 设计一个实现在 monorepo 项目内，子包将构建产物移动到根目录下以便解决 vercel 平台部署问题的 typescript 脚本

1. 首先你阅读这个文档，了解清楚相关的故障和设计缘故 https://juejin.cn/post/7610816257119354915 。
2. 其次，请你阅读 D:\code\github-desktop-store\gh.notes\docs\my-pull-requests\package.json 的处理方式。了解清楚基于命令实现的构建产物的移动方案。
3. 我很不喜欢这个方案，我希望实现一个基于 typescript，用 tsx 运行的脚本。我希望 `packages\utils\package.json` 这个包在 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root` 目录内，提供一个脚本，实现在 monorepo 项目内的子包将构建产物移动到项目根目录内。

这个脚本在 `packages\utils\package.json` 内要提供一个快捷入口，在 exports 内提供一个快捷入口，实现直接使用这个 node 脚本。

这个脚本会在 monorepo 的子包内运行。

这个脚本预期会使用 `tsx @ruan-cat/utils/move-vercel-output-to-root` 的方式，直接在对应的 monorepo 子包内运行。

由于不清楚 monorepo 包的深度问题，所以允许你设计出额外的脚本运行参数和解析逻辑，实现路径识别。但是我希望你使用本包提供的 monorepo 函数，实现根目录的定位。

在 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root` 目录内，新建脚本、使用说明文档、和测试用例。

### 1 出现重大设计失误

经过实际使用，对于 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root\index.ts` 而言，在真实的 monorepo 子包内，执行 `tsx @ruan-cat/utils/move-vercel-output-to-root` 是错误的。出现严重故障。

根据这篇文章 `https://raw.githubusercontent.com/ruan-cat/notes/refs/heads/dev/docs/ruan-cat-notes/docs/tsx/tsx-cli-module-resolution-trap.md` 的说明，我们的 tsx 方案完全就是错误的。很差劲的方案。

我们应该提供标准的 bin 字段。

1. 需要你更新 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root\index.ts` 。按理说你似乎不需要更新。
2. 完全重做 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root\index.md` 文档，说明清楚必须使用本包提供的 bin 字段来完成加载任务。
3. 设计了 `packages\utils\src\cli\index.ts` ，你应该在这里整合 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root\index.ts` 脚本。确保 `packages\utils` 包提供 bin 运行脚本。且 bin 运行脚本的入口是 `packages\utils\src\cli\index.ts` 文件。
4. 对于 `packages\utils\package.json` 这款，增加专门的 `packages\utils\src\cli` 目录下的 index.md 说明文档，说明本包提供了 cli 命令行。
5. 对于 `packages\utils\tsup.config.ts` ，你应该增加构建入口，确保该 `packages\utils\src\cli\index.ts` 和 bin 入口能够提供有效的构建后的可运行 javascript 脚本。

## 003 <!-- 已完成 --> 用 `@ruan-cat/utils` 的内部能力，完成对 `scripts\relizy-runner.ts` 脚本的内部整合

阅读以下内容：

- D:\code\github-desktop-store\01s-11comm\scripts\relizy-runner.ts
- D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\scripts\relizy-runner.ts

这些脚本是高度相似的，他们负责提取 pnpm 配置的内容，我需要在 `@ruan-cat/utils` 内设置一个能力，确保其能够实现这个脚本，就叫做 relizy-runner 。在 bin 内对外暴露这个路径。

我们的 packages\utils\src\cli 已经提供了一个通用的脚本入口，这个脚本需要识别 `relizy-runner` 这个入口，然后去执行 relizy-runner 的相关逻辑。

### 迭代优化脚本

尽管我让你去参考 relizy-runner.ts 脚本，但是我们自己的 relizy-runner 脚本，应该使用 consola 来优化显示效果。

### 补全 relizy-runner 的测试用例

你在 `D:\code\github-desktop-store\01s-11comm\` 和 `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo` 项目内，能看到和 relizy 相关的 vitest 测试用例的，模仿并为我们的 relizy-runner 脚本增加测试用例。

### 补全文档

在 `packages\utils\src\node-esm\scripts` 内新建具体的工作脚本、测试用例、和 index.md 的说明文档。其中，index.md 说明文档应该参考：

- D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo\README.md
- D:\code\github-desktop-store\01s-11comm\README.md

重点说明清楚在 monorepo 的根包内，要怎么配置这个 relizy-runner 脚本，这个脚本运行有哪些参数要使用。重点从这两个参考文档内，照搬，获取清楚 relizy 包运行时的参数。

### 本包的依赖需要拓展

这个脚本预期会使用 pnpm-workspace-yaml 、pkg-types、和 consola 这三个包。让本包增加 pnpm-workspace-yaml 、pkg-types 这两个包为生产环境依赖包。

## 004 <!-- 失败，经过AI验证，未能够实现替代 --> 迭代 `packages\utils\src\node-esm\scripts\relizy-runner\index.md` 说明文档

我觉得 relizy-runner 的文档，应该多说明，多讲讲关于 relizy 的东西，避免使用的时候出现其他杂七杂八的内容。

1. 发版的时候为什么容易出现出现误报？是什么原因？该故障已经在那个 pr 内修复了？
   > 完整的说明文档： D:\code\github-desktop-store\01s-11comm\docs\issues\relizy\2026-03-24-windows-path-body-filter-no-bump.md
   > 具体被修复的 pr： https://github.com/LouisMazel/relizy/pull/53

## 005 <!-- 失败，经过AI验证，未能够实现替代 --> 标记 `packages\utils\src\node-esm\scripts\relizy-runner\index.md` 说明文档的能力已经过时

全面阅读：

- https://github.com/LouisMazel/relizy/pull/58
- https://github.com/LouisMazel/relizy/pull/53

的 pr，现在的 relizy 已经修复这个问题了。

1. 你首先去看看 `github.com/LouisMazel/relizy` 项目内，是否修复了这个 window 的故障？
2. 评估 `packages\utils\src\node-esm\scripts\move-vercel-output-to-root` 这款脚本，是否已经过时了？
3. 去更新 `packages\utils\src\node-esm\scripts\relizy-runner\index.md` 说明文档的能力已经过时
