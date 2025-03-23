# @ruan-cat/vitepress-preset-config

## 0.7.2

### Patch Changes

1. 增加 `src` 导出路径。
2. 移除掉发包时多余的 `dist` 目录。

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
