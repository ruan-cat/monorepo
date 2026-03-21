# AI Plugins 使用总览

`ai-plugins` 是本仓库对外分发 AI 插件与技能的统一目录，面向多平台客户端（当前支持 Claude Code 与 Cursor）。

## 目录结构

```text
ai-plugins/
├── common-tools/
│   ├── .claude-plugin/plugin.json
│   ├── .cursor-plugin/plugin.json
│   └── skills/
└── dev-skills/
    ├── .claude-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    └── skills/
```

## 可安装插件

- `common-tools`：常用开发辅助工具技能
- `dev-skills`：偏工程研发流程的技能（如 Nitro、OpenSpec）

## 按平台安装

- Claude Code：见 [`../../.claude-plugin/README.md`](../../.claude-plugin/README.md)
- Cursor：见 [`../../.cursor-plugin/README.md`](../../.cursor-plugin/README.md)

## 用 `npx skills` 安装技能

如果你只想安装 Skill（而不是整个平台插件），请阅读：[`./use-vercel-skills-install.md`](./use-vercel-skills-install.md)
