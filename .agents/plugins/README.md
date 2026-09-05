# Codex 插件市场

本目录是本仓库的 Codex 插件市场入口，提供 `common-tools`、`dev-skills` 与 `low-frequency-skill` 三个插件。

## 元数据说明

市场级 `interface` 只配置 Codex 支持的中文展示名“阮喵喵开发工具集”。插件的中文名称、短描述、长描述、开发者、分类、能力、默认提示、官网和品牌色位于各自 `.codex-plugin/plugin.json` 的 `interface` 中。

市场 schema 不提供与 Claude Code 等价的全局描述、仓库或作者字段；这些信息由每个插件 manifest 提供。没有真实隐私政策、服务条款或图标资源时，不填写对应字段。

## 安装

从 GitHub 安装稳定版本：

```powershell
codex plugin marketplace add ruan-cat/monorepo --ref main
codex plugin add common-tools@ruan-cat-tools
codex plugin add dev-skills@ruan-cat-tools
codex plugin add low-frequency-skill@ruan-cat-tools
```

从本地仓库验证或开发时，将第一条命令替换为：

```powershell
codex plugin marketplace add D:\code\ruan-cat\monorepo
```

## 更新

```powershell
codex plugin marketplace upgrade ruan-cat-tools
codex plugin remove common-tools@ruan-cat-tools
codex plugin add common-tools@ruan-cat-tools
```

对 `dev-skills` 与 `low-frequency-skill` 使用相同的 remove/add 流程。更新后新开一个 Codex task，以便加载新技能。

## 卸载

```powershell
codex plugin remove common-tools@ruan-cat-tools
codex plugin remove dev-skills@ruan-cat-tools
codex plugin remove low-frequency-skill@ruan-cat-tools
codex plugin marketplace remove ruan-cat-tools
```

## 相关文档

- 多平台总览：[`ai-plugins/docs/README.md`](../../ai-plugins/docs/README.md)
- Claude Code 插件市场：[`../../.claude-plugin/README.md`](../../.claude-plugin/README.md)
- Cursor 插件市场：[`../../.cursor-plugin/README.md`](../../.cursor-plugin/README.md)
