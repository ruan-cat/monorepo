---
name: sync-local-global-agents-skills
description: >-
  同步本机全局 agent skills 到多个本地 agent 平台（WorkBuddy、QoderWork、Kimi Work 等）。
  以 C:\Users\<user>\.agents\skills 为唯一真理数据源，通过目录级符号链接分发安装，避免重复拷贝。
  支持 dry-run、自动备份、错误链接替换。触发关键词：sync-local-global-agents-skills、同步 skills、全局 skills 同步。
metadata:
  version: "0.1.0"
---

# 本地全局 Agent Skills 同步器

本技能用于将 Vercel `skills` CLI 全局安装的 skills（`~/.agents/skills`）作为唯一数据源，批量同步到本机其他本地 agent 平台的 skills 目录。

## 使用场景

当遇到以下情况时使用本技能：

- 已使用 `skills add ... -g` 全局安装/更新了 skills，需要同步到 WorkBuddy、QoderWork、Kimi Work 等本地 agent 平台
- 新增了一个本地 agent 平台，需要把现有 skills 分发过去
- 某个平台的 skills 目录被误删或链接失效，需要重建

## 核心职责

1. **唯一数据源**：始终从 `~/.agents/skills` 读取，不维护第二份副本
2. **目录级符号链接**：把目标平台的 skills 目录替换为指向源目录的符号链接
3. **幂等执行**：重复运行不会重复创建链接
4. **安全备份**：遇到真实目录时自动备份为 `skills.bak.<timestamp>-<uuid>`
5. **错误链接修复**：遇到指向错误位置的符号链接时自动删除并重建

## 已支持平台（硬编码）

平台注册表硬编码在 `src/platforms.ts` 中，新增平台需修改该文件并升级技能版本。

| 平台      | 目标目录                                                    |
| :-------- | :---------------------------------------------------------- |
| WorkBuddy | `~/.workbuddy/skills`                                       |
| QoderWork | `~/.qoderworkcn/skills`                                     |
| Kimi Work | `~/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills` |

## 使用方式

### 主脚本（推荐）

在技能安装目录（例如 `~/.agents/skills/sync-local-global-agents-skills/`）下运行：

```bash
# 使用 tsx 运行
tsx scripts/sync.ts

# 只查看计划，不修改文件系统
tsx scripts/sync.ts --dry-run

# 指定自定义源目录
tsx scripts/sync.ts --source D:\custom\.agents\skills

# 不备份直接替换
tsx scripts/sync.ts --no-backup
```

### 兜底脚本

当无法使用 Node/TypeScript 时，可使用同目录下的 fallback 脚本：

```powershell
# Windows PowerShell
fallback/sync.ps1
```

```bash
# WSL / macOS / Linux
fallback/sync.sh
```

## 符号链接策略

- **Windows**：优先创建原生目录符号链接（`lrwxrwxrwx` / `MSYS=winsymlinks:native` 形式），权限不足时自动 fallback 到 `junction`
- **Linux/macOS**：使用标准 `ln -s` 目录软链接

## 同步行为

1. 目标目录不存在 → 创建目录级符号链接
2. 目标目录已是正确链接 → 跳过
3. 目标目录是真实目录 → 备份后替换为链接
4. 目标目录是错误链接 → 直接替换（不备份）
5. 目标路径是普通文件 → 删除后创建链接

## 相关文件

- `scripts/sync.ts` — CLI 入口
- `src/sync.ts` — 核心同步逻辑
- `src/platforms.ts` — 平台注册表
- `fallback/sync.ps1` — Windows PowerShell 兜底
- `fallback/sync.sh` — Bash 兜底
