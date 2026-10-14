> **何时读**：排障与 review 前逐条自检；每条均为历史踩坑浓缩，详细展开见各专项 references 文件。

## Common Mistakes

- 把 `store-dir` 当成 `virtual-store-dir`，或把 `pnpm store path` 当成全局依赖安装目录。
- 把 `pnpm root -g` 当成 global-dir；它返回的是全局 `node_modules`，global `package.json` 和 `pnpm-lock.yaml` 在它的父目录。
- 看到 `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` 就先改全局 `virtual-store-dir`。
- 在 Corepack 管理 pnpm 时用 `npm i -g pnpm` 覆盖 shim，导致 `where.exe pnpm` 指向混乱。
- pnpm 12 下试图用 corepack 安装或升级 pnpm（机制性死路），或保留 workflow / preinstall 里的 `corepack enable` 步骤。
- pnpm 12 下继续把设置写在 `.npmrc` 或 package.json 的 `pnpm` 字段里——只迁到 `pnpm-workspace.yaml`，否则被静默忽略（见 [`references/pnpm12-migration.md`](pnpm12-migration.md) 第 4 节）。
- pnpm 12 下用 `onlyBuiltDependencies` 授权构建脚本——它不再生效，授权表是 `allowBuilds`。
- NVM Desktop 切 Node 后只看 `node -v`，不看 `where.exe node`、`where.exe pnpm`、`where.exe corepack`。
- 在 pin 了 `packageManager` 的项目目录里跑 `pnpm self-update`，看到 `pnpm --version` 变化就认为全局升级完成——实际只改了 pin 字符串，版本号是 `manage-package-manager-versions` 自动切换的假象。
- `pnpm self-update` 输出成功就收工，不跑 `where.exe pnpm` / `which -a pnpm` 验证解析链——pnpm 11+ 布局迁移残留（`<PNPM_HOME>` 根目录旧版二进制）会让升级"成功但不生效"。
- 只用单 shell 验证全局命令健康度——Git Bash 对 pnpm 无扩展名 sh shim 有 MSYS 路径转换污染（假性 `MODULE_NOT_FOUND`），沙箱注入的 `MSYS2_ARG_CONV_EXCL`/`MSYS_NO_PATHCONV` 也会产生假性故障；至少两个 shell 交叉验收，验收前先排除沙箱注入变量。
- 包管理器迁移后只检查 pnpm 命令本身，不检查其他全局命令——布局迁移让所有第三方命令 shim 的解析序从高位跌落，历史坏 shim（node 管理器遗物）会从潜伏态翻转为劫持态，把按裸命令调用的 MCP/hooks 配置整体击穿。
- 在钉了 `packageManager` 的目录（包括 cwd 祖先链上有流浪 pin 的目录，如系统目录里误执行 init 的产物）里跑 `pnpm add -g`——全局包装进旧版宇宙，造成全局双宇宙分叉；`pnpm ls -g` 空列表先查 cwd 祖先链，不是全局区损坏。
- 用 `--config.manage-package-manager-versions=false` 试图阻止自动版本切换——自管切换发生在 flag 解析之前，flag 无效；有效手段是 env 前缀 `npm_config_manage_package_manager_versions=false`。
- 迁移全局区时只照抄 `onlyBuiltDependencies` 声明白名单——还要盘点旧布局中实际存在构建产物的包（传递依赖的原生绑定可能不在声明里），漏掉的包迁移后会报原生绑定缺失。
- 只改用户级 PATH 就认为能压制 pnpm 入口优先级——Windows 系统级（Machine）PATH 整体优先于用户级，系统级条目必须管理员权限治理。
- 不备份 global 元数据就删除全局依赖树。
- 在无 TTY 环境永久设置 `CI=true`，影响后续命令行为。
- 在 workspace 根目录不带 `--filter` 或 `-w` 直接加依赖。
- 把某台机器的绝对路径写进可分发技能文档、项目模板或全局配置。
