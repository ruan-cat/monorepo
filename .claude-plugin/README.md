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

你可以使用 [`npx skills`](https://github.com/vercel-labs/skills) 命令从 GitHub 远程安装技能，无需手动克隆本仓库。

### 不要使用仓库简写 + 通配符安装「全仓库技能」

本仓库是 **monorepo**：除插件市场外，在 `.claude/skills/`、`.agents/skills/`、`packages/` 等路径下还有大量 **仅供本仓库维护与局部工作流使用** 的技能（例如 OpenSpec 子技能、`package-linter` 等）。它们 **不是** 面向外发的「插件市场技能」。

若使用下面这种写法，CLI 会在整仓内递归发现所有 `SKILL.md`，并把上述局部技能一并装进全局技能目录，容易造成 **全局技能脏数据** 与 **误触发**：

```bash
# 错误示例：范围过大，勿用
npx skills add ruan-cat/monorepo --skill '*' -g -y
```

同理，也 **不要** 依赖 `ruan-cat/monorepo` 简写配合 `--skill '*'` 做「一键全装」。

### 批量安装插件市场目录下的全部技能（推荐）

插件市场中 **有意对外分发** 的技能，统一放在目录 `claude-code-marketplace/common-tools/skills/`。请把安装 **源** 限定到该路径（GitHub `tree` URL），再使用通配符，这样 `--skill '*'` 只会作用于该子树下的技能（具体列表以下方 `--list` 命令输出为准）：

```bash
# 安装前可先查看将发现哪些技能（不写盘安装）
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills --list

# 全局安装该目录下的全部插件市场技能（推荐）
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills --skill '*' -g -y
```

| 参数/来源                                                   | 说明                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `.../tree/main/claude-code-marketplace/common-tools/skills` | 将技能发现范围限制在插件市场 `common-tools` 技能包内，不包含 monorepo 其他目录下的局部技能 |
| `--skill '*'`                                               | 仅安装 **上述路径下** CLI 发现到的全部技能                                                 |
| `-g`                                                        | 全局安装，技能写入用户目录（如 `~/.cursor/skills/`、`~/.claude/skills/` 等），对各项目生效 |
| `-y`                                                        | 跳过交互确认，适合文档或脚本中一键执行                                                     |

CLI 会自动检测本机已安装的 AI 客户端，只向已检测到的客户端写入技能文件。

使用 **开发分支** 时，将 URL 中的 `main` 改为 `dev` 即可。

安装完成后，可按 [skills CLI 文档](https://github.com/vercel-labs/skills) 使用 `npx skills update` 等命令更新已安装技能。

### 若曾误装整仓技能，如何清理

对已错误安装到全局的技能，可使用 CLI 移除（具体子命令以 `npx skills remove --help` 为准），或从各客户端的全局 skills 目录中删除对应条目。建议清理后，再按上一节 **限定目录的 URL** 重新安装插件市场技能。

### 单独安装特定技能

**优先** 使用「单个技能」的 `tree` 路径（与下文「可用技能列表」中每条命令一致），来源清晰、不会扫到 monorepo 其他位置：

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills/<skill-name> -g -y
```

若已使用 **插件市场技能目录** 作为源，也可在同一源上按名称多选（仍不会扫到仓库根目录下的局部技能）：

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/claude-code-marketplace/common-tools/skills --skill git-commit --skill rebase2main -g -y
```

**不推荐** 使用 `ruan-cat/monorepo --skill <名称>` 从整仓解析技能名：monorepo 内可能存在同名或重复结构，行为不如限定到 `common-tools/skills` 明确。

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
