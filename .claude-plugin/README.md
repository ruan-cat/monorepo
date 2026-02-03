# 插件市场

本仓库还作为一个 claude code 插件市场。

## 添加插件市场

运行 claude code 命令：

```bash
/plugin marketplace add ruan-cat/monorepo
```

## 安装插件

```bash
/plugin install common-tools@ruan-cat-tools
```

## 用 skills 工具单独安装插件市场提供的 skills 技能

你可以使用 `npx skills` 命令从 GitHub 远程安装本仓库提供的特定技能，无需下载整个仓库。

### 安装命令格式

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/<skill-name>
```

### 可用技能列表

以下是当前可用的技能及其安装命令：

#### Git 提交助手 (git-commit)

创建高质量的 Conventional Commits 规范提交。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/git-commit
```

#### OpenSpec 规范开发 (openspec)

基于 OPSX 工作流的 AI 辅助编程框架。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/openspec
```

#### AI 记忆初始化 (init-ai-md)

初始化和同步 AI 记忆文件（CLAUDE.md 等）。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/init-ai-md
```

#### Claude Code 状态栏 (init-claude-code-statusline)

快速配置 Claude Code 的状态栏显示。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/init-claude-code-statusline
```

#### Prettier Git Hooks (init-prettier-git-hooks)

一键配置 lint-staged 和 simple-git-hooks。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/init-prettier-git-hooks
```

#### Nitro 接口开发 (nitro-api-development)

初始化和开发符合规范的 Nitro 后端接口。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/nitro-api-development
```

> **注意**：如果你想使用开发版分支，请将 URL 中的 `main` 替换为 `dev`。

## 风险项

claude code 安装插件市场时，会对本仓库做一个全量的浅克隆。具体存储该插件市场的目录，会出现很多无关的文件。
