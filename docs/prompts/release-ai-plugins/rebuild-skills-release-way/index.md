# <!-- 已完成重构 --> 重构技能存储的目录层级，拓展成更加通用的技能分发方案

我的全部对外外发的技能，都存储在 `claude-code-marketplace\common-tools\skills` 目录内，是一个和 `claude-code-marketplace` ，和 claude code 高度绑定的一款配置插件方案。我希望全面的，重大改造我的 skills `分发方式`和`存储方式`。

## 参考资料

- https://cursor.com/cn/docs/reference/plugins

## 核心重构要求

- 多插件架构
- 多平台的插件商城架构
- 实现多平台插件商城、多款 plugins 的配置

重点阅读以下仓库：

- https://github.com/grafana/ai-marketplace
- https://github.com/greensock/gsap-skills
- https://github.com/sanity-io/agent-toolkit

我要求你学习好这些仓库的插件商城配置、和 plugin.json 的组织方式。重点阅读 `grafana/ai-marketplace` 仓库。

## 解耦 skills 的存储目录，细化 skills 的存储目录，重构多分发的多插件 ai-plugins 目录

我希望在本项目内，在整个项目的根目录内，专门新建一个 `plugins` 目录，层次分明的划分出两类子目录。

- common-tools
- dev-skills

我希望未来使用技能时，不要携带这两个目录名称作为使用的前缀名。

其实现在的 `claude-code-marketplace` 目录就很适合了，需要你直接把 `claude-code-marketplace` 目录重命名为 `ai-plugins` ，然后接着完成重构与开发。

## 重新划分现有技能的存储路径，按照其功能和范畴重新确定清楚其存储位置

其划分方案如下：

- common-tools
  - git-commit
  - get-git-branch
  - init-claude-code-statusline
  - init-prettier-git-hooks
  - init-ai-md
  - rebase2main
  - use-other-model
- dev-skills
  - nitro-api-development
  - openspec

你应该移动这些 skills 文档了。

## 解耦的 skills 目录便于拓展更多灵活的 skills 技能分发平台

现在的 skills 是和 claude code 插件商城耦合的，我希望以后的 skills 可以同时外发到多款 skills 分发平台，至少包括：

- claude code 插件商城
- cursor 插件商城

其实你需要新建好 `.claude-plugin/marketplace.json` 和 `.cursor-plugin/marketplace.json` 的目录层级就好了。

## claude code 插件商城增加一个内部插件 dev-skills

这款 claude code 插件商城，以后将提供两款插件了，一个是 common-tools ，另一个是 dev-skills 。

具体做法应该是：

- `ai-plugins/common-tools/.claude-plugin/plugin.json`
- `ai-plugins/common-tools/.cursor-plugin/plugin.json`

- `ai-plugins/dev-skills/.claude-plugin/plugin.json`
- `ai-plugins/dev-skills/.cursor-plugin/plugin.json`

## tsconfig.json 及时确保 skills 目录的 markdown 提供类型支持

及时更新对应的 tsconfig.json，确保不要出现 markdown 文件的类型报错。

## 及时重做整个 `.claude\skills\claude-code-marketplace` 技能

这个 `claude-code-marketplace` 技能是根据旧的文件目录结构，来完成技能版本号发布，以及相关插件商城文件的版本号发布更新的。

现在这个局部技能显然过时了，不能同时支撑多款 skills 发布渠道了。包括 claude code 插件商城，和 cursor 的插件商城。

请你及时更新，便于未来支撑更多的 skills 发布渠道的版本号更新场景。

## 直接重命名本地技能，`.claude\skills\claude-code-marketplace` 应该重命名为 release-ai-plugins ，重命名目录

## 及时更新其他对应的说明文档，和插件安装、skill 安装文档

我需要你重构，重新设计 AI 插件商城的说明文档。

### 编写面向 skills 这款 node 包的安装说明文档

预期在 `ai-plugins\docs\use-vercel-skills-install.md` 内编写如何用 skills 这款 node 包，全面安装本 monorepo 仓库提供的包。其中， `.claude-plugin\README.md` 文档内包含了很多使用 skills 安装技能的文档，剪切迁移进来，并且更新内部文本，更新路径。

### 编写多插件的说明文档

在 `ai-plugins\docs\README.md` 内编写本仓库如何使用多款面向不同客户端的 AI 插件安装使用文档。

### 缩减 `.claude-plugin\README.md` 文档的职责

只说明清楚本仓库如何以 claude code 插件的方式来安装对应的插件。

### 增加 `.cursor-plugin\README.md` 文档的

只说明清楚本仓库如何以 cursor 插件的方式来安装对应的插件。

### 根 README 的最底部适当重写

应该改写，增加以下文档作为入口：

- `ai-plugins\docs\use-vercel-skills-install.md`
- `ai-plugins\docs\README.md`
- `.claude-plugin\README.md`
- `.cursor-plugin\README.md`
