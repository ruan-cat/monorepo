# 布局迁移与版本自管的故障外溢

pnpm 11+ 布局迁移（全局 bin 从 `PNPM_HOME` 根迁到 `<PNPM_HOME>\bin`）与 pnpm 12 默认开启的 `manage-package-manager-versions` 自管切换，故障表象经常出现在 **pnpm 之外**——其他全局命令失灵、其他目录下 pnpm 行为异常。本文处理这类外溢故障的判定与治理。

与 [`self-update-and-path-governance.md`](self-update-and-path-governance.md) 的分工：那边治理 **pnpm 命令自身**的 PATH 竞争；本文治理 **第三方命令被击穿**与 **cwd 钉住假象**。两类问题可能同时存在。

## 1. 全局命令 shim 被坏 shim 劫持（第三方击穿）

一台机器先后用过多个包管理器时，旧管理器会在自己的 shim 目录留下命令遗物。迁移前后的格局变化：

| 阶段   | 格局                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------- |
| 迁移前 | pnpm 全局包的命令 shim 位于 `PNPM_HOME` 根（PATH 高位），**遮蔽** node 管理器目录里的同名历史遗物 |
| 迁移后 | shim 移到 `<PNPM_HOME>\bin`（PATH 中通常更靠后），裸命令解析被坏 shim **反超劫持**                |

机制要点：

- 布局迁移**不产生也不删除任何文件**，仅仅是位置移动，就足以让潜伏的坏 shim 从遮蔽态翻转为劫持态。
- 坏 shim（node 管理器 launcher 类）运行时**按名字重新解析**目标命令；真身早已迁移到 pnpm 侧后，转发链在其内部解析环节断裂。
- 任何按裸命令调用该命令的配置——MCP 配置的 `"command": "<name>"`、hooks、脚本——全部击穿。**配置本身完全正确也没用，坏在它依赖的 PATH 解析环境。**

判定特征：

```powershell
where.exe <cmd>                              # 第一命中不是 <PNPM_HOME>\bin → 可疑
<cmd> --version                              # 「不是内部或外部命令」或启动即失败
& "<PNPM_HOME>\bin\<cmd>.cmd" --version      # 正常输出 → 劫持实锤
```

关键判据：**命令起不来，但该包的数据目录完好无损**（数据目录与包管理器、PATH 完全解耦）。这是「包管理器迁移故障」区别于「工具内部故障」的核心信号——纯启动链路问题，不需要任何数据恢复动作。

修复（两条路线，推荐组合）：

1. **根治**：删除 node 管理器 shim 目录里的同名失效遗物（`.cmd`/`.exe` 成对）。一次修复所有按裸命令调用的工具，不限于某一个宿主。注意区分复活机制：corepack 系 shim 有 `corepack enable` 复活渠道（见 [`corepack-eol-and-shim.md`](corepack-eol-and-shim.md) 第 3 节），包管理器历史遗物通常没有。
2. **快速**：调用方配置把 `command` 改为 `<PNPM_HOME>\bin\<name>.cmd` 绝对路径，把「PATH 顺序」这个不可控变量从依赖里去掉。注意修改配置文件可能变更宿主的信任 hash（MCP 审批场景），需要重新审批并完全重启宿主。

### 1.1 迁移后必跑 shim 交集检查

任何包管理器迁移（npm→pnpm、pnpm 布局变更、corepack 切换）完成后，对比新旧 bin 目录的命令清单交集，交集内命令逐个验证解析位与实际执行：

```bash
comm -12 <(ls <node-管理器-shim-目录> | sed 's/\.\(cmd\|exe\|ps1\)$//' | sort -u) \
         <(ls "<PNPM_HOME>/bin" | sed 's/\.\(cmd\|exe\|ps1\)$//' | sort -u)
```

非空交集里的每一个命令都是潜伏劫持风险：迁移前被遮蔽，迁移后可能反超。

### 1.2 多 shell 验收（单链路验证会漏判）

- cmd / PowerShell / Git Bash 对 shim 三件套（无扩展名 sh 脚本 / `.cmd` / `.ps1`）的解析优先级不同，单 shell 验证可能得出错误结论。
- Git Bash 两个已知坑：
  - pnpm 生成的一部分 shim 是无扩展名 sh 脚本，Git Bash 执行时可能报 MSYS 路径转换污染（`MODULE_NOT_FOUND`，路径形如 `d:\c\Users\...`）——这是**假性故障**，cmd/PowerShell 下同一命令正常即可证明 shim 健康。
  - 沙箱类宿主可能注入 `MSYS2_ARG_CONV_EXCL` / `MSYS_NO_PATHCONV` 环境变量破坏路径转换，产生 `C:\c\Users\...` 假性故障。验收 CLI 时先 `env -u MSYS2_ARG_CONV_EXCL -u MSYS_NO_PATHCONV` 排除，否则会把健康 shim 误判为损坏。
- 验收口径：解析位（`where.exe` / `which -a`）+ 实际执行，至少两个 shell 交叉确认。

### 1.3 双安装并存遮蔽（非 pnpm 本体的全局 CLI）

同一 CLI 两套安装并存（如官方原生安装器目录与 `<PNPM_HOME>\bin` 各一份），PATH 先命中者为实际生效版本，`<cmd> --version` 与包管理器清单显示的版本可能长期背离，排错时产生「版本精神分裂」。

- 处置：查证该 CLI 官方当前推荐的安装方式，保留一条通道并删除另一条；验证 `where.exe <cmd>` 唯一命中。
- 保留原生安装器通道时留意其自更新入口可能重建被删文件（与 corepack shim 复活同类的结构性风险），删除后定期复查解析唯一性。

## 2. cwd 钉住假象（manage-package-manager-versions）

pnpm 自带的版本管理默认开启：从 cwd **向上逐级查找** `package.json` 的 `packageManager` 钉，钉住版本不等于自身版本时，透明切换到自管缓存里的对应副本（版本缓存预下载完毕，切换零延迟、零提示）。

### 2.1 症状：`pnpm ls -g` 空列表（exit 0，无报错）

根因链：

```log
cwd 祖先链上存在流浪 pin（含 packageManager 字段的 package.json，
甚至可能位于系统目录——历史误执行的 init 类命令产物）
  → pnpm 12 向上查找到它，静默切换到旧版副本
  → 旧版副本的全局宇宙在布局迁移中已被删除
  → ls -g 空输出，exit 0，零报错
```

判定方法：**同一命令在不同 cwd 结果不同** → 检查 cwd 祖先链每一级的 `package.json`。盘符（C: / D:）完全不相关，决定因素是祖先链上有没有带 pin 的 `package.json`。

### 2.2 逃生通道与禁忌

| 手段                                                                    | 有效性                             |
| ----------------------------------------------------------------------- | ---------------------------------- |
| env 前缀：`npm_config_manage_package_manager_versions=false pnpm ls -g` | 有效                               |
| CLI flag：`--config.manage-package-manager-versions=false`              | 无效——自管切换发生在 flag 解析之前 |

两条禁忌：

- **不在钉住目录执行 `pnpm add -g`**——全局包会装进旧版宇宙，造成全局双宇宙分叉。
- **迁移中途不全局禁用 `manage-package-manager-versions`**——钉旧版的仓库会失去版本保护，pnpm 12 的收紧规则会直接跑进旧版仓库。

### 2.3 流浪 pin 清理

祖先链上的流浪 `package.json`（全文仅含 `packageManager` 字段）确认非系统组件后删除。系统目录内的清理需要管理员权限，且必须先向用户展示文件全文并获确认。

### 2.4 验证纪律：目录形态全覆盖

验证「目录无关」类结论时，必须覆盖**每一种目录形态**：盘根、项目目录、系统目录、带钉目录、不带钉目录。只测盘根和项目目录就外推结论，会被系统目录形态击穿——同一症状可能来自完全不同的根因。
