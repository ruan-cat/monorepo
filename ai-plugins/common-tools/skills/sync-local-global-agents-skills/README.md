# sync-local-global-agents-skills

本地全局 Agent Skills 同步器。

将 Vercel `skills` CLI 全局安装的 skills（`~/.agents/skills`）作为唯一数据源，通过目录级符号链接批量同步到本机其他本地 agent 平台，包括 WorkBuddy、QoderWork、Kimi Work、CodeBuddy 和 Qoder。

## 快速开始

```bash
tsx scripts/sync.ts
```

## 命令行选项

已支持的平台包括 WorkBuddy（国内版 `~/.workbuddy/skills` 与国际版 `~/.workbuddy-ai/skills`）、QoderWork、Kimi Work、CodeBuddy 和 Qoder，其中 CodeBuddy 使用 `~/.codebuddy/skills`，Qoder 使用 `~/.qoder/skills`。WorkBuddy 的两个版本配置目录相互独立，需分别同步。

```text
--source <path>   指定源 skills 目录（默认：~/.agents/skills）
--dry-run         只输出计划，不修改文件系统
--no-backup       替换真实目录时不备份
--help            显示帮助信息
```

### 官方 Memorix Skills 只读审计

本工具**不再**下载、覆盖、备份或刷新官方 `memorix-*` skills；官方 Memorix setup/升级是唯一所有者。

运行 `sync.ts` 时默认先输出只读审计结果（`present` / `missing` / `invalid`），再执行平台链接同步。审计只读 `SKILL.md` frontmatter，不联网、不安装、不修改文件。

```text
--skip-memorix-audit   跳过只读审计，直接同步平台链接
```

独立审计：

```bash
# 人读输出
tsx scripts/audit-memorix-skills.ts

# JSON 输出
tsx scripts/audit-memorix-skills.ts --json

# 指定 skills root
tsx scripts/audit-memorix-skills.ts --skills-root <path>
```

`missing` / `invalid` 只提示使用 Memorix 官方 setup/升级，不自动修复。

## 技能文件

安装后技能目录包含 `scripts/sync.ts`、`scripts/audit-memorix-skills.ts`、`src/platforms.ts`、`src/sync.ts`、`src/memorix-audit.ts`、`fallback/sync.ps1` 和 `fallback/sync.sh`。
