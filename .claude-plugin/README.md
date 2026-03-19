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

## 用 skills 工具安装插件市场提供的 skills 技能

你可以使用 [`npx skills`](https://github.com/vercel-labs/skills) 命令从 GitHub 远程安装本仓库提供的技能，无需下载整个仓库。

### 批量安装全部技能（推荐）

一条命令即可将本仓库的全部技能全局安装到你本机已有的 AI 客户端（Cursor、Claude Code、Windsurf、Codex 等）：

```bash
npx skills add ruan-cat/monorepo --skill '*' -g -y
```

| 参数                | 说明                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `ruan-cat/monorepo` | GitHub 仓库简写，CLI 会自动克隆并发现仓库中所有的 `SKILL.md` 技能文件                         |
| `--skill '*'`       | 安装仓库中发现的全部技能                                                                      |
| `-g`                | 全局安装，技能文件写入用户目录（如 `~/.cursor/skills/`、`~/.claude/skills/`），对所有项目生效 |
| `-y`                | 跳过交互确认，适合在文档中一键执行                                                            |

CLI 会自动检测本机已安装的 AI 客户端，只向已检测到的客户端写入技能文件，不会创建多余目录。

安装完成后，可随时更新全部已安装的技能到最新版本：

```bash
npx skills update
```

### 单独安装特定技能

如果只需要其中几个技能，可以按名称选择性安装：

```bash
npx skills add ruan-cat/monorepo --skill git-commit --skill rebase2main -g -y
```

也可以通过完整 URL 安装单个技能：

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/<skill-name>
```

### 可用技能列表

以下是当前可用的技能及其安装命令：

#### 获取全部 Git 远程分支 (get-git-branch)

诊断并修复 Git 仓库无法看到所有远程分支的问题，将受限的 fetch refspec 恢复为通配符模式。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/get-git-branch
```

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

#### VSCode 配置初始化 (init-vscode)

初始化或更新项目的 VSCode 配置文件，智能合并现有配置。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/init-vscode
```

#### Nitro 接口开发 (nitro-api-development)

初始化和开发符合规范的 Nitro 后端接口。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/nitro-api-development
```

#### Rebase 同步主分支 (rebase2main)

将当前开发分支通过 rebase 同步到 main 分支并推送远端。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/rebase2main
```

#### 使用其他 AI 模型 (use-other-model)

指导主代理如何驱动其他 AI 模型(MiniMax、Gemini)完成任务,实现 50-80% token 节省。

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/use-other-model
```

> **注意**：如果你想使用开发版分支，请将 URL 中的 `main` 替换为 `dev`。

## 风险项

claude code 安装插件市场时，会对本仓库做一个全量的浅克隆。具体存储该插件市场的目录，会出现很多无关的文件。
