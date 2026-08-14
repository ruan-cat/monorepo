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

## 05 <!-- 已完成 --> 更新迭代 `.npmrc` 文件的配置，以便避免出现警告

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

## 007 <!-- 已完成 --> 给 vitepress 文档站点增加 `favicon.svg`

我们的 monorepo 项目内，有很多的 vitepress 文档，但是这些 vitepress 文档都没有对应的，合适的 `favicon.svg` 。请你按照满足 vitepress 的格式，补全，增加满足各个项目风格的 style 设计的 `favicon.svg` 。

我的偏好：

- 颜色最多 2 个。
- 直接展示出 iconify 的那种清晰明亮的 icon 图标。
- 避免过于复杂而导致 `favicon.svg` 在浏览器内阅读困难。我不想在浏览器内看到一团浆糊。

优先去 iconify 图标库内去找设计灵感。

## 008 <!-- Kimi Work正在处理 已完成 --> 处理 WorkBuddy 内出现的 memorix MCP 故障

尝试通过 memorix 查询记录，但 memorix MCP 服务器当前无法启动，原因是 better-sqlite3 的 native 绑定与当前 Node 版本（v22.14.0 / ABI 127）不匹配。错误信息核心如下：

```log
Could not locate the bindings file. Tried:
 → ...\better-sqlite3\build\Release\better_sqlite3.node
 → ...\compiled\22.14.0\win32\x64\better_sqlite3.node
```

我要求你解决这个故障，不要通过改写 WorkBuddy MCP 配置文件的方式来解决，去重点看看 better-sqlite3 本身的问题，去看看我们是不是要重新全局 build 一下？是不是要根据 node 版本来实现一次重新构建 memorix 对应的依赖项？

---

需额外构建一个 ABI 127 的副本并存入 lib/binding/node-v127-win32-x64/，我需要你做这一步。

## 009 <!-- 委托给其他长任务来完成 codex正在做 --> 整个项目 vitest 基础设置全面升级问题

Vitest 4 本身也已经把旧 workspace 配置迁向 projects；因此更没有必要借这个 MCP 项目顺手迁全仓测试基础设施。
现在时间过了很久了，我想让你看看一个非常具有破坏性的变更，我们整个项目的基础设施可以完成统一的升级么？
我们的 vite 可以到 vite8 么？vitest 可以到 vitest4 么？

## 010 <!-- 已完成 codex正在做 --> 阅读 2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web 上下文并制作任务工件

`docs\prompts\release-ai-plugins\2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web` 目录全都是已经设计好的东西，全都是已经设计好任务提示词。你直接拿来用就行，我相信大多数的实施细节和边缘问题都已经写清楚了。
但是我要求你，按照严格的 do-long-task 技能 ，新建一个独立的长任务。我相信这个云 MCP 制作任务，是一个很困难的任务。是需要你长期完成的任务，因此我要求你在保留这些必要的 `docs\prompts\release-ai-plugins\2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web` 上下文的同时，制作一个基于 do-long-task 的长任务执行工件。便于我随时根据实际 token 供应情况，做出任务中断与任务恢复。

## 011 <!-- TODO: --> 2026-8-13 执行长任务 vite8-vitest4-foundation-upgrade

阅读 - openspec\changes\vite8-vitest4-foundation-upgrade 目录内的全部必要的任务工件，用 do-long-task 技能完成这个艰巨的长任务。

## 012 <!-- 已完成第一阶段的开发和生产环境部署； codex pro5 正在做 --> 2026-8-13 执行长任务 make-skill-router-mcp-for-chatgpt-web

阅读 openspec\changes\make-skill-router-mcp-for-chatgpt-web 目录内的全部必要的任务工件，用 do-long-task 技能完成这个艰巨的长任务。

---

我看了你的硬性卡点：

1. Cloudflare dashboard/API 授权。
   - 我们本地的 wrangler 是可以用的。wrangler 给了你足够多的权限和工具，能完成必要的 cloudflare worker 部署，以及基于 git 提交完成修改部署的 git 链接。

其他要求和问题：

1. `.github\workflows\skill-router-mcp.yml` 的设计很稳妥，但是我要求你做成一个 `.github\workflows\ci.yaml` 的附属子任务。我再跟你说的是类似于 github workflow 工作流模块化划分的东西，我希望你做出这样的模块化改造。毕竟 skill-router-mcp.yml 设计的本质和 ci.yaml 的职测一样，都是完成云端的基础测试。我要求你做出合适的模块化整合。
2. `packages\skill-router-mcp\nitro.config.ts` 的 compatibilityDate 我不满意。你应该严格按照 `nitro-api-development` 这款全局技能的要求，做出 compatibilityDate 的配置日期改动。我不希望出现 compatibilityDate 层面额故障。
   - 你可以反驳我，除非在我们这样的云 MCP 业务内情况不对劲，否则我是要求你改成符合要求的 compatibilityDate 取值的。

---

我要求你给我在本项目，注册局部级别的 cloudflare MCP 配置，而不是全局 MCP 配置，我的 codex 本身就有很多全局的 MCP 了，我不想增加全局 MCP 了，对于本任务，我只能接受本项目的 codex 目录内提供项目级别的 MCP 配置。

Cloudflare API token 获得 Workers Builds Git Integration 访问权限。
Cloudflare 官方明确要求 Workers Builds API 使用 `User-scoped API token`；`Account-scoped token` 会被拒绝。创建/管理 Builds trigger 至少需要 Workers CI Write 权限。
`Cloudflare Workers Builds Git Integration`

---

<!-- 放弃询问 -->

我有几个疑问，云 MCP 用的是 cloudflare worker 的额度么？如果我给这个 cloudflare worker 绑定了自己的域名，请问会不会高强度占用域名的 cloudflare CDN 代理流量呢？这个额度大概多少，能支撑的多大规模，多少人的高强度使用呢？我需要对这个云 MCP 的性能承担能力有个底。请你在 `docs\prompts\release-ai-plugins\2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web` 目录内，新建专门的报告文件夹，编写一个报告，说明清楚这个云 MCP 能提供的额度情况。

---

<!-- 放弃询问 -->

现在的 https://dash.cloudflare.com/3412269ab0def154c8806e38acd1b493/workers/services/view/skill-router-mcp/production ，即我 cloudflare 账户的 cloudflare worker ，`skill-router-mcp` 这款 cloudflare worker，还没有实现对 `https://github.com/ruan-cat/monorepo` 指定目录的 git 触发配置和链接。按照你的计划和要求，这是必须做的到，请你继续完成这个基于 github 的监听修改。务必要监听 dev 分支的修改。

---

<!-- 已处理，放弃询问 -->

我在 ChatGPT web 内，无法连接这个云 MCP，我哪里写错了？
![2026-08-13-15-12-20](https://gh-img-store.ruan-cat.com/img/2026-08-13-15-12-20.png)

## 013 <!-- TODO: ChatGPT web正在做 --> 需要合适的云 github workflow 层面的 prettier 格式化流程

我觉得我需要一个通用层面的，基于项目具体的 format 格式化函数的，github workflow 格式化专用工作流。以便补全纯 origin 云 git 分支开发的 prettier 格式化行为的补全。
正如 `ai-plugins\common-tools\skills\init-prettier-git-hooks\SKILL.md` 技能做的一样，这个技能能帮助我们在本地开发的时候，在 lint-stage 和 vscode plugins 层面上都做好 prettier 格式化行为。所以只要是经过本地 git 分支开发的文件，都会完成这些 prettier 格式化批处理。这是完善的工程化做法。

我们最近有 2 个完全由 ChatGPT web 云开发完成的工作任务，分别是 117 号 pr，和已经正式完成可记录 merge 合并的 119 号 pr。这两款 pr 都事实上的实现了 git 合并，都整合到 dev 了。但是这一大批文件修改和新增，都脱离的本地文件系统，所以他们都不经过 lint-stage 和 vscode plugins 层面的 prettier 处理管线。我们的纯粹云 origin git 分支处理产生的大量文件修改，均没有经过任何人的 prettier 处理。我们事实上是应该要增加一款 github workflow 来代为完成这一大堆文件的格式化的。

1. 你现在是云任务，是 ChatGPT web。动用你的 github 和 `skill-router-mcp` 这两款连接器的全部可用工具来完成基于主 pr 和多轮 pr 测试性 pr 的自测自检方式的云任务。
2. 你的指导 skills 参考资料包括： `init-prettier-git-hooks` ，用 `skill-router-mcp` 这款云 MCP 来查询 `init-prettier-git-hooks` 技能寻求清晰的 prettier 参考。
3. 你的工作目标是 `https://github.com/ruan-cat/monorepo/tree/dev` ，注意清楚 pr 目标分支是 dev 分支。
4. 你的 pr 稿的 title 标题应该使用 git-commit 技能的要求来编写合适的标题。
5. 我现在需要你在 `docs\plan\2026-8-15-cloud-ci-prettier` 目录设计一个完整的 spec 和 plan 落地规划文档。
6. 然后你直接新建一个合适的 github workflow 文件，完成我需要交给你的任务： 即补全 pr 流程时缺乏的基于修改的 prettier 流程。
7. 这款新的 github workflow 应该是要基于 pr 作为触发器来执行的。只有 pr 才能调度触发这款 github workflow。
8. 最后告诉我需要我完成审核审批的主 pr 编号，和中途产生的 origin 云分支名称，告诉我哪些 origin branch 属于主工作分支，哪些是需要我介入删除的临时云分支。

---

我要求你继续优化迭代，我现在觉得我们无条件先完成一个根包 package.json 的 format，然后再开始清理副作用，然后再 git commit 提交格式化修改。流程如下：

1. 无条件全量大范围 format
2. 用 node 能力再完成去除副作用。
3. 最后对被修改的内容做 git commit。

我感觉这个效率有点低下了。那么如果我这一个目标项目，本来就内容非常多，文件极其庞大，那么前两个步骤就有可能大面积的消耗性能，如果我的这一次 pr 只提交了少量文件，但是大部分的性能和时间开销都被前两个步骤吞了。时间和性能得不偿失。你能不能给我一个更加好的，更加精准有效的 pr 文件提取以及精准格式化的方案？
既然我们的 `"format": "prettier --experimental-cli --write --no-parallel '**/*.{js,jsx,ts,tsx,mts,json,css,scss,md,yml,yaml,html}' '!**/snippets/**' --ignore-path ./.config/.prettierignore --ignore-path .gitignore",` 能完成格式化，我在想的是，你能不能给我用更加精准有效的方式，比如用 prettier cli 传递参数的方式，实现对少量精准文件的获取并完成格式化。产生出有效的格式化之后，在酌情提交 git commit。

## 014 <!-- TODO: --> 设计合适的云任务提示词

## 014 <!-- TODO: -->
