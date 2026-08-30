# sync-local-global-agents-skills

本地全局 Agent Skills 同步器。

将 Vercel `skills` CLI 全局安装的 skills（`~/.agents/skills`）作为唯一数据源，通过目录级符号链接批量同步到本机其他本地 agent 平台，包括 WorkBuddy、QoderWork、Kimi Work、CodeBuddy 和 Qoder。

## 快速开始

```bash
tsx scripts/sync.ts
```

## 命令行选项

已支持的平台包括 WorkBuddy、QoderWork、Kimi Work、CodeBuddy 和 Qoder，其中 CodeBuddy 使用 `~/.codebuddy/skills`，Qoder 使用 `~/.qoder/skills`。

```text
--source <path>   指定源 skills 目录（默认：~/.agents/skills）
--dry-run         只输出计划，不修改文件系统
--no-backup       替换真实目录时不备份
--help            显示帮助信息
```

### Memorix Skills 刷新

从现在开始，运行 `sync.ts` 时会**自动**先从 memorix 官方仓库（GitHub raw）刷新最新的内部 skills 到 `~/.agents/skills/`，然后再同步到各 agent 平台。

独立刷新脚本：

```bash
# 预览（dry-run）
tsx scripts/fetch-memorix-skills.ts --dry-run

# 执行刷新
tsx scripts/fetch-memorix-skills.ts

# 强制覆盖
tsx scripts/fetch-memorix-skills.ts --force
```

新增 CLI 参数：

| 参数                                          | 说明                            |
| --------------------------------------------- | ------------------------------- |
| `--skip-memorix-refresh`                      | 跳过 memorix 刷新步骤           |
| `--force-memorix-refresh`                     | 强制覆盖已存在的 memorix skills |
| `--memorix-source <github\|local\|cli\|auto>` | 来源策略（默认：auto）          |
| `--memorix-agent <agent>`                     | agent 来源（默认：cursor）      |

元数据文件路径：`~/.memorix/memorix-skills/memorix-meta.json`

## 技能文件

安装后技能目录包含 `scripts/sync.ts`、`src/platforms.ts`、`src/sync.ts`、`fallback/sync.ps1` 和 `fallback/sync.sh`。
