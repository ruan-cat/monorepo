# Claude Code 插件市场

[![Claude Code Plugin Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fruan-cat%2Fmonorepo%2Fmain%2F.claude-plugin%2Fmarketplace.json&query=%24.metadata.version&label=Claude%20Code%20Plugin&color=blueviolet&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48cGF0aCBkPSJNMTIgNmMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNiA2LTIuNjkgNi02LTIuNjktNi02LTZ6bTAgMTBjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvc3ZnPg==)](https://github.com/ruan-cat/monorepo/tree/main/.claude-plugin)

本文档仅说明如何以 Claude Code 插件方式安装本仓库的插件。

## 1) 添加插件市场

```bash
/plugin marketplace add ruan-cat/monorepo
```

## 2) 安装插件

当前提供两个插件：

- `common-tools`
- `dev-skills`

安装命令示例：

```bash
/plugin install common-tools@ruan-cat-tools
/plugin install dev-skills@ruan-cat-tools
```

## 3) 更新插件

```bash
/plugin marketplace update ruan-cat/monorepo
```

如果你已经安装过旧版本，也可以先卸载再安装：

```bash
/plugin uninstall common-tools
/plugin uninstall dev-skills
/plugin install common-tools@ruan-cat-tools
/plugin install dev-skills@ruan-cat-tools
```

## 4) 相关文档

- 多平台总览：[`ai-plugins/docs/README.md`](../ai-plugins/docs/README.md)
- 使用 `npx skills` 安装：[`ai-plugins/docs/use-vercel-skills-install.md`](../ai-plugins/docs/use-vercel-skills-install.md)
- Cursor 插件说明：[`../.cursor-plugin/README.md`](../.cursor-plugin/README.md)

## 风险提示

Claude Code 添加 marketplace 时会对仓库做浅克隆，插件目录之外也可能被拉取。这是平台行为，不影响插件功能。
