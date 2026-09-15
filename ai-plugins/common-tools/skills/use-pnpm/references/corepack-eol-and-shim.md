# corepack 退役定位、pnpm 12 原生安装与 shim 复活防治

本文是「pnpm 由谁管理」triage 的 corepack 分支权威依据。结论先行：**对 pnpm ≥12，corepack 是死路；对 pnpm ≤11，corepack 路线仍然有效**。处理前先确认目标 pnpm 大版本。

## 1. corepack 装不了 pnpm 12 的机制原因

- pnpm 12 的 npm 分发包**没有 `bin/pnpm.mjs`**（JS 入口），改为 postinstall 钩子从平台子包 `@pnpm/exe.<platform>-<arch>` 链接原生二进制。
- corepack 设计上**不安装 optional dependencies**（平台子包正是 optional dep）且**不执行 postinstall**——两条路同时被堵死。
- corepack 的 pnpm 版本上限：`11.26.0`。Node.js 25 起不再随发行版内置 corepack。pnpm 官方文档已把 corepack 从安装页与 CI 示例移除，并拒绝提供向后兼容 JS shim（加了就抵消原生启动优势，pnpm/pnpm#13018）。

## 2. 全局安装 pnpm 12 的三条路线

| 路线        | 命令                                                        | 适用与注意                                                                                                                                                   |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| self-update | `pnpm self-update`                                          | v11.10+ 可直升 12；**corepack 托管的 pnpm 会拒绝**（`ERR_PNPM_CANT_SELF_UPDATE_IN_COREPACK`）；在钉了 packageManager 的项目内运行只更新 pin 字符串，不装全局 |
| npm 全局    | `npm i -g pnpm@latest-12`                                   | 需要 Node ≥22.13；注意 npm 全局目录是否在 PATH、是否与其他 shim 竞争                                                                                         |
| 原生二进制  | GitHub Release 下载 `pnpm-win32-x64.zip` 解压到 `PNPM_HOME` | 无 Node 依赖；官方 install.ps1 脚本等效但依赖 `Invoke-Expression`（受限环境可能被安全策略拦截）                                                              |

安装后必检：

```powershell
pnpm -v            # 期望 12.x
where.exe pnpm     # 确认入口唯一且优先级正确
```

## 3. shim 复活机制（隐性问题，重点）

`corepack enable` 的行为是**把 shim 写到 corepack 可执行文件所在的目录**（NVM Desktop 环境通常是 `~\.nvmd\bin`）。这意味着：

- 手动删掉的 pnpm shim，只要任何脚本执行一次 `corepack enable`，就会原地复活。
- 复活 shim 是 corepack 旧链路，实际指向 corepack 缓存里的旧版 pnpm（如 10.x），与 PNPM_HOME 的 12.x 并存。
- 复活来源实例：仓库 `preinstall` 钩子里挂 `corepack:pnpm: corepack enable && corepack install`，每次 install 都会静默重建 shim。

### 3.1 恶劣影响

1. **显式路径调用错版**：按绝对路径调用 shim 的工具（turbo 工具链探测等）拿到旧版 pnpm，绕过 PATH 优先级。
2. **版本精神分裂**：裸命令 `pnpm`（PATH 解析，新）与绝对路径调用（旧）行为不一致，且 lockfileVersion 相同、互不报错，差异全部静默。
3. **静默复发**：复活过程无任何输出，不根治钩子源头就会无限循环。

### 3.2 自检与处置（3 分钟）

```powershell
where.exe pnpm                  # 期望仅 PNPM_HOME 一处；出现其他目录即 shim 存在
~\.nvmd\bin\pnpm.cmd --version  # 能执行且非 12.x → shim 已复活
rm ~\.nvmd\bin\pnpm.cmd, ~\.nvmd\bin\pnpm.exe   # 删除复活 shim（corepack 本体保留无害）
pnpm --version                  # 复核 12.x
```

### 3.3 根源治理

- 全仓 grep `corepack enable`：workflow 步骤与 `preinstall` 钩子里的 corepack 调用全部移除（pnpm 12 下它们是必炸死代码）。
- 包管理器约束需要保留时，`preinstall` 只留 `npx only-allow pnpm`。
- PATH 防线：确保 `PNPM_HOME` 在 PATH 中先于任何 node 管理器 shim 目录。

## 4. 版本分域速查

| 场景                   | pnpm ≤11                                       | pnpm ≥12                                                                       |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| 全局升级               | `corepack install -g pnpm` 或 self-update 均可 | self-update / npm / 原生二进制；**禁用 corepack**                              |
| 项目 pin 解析          | corepack/action-setup 自动跟随                 | action-setup、pnpm/setup、pnpm 自身的 manage-package-manager-versions 自动跟随 |
| workflow corepack 步骤 | 可用（但冗余）                                 | 必炸死代码，删除                                                               |
| 设置读取               | .npmrc + package.json pnpm 字段                | 仅 pnpm-workspace.yaml（见 [`pnpm12-migration.md`](pnpm12-migration.md)）      |
