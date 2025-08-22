# 开发本包用的提示词

这里仅仅是记录提示词。便于后续复盘。

## 001

请为我推荐一个 github release 发行日志的生成方案。

我的发包流程如下：

我现在正在使用 github workflow 工作流 changesets/action 实现 github pr 的生成，在我的项目内出现有意义的 .changeset 变更集文件时，我的 github 工作流就会新建一个 pr。在我合并完 pr 时，changesets/action 会帮助我发包。使用 changeset 实现发包。

但是我的 github release 发行版的更新日志生成效果很差，没有包含我希望的 git commit 记录。请为我推荐一个方案，实现 github release 包含 git commit 的提交信息。

## 002

请深度思考。请为我推荐多个 github release 和 CHANGELOG.md 一起生成的方案：

本仓库现在的发包流程如下：

1. 使用 github workflow 工作流 changesets/action 实现 github pr 的生成。
2. 在我的项目内出现有意义的 .changeset 变更集文件时，我的 github 工作流就会新建一个 pr。
3. 在我合并完 pr 时，changesets/action 会帮助我发包。使用 changeset 实现发包。

该流程有以下缺点：
github release 发行版的更新日志生成效果很差，没有包含我希望的 git commit 记录。

请为我推荐多个改造方案，实现：

1. github release 和 CHANGELOG.md 的生成内容完全一样。
2. 可以通过 github pr 的合并，来触发发包行为。
3. 更新日志内包含语义化的 git commit 信息。包含 Conventional Commit 信息的更新日志。
   你提供的方案至少包含一个基于 changelogen https://github.com/unjs/changelogen 的方案。

## 003

请深度思考。我很喜欢你的方案。可以在本项目内实施。

1. 请你首先将你产出的方案，写入到文件 try-changelogen.md 内，便于我阅读。
2. 按照以下要求，逐步实施方案。

- 2.1 我不希望出现纯 js 的代码，请你在本 monorepo 内，新建一个包。用来实现上述的业务逻辑。包括：
- 2.1.1 自定义 changelog 插件 changelog-with-changelogen
- 2.1.2 GitHub Release 同步脚本 sync-github-release
- 2.1.3 changelogen 配置 changelogen.config.ts

请你将这些代码和业务逻辑，全部包括在一个子包内，该子包名为 @ruan-cat/release-toolkit 。

- 2.2 在你新建好子包 @ruan-cat/release-toolkit 后，请确保在发包之前，该包已经被打包生成了 javascript 文件，供其他环境使用。
- 2.3 .changeset/config.json 直接使用来自 @ruan-cat/release-toolkit 的配置。
- 2.4 .github/workflows/release.yml 运行的不是直接的 javascript，而是用 tsx 来直接运行 typescript。我希望你用类似于 tsx sync-github-release.ts 的方式来调用该脚本。
- 2.5 在本 monorepo 的 .config 内新建 changelogen.config.ts，并使用来自 @ruan-cat/release-toolkit 内预设好的配置。

其中，子包 @ruan-cat/release-toolkit 按照以下要求生成：

1. 打印日志使用 consola 而不是简单的 console 。
2. 构建工具使用 tsup 实现打包。
3. 恰当的阅读本 monorepo 其他的子包，按照上面的要求，package.json 的对外导出，应该包括打包后的 dist 和直接的 ts 文件。
4. 生成完 @ruan-cat/release-toolkit 子包的核心逻辑后，在该子包内生成合适的 README.md 说明文档，将该包的架构设计、使用说明都写清楚，归纳成文档，便于我以后阅读了解 @ruan-cat/release-toolkit 子包。
5. 对照其他子包的 README.md 文档，使用 automd 生成 npm version 和 npm downloads 的 badges 。
6. 在本仓库的根 README.md 文档内，使用 automd 补全 @ruan-cat/release-toolkit 子包的 badges 信息。

其中，changelogen 配置 changelogen.config.ts，按照以下要求生成：

1. changelogen.config.ts 会不可避免的使用 git commit 的信息，其 emoji 信息应该从子包 @ruan-cat/commitlint-config 内获取，请你主动阅读 @ruan-cat/commitlint-config 子包的信息。必要时，你可以适当的拆分 @ruan-cat/commitlint-config 子包的配置，便于你直接读取现成的配置。

## 004

请深度思考。

子包 @ruan-cat/release-toolkit 对外导出的 changelog-with-changelogen.ts 插件，在 .changeset\config.json 的 changelog 配置内使用，预期是作为一个变更日志生成工具。最终实现 github release 和 CHANGELOG.md 信息相统一的变更日志。

目前这个 changelog-with-changelogen.ts 插件，没有真正的使用 changelogen 内部的函数，实现对 git commit 信息的读取，并写入变更日志内。请你修改该文件，使其可以实现识别我的 git commit 信息，并使用 changelogen 内部的函数生成变更日志。

我希望 changelog-with-changelogen.ts 插件，不仅仅可以根据 changeset 变更集的文件来生成日志，也需要借助 changelogen 根据 git commit 生成变更日志。

## 005

请为我推荐一个在 monorepo 场景下的 node 发包方案。

我使用 github workflow、changeset 这些技术。并期望在 CHANGELOG.md 和 github release 内使用相同的变更日志，且能够接收到 pr 的更新内容，并在更新日志内看到基于 Conventional Commit 生成的日志。

## 006

推荐几款 .changeset\config.json 的 changelog 日志生成库。

我使用 github workflow、changeset 这些技术。并期望在 CHANGELOG.md 和 github release 内使用相同的变更日志，且能够接收到 pr 的更新内容，并在更新日志内看到基于 Conventional Commit 生成的日志。
