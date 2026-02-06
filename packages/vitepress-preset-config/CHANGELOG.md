# @ruan-cat/vitepress-preset-config 更新日志

## 2.14.0

### Minor Changes

- 1. `copyClaudeFiles` 函数新增 `skills` 文件夹复制支持，`ClaudeFolderName` 类型扩展为 `"agents" | "commands" | "skills"`。 ([`9b85305`](https://github.com/ruan-cat/monorepo/commit/9b8530533ce1879ca053b766c538247cabd7af85))
  2. 默认复制列表从 `['agents', 'commands']` 变更为 `['agents', 'commands', 'skills']`，构建产物将自动包含 `.claude/skills` 目录。

## 2.13.0

### Minor Changes

- 1. 升级 vitepress-plugin-llms 依赖，升级了按钮显示效果。 ([`41e6826`](https://github.com/ruan-cat/monorepo/commit/41e682699b91cbbc5857a566d1d047b28bc40c16))

## 2.12.4

### Patch Changes

- Updated dependencies [[`6423c34`](https://github.com/ruan-cat/monorepo/commit/6423c344e268852a91c8cffe5819d208e51a1cc0)]:
  - @ruan-cat/utils@4.20.0

## 2.12.3

### Patch Changes

- Updated dependencies [[`bbaba45`](https://github.com/ruan-cat/monorepo/commit/bbaba45d4e98338eabb84088e14dfcfbb67c8a66)]:
  - @ruan-cat/utils@4.19.0

## 2.12.2

### Patch Changes

- Updated dependencies [[`787361f`](https://github.com/ruan-cat/monorepo/commit/787361f4596fb3d391f420299c3cd3ae831c2dbd)]:
  - @ruan-cat/utils@4.18.0

## 2.12.1

### Patch Changes

- Updated dependencies [[`0d708cc`](https://github.com/ruan-cat/monorepo/commit/0d708cc9971d63f330efef2998d9fbf6768260d3)]:
  - @ruan-cat/utils@4.17.0

## 2.12.0

### Minor Changes

- 升级项目依赖到 [`vitepress-theme-teek@1.5.2`](https://github.com/Kele-Bingtang/vitepress-theme-teek/releases/tag/v1.5.2) ，该版本修复了标题包含类 html 标签文本时，本地运行失败的故障。修复了 [161 故障](https://github.com/Kele-Bingtang/vitepress-theme-teek/issues/161)。 ([`e45f8d7`](https://github.com/ruan-cat/monorepo/commit/e45f8d75d59651116ae6d157742ac1a601e340fd))

## 2.11.0

### Minor Changes

- 发包配置不提供 `typesVersions` ，不再对外提供该配置。类型导出由其他的配置实现。 ([`57f5fb8`](https://github.com/ruan-cat/monorepo/commit/57f5fb89ad4ede261820547821c903461c783281))

- 重构 Claude 文件复制功能，支持同时处理 `.claude/agents` 和 `.claude/commands` 文件夹： ([`9e5147a`](https://github.com/ruan-cat/monorepo/commit/9e5147a8d9bf303ba41a8c90652a6699a7eb1716))
  - **API 重命名**：`copyClaudeAgents` 函数重命名为 `copyClaudeFiles`，更准确地反映其功能范围
  - **类型重命名**：`CopyClaudeAgentsOptions` 接口重命名为 `CopyClaudeFilesOptions`
  - **新增导出**：`ClaudeFolderName` 类型，用于约束文件夹名称（`"agents" | "commands"`）
  - **新增功能**：
    - 现在会自动复制 `.claude/commands` 文件夹到目标位置，与 `.claude/agents` 保持相同的处理逻辑
    - 新增 `items` 配置项，支持选择性复制文件夹（默认复制 `agents` 和 `commands`）
    - 支持灵活配置：可选择只复制 `agents`、只复制 `commands`，或两者都复制
  - **行为变更**：
    - `target` 参数现在指向父文件夹，函数会自动创建 `agents` 和 `commands` 子文件夹
    - 例如：`target: 'src/docs/prompts'` 会生成 `src/docs/prompts/agents/` 和 `src/docs/prompts/commands/`
    - 使用 `items` 可以选择只复制部分文件夹，例如：`items: ['agents']` 只复制 agents 文件夹
    - 对于不存在的文件夹会打印警告并跳过，不影响其他文件夹的复制

  **破坏性变更**：
  - 已删除 `copyClaudeAgents` 导出，请改用 `copyClaudeFiles`
  - 已删除 `CopyClaudeAgentsOptions` 类型，请改用 `CopyClaudeFilesOptions`

## 2.10.0

### Minor Changes

- 全面调整全部包的 files 构建输出配置，统一排除规则，避免错误发布冗余文件 ([`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9))

  ## 主要改进
  - 优化 `files` 字段配置，更精确地控制发布到 npm 的文件列表
  - 统一排除不必要的构建产物和缓存文件（如 `.vitepress/cache`、`.vitepress/dist` 等），统一排除掉 `.vitepress` 文件夹
  - 排除测试文件和文档文件（`**/tests/**`、`**/docs/**` 等）
  - 使用 `dist/**` 替代 `dist/*` 以确保包含所有构建输出子目录
  - 统一各包的文件排除规则格式

  这些改动仅影响 npm 包的发布内容，不影响包的功能和 API，减少了包的体积并提升了发布质量。

### Patch Changes

- Updated dependencies [[`a0004e3`](https://github.com/ruan-cat/monorepo/commit/a0004e395be907502350efbe335f81d10ac299b9)]:
  - @ruan-cat/utils@4.16.0

## 2.9.0

### Minor Changes

- 重构 `addChangelog2doc` 函数的 markdown 数据写入 yaml 的实现方式 ([`5d3ca82`](https://github.com/ruan-cat/monorepo/commit/5d3ca824c0265989a381a4ee474871c33f99947f))

  **主要变更：**
  - 使用 `gray-matter` 库替代原有的 `writeYaml2md` 函数实现 YAML frontmatter 的写入
  - 移除了 `lodash-es` 的数据合并逻辑，改为直接覆盖写入
  - 新增 `data` 参数的默认值 `pageOrderConfig.changelog`，使用更加灵活
  - 代码实现与 `writeYaml2PromptsIndexMd` 函数保持一致的风格和库选择

## 2.8.0

### Minor Changes

- 依赖项变更。移除掉了不需要使用的 js-yaml 依赖。 ([`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1))

### Patch Changes

- Updated dependencies [[`32c6493`](https://github.com/ruan-cat/monorepo/commit/32c6493b38c6daf8ab4d1497fdaefdc2e785e8e1)]:
  - @ruan-cat/utils@4.15.0

## 2.7.0

### Minor Changes

- 1. 自动识别提示词文件，并增加顶部导航栏入口。 ([`b55b641`](https://github.com/ruan-cat/monorepo/commit/b55b641272c828063369d3aa828c8d15a503a690))
  2. 优化 VitePress 项目路径解析和 YAML frontmatter 处理

  ## 新增功能
  - 自动识别提示词文件，并增加顶部导航栏入口。在 vitepress 项目的 srcDir 目录内，编写 prompts/index.md 文件时，就默认增加顶部导航栏。
  - **项目根目录解析优化**：新增 `getProjectRootFromArgs()` 函数，支持从命令行参数解析 VitePress 项目根目录
  - **源目录获取功能**：实现 `getVitepressSourceDirectory()` 函数，支持获取 VitePress 的源目录（srcDir），正确处理配置文件中的 `srcDir` 选项
  - **智能 YAML frontmatter 合并**：重写 `writeYaml2PromptsIndexMd()` 函数，使用 `gray-matter` 库实现 YAML frontmatter 的智能读取、解析和合并

  ## 功能改进
  - 使用 `lodash-es` 的 `merge` 函数实现深度数据合并，保留已有数据的同时更新新字段
  - 增强了路径解析的健壮性，支持从命令行参数、向上查找等多种方式获取项目路径
  - 更清晰的日志输出，便于调试和追踪执行过程

  ## 依赖变更
  - 新增依赖：`gray-matter@^4.0.3` - 用于处理 Markdown 文件的 YAML frontmatter
  - 移除对 `@ruan-cat/utils` 中 `writeYaml2md` 函数的依赖

  ## 技术细节

  本次更新使函数能够：
  1. 正确解析 `vitepress dev src/docs` 命令中的项目路径
  2. 支持配置文件中的 `srcDir` 选项
  3. 智能合并已有的 YAML frontmatter 数据，避免数据丢失
  4. 自动创建不存在的目录和文件

## 2.6.0

### Minor Changes

- ## 1. 文件重构 ([`bcc918d`](https://github.com/ruan-cat/monorepo/commit/bcc918deea3a5e9a45de4cfdfa015c0531197d88))

  重构变更日志导航栏配置模块的代码组织结构

  ### 主要变更
  - 将 `handleChangeLog` 函数从主配置文件 `config.mts` 中抽离到独立的 `config/changelog-nav.ts` 模块
  - 优化了代码文件的职责划分，提升了代码的可维护性和可读性
  - 移除了主配置文件中不必要的 `hasChangelogMd` 导入，该工具函数现在仅在 `changelog-nav.ts` 模块内部使用

  ### 技术细节

  此次重构将变更日志导航栏的处理逻辑从主配置文件中分离，形成独立的功能模块。这种模块化的组织方式有助于：
  - 降低主配置文件的复杂度
  - 提高代码的内聚性
  - 便于后续维护和功能扩展

  **注意**：此次重构不涉及任何功能性变更，仅调整内部代码排布方式。对外暴露的 API 保持完全兼容。

  ## 2. 增加新的配置文件 `pageOrderConfig`

  用来统一控制部分固定页面的页面排序。

  ## 3. 将 utils 包专供 vitepress 文档预设的工具函数全部迁移整合到本包

  以后就再也不需要再 utils 包内使用本应该是 vitepress 负责的函数了。提高可读性。

### Patch Changes

- Updated dependencies [[`3cd2148`](https://github.com/ruan-cat/monorepo/commit/3cd2148ad896203508cc5e1ddc185683a7edaf83), [`bad3e51`](https://github.com/ruan-cat/monorepo/commit/bad3e51e4d6c914663032e93cc5cdcd9500233d0)]:
  - @ruan-cat/utils@4.14.0

## 2.5.1

### Patch Changes

- vitepress 预设配置，更新正确的默认定向文档。`themeConfig.editLink.pattern` 现在默认指向[该地址](https://github.com/ruan-cat/monorepo/blob/dev/packages/vitepress-preset-config/src/docs/please-reset-themeConfig-editLink.md)。 ([`c0913c8`](https://github.com/ruan-cat/monorepo/commit/c0913c82923eb283f7379632de2ade82b0562a6b))

## 2.5.0

### Minor Changes

- 为 VitePress 预设配置添加 editLink 编辑链接功能 ([`cda56a3`](https://github.com/ruan-cat/monorepo/commit/cda56a347f980da53ad1017b17d9451287f0d7d0))
  - 在默认配置中添加 `themeConfig.editLink` 配置，支持在文档页面显示编辑链接
  - 更新站点配置的 GitHub 链接从 main 分支切换到 dev 分支
  - 新增配置指南文档 `please-reset-themeConfig-editLink.md`，说明如何正确配置 editLink.pattern
  - 编辑链接支持使用 `:path` 占位符动态生成对应页面的 GitHub 源文件链接

## 2.4.1

### Patch Changes

- Updated dependencies [[`896d2eb`](https://github.com/ruan-cat/monorepo/commit/896d2eb7677b7887e36074a24146784377663e04)]:
  - @ruan-cat/utils@4.13.0

## 2.4.0

### Minor Changes

- fa043fb: 对外导出工具函数 copyClaudeAgents 。

## 2.3.0

### Minor Changes

- 使用 vitepress-theme-teek 主题提供的[样式增强](https://vp.teek.top/guide/styles-plus.html#样式增强)效果。增强的效果包括： ([`c4d782a`](https://github.com/ruan-cat/monorepo/commit/c4d782a4470da313cedc51d47bfc468d63709db0))
  - 文章一级标题渐变色
  - 导航栏毛玻璃样式
  - 滚动条样式
  - 侧边栏样式
  - 右侧目栏录文字悬停和激活样式
  - 首次进入页面添加渐显动画

## 2.2.0

### Minor Changes

- 优化代码块的展示效果。使用 teek 主题的 [codeBlock](https://vp.teek.top/reference/config/global-config.html#codeblock) 配置实现优化。 ([`30feea8`](https://github.com/ruan-cat/monorepo/commit/30feea8f726faff982deabc0faec288e0bea5514))

## 2.1.0

### Minor Changes

- 封装 [vitepress-plugin-llms](https://github.com/okineadev/vitepress-plugin-llms/blob/main/README.md) 提供的复制按钮。 ([`1281367`](https://github.com/ruan-cat/monorepo/commit/128136703389c07acf650ffd78aa5360aebacec7))

## 2.0.0

### Major Changes

- 1. 增加 getPlugins 函数，用于配置 vitepress 的插件。实现自定义插件配置。 ([`249e6f0`](https://github.com/ruan-cat/monorepo/commit/249e6f01ff5da95a8370af6e5d7051f671242a91))
  2. setUserConfig 函数，增加 extraConfig 配置。允许用户做出额外的配置
     - `plugins` 即 vite 的 plugins
     - `teekConfig` Teek 主题配置

## 1.4.0

### Minor Changes

- 重新恢复 mermaid 渲染能力。并且渲染方案选用 [@leelaa/vitepress-plugin-extended](https://github.com/admin8756/vitepress-ext) ，而不是 [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) 的方案了。 ([`bbb7acf`](https://github.com/ruan-cat/monorepo/commit/bbb7acfd7dc0798960e5a96c35abd38f2553a7df))

- 内部文件移动重构位置。 ([`420d7b3`](https://github.com/ruan-cat/monorepo/commit/420d7b388d2ee7f5becb0abad432b6d9d823a7e6))

## 1.3.0

### Minor Changes

- - 关闭默认的 [teekHome](https://vp.teek.top/reference/config/global-config.html#teekhome) 首页风格。 ([`986421f`](https://github.com/ruan-cat/monorepo/commit/986421f7cfbb9cdeb07cc36bf4b2a74dcc8cb3c4))
  - 默认启动项目的端口为 8080 。

## 1.2.1

### Patch Changes

- 更新行号渲染错误的文档。 ([`86988a8`](https://github.com/ruan-cat/monorepo/commit/86988a83580ef46a8c312d50c5e7ffff09f5f046))

## 1.2.0

### Minor Changes

- 增加行号显示。 ([`b988db7`](https://github.com/ruan-cat/monorepo/commit/b988db74836e1148e68d2a49b327934727c2d9dc))

## 1.1.0

### Minor Changes

- 增加发包配置 `!**/.vercel/**` 避免出现不小心把部署信息一起打包的情况。减少打包体积。 ([`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16))

### Patch Changes

- Updated dependencies [[`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16)]:
  - @ruan-cat/utils@4.10.0

## 1.0.0

### Major Changes

- 本依赖包改成默认对 [vitepress-theme-teek](https://github.com/Kele-Bingtang/vitepress-theme-teek) 主题的二次封装，不再是自己封装的一套预设了。 ([#14](https://github.com/ruan-cat/monorepo/pull/14))
  - 移除内置的 [vite-plugin-vercel](https://github.com/magne4000/vite-plugin-vercel/tree/v9) 插件。
  - 项目不再会自动生成 `.vercel` 目录，因为移除了 vite-plugin-vercel 插件。
  - 移除定义文档配置时的插件配置对象。

## 0.16.2

### Patch Changes

- 1. 更新依赖。 ([`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27))
  2. 首页 README.md 增加了来自 automd 提供的标签，优化显示效果。
- Updated dependencies [[`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27)]:
  - @ruan-cat/utils@4.9.2

## 0.16.1

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

- Updated dependencies [[`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe)]:
  - @ruan-cat/utils@4.9.1

## 0.16.0

### Minor Changes

- setUserConfig 函数增加参数 ruanCatConfig，用来进一步的精细化设置文档。 ([`ebd11b8`](https://github.com/ruan-cat/monorepo/commit/ebd11b86b6577796e664029aa0e084d234161505))

## 0.15.0

### Minor Changes

- 对外导出 `copyReadmeMd` 函数。用于实现 Readme 文件的复制功能。 ([`3b9b673`](https://github.com/ruan-cat/monorepo/commit/3b9b673fd4e0850fd8a36e3664e7cbb01dc52988))

### Patch Changes

- Updated dependencies [[`cce2a9e`](https://github.com/ruan-cat/monorepo/commit/cce2a9ede596409e0b84575beff8975f49cf76c5)]:
  - @ruan-cat/utils@4.9.0

## 0.14.0

### Minor Changes

- 增加图片放大预览功能。 ([`32d5561`](https://github.com/ruan-cat/monorepo/commit/32d5561fe24678777dfec68e5ca1104b0fd03f7f))

## 0.13.4

### Patch Changes

- 增加依赖 [vitepress-plugin-image-viewer](https://github.com/T-miracle/vitepress-plugin-image-viewer) ，准备对接该库。 ([`a578e43`](https://github.com/ruan-cat/monorepo/commit/a578e43ed551eebbb0a364275746a0aba0f812a2))

## 0.13.3

### Patch Changes

- 杂项变更，发包仓库地址改名。

  发包时，其 `repository.url` 从 `git+https://github.com/ruan-cat/vercel-monorepo-test.git` 更改成 `git+https://github.com/ruan-cat/monorepo.git` 。以便适应仓库名称改名的需求。

  现在发包的 package.json 内，其 url 地址如下：

  ```json
  {
  	"repository": {
  		"url": "git+https://github.com/ruan-cat/monorepo.git"
  	}
  }
  ```

- Updated dependencies []:
  - @ruan-cat/utils@4.8.1

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.8.0

## 0.13.1

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.7.0

## 0.13.0

### Minor Changes

- 使用本预设打包文档项目时，会在文档根目录内，额外生成 `.vercel` 目录，以便于 vercel 平台的部署。

## 0.12.3

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.6.0

## 0.12.2

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.5.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.4.0

## 0.12.0

### Minor Changes

- 不输出调试信息

## 0.11.2

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.2

## 0.11.1

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.1

## 0.11.0

### Minor Changes

- 对外导出来自 [vitepress-plugin-mermaid](https://emersonbottero.github.io/vitepress-plugin-mermaid/) 的 withMermaid 函数。

### Patch Changes

- Updated dependencies []:
  - @ruan-cat/utils@4.3.0

## 0.10.0

### Minor Changes

- 接入插件 `vitepress-plugin-llms` 。文档打包后会生成便于大模型读取识别的文件。增强 AI 的读取能力。

## 0.9.1

### Patch Changes

- github 仓库改名了。不再使用 `/vercel-monorepo-test/` 字符串，全部改成 `/monorepo/` 。对外不再称呼为测试性质项目，而是正式的工程项目。
- Updated dependencies
  - @ruan-cat/utils@4.2.2

## 0.9.0

### Minor Changes

1. 实现 0.8.0 版本的删减计划。

## 0.8.0

### Minor Changes

1. 移除 `defaultTheme2` 测试主题。不再需要该内容完成测试。
2. 主题配置默认使用 `defaultTheme` 对象和 `defineRuancatPresetTheme` 函数完成配置。
3. 主题配置默认仅服务于纯 `ts` 文件，不考虑 `js` 文件。

未来的预期更改如下：

1. `defaultLayoutConfig` 和 `defaultEnhanceAppPreset` 要被标记为内部变量，未来将不再导出。
2. 主题配置将**不再要求**手动导入 `import "@ruan-cat/vitepress-preset-config/theme.css";` 样式。

## 0.7.2

### Patch Changes

1. 增加 `src` 导出路径。
2. 移除掉发包时多余的 `dist` 目录。

`0.7.2` 版本属于可用版本。经过验证，直接对外导出 typescript 文件就能让 vitepress 正常工作。

## 0.7.1

### Patch Changes

- 提供 `defaultTheme2` 用于测试。

## 0.7.0

### Minor Changes

1. 增加 `vue` 作为对等依赖。
2. 增加 `defaultLayoutConfig` 和 `defaultEnhanceAppPreset` 。现在主题配置要求用户自己拼接。

## 0.6.0

### Minor Changes

- 放弃内部封装 `vitepress-demo-plugin` 依赖。要求生产环境安装该对等依赖。

## 0.5.0

### Minor Changes

- 主题配置要求手动导入 `import "@ruan-cat/vitepress-preset-config/theme.css";` 样式。

## 0.4.1

### Patch Changes

- 最大日志深度为 10, 避免获取过多无意义的历史日志

## 0.4.0

### Minor Changes

- 使用来自镜像源的 demo 展示包。

### Patch Changes

- Updated dependencies
  - @ruan-cat/vitepress-demo-plugin@0.1.0

## 0.3.0

### Minor Changes

- 主题配置改成用 `defineRuancatPresetTheme` 来实现定义与使用。

## 0.2.0

### Minor Changes

- 自动导入 demo 组件和样式。

`vitepress-demo-plugin` 的样式和组件将会在本包内实现导入和全局注册。不再使用内部注入的方式向 md 文件注入局部组件。

## 0.1.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.1

## 0.1.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.2.0

## 0.1.0

### Minor Changes

1. 提供默认的 container 容器标签中文名称。
2. 集成 twoslash 类型生成工具。

## 0.0.3

### Patch Changes

- 删除掉内部冗余的配置。
- 更新了默认 github 按钮的入口。

## 0.0.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 0.0.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0
