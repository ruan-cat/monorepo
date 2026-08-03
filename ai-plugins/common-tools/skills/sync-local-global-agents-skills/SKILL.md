---
name: sync-local-global-agents-skills
description: >-
  Use when 已完成全局 skills 安装后，需要把 `~/.agents/skills` 后置同步到 WorkBuddy、QoderWork、Kimi Work、CodeBuddy 等本地平台，或显式修复本地 skills 链接。
  这是后置同步、显式同步和链接修复工具，不是 `skills add` 的替代安装器。
  支持 dry-run、自动备份、错误链接替换，并可按需刷新 memorix 内部 skills。
  触发关键词：sync-local-global-agents-skills、同步 skills、全局 skills 同步。
metadata:
  version: "0.1.2"
---

# 本地全局 Agent Skills 同步器

本技能用于将 Vercel `skills` CLI 全局安装的 skills（`~/.agents/skills`）作为唯一数据源，批量同步到本机其他本地 agent 平台的 skills 目录。

## 触发边界

合法触发包括：

- `skills add ... -g` 已成功后，用户要求继续同步到本地平台。
- 用户明确要求把全局 `~/.agents/skills` 同步到 WorkBuddy、QoderWork、Kimi Work、CodeBuddy。
- 新增平台完成目录语义和链接能力核验后，需要执行同步。
- 目标 skills 链接失效、误删或指向错误位置，需要重建。

用户给出尚未执行的完整 `skills add` 命令时，不抢在原命令前运行本同步器；应先执行或按用户语义确认原命令，失败后再按错误分流。

## 使用场景

当遇到以下情况时使用本技能：

- 已使用 `skills add ... -g` 全局安装/更新了 skills，需要同步到 WorkBuddy、QoderWork、Kimi Work、CodeBuddy 等本地 agent 平台
- 新增了一个本地 agent 平台，需要把现有 skills 分发过去
- 某个平台的 skills 目录被误删或链接失效，需要重建

## 核心职责

1. **唯一数据源**：始终从 `~/.agents/skills` 读取，不维护第二份副本
2. **目录级符号链接**：把目标平台的 skills 目录替换为指向源目录的符号链接
3. **幂等执行**：重复运行不会重复创建链接
4. **安全备份**：遇到真实目录时自动备份为 `skills.bak.<timestamp>-<uuid>`
5. **错误链接修复**：遇到指向错误位置的符号链接时自动删除并重建

## 已支持平台

平台注册表在 `src/platforms.ts` 中维护，新增平台需修改该文件并升级技能版本。

| 平台      | 目标目录                                                    |
| :-------- | :---------------------------------------------------------- |
| WorkBuddy | `~/.workbuddy/skills`                                       |
| QoderWork | `~/.qoderworkcn/skills`                                     |
| Kimi Work | `~/AppData/Roaming/kimi-desktop/daimon-share/daimon/skills` |
| CodeBuddy | `~/.codebuddy/skills`                                       |

## 使用方式

### 主脚本（推荐）

在技能安装目录（例如 `~/.agents/skills/sync-local-global-agents-skills/`）下运行：

```bash
# 使用 tsx 运行
tsx scripts/sync.ts

# 只查看计划，不修改文件系统
tsx scripts/sync.ts --dry-run

# 指定自定义源目录
tsx scripts/sync.ts --source <custom-skills-root>

# 不备份直接替换
tsx scripts/sync.ts --no-backup
```

### 兜底脚本

fallback 只在同步主脚本不可用、Node/TypeScript 不可用、权限不足、符号链接能力失败，或同步脚本已经失败后作为降级路径；它不是 `skills add` 前的默认路径。

当需要降级执行时，可使用同目录下的 fallback 脚本：

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

## Memorix Skills 刷新

本版本已集成 memorix 内部 skills 刷新能力。运行 `sync.ts` 时会自动先从 memorix 官方仓库（GitHub raw）刷新最新的内部 skills 到 `~/.agents/skills/`，然后再同步到各 agent 平台。

| 参数                                          | 说明                            |
| --------------------------------------------- | ------------------------------- |
| `--skip-memorix-refresh`                      | 跳过 memorix 刷新步骤           |
| `--force-memorix-refresh`                     | 强制覆盖已存在的 memorix skills |
| `--memorix-source <github\|local\|cli\|auto>` | 来源策略（默认：auto）          |
| `--memorix-agent <agent>`                     | agent 来源（默认：cursor）      |

独立刷新脚本：`scripts/fetch-memorix-skills.ts`（支持 `--dry-run`、`--force` 参数）。

## 相关文件

- `scripts/sync.ts` — CLI 入口
- `src/sync.ts` — 核心同步逻辑
- `src/platforms.ts` — 平台注册表
- `fallback/sync.ps1` — Windows PowerShell 兜底
- `fallback/sync.sh` — Bash 兜底
