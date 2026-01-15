# 2026-01-15 VitePress 主题切换功能回退报告

## 背景

本报告说明为什么放弃 VitePress 主题切换功能，以及 VitePress 版本差异对两个主题的影响。

## 核心问题：VitePress 版本不兼容

### 两个主题的版本要求

| 主题     | 包名                            | 要求的 VitePress 版本      |
| -------- | ------------------------------- | -------------------------- |
| Teek     | `vitepress-theme-teek`          | `^1.6.3` (仅 1.x)          |
| VoidZero | `@voidzero-dev/vitepress-theme` | `^2.0.0-alpha.15` (仅 2.x) |

### 版本冲突的本质

1. VitePress 1.x 和 2.x 是**互斥的主版本**，无法同时安装
2. Teek 主题**仅支持** VitePress 1.x，其 `peerDependencies` 明确声明 `vitepress: ^1.6.3`
3. VoidZero 主题**仅支持** VitePress 2.x，其 `peerDependencies` 明确声明 `vitepress: ^2.0.0-alpha.15`

### 技术层面的不兼容

VitePress 2.0 相对于 1.x 有以下破坏性变更：

1. **API 变更**：VoidZero 主题使用了 VitePress 2.0 特有的 `provide/inject` API（如 `theme-context-key`）
2. **组件结构变更**：VoidZero 的组件（如 `TopBanner.vue`）依赖 VitePress 2.0 的上下文注入
3. **配置格式变更**：`markdown.lazyLoading` 等配置在 VitePress 2.0 中被移除

### 实际遇到的错误

在 VitePress 1.6.4 环境下尝试加载 VoidZero 主题时，出现以下错误：

```log
TopBanner.vue:18 Uncaught (in promise) TypeError: Cannot destructure property 'footerBg' of 'inject(...)' as it is undefined.
```

这是因为 VoidZero 主题的组件依赖于 VitePress 2.0 通过 `provide` 注入的主题上下文，而 VitePress 1.x 没有这个机制。

## 为什么无法实现主题切换

### 方案一：在 VitePress 1.x 下切换（失败）

1. Teek 主题正常工作
2. VoidZero 主题无法工作，因为缺少 VitePress 2.0 的 `provide/inject` 依赖

### 方案二：升级到 VitePress 2.x（不可行）

1. VoidZero 主题正常工作
2. Teek 主题无法工作，因为 Teek 尚未发布兼容 VitePress 2.0 的版本
3. 其他 monorepo 包（共 7 个）也依赖 VitePress 1.x，全量升级风险大

### 方案三：等待 Teek 支持 VitePress 2.0（未来可能）

目前 `vitepress-theme-teek` 最新版本 `1.5.4` 仍然只支持 VitePress 1.x。需要等待作者发布兼容版本。

## 决策

鉴于以上技术限制，决定**完全放弃主题切换功能**，回退到 main 分支的稳定状态：

1. 删除 `theme-switcher` 目录及所有相关代码
2. 删除 `@voidzero-dev/vitepress-theme` 依赖
3. 恢复原有的 Teek 主题配置
4. 保留其他非主题切换相关的改进

## 回退范围

### 需要删除的文件/目录

1. `packages/vitepress-preset-config/src/theme-switcher/` - 整个目录
2. `packages/vitepress-preset-config/src/config/theme-switcher.ts`
3. `packages/vitepress-preset-config/src/docs/.vitepress/theme/Layout.vue`
4. `packages/vitepress-preset-config/src/docs/prompts/add-switch-voidzero-dev-vitepress-theme/`
5. `.kiro/specs/vitepress-theme-switcher/` - 整个目录

### 需要回退的文件

1. `packages/vitepress-preset-config/src/types.ts` - 移除主题切换器类型定义
2. `packages/vitepress-preset-config/src/config.mts` - 移除 `handleThemeSwitcher` 调用
3. `packages/vitepress-preset-config/src/theme.ts` - 移除主题切换器相关代码
4. `packages/vitepress-preset-config/src/docs/.vitepress/theme/index.ts` - 恢复原有主题配置
5. `packages/vitepress-preset-config/src/docs/.vitepress/config.mts` - 移除主题切换器配置
6. `packages/vitepress-preset-config/src/config/index.ts` - 移除主题切换器导出
7. `packages/vitepress-preset-config/package.json` - 移除 `@voidzero-dev/vitepress-theme` 和 `fast-check` 依赖

## 结论

VitePress 主题切换功能在当前技术条件下无法实现，根本原因是两个目标主题对 VitePress 版本的要求互斥。建议在以下条件满足后重新评估：

1. Teek 主题发布兼容 VitePress 2.0 的版本
2. 或者 VoidZero 主题发布兼容 VitePress 1.x 的版本
3. 或者 VitePress 2.0 正式发布且生态稳定
