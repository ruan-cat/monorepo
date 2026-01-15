# 实现计划

- [x] 1. 搭建项目结构和依赖
  - [x] 1.1 在 package.json 中添加 @voidzero-dev/vitepress-theme 和 fast-check 依赖
    - 将 `@voidzero-dev/vitepress-theme` 添加到 dependencies
    - 将 `fast-check` 添加到 devDependencies 用于属性测试
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 创建 theme-switcher 目录结构
    - 创建 `src/theme-switcher/` 目录
    - 创建子目录：`components/`、`adapters/`、`__tests__/`
    - _Requirements: 3.1_

- [x] 2. 实现 ThemeRegistry 核心模块
  - [x] 2.1 在 types 中创建 ThemeDefinition 和 ThemeRegistry 接口
    - 定义包含 id、name、theme、styles、cleanup 的 ThemeDefinition 接口
    - 定义包含 register、get、getAll、has、size 方法的 ThemeRegistry 接口
    - 从 src/types.ts 导出类型
    - _Requirements: 3.1, 7.2, 7.4_

  - [x] 2.2 实现 ThemeRegistry 类
    - 实现基于 Map 的主题存储
    - 实现支持覆盖的 register 方法
    - 实现 get、getAll、has、size 方法
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 2.3 编写 ThemeRegistry 注册的属性测试
    - **Property 6: 主题注册接受性**

    - **Validates: Requirements 3.1**

  - [x] 2.4 编写 ThemeRegistry 覆盖行为的属性测试
    - **Property 8: 主题覆盖行为**
    - **Validates: Requirements 3.4**

  - [x] 2.5 编写 ThemeRegistry 查找正确性的属性测试
    - **Property 9: 主题查找正确性**

    - **Validates: Requirements 3.5**

- [x] 3. 实现 ThemePersistence 模块
  - [x] 3.1 创建 ThemePersistence 接口和实现
    - 使用 localStorage 实现 save 方法

    - 实现带验证的 load 方法
    - 实现 clear 方法
    - 优雅处理 localStorage 不可用的情况

    - _Requirements: 1.4, 1.5_

  - [x] 3.2 编写持久化往返的属性测试
    - **Property 3: 主题持久化往返**
    - **Validates: Requirements 1.4**

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 5. 实现内置主题适配器
  - [x] 5.1 创建 Teek 主题适配器
    - 定义包含所有必需样式的 teekThemeDefinition

    - 从 src/theme-switcher/adapters/teek.ts 导出适配器
    - _Requirements: 2.1, 2.4_

  - [x] 5.2 创建 VoidZero 主题适配器
    - 按照官方集成模式定义 voidZeroThemeDefinition

    - 包含正确的样式导入和清理函数
    - 从 src/theme-switcher/adapters/voidzero.ts 导出适配器
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.3 创建适配器索引文件
    - 从 src/theme-switcher/adapters/index.ts 导出所有适配器
    - 创建 createBuiltinRegistry 函数以使用内置主题初始化注册表
    - _Requirements: 3.2_

- [x] 6. 实现 ThemeManager 核心模块
  - [x] 6.1 创建 ThemeManager 接口和实现
    - 实现 getCurrentTheme 方法

    - 实现带样式注入的 switchTheme 方法
    - 实现 getAvailableThemes 方法
    - 实现与持久化集成的 initialize 方法
    - _Requirements: 1.2, 1.3, 5.1, 5.2_

  - [x] 6.2 编写主题应用一致性的属性测试
    - **Property 1: 主题应用一致性**

    - **Validates: Requirements 1.2**

  - [x] 6.3 编写 CSS 动态更新的属性测试
    - **Property 12: CSS 动态更新**
    - **Validates: Requirements 5.2**

- [x] 7. 实现 ThemeSwitcherConfig 并扩展 ExtraConfig
  - [x] 7.1 在 types.ts 中添加 ThemeSwitcherConfig 接口
    - 定义 enabled、defaultTheme、themes、storageKey、customThemes、buttonPosition、buttonText 属性

    - 使用 themeSwitcher 属性扩展 ExtraConfig 接口
    - _Requirements: 4.1, 7.1, 7.4_

  - [x] 7.2 编写默认主题配置的属性测试
    - **Property 10: 默认主题配置**

    - **Validates: Requirements 4.3**

  - [x] 7.3 编写主题过滤的属性测试
    - **Property 11: 主题过滤**
    - **Validates: Requirements 4.4**

  - [x] 7.4 编写自定义主题合并的属性测试
    - **Property 7: 自定义主题合并**
    - **Validates: Requirements 3.3**

- [x] 8. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 9. 实现 ThemeSwitcherButton Vue 组件
  - [x] 9.1 创建 ThemeSwitcherButton.vue 组件
    - 实现带主题列表的下拉菜单
    - 实现主题选择处理器
    - 样式与 VitePress 导航栏匹配
    - _Requirements: 1.1, 1.3_

  - [x] 9.2 创建 useThemeSwitcher 组合式函数
    - 提供响应式主题状态
    - 暴露 switchTheme 和 getAvailableThemes 方法
    - 处理初始化和持久化
    - _Requirements: 1.2, 1.4, 5.3_

- [x] 10. 将主题切换器集成到现有 theme.ts
  - [x] 10.1 修改 defineRuancatPresetTheme 以支持主题切换器
    - 向 DefineRuancatPresetThemeParams 添加可选的 themeSwitcher 参数
    - 有条件地注册 ThemeSwitcherButton 组件
    - 保留现有的 enhanceApp 行为

    - _Requirements: 2.2, 2.4_

  - [x] 10.2 编写向后兼容性的属性测试 - defineRuancatPresetTheme
    - **Property 4: 向后兼容性 - defineRuancatPresetTheme**

    - **Validates: Requirements 2.2**

- [x] 11. 将主题切换器集成到现有 config.mts
  - [x] 11.1 修改 setUserConfig 以处理主题切换器配置
    - 在 config 目录中添加 handleThemeSwitcher 函数
    - 处理 ExtraConfig 中的 themeSwitcher
    - 使用配置的主题初始化 ThemeRegistry
    - _Requirements: 2.3, 4.2, 4.3, 4.4, 4.5_

  - [x] 11.2 编写向后兼容性的属性测试 - setUserConfig
    - **Property 5: 向后兼容性 - setUserConfig**
    - **Validates: Requirements 2.3**

- [x] 12. 实现 VoidZero 主题清理逻辑
  - [x] 12.1 向 VoidZero 适配器添加清理函数
    - 从文档中移除 VoidZero 特定的样式元素
    - 清理任何 VoidZero 特定的 CSS 变量

    - _Requirements: 6.4_

  - [x] 12.2 编写 VoidZero 主题清理的属性测试
    - **Property 13: VoidZero 主题清理**
    - **Validates: Requirements 6.4**

- [x] 13. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 14. 创建模块导出和文档
  - [x] 14.1 创建包含所有导出的 theme-switcher index.ts
    - 导出 ThemeRegistry、ThemeManager、ThemePersistence
    - 导出 ThemeDefinition、ThemeSwitcherConfig 类型

    - 导出内置主题适配器
    - 导出 ThemeSwitcherButton 组件

    - _Requirements: 7.4_

  - [x] 14.2 更新 src/index.ts 以包含 theme-switcher 导出
    - 为 theme-switcher 模块添加条件导出
    - 确保与现有导出的向后兼容性
    - _Requirements: 2.1, 7.4_
  - [x] 14.3 更新 src/config/index.ts 以导出主题切换器配置处理器
    - 导出 handleThemeSwitcher 函数
    - _Requirements: 4.1_

- [x] 15. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。
