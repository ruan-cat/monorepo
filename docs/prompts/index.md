# 本项目的杂项提示词

## 01 本项目待办任务

- @ruan-cat/vercel-deploy-tool 运行时增加 dry 模式，干燥运行整个流程，不实际真的部署。模仿【turbo run build:docs --dry-run】的方式。
- 编写掘金文章，说明对 dry 模式的思考与设计。

## 02 统一设置 `themeConfig.editLink.pattern` 的取值

1. 阅读 `packages\vitepress-preset-config\src\docs\.vitepress\config.mts` 文件，以该配置文件的 `themeConfig.editLink.pattern` 为例子，重新设置整个项目全部的 `.vitepress\config.mts` 配置文件。
2. 配置文件的匹配地址为 `https://github.com/ruan-cat/monorepo/blob/dev/packages/vitepress-preset-config/src/docs/:path` ，请你根据被配置的 package 子包文件位置，更替为正确的地址。
3. 根据 glob 匹配 `**/.vitepress/config.mts` ，全面地读取本项目全部的 vitepress 配置文件，设置 `themeConfig.editLink.pattern` 。

## 03 处理打包错误

`@ruan-cat/vitepress-preset-config` 包的 build 命令会出现错误，请帮我修复该错误。

你也可以运行根包的 build 命令来检查错误。

## 04 制作基于 turbo 的 prebuild 命令，统一封装全体子包的 automd 运行命令

请你在 turbo.json 内，为全部的 "prebuild" 命令，制作一个全局的 turbo 任务，预期在运行 turbo 的 build 任务前，先完成 turbo 的 prebuild 任务。

## 05 <!-- TODO: --> 更新迭代 `.npmrc` 文件的配置，以便避免出现警告

1. 你可以阅读 `C:\Users\pc\.npmrc` 文件，了解上述配置使用了那些全局配置。
2. 阅读本项目全部的 `.npmrc` 文件。
3. 请阅读以下的 log 警告日志，帮我用合适的方案，实现配置信息的迁移。
4. 最后请为我生成一份研究报告，告诉我为什么会出现这些警告？以及如何避免上述的警告信息？

```log
npm warn Unknown project config "link-workspace-packages". This will stop working in the next
major version of npm.
npm warn Unknown project config "shamefully-hoist". This will stop working in the next major version of npm.
npm warn Unknown project config "public-hoist-pattern". This will stop working in the next major version of npm.
npm warn Unknown project config "ignore-workspace-root-check". This will stop working in the next major version of npm.
npm warn Unknown user config "COREPACK_NPM_REGISTRY". This will stop working in the next major version of npm.
npm warn Unknown user config "COREPACK_INTEGRITY_KEYS". This will stop working in the next major version of npm.
npm warn Unknown user config "NODE_TLS_REJECT_UNAUTHORIZED". This will stop working in the next major version of npm.
npm warn Unknown user config "store-dir". This will stop working in the next major version of
npm.
npm warn Unknown user config "cache-dir". This will stop working in the next major version of
npm.
```

## 06 使用 automd 提供的 `automd:pm-install` 来优化各个 README.md 文件的安装说明文本

- 阅读 https://automd.unjs.io/generators/pm-install 文档。
- 我们这整个 monorepo 项目，都全方位的在多个子包的 README.md 文档内，使用了 automd 来生成特定内容。我需要应用 automd 提供的这款工具来优化文档显示效果。按照以下步骤来完成批量升级：

1. 根据 `pnpm-workspace.yaml` 配置文件，扫描出本项目内有哪些有意义的 monorepo 子包。首先明确清楚有哪些 node 包需要被处理。
2. 检查每一个子包，是否安装了 automd 这个开发依赖。
3. 全局升级 automd 依赖，升级到最新版。
4. 使用 `git-commit` 技能，为依赖升级编写 git 提交信息。
5. 为各个有意义的子包，补全 README.md 文档。确保有意义的子包都包含一个 README.md 文档。
6. 如果增加了 README.md 文档，就使用 `git-commit` 技能，编写新建 README.md 文档的 git 提交信息。
7. 检查全部有意义子包的 README.md 文档，特别是检查其安装的写法。我们将使用 automd 提供的 `automd:pm-install` 特殊注释，来完成安装命令的批量重写。以后 README.md 文档不再手写依赖安装命令了，而是统一用 automd 来完成批量生成。
8. 你要仔细分别清楚，那些子包是需要写安装命令的，以及这些安装命令是安装为 dependencies 还是 devDependencies 依赖。

其中 `automd:pm-install` 特殊注释的格式如下：

```markdown
<!-- automd:pm-install name="package-name" dev -->
<!-- /automd -->
```

9. 删减写死的安装命令并替换成 `automd:pm-install` 特殊注释之后，就批量运行每个子包提供的 `prebuild` 命令。统一生成 automd 文本。
10. 生成完毕后，就使用 `git-commit` 技能，根据本次主动补全安装命令的 markdown 文档内容，编写 git 提交信息。

### 06.01 持续更新迭代 README 文档内容

/opsx:apply 有部分 README 文件的处理方式，不合适。

根据 git 历史记录，阅读这几个 README 文档：

- configs-package\commitlint-config\README.md
- packages\claude-notifier\README.md
- configs-package\taze-config\README.md
- packages\release-toolkit\README.md

这几个包对应的文档。应该补全对应的 peer 依赖。需要同步安装齐全足够的 peer 依赖。另外，有部分包本身是推荐用 npx 或 pnpm dlx 的方式来安装的。现在的文档内，丢失应该要同时安装的依赖项，没有说明清楚需要安装的对等依赖。也没有体现出相关包需要使用 npx 来使用。

请你帮我完成修改与补全。

---

请你更改 openspec 对应的规范设计文档。
