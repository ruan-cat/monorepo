# AI Plugins 使用总览

`ai-plugins` 是本仓库对外分发 AI 插件与技能的统一目录，面向多平台客户端（当前支持 Claude Code、Cursor 与 Codex）。

## 目录结构

```text
ai-plugins/
├── common-tools/
│   ├── .claude-plugin/plugin.json
│   ├── .cursor-plugin/plugin.json
│   ├── .codex-plugin/plugin.json
│   └── skills/
├── dev-skills/
│   ├── .claude-plugin/plugin.json
│   ├── .cursor-plugin/plugin.json
│   ├── .codex-plugin/plugin.json
│   └── skills/
└── low-frequency-skill/
    ├── .claude-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    ├── .codex-plugin/plugin.json
    └── skills/
        ├── clone-ruancat-repo/
        ├── factory-reset-vscode-fork-ide/
        ├── get-git-branch/
        ├── init-claude-code-statusline/
        ├── init-playwright/
        ├── init-simple-memorix/
        └── init-tsconfig/
```

## 可安装插件

- `common-tools`：常用开发辅助工具技能
- `dev-skills`：偏工程研发流程的技能（含 Nitro、OpenSpec 等）
- `low-frequency-skill`：阮喵喵低频使用与低频维护的技能合集（含 init-playwright、init-simple-memorix 等）

## 按平台安装

- Claude Code：见 [`../../.claude-plugin/README.md`](../../.claude-plugin/README.md)
- Cursor：见 [`../../.cursor-plugin/README.md`](../../.cursor-plugin/README.md)
- Codex：见 [`../../.agents/plugins/README.md`](../../.agents/plugins/README.md)

## 用 `npx skills` 安装技能

如果你只想安装 Skill（而不是整个平台插件），请阅读：[`./use-vercel-skills-install.md`](./use-vercel-skills-install.md)
