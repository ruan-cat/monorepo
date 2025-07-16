# @ruan-cat/vitepress-preset-config 更新日志

## 0.16.0

### Minor Changes

- setUserConfig 函数增加参数 ruanCatConfig，用来进一步的精细化设置文档。 ([`ebd11b8`](https://github.com/ruan-cat/monorepo/commit/ebd11b86b6577796e664029aa0e084d234161505))

## 0.15.0

### Minor Changes

- 对外导出 `copyReadmeMd` 函数。用于实现Readme文件的复制功能。 ([`3b9b673`](https://github.com/ruan-cat/monorepo/commit/3b9b673fd4e0850fd8a36e3664e7cbb01dc52988))

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

- 接入插件 `vitepress-plugin-llms` 。文档打包后会生成便于大模型读取识别的文件。增强AI的读取能力。

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

- 最大日志深度为10, 避免获取过多无意义的历史日志

## 0.4.0

### Minor Changes

- 使用来自镜像源的demo展示包。

### Patch Changes

- Updated dependencies
  - @ruan-cat/vitepress-demo-plugin@0.1.0

## 0.3.0

### Minor Changes

- 主题配置改成用 `defineRuancatPresetTheme` 来实现定义与使用。

## 0.2.0

### Minor Changes

- 自动导入demo组件和样式。

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
- 更新了默认github按钮的入口。

## 0.0.2

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.1

## 0.0.1

### Patch Changes

- Updated dependencies
  - @ruan-cat/utils@4.1.0
