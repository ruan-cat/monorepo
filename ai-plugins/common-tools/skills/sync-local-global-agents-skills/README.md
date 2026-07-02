# sync-local-global-agents-skills

本地全局 Agent Skills 同步器。

将 Vercel `skills` CLI 全局安装的 skills（`~/.agents/skills`）作为唯一数据源，通过目录级符号链接批量同步到本机其他本地 agent 平台。

## 快速开始

```bash
tsx scripts/sync.ts
```

## 命令行选项

```text
--source <path>   指定源 skills 目录（默认：~/.agents/skills）
--dry-run         只输出计划，不修改文件系统
--no-backup       替换真实目录时不备份
--help            显示帮助信息
```

## 项目结构

```text
ai-plugins/common-tools/skills/sync-local-global-agents-skills/
  scripts/
    sync.ts          # CLI 入口
  src/
    platforms.ts     # 硬编码平台注册表
    sync.ts          # 核心同步逻辑
  fallback/
    sync.ps1         # Windows PowerShell 兜底脚本
    sync.sh          # Bash 兜底脚本
```

## 测试

```bash
cd tests/sync-local-global-agents-skills
pnpm vitest run
```
