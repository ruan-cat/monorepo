# Claude Code 插件 Hooks 重复加载问题修复报告

**日期**: 2025-11-19
**版本**: v0.6.6 → v0.6.7
**问题类型**: Bug Fix
**影响范围**: `common-tools` 插件配置

## 问题概述

在使用 Claude Code 插件 `common-tools` 时，出现了 `Duplicate hooks file detected` 错误，导致插件无法正常加载，所有 hooks 功能失效。

### 错误日志

```log
Plugin Errors
└ 1 plugin error(s) detected:
  └ common-tools@ruan-cat-tools [common-tools]: Hook load failed: Duplicate hooks file
detected: ./hooks/hooks.json resolves to already-loaded file C:\Users\pc\.claude\plugins\marketplaces\ruan-cat-tools\claude-code-marketplace\common-tools\hooks\hooks.json. The standard hooks/hooks.json is loaded automatically, so manifest.hooks should only reference additional hook files.
```

## 问题分析

### 根本原因

Claude Code 插件系统具有**自动加载机制**：

- 标准位置的 `hooks/hooks.json` 文件会被**自动加载**
- 无需在 `plugin.json` (manifest) 中显式声明

### 错误配置

`plugin.json` 中的错误配置：

```json
{
	"name": "common-tools",
	"version": "0.6.6",
	"commands": ["./commands/markdown-title-order.md", "./commands/close-window-port.md"],
	"agents": ["./agents/format-markdown.md", "./agents/migrate-iconify-use-pure-admin.md"],
	"hooks": "./hooks/hooks.json" // ❌ 错误：重复引用
}
```

这导致了**重复加载**：

1. 系统自动加载 `./hooks/hooks.json`（默认行为）
2. `plugin.json` 手动指定加载同一文件（重复引用）

## 解决方案

### 修复措施

删除 `plugin.json` 中的 `hooks` 字段配置：

```json
{
	"name": "common-tools",
	"version": "0.6.7",
	"commands": ["./commands/markdown-title-order.md", "./commands/close-window-port.md"],
	"agents": ["./agents/format-markdown.md", "./agents/migrate-iconify-use-pure-admin.md"]
	// ✅ 已删除 "hooks": "./hooks/hooks.json"
}
```

### Claude Code Hooks 配置规范

根据官方文档总结：

#### 1. 自动加载机制

- **标准位置**: `hooks/hooks.json` 会被自动加载
- **无需声明**: 不需要在 manifest 中显式引用

#### 2. `hooks` 字段的正确用途

**✅ 应该使用的场景**：

- 引用**额外的** hooks 文件（非标准位置）
- 加载多个 hooks 配置文件

```json
{
	"name": "my-plugin",
	"hooks": "./custom-location/extra-hooks.json" // ✅ 自定义位置
}
```

**❌ 不应该使用的场景**：

- 引用标准位置的 `./hooks/hooks.json`
- 会导致重复加载错误

```json
{
	"name": "my-plugin",
	"hooks": "./hooks/hooks.json" // ❌ 会重复加载
}
```

#### 3. 最佳实践

**单个 hooks 文件（推荐）**：

```json
{
	"name": "my-plugin"
	// 不配置 hooks 字段，系统自动加载 ./hooks/hooks.json
}
```

**多个 hooks 文件**：

```json
{
	"name": "my-plugin",
	"hooks": ["./custom-hooks/feature-a.json", "./custom-hooks/feature-b.json"]
	// 系统仍会自动加载 ./hooks/hooks.json
}
```

## 相关文件修改

### 1. 配置文件

- **plugin.json**: 删除 `hooks` 字段，更新版本号至 `0.6.7`
- **marketplace.json**: 更新版本号至 `0.6.7`

### 2. 文档更新

- **CHANGELOG.md**: 添加 v0.6.7 版本变更记录
- **README.md**: 更新版本号至 `0.6.7`

## 经验教训

### 1. 理解框架的自动化机制

在使用任何框架或工具时，需要充分理解其自动化机制：

- Claude Code 对标准位置的文件有自动加载机制
- 手动配置可能导致与自动机制冲突

### 2. 阅读官方文档的重要性

错误信息明确指出了问题所在：

> "The standard hooks/hooks.json is loaded automatically, so manifest.hooks should only reference additional hook files."

关键提示：

- **automatically**: 自动加载
- **only reference additional hook files**: 仅引用额外的文件

### 3. 语义化版本管理

本次修复属于 Bug Fix，遵循语义化版本规范：

- **Patch 版本升级**: 0.6.6 → 0.6.7
- **适用场景**: 向后兼容的问题修复

## 参考资料

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks.md) - Hook 事件详细文档
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference.md) - Plugin manifest schema
- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) - 变更日志格式规范
- [Semantic Versioning](https://semver.org/lang/zh-CN/) - 语义化版本规范

## 验证结果

修复后，插件应该能够：

- ✅ 正常加载 hooks 配置
- ✅ 所有 hooks 事件正常触发
- ✅ 通知系统正常工作
- ✅ 插件状态检查无错误

## 总结

通过删除 `plugin.json` 中多余的 `hooks` 字段配置，成功修复了重复加载问题。这次经历强化了以下认知：

1. **框架约定优于配置**: Claude Code 的自动加载机制体现了"约定优于配置"的设计理念
2. **错误信息是最好的文档**: 官方错误提示清晰地说明了问题和解决方案
3. **保持配置简洁**: 不必要的显式配置可能导致问题，应遵循框架的最佳实践
