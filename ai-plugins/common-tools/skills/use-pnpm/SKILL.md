---
name: use-pnpm
description: >-
  Use when 需要处理 pnpm 包管理、workspace 命令、npm/npx/yarn 到 pnpm 的替换、Windows 或 PowerShell pnpm 故障、Corepack 管理的 pnpm、NVM Desktop 切换 Node 后的路径错位、全局包更新、ERR_PNPM_UNEXPECTED_VIRTUAL_STORE、virtual-store-dir 混淆、PNPM_HOME/global-dir/store-dir 诊断，或 pnpm install/update/rebuild 排障；English: handling pnpm package management, workspace commands, npm/npx/yarn replacement, Windows or PowerShell pnpm failures, Corepack-managed pnpm, NVM Desktop Node switches, global package updates, ERR_PNPM_UNEXPECTED_VIRTUAL_STORE, virtual-store-dir confusion, PNPM_HOME/global-dir/store-dir diagnosis, or pnpm install/update/rebuild troubleshooting.
user-invocable: true
metadata:
  version: "0.3.1"
---

# use-pnpm

## Overview

本技能用于处理 pnpm 相关的安装、更新、工作区命令替换、Windows/PowerShell 故障和全局包恢复。重点覆盖 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`、`PNPM_HOME` 与全局依赖树错位、Corepack 管理 pnpm、NVM Desktop 切换 Node 后的 pnpm 运行时混乱。

目标不是复述事故过程，而是给 future-agent 一套可执行判断路径：先识别 pnpm 由谁管理、全局区在哪里、store 在哪里、虚拟 store 指向哪里，再决定是重建依赖树、修配置，还是切回正确的 Node/pnpm 管理链路。

## Low-Model Execution Contract

低等级模型必须把全局升级/审批任务当作“逐步清单”执行，不得凭标题或记忆跳步。相关具体命令只从 [`references/global-upgrade-checklist.md`](references/global-upgrade-checklist.md) 复制，并遵守以下硬门：

1. 先完成运行时盘点；任一命令退出非零、路径为空或结果矛盾，立即 `STOP`，不得继续升级。
2. 一次只执行一个清单步骤；每步记录命令、退出码、关键输出和下一步。不得把多个升级批次、rebuild 或验证命令拼成一条。
3. 遇到交互审批时，只选择清单中“已确认用途”的包；不确定就保持未批准并 `STOP`。禁止把 `--all` 当快捷修复。
4. 出现 `MSB8040`、node-gyp、MSBuild、超时或无输出时，立即停止当前包，保留已写入策略和日志，不扩大审批范围、不重试整批。
5. 只有四项结论都有证据，才能报告完成：包升级、审批策略写入、构建脚本执行、CLI 可运行。缺任何一项都只能报告“部分完成/待处理”。

全局写操作还必须满足两道授权门：

- 用户未明确授权全局升级、审批、rebuild 或删除时，只执行参考清单第 1 节只读盘点，然后停下并请求授权。
- 每一节开始前确认上一节账本退出码为 `0`；上一节失败、被中断或未执行时，不得跳到后续章节。

## When to Use

- 用户要求安装、更新、删除、重建 pnpm 依赖或全局包。
- 用户想把 `npm`、`npx`、`yarn` 命令替换为 pnpm 写法。
- pnpm 报错包含 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`、`virtual-store-dir`、`store-dir`、`PNPM_HOME`、global root、global bin 等关键词。
- Windows 或 PowerShell 下 pnpm 命令异常、全局命令找不到、全局包升级失败。
- Corepack 管理 pnpm，或 NVM Desktop 切换 Node 后 pnpm 版本、路径、全局区不一致。
- pnpm workspace 中需要判断命令应该在根目录、子包目录，还是通过 `--filter` 执行。

## When Not to Use

- 任务与 pnpm 无关，只是通用 Node.js、TypeScript、Git 或框架问题。
- 用户明确要求使用其他包管理器，并且没有迁移到 pnpm 的上下文。
- 当前项目没有 pnpm 配置，也没有用户要求引入 pnpm。不要主动改包管理器。
- 只是解释 JavaScript 语法、Node API 或业务代码逻辑，不涉及依赖管理。

## Core Model

处理 pnpm 故障前必须区分这些概念：

- `PNPM_HOME`：pnpm 放置全局可执行入口的位置，通常应出现在 `PATH` 中。它不是全局依赖真实安装树，也不是 store。
- `pnpm root -g`：全局包的 `node_modules` 根目录，即全局依赖树所在位置，可称为 `<pnpm-global-node-modules>`；它的父目录才是全局区目录，通常包含 global `package.json` 和 `pnpm-lock.yaml`。
- `pnpm bin -g`：全局命令 shim/bin 所在目录，可能等于或接近 `PNPM_HOME`，但必须用命令确认。
- `store-dir` / `pnpm store path`：pnpm 内容寻址 store，保存包内容缓存，可称为 `<store-dir>`。
- `virtual-store-dir`：项目或全局依赖树内部的虚拟 store 目录，默认通常是 `node_modules/.pnpm`。它描述依赖树布局，不等于 `store-dir`。

判断原则：

1. `store-dir` 是包内容缓存，`virtual-store-dir` 是某个依赖树里的链接布局目录。
2. `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` 通常说明现有 `node_modules` 的 `.modules.yaml` 记录和当前 pnpm 期望的 virtual store 位置不一致。
3. 如果错误发生在 `pnpm add -g`、`pnpm update -g`、`pnpm i -g`、全局命令升级或全局包列表操作中，先按 global 场景处理。
4. global 场景优先重建全局依赖树，不要第一反应就改全局 `.npmrc` 或全局 pnpm 配置。

## First Checks

在 Windows/PowerShell 中先收集这些证据：

```powershell
where.exe node
where.exe pnpm
where.exe corepack
node -v
pnpm -v
corepack --version
pnpm config get global-dir
pnpm config get store-dir
pnpm config get virtual-store-dir
pnpm store path
pnpm root -g
pnpm bin -g
```

如果是项目内问题，再补充：

```powershell
pnpm config list
pnpm config list --location project
pnpm config list --location global
```

`pnpm install --lockfile-only` 可能写入 `pnpm-lock.yaml`。该命令仅在用户允许更新锁文件或需要验证锁文件解析时执行，不要把它当作纯只读证据收集命令。

检查 `node_modules/.modules.yaml` 时，只读取关键字段：`storeDir`、`virtualStoreDir`、`layoutVersion`、`packageManager`。不要把整个文件当作需要手写修复的配置文件。

## Decision Path

1. 判断 pnpm 是谁管理的：
   - `corepack pnpm --version` 可用且项目依赖 Corepack：优先按 Corepack 管理。
   - `where.exe pnpm` 指向某个 Node 安装或 Corepack shim：继续检查 `where.exe node` 和版本。
   - pnpm 来自独立安装器或系统包管理器：按对应安装源处理，不混用 npm 全局安装。

2. 判断错误范围：
   - 带 `-g` 或涉及全局命令：global 场景。
   - 在项目根目录或子包中执行 `pnpm install`：project/workspace 场景。
   - 只有某个包脚本失败：先确认脚本是否实际调用 pnpm 或读取 pnpm 路径。

3. 判断是否是 virtual store 错位：
   - 错误包含 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`。
   - `.modules.yaml` 中的 `virtualStoreDir` 与当前配置或当前路径不一致。
   - 切换 Node、pnpm 版本、配置或迁移目录后出现。

4. 选择恢复策略：
   - global 场景：备份全局依赖树元数据，重建 global 区。
   - project 场景：优先删除并重建当前项目的 `node_modules`，不要改全局配置绕过。
   - 配置污染场景：移除不合理的全局 `virtual-store-dir`，必要时在项目级写相对路径并说明原因。

## Windows Global Virtual Store Recovery

遇到全局 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` 时按这个顺序处理。

先备份全局元数据：

```powershell
$globalNodeModules = pnpm root -g
$globalDir = Split-Path -Parent $globalNodeModules
Copy-Item -LiteralPath "$globalDir\package.json" -Destination "$globalDir\package.json.bak" -ErrorAction SilentlyContinue
Copy-Item -LiteralPath "$globalDir\pnpm-lock.yaml" -Destination "$globalDir\pnpm-lock.yaml.bak" -ErrorAction SilentlyContinue
Copy-Item -LiteralPath "$globalNodeModules\.modules.yaml" -Destination "$globalDir\.modules.yaml.bak" -ErrorAction SilentlyContinue
```

再重建全局依赖树：

```powershell
pnpm i -g
```

如果当前环境无 TTY，且 `pnpm i -g` 因交互提示无法继续，可以只对这一次命令临时设置 `CI=true`：

```powershell
$hadCI = Test-Path Env:CI
$previousCI = $env:CI
try {
  $env:CI = "true"
  pnpm i -g
}
finally {
  if ($hadCI) {
    $env:CI = $previousCI
  }
  else {
    Remove-Item Env:CI -ErrorAction SilentlyContinue
  }
}
```

如果仍失败，再检查：

```powershell
pnpm config get virtual-store-dir
pnpm config list --location global
pnpm root -g
pnpm store path
```

不要把绝对 `virtual-store-dir` 写进全局 `.npmrc` 或全局 pnpm 配置来压住错误。绝对 virtual store 会把不同 Node、不同用户、不同全局区耦合到同一个布局路径，后续切 Node 或迁移目录时更容易复发。

## NVM Desktop + Corepack Rules

Windows + NVM Desktop + Corepack 的核心风险是：`node`、`corepack`、`pnpm` 可能来自不同 Node 版本或不同 shim 目录。切 Node 或换 pnpm 版本后，先验证路径和版本，再重建 global 区。

必查命令：

```powershell
where.exe node
where.exe pnpm
where.exe corepack
node -v
pnpm -v
corepack --version
pnpm root -g
pnpm bin -g
pnpm store path
pnpm config get global-dir
pnpm config get store-dir
pnpm config get virtual-store-dir
```

规则：

- 如果项目使用 Corepack 管 pnpm，不要把 `npm i -g pnpm` 或 `pnpm add -g pnpm` 当作升级 pnpm 本体的首选方式。
- Corepack 管理时，优先使用 Corepack 激活或准备目标 pnpm 版本；如果当前 pnpm 明确支持并且管理链路允许，也可以使用 `pnpm self-update`。
- 切换 Node 后，全局包区和 shim 可能需要重新安装或重建。先让 `where.exe node`、`where.exe pnpm`、`where.exe corepack` 指向同一套预期链路，再运行 `pnpm i -g`。
- 不要混用多个来源安装 pnpm。出现多个 `where.exe pnpm` 结果时，先解释路径优先级，再决定清理哪一个。

## Command Mapping

常见替换：

| npm/yarn/npx           | pnpm                                   |
| ---------------------- | -------------------------------------- |
| `npm install`          | `pnpm install`                         |
| `npm install <pkg>`    | `pnpm add <pkg>`                       |
| `npm install -D <pkg>` | `pnpm add -D <pkg>`                    |
| `npm uninstall <pkg>`  | `pnpm remove <pkg>`                    |
| `npm update <pkg>`     | `pnpm update <pkg>`                    |
| `npm run <script>`     | `pnpm run <script>` 或 `pnpm <script>` |
| `npx <bin>`            | `pnpm dlx <bin>`                       |
| `yarn add <pkg>`       | `pnpm add <pkg>`                       |
| `yarn remove <pkg>`    | `pnpm remove <pkg>`                    |
| `yarn why <pkg>`       | `pnpm why <pkg>`                       |

全局命令：

```powershell
pnpm add -g <pkg>
pnpm update -g <pkg>
pnpm remove -g <pkg>
pnpm list -g --depth 0
```

注意：`pnpm add -g pnpm` 不是 Corepack 场景下升级 pnpm 本体的默认答案。先确认 pnpm 管理方式。

## Global Upgrade Policy

全局升级先盘点运行时、registry、global-dir、store-dir、待升级包和待审批脚本；不要把一次命令当成完整验收。

- 日常升级禁止使用 `pnpm up -L -g` 扫描并升级全部全局包；按用途分组后使用 `pnpm update -g --latest <packages>`，每批单独记录退出码、版本变化和警告。
- 先升级包，再单独处理构建脚本审批。包版本已更新不等于 install/postinstall 已执行，也不等于 CLI 已可运行。
- `pnpm approve-builds -g` 必须交互选择经确认的最小白名单；禁止用 `--all` 作为默认或失败兜底。未确认用途的包保持未批准。
- 升级、审批、构建和运行验证分别记录；某一阶段失败时停止扩大范围，不用后续成功掩盖前一阶段失败。

具体的包分组、审批候选、备份、验收和单包 rebuild 命令见 [`references/global-upgrade-checklist.md`](references/global-upgrade-checklist.md)。

## Native Module Stop-Loss

看到 `node-gyp`、MSBuild、`MSB8040` 或原生编译失败时，先记录失败包、退出码、缺失组件和已写入的审批策略，然后停止继续构建或扩大白名单。

- `node-pty` 等原生模块的失败属于工具链或平台问题，不通过批准更多包、手改 `.modules.yaml`、写绝对 `virtual-store-dir` 或删除全局依赖树来绕过。
- `koffi`、`onnxruntime-node` 等包也必须先确认实际功能需求与编译工具链；“能批准”不代表“应该批准”。
- 单包 rebuild 用于定位卡点；一次只处理一个包，并记录开始/结束时间、退出码和最后输出。约 30 秒无新输出就停止该包并标记候选卡点，不要继续盲等或立即扩大审批范围。

## Approval Policy Persistence

`approve-builds` 的策略写入和构建结果是两个独立事实。命令退出非零或被中断后，仍要检查全局 `pnpm-workspace.yaml`：

- `onlyBuiltDependencies` 只包含本次明确批准且有用途依据的包；`ignoredBuiltDependencies` 保留明确暂缓项。
- 先记录策略文件是否已持久化，再判断脚本是否成功执行；不能因策略已写入就声称构建完成。
- 不手写 `.modules.yaml`，不执行超出 `pnpm approve-builds` 的全局构建策略覆盖。

## Interrupted Run Closure

任何升级或审批命令中断、超时或退出非零时，必须输出四项独立结论：包升级是否成功、审批策略是否写入、构建脚本是否执行成功、核心 CLI 是否可运行。记录退出码、已完成包、剩余脚本和下一步；在具体根因修复前不要重试整批，也不要用 `--all` 兜底。

## Workspace Rules

- 先确认当前目录是否是 workspace 根目录，是否存在 `pnpm-workspace.yaml`。
- 在根目录给 workspace 添加依赖时，明确目标包：

```powershell
pnpm --filter <package-name> add <dependency>
pnpm --filter <package-name> add -D <dependency>
```

- 根包确实需要依赖时，使用 `-w`：

```powershell
pnpm add -w -D <dependency>
```

- 执行脚本时优先用 `--filter` 精确约束范围：

```powershell
pnpm --filter <package-name> build
pnpm --filter <package-name> test
```

- 不确定目标包时先问用户，或读取 workspace 清单和相关 `package.json`。不要在 workspace 根目录随意安装运行时依赖。
- 不要把某个项目的 `virtual-store-dir` 经验泛化到整个 workspace。确实需要自定义时，只允许项目级相对路径，例如：

```ini
virtual-store-dir=.pnpm
```

并说明为什么默认 `node_modules/.pnpm` 不适用。

## Safety Rules

- 修复前备份 global-dir 下的 `package.json`、`pnpm-lock.yaml`，以及 `pnpm root -g` 返回目录下的 `.modules.yaml`。
- 不要手写大段 `.modules.yaml` 内容；它是 pnpm 生成的状态文件，优先通过重建依赖树恢复。
- 不建议把绝对 `virtual-store-dir` 写入全局 `.npmrc` 或全局 pnpm 配置。
- 如果项目确实需要 `virtual-store-dir`，只使用项目级相对路径，并写清原因。
- 不要同时使用 npm 全局安装、Corepack、pnpm self-update 管理同一个 pnpm 本体。
- Windows 下优先使用 `where.exe` 检查真实命令解析，避免 PowerShell alias 或 shim 混淆。
- 删除 `node_modules` 或全局依赖树前，先确认路径是 `<project-root>\node_modules` 或 `pnpm root -g` 返回的全局 `node_modules`，不要对模糊变量做递归删除。
- 无 TTY 环境下如需跳过交互，只对单次 `pnpm i -g` 临时设置 `CI=true`，不要长期污染 shell 环境。

## Verification Checklist

修复完成后至少验证：

```powershell
pnpm list -g --depth 0
pnpm root -g
pnpm bin -g
pnpm store path
pnpm config get virtual-store-dir
```

全局升级或审批后的具体命令与四项独立结论模板见 [`references/global-upgrade-checklist.md`](references/global-upgrade-checklist.md)。

然后重跑原失败命令。例如：

```powershell
pnpm add -g <pkg>
pnpm update -g <pkg>
<original-failing-command>
```

闭环标准：

- `pnpm list -g --depth 0` 能列出全局包。
- 原失败命令不再报 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE`。
- `PNPM_HOME`、`pnpm bin -g`、`pnpm root -g`、`pnpm store path` 能解释清楚且互不混淆。
- 全局配置里没有不合理的绝对 `virtual-store-dir`。
- 如果改了项目级配置，配置是相对路径且原因已写明。

## Common Mistakes

- 把 `store-dir` 当成 `virtual-store-dir`，或把 `pnpm store path` 当成全局依赖安装目录。
- 把 `pnpm root -g` 当成 global-dir；它返回的是全局 `node_modules`，global `package.json` 和 `pnpm-lock.yaml` 在它的父目录。
- 看到 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` 就先改全局 `virtual-store-dir`。
- 在 Corepack 管理 pnpm 时用 `npm i -g pnpm` 覆盖 shim，导致 `where.exe pnpm` 指向混乱。
- NVM Desktop 切 Node 后只看 `node -v`，不看 `where.exe node`、`where.exe pnpm`、`where.exe corepack`。
- 不备份 global 元数据就删除全局依赖树。
- 在无 TTY 环境永久设置 `CI=true`，影响后续命令行为。
- 在 workspace 根目录不带 `--filter` 或 `-w` 直接加依赖。
- 把某台机器的绝对路径写进可分发技能文档、项目模板或全局配置。

## Future Expansion

这个技能应保持简单、长期可扩展：

- 新增 pnpm 规范、事故提炼、平台差异说明时，优先放入 `references/`，正文只保留稳定决策路径。
- 只有当存在可复用、确定性的检查逻辑时，才新增 `scripts/` 或 `fallback/`。
- 新增脚本时必须以技能安装目录为运行视角，不依赖安装目录之外的位置。
- 扩展内容不得引用不可迁移的内部证据、个人信息、机器专属绝对路径或环境专属流程路径。
- 对外分发内容只写可迁移规则、占位路径和可验证命令。
