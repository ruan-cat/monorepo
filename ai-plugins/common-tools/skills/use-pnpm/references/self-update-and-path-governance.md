# self-update 双行为分支、布局迁移残留与 PATH 优先级治理

本文是「pnpm self-update 升级不生效」triage 的权威依据。结论先行：**`self-update` 报告成功不等于全局升级生效**——它有两个行为分支，且 pnpm 11+ 布局迁移残留会让旧二进制继续占据 PATH。处理前先通读本文再动手，禁止只凭 `pnpm --version` 一条输出下结论。

与 [`corepack-eol-and-shim.md`](corepack-eol-and-shim.md) 的分工：那边处理 **corepack 旧链路 shim 复活**（`corepack enable` 写入 node 管理器目录的 shim，处置=删除）；本文处理 **pnpm 官方布局迁移残留**（`PNPM_HOME` 根目录旧版二进制）与 **Windows PATH 双级优先级治理**。两类残留可能同时存在。

## 1. self-update 双行为分支（必读，误判高发区）

`pnpm self-update` 的行为取决于**运行时所在目录的项目上下文**（官方文档明确）：

| 运行位置                                                                                   | 实际行为                                             | 表面现象                                     |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------- |
| 项目内，`package.json` 有 `packageManager: "pnpm@x.y.z"`（或 `devEngines.packageManager`） | **只改写该项目的 pin 字符串，不装全局**              | 什么都不提示或提示已更新 pin                 |
| 项目外（无 pin）                                                                           | 全局安装目标版本，链接到 `PNPM_HOME`，替换活动二进制 | `Switching pnpm from vX to vY...` + 下载进度 |

**掩盖效应**：pin 项目的 `pnpm --version` 显示的是 `manage-package-manager-versions` 自动切换到的 pin 版本，**不是全局二进制的真实版本**。在 pin 项目里跑 self-update 后看到版本号变化 = 假象，全局可能纹丝未动。

判定纪律：

1. 升级全局 pnpm 一律在**无 pin 的目录**执行（临时目录最稳）。
2. 升级前后各跑一次解析链验证（见第 4 节），不能只看 `pnpm --version`。
3. `self-update` 默认解析 `latest` dist-tag 且拒绝降级；需要指定版本用 `pnpm self-update <version|dist-tag>`（如 `next-12` 预发布通道）。

## 2. pnpm 11+ 布局迁移残留（升级不生效的根因）

pnpm 11 起官方布局变更：全局二进制从 `PNPM_HOME` 根目录移到 `<PNPM_HOME>\bin`（目的：`global/`、`store/` 等内部目录不再污染 shell 补全）。**迁移留白：`self-update` 与新版 `setup` 只写新布局，不清理旧布局、不迁移旧 PATH 条目。**

升级后机器上可能同时存在三个 pnpm 来源参与 PATH 竞争：

| 来源               | 位置                                      | 说明                                                                                      |
| ------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| ① 旧布局二进制     | `<PNPM_HOME>` 根目录（如 `pnpm.exe`）     | pnpm 11 前布局的残留，版本停在升级前                                                      |
| ② node 管理器 shim | `~\.nvmd\bin` 等（corepack 或管理器写入） | 属 corepack 旧链路，处置见 [`corepack-eol-and-shim.md`](corepack-eol-and-shim.md) 第 3 节 |
| ③ 新布局 shim      | `<PNPM_HOME>\bin`                         | self-update 的更新目标，唯一正确入口                                                      |

典型故障链：self-update 成功更新 ③ → PATH 首选仍是 ①（或 ②）→ 裸命令版本纹丝不动。**这是「升级成功但不生效」的第一大根因。**

## 3. Windows PATH 双级优先级机制

- 合成规则：**系统级（Machine）PATH 整体排在用户级（User）PATH 之前**。用户级怎么改都压不住系统级条目。
- node 管理器（NVM Desktop 等）装机时通常把 shim 目录写入**系统级** PATH；pnpm 的条目历史上有旧版 `setup` 写进根目录（系统级+用户级都可能出现）。
- 因此治理必须：先看系统级，再看用户级；修改系统级需要管理员权限。

### 治理 SOP（从真实升级事故提炼）

1. **备份双级 PATH**（注册表读出存档）：

```powershell
[Environment]::GetEnvironmentVariable('Path','User') | Out-File path-user-backup.txt -Encoding utf8
[Environment]::GetEnvironmentVariable('Path','Machine') | Out-File path-machine-backup.txt -Encoding utf8
```

2. **管理员修正系统级**：移除 `<PNPM_HOME>` 根目录条目（旧布局），把 `<PNPM_HOME>\bin` 排在任何 node 管理器 shim 目录之前。脚本化修改用 `[Environment]::SetEnvironmentVariable('Path', $new, 'Machine')`（自动广播 `WM_SETTINGCHANGE`）。
3. **用户级清理**：移除重复的根目录条目，保留 `<PNPM_HOME>\bin`。
4. **旧二进制退役**：重命名 `<PNPM_HOME>\pnpm.exe` 为 `pnpm.exe.bak-<version>`（不要直接删，可回滚）。重命名后旧条目自动变成"死条目"，PATH 不再命中。
5. **验证**（重启终端后）：`where.exe pnpm` 第一行必须是 `<PNPM_HOME>\bin\pnpm`。
6. **观察与清理**：备份文件观察一周（期间跑几次健康自检）后再删除。

### 与 corepack shim 复活的处置边界

- corepack 旧链路 shim（`corepack enable` 复活、指向 corepack 缓存）：**直接删除**，并根治 `corepack enable` 来源（见 [`corepack-eol-and-shim.md`](corepack-eol-and-shim.md) 第 3 节）。
- node 管理器生态自身的 shim 目录：**用 PATH 排序压制**，不强删——删除可能破坏管理器自身的 node 版本联动。

## 4. 升级 SOP 与健康判据

```powershell
# 1. 升级（无 pin 目录；bash 场景 cd 到临时目录同理）
pnpm self-update

# 2. 解析链验证（两条都要跑，期望第一行都是 <PNPM_HOME>\bin\pnpm）
where.exe pnpm     # PowerShell / cmd
Get-Command pnpm   # PowerShell，确认解析目标

# 3. 版本验证
pnpm --version     # 与 pnpm view pnpm version 的 latest 一致（或更新）
```

bash（Git Bash / WSL）对应：

```bash
which -a pnpm      # 期望第一行 <PNPM_HOME>/bin/pnpm
pnpm --version
```

健康判据：解析链第一行命中 `<PNPM_HOME>\bin` 且版本与 registry latest 一致。不满足任一条 → 回到第 1-3 节定位，禁止声称"升级完成"。

## 5. 常见误判清单（全部来自真实升级事故）

- 在 pin 项目里跑 self-update，看到 `pnpm --version` 变了就认为全局升级完成——实际只改了 pin，版本号是自动切换的假象。
- self-update 输出 `Successfully updated` 就收工，不验证 PATH 解析链——新布局装好了，活动二进制还是旧布局残留。
- 只改用户级 PATH，不知道系统级条目整体优先——改完"不生效"还以为 pnpm 有 bug。
- 只用 bash 的 `which` 验证，PowerShell 场景因 alias/shim 差异结果不同——双 shell 交叉验证才闭环。
- 直接删除旧布局二进制而不是重命名退役——回滚通道被自己堵死。
