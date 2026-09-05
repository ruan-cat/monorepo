---
name: factory-reset-vscode-fork-ide
description: 将基于 VSCode 二次开发的 IDE（如 Qoder CN IDE、Trae、Cursor、Windsurf、Cline 类）还原到出厂状态：强制卸载全部导入/内置的 vscode 插件、删除扩展残留文件夹、重置用户级 settings.json / keybindings.json / snippets。当用户提到「还原出厂」「清空插件」「删除导入的 vscode 扩展」「重置 IDE 配置」「二次开发 IDE 清理」「factory reset」「uninstall all extensions」，或给出某个 IDE 安装目录要求删光其插件与个人配置时使用。内置 CLI 选错入口、built-in 扩展拦截、目录找错时的主动探索方案。
metadata:
  version: "1.0.0"
---

# VSCode 二次开发 IDE 出厂还原

适用于 Windows（Git Bash 执行）。目标：扩展数归零 + 用户配置归出厂。**默认不留任何备份**（用户偏好），删除一律走回收站（`SendToRecycleBin`），不直接物理删除。

**审计附件**：历次实战处理过的全部 C 盘路径（各 IDE 扩展文件夹、个人配置三件套、未动的相邻目录、恢复指引）见 [references/cleanup-audit-log.md](references/cleanup-audit-log.md)。执行新目标前可对照该清单确认同类路径的处理边界；每次完成新清理后应追加更新该清单。

## 铁律（踩过的坑）

1. **CLI 入口要挑对**：fork 的 `bin/` 下常有多个 `.cmd`（如 `code.cmd`、`qoder-cn.cmd`）。逐个试 `--list-extensions`，能输出扩展列表的才是 IDE 管理入口；另一个多半是独立 agent CLI 的壳，不支持扩展参数。
2. **不要猜数据目录**：`~/.xxx/extensions` 这种目录可能属于**另一个同门产品**（共享或历史遗留）。唯一权威来源是 `<安装目录>/resources/app/product.json` 的 `dataFolderName` 字段。
3. **内置导入扩展必须 `--force`**：报 `marked as a Built-in extension` 不是失败，加 `--force` 重来。
4. **卸载后必扫残留**：CLI 卸载会留下空壳文件夹、`.GUID` 临时目录和 `.obsolete` 标记，物理目录要手动清。
5. **依赖会阻塞卸载**：报 `Cannot uninstall 'X'. 'Y' extension depends on this` 时，先卸依赖方 `Y`（若 `Y` 是内置"not installed"，等 IDE 进程退出后重试 `X` 通常即通）；报 `is not installed` 说明该项已在别处清掉，跳过即可，不算失败。
6. **IDE 进程必须先退出**：运行中的实例退出时会写回 `extensions.json` 和用户配置，覆盖清理结果。动手前 `tasklist | grep -i <IDE名>`，有进程先让用户关闭。
7. **`extensions.json` 计数为 0 才算完**：文件夹删了但注册表没清 = 没清干净。
8. **绝不动相邻产品目录**：只动目标 fork 自己的 `~/.<dataFolderName>`（且只碰其 `extensions` 子目录）和 `%APPDATA%\<AppName>\User`，同前缀的其他目录是别的产品的家（`.qoder` / `.qoder-cn` / `.qoderwork` 分属不同产品，归属以各自 product.json 为准）。
9. **CLI 卸载路径可能整个坏掉**：若**所有**扩展都报同一个 JS 错误（如 Trae EN 的 `Cannot read properties of undefined (reading 'isProtectedExtension')`，带不带 `--force` 都一样），说明 fork 改坏了卸载功能，不是单个扩展的问题。不要逐个重试——直接切换「注册表直改方案」（见标准流程 §3 的兜底分支）。

## 标准流程

### 0. 动手前四查（开工门禁，一项不过不许动手）

1. **查进程**：`tasklist | grep -i <IDE名>`，有进程先让用户退出（铁律 6）。
2. **查入口**：逐个试 `bin/*.cmd --list-extensions`，锁定扩展管理 CLI（铁律 1）。
3. **查归属**：读 `product.json` 的 `dataFolderName` 与 `nameLong`，用 `ls` 确认实际目录存在（铁律 2）。
4. **查边界**：枚举 `~/.<前缀>*` 和 `%APPDATA%` 下所有同前缀目录，列出相邻产品清单与目标目录内的 agent 层子目录（如 `agent-extensions/`、`rules/`、`skills/`、`memory/`），明确只动 `extensions/`（铁律 8）。四查结果先出示给用户再动手。
5. **查本体真伪**：确认目标安装目录里有主程序 `.exe`、`resources/app/product.json`；**空目录或残缺目录是空壳**（可能卸载残留或路径给错），立刻和用户核对真实路径，不要对空壳执行流程。同一产品可能同时存在多个相似路径（如 `ai-ide/trae-cn` 空壳与 `ai-agent/trae-code-cn` 真本体），路径必须逐字核对。

### 1. 选定 CLI 入口

```bash
IDE_DIR="<IDE 安装目录>"   # 如 "D:/dev-tool/ai-ide/Qoder CN IDE"
for c in "$IDE_DIR"/bin/*.cmd; do
  echo "== $c =="; "$c" --list-extensions 2>&1 | head -20
done
CLI="<能列出扩展的那个 .cmd 全路径>"
```

### 2. 定位数据目录（product.json 为唯一权威）

```bash
grep -o '"dataFolderName": *"[^"]*"' "$IDE_DIR/resources/app/product.json"
grep -o '"nameLong": *"[^"]*"'       "$IDE_DIR/resources/app/product.json" | head -1
# EXT_DIR = $USERPROFILE/.<dataFolderName>/extensions
# USER_DATA = %APPDATA%\<AppName>\User   （AppName 常与 nameLong 一致，大小写以实际目录为准，用 ls 确认）
ls "$USERPROFILE/.<dataFolderName>/extensions" "$APPDATA/<AppName>/User"
```

**目录找不到时**：跑 `"$CLI" --help | grep -iA1 "user-data-dir\|extensions-dir"` 确认参数名；用 `ls -d "$USERPROFILE"/.<前缀>*` 和 `ls "$APPDATA" | grep -i <前缀>` 枚举候选；逐个候选检查 `extensions/extensions.json` 是否存在——存在的那个才是活目录。**宁可多探一步，不要删错目录。**

### 3. 卸载全部扩展（循环 + --force）

```bash
"$CLI" --list-extensions | tr -d '\r' | while read -r ext; do
  echo "== $ext =="
  "$CLI" --uninstall-extension "$ext" --force
done
```

**已是出厂态分支**：若 `--list-extensions` 为空且 `extensions.json` 已是 `[]`，说明插件层无需处理——不要强行找活干。直接跳到 §6 验证确认，把剩余残留（IDE 自身资产、缓存、agent 层）列清单交给用户拍板删留，别擅自扩大范围。

**兜底分支（铁律 9 触发时）——注册表直改方案**：

若上一步所有扩展都报同一 JS 错误（fork 把卸载功能改坏了），别逐个重试，直接手动完成 CLI 本来要做的三件事：

1. **先查豁免**：确认 `extensions/` 物理目录里没有该 fork 的内置保护件（`ls | grep -iE '<fork前缀>|<其保护清单>'`）。保护件清单可从安装目录源码里 `isProtectedExtension` 的白名单查到。若无则全可删。
2. **清注册表**：`printf '[]' > ~/.<dataFolderName>/extensions/extensions.json`。
3. **清物理残留**：走标准流程 §4 回收所有扩展目录。
4. **照常走 §5 / §6**：重置配置 + 四证据验证。

> 注册表直改等价于卸载——`extensions.json` 归 `[]` 且目录清空后，IDE 不会再加载任何扩展。
>
> **同代码系族预判**：同一产品的不同发行版（如 Trae EN / Trae CN / Trae AICC）共享代码，卸载路径**可能**同样坏。但这只是概率预判，不能当结论——**每个目标必须单项复测一次再定路径**（反例：Trae EN 全坏，Trae CN 的 CLI 却完全正常）。

### 4. 清理扩展目录物理残留（回收站）

```powershell
powershell.exe -NoProfile -Command "Add-Type -AssemblyName Microsoft.VisualBasic; Get-ChildItem 'C:\Users\<用户>\.<dataFolderName>\extensions' -Directory | ForEach-Object { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(\$_.FullName,'OnlyErrorDialogs','SendToRecycleBin'); Write-Host ('recycled: ' + \$_.Name) }"
# 若残留 .obsolete 标记文件：同法 DeleteFile 回收
```

### 5. 重置用户配置（settings.json / keybindings.json / snippets/）

```powershell
powershell.exe -NoProfile -Command "Add-Type -AssemblyName Microsoft.VisualBasic; \$src = \"\$env:APPDATA\<AppName>\User\"; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(\"\$src\settings.json\",'OnlyErrorDialogs','SendToRecycleBin'); [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(\"\$src\keybindings.json\",'OnlyErrorDialogs','SendToRecycleBin'); [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(\"\$src\snippets\",'OnlyErrorDialogs','SendToRecycleBin'); Set-Content \"\$src\settings.json\" '{}' -Encoding UTF8; Set-Content \"\$src\keybindings.json\" '[]' -Encoding UTF8; New-Item -ItemType Directory \"\$src\snippets\" | Out-Null"
```

不动的部分（除非用户明确要求彻底清）：`globalStorage/`、`workspaceStorage/`——存放 IDE 自身登录态与工作区状态，不是导入的冗余配置。

### 6. 验证闭环（四条证据缺一不可）

```bash
"$CLI" --list-extensions                # 输出必须为空
ls "$USERPROFILE/.<dataFolderName>/extensions"   # 只剩空 extensions.json（可含 .obsolete）
cat "$APPDATA/<AppName>/User/settings.json"      # {}
cat "$APPDATA/<AppName>/User/keybindings.json"   # []
```

**验证纪律**：取退出码时命令后面不要串 `grep` / `head` 等过滤器——管道的 `$?` 是过滤器的退出码，空匹配会返回非 0，制造"失败"误报（Trae EN 实战教训）。**fork 私有警告打到 stderr 也会染脏管道**（如 Antigravity 的 `antigravityAnalytics NOT registered`），验证时用 `命令 > /tmp/out 2>/dev/null; echo $?` 单独取退出码再看输出文件（Antigravity 实战教训）。

## 豁免条款：自动下发的内置扩展不用管

部分 fork（如 Qoder CN IDE）在**启动时会自动重新下发**标记为 "Built-in" 的内置扩展（已知：`ms-python.python` / `autopep8` / `debugpy` / `vscode-python-envs` / `detachhead.basedpyright`）。这是 IDE 自身行为，**不是**用户从 VSCode 导入的个人插件：

- 卸载后只要该 IDE 再被启动，它们就会回来（连版本号都会换新），反复卸载是白费力气。
- 出厂还原的目标是清掉**导入的冗余配置和插件**；这批自动内置件不携带用户的旧设置，**直接豁免，不必处理**。
- 交付验收时向用户说明这一豁免即可，不要把它当作清理失败。

## 可选：完全卸载该 IDE

装目录里的 `unins000.exe`（Inno Setup）是官方卸载器，需要交互确认，提示用户手动运行或另行授权。

## 实战案例（2026-08-31，Qoder CN IDE）

- 入口坑：`bin/qoder-cn.cmd --list-extensions` 报 "QoderCN CLI is not installed"；同目录 `bin/code.cmd` 才是扩展管理入口。
- 目录坑：`~/.qoder/extensions`（80+ 扩展）属于 Qoder IDE（另一产品），`product.json` 的 `dataFolderName: .qoder-cn` 才指向真目录。
- 拦截坑：5 个导入扩展全部 "Built-in" 拦截，`--force` 后全部卸载成功。
- 残留坑：卸载后 `~/.qoder-cn/extensions` 留 17 个文件夹（含 11 个 `.GUID` 临时目录、1 个历史遗留扩展），按第 4 步回收后 `extensions.json` 归 0。
- 用户明确拒绝任何备份文件——删完连备份清单都要回收掉。
- 复活坑：清理完成后用户启动过一次该 IDE，5 个 Built-in 扩展被自动重新下发（版本号换新）。用户裁定：这类自动内置件豁免不处理（见「豁免条款」）。

### 实战案例 2（2026-08-31，Qoder IDE）

- 入口：`bin/code.cmd` 管理扩展（78 项），`bin/qoder.cmd` 是 agent CLI 壳——与案例 1 同构。
- 新坑 1：IDE 进程在跑时批量卸载，3 项失败（1 项依赖阻塞 + 2 项幻影 `not installed`）；进程退出后重试即通。**教训：动手前先查进程（铁律 6）。**
- 新坑 2：`ms-python.python` 被内置 Pylance 依赖阻塞，但 Pylance 不在用户注册表里（`--uninstall` 报 not installed）；IDE 关闭后直接重试 `ms-python.python --force` 成功。
- 注意：`%APPDATA%\Qoder\User` 里有 Qoder 自身的 `mcp.json`、`app.json` 等，不属于 VSCode 三件套，重置时不动。
- 四证据闭环通过：列表空 / 目录只剩 `extensions.json` / settings `{}` / keybindings `[]`，注册表 count 0。

### 实战案例 3（2026-08-31，Trae EN）

- 入口：`bin/trae.cmd` 唯一 CLI，`--list-extensions` 可用（122 项）。
- 归属：`dataFolderName: .trae`；同门有 `.trae-cn` / `.trae-aicc` 和 `%APPDATA%\Trae CN` / `TRAE SOLO CN`，只动 `~/.trae/extensions` 与 `%APPDATA%\Trae\User`。
- **新坑（铁律 9 首次触发）**：`--uninstall-extension` 对**全部** 122 个扩展报同一错误 `Cannot read properties of undefined (reading 'isProtectedExtension')`，带不带 `--force` 都一样——fork 把 CLI 卸载路径改坏了。逐个重试是死路。
- 解法：走「注册表直改方案」——先确认 `extensions/` 目录无 `trae.*`/`cloudide.*` 保护件（源码白名单为 `trae.ai` 等 4 项，均不在目录内），再 `extensions.json` 写 `[]`、回收 149 个物理目录、重置配置三件套。
- 注意：`~/.trae` 下还有 `agent-extensions/`、`rules/`、`skills/` 等 Trae agent 层，只动 `extensions/` 子目录。
- 四证据闭环通过：列表空（exit 0）/ 目录只剩 `extensions.json` / settings `{}` / keybindings `[]`，注册表 count 0。

### 实战案例 4（2026-08-31，Trae CN）

- **路径乌龙（新增第五查的直接起因）**：先拿到 `D:\dev-tool\ai-ide\trae-cn`（空壳，2026-02-14 建的空目录），差点按"残留清理"处理；用户纠偏后确认真本体在 `D:\dev-tool\ai-agent\trae-code-cn`（214MB 主程序）。**教训：目录无 exe / 无 product.json 就是空壳，必须逐字核对路径（§0 第 5 查）。**
- 归属：`dataFolderName: .trae-cn`，`nameLong: Trae CN`；入口 `bin/trae-cn.cmd` 唯一。
- **插件层已是出厂态**：`--list-extensions` 空、注册表 `[]`、无 settings.json / keybindings.json、snippets 空——走「已是出厂态分支」，不强行找活。
- **系族预判修正**：Trae EN 的 CLI 卸载全坏，但 Trae CN 的 `--uninstall-extension` 完全正常（单项复测通过）——同族≠同病，预判必须复测确认。
- 用户裁定：只清缓存层——回收 `%APPDATA%\Trae CN\User\` 下 `History/` / `globalStorage/` / `workspaceStorage/`；`~/.trae-cn`（134M，含 builtin/plugins/jwt 令牌）与 `%APPDATA%\Trae CN` 顶层 Electron 缓存（CachedData 100M 等）**保留**，列清单交用户未拍板不擅动。

### 实战案例 5（2026-08-31，CodeBuddy CN）

- 与案例 4 同型：`buddycn.cmd` CLI 正常、插件层开箱即出厂态（列表空 / 注册表 `[]`）、无 keybindings、snippets 空——走「已是出厂态分支」。
- **新增豁免识别**：`settings.json` 仅 14 行且全是 `CodeBuddy.*` / `codingcopilot.*` 前缀——这是 fork 自家 AI 配置，不是导入的编辑器配置，按豁免保留。**判别法：逐行看配置前缀，全是 fork 自家命名空间即豁免；混入 `editor.*` / `workbench.*` 等 VSCode 通用项才是导入配置。**
- 用户裁定照例清缓存层：回收 `%APPDATA%\CodeBuddy CN\User\` 下三缓存目录（合计约 2MB）；同门 `.codebuddy`（国际版）未碰。

### 实战案例 6/7（2026-08-31，Kiro + Antigravity，双目标并行）

- 双目标结构均为标准 VSCode fork（exe + product.json + bin），`kiro.cmd`（46 项）与 `antigravity.cmd`（79 项）CLI 卸载路径都正常，**两路后台并行卸载**是批量目标的标准姿势。
- Antigravity 2 个 `ms-vscode.remote-*` 报 `not installed` 幻影（铁律 5 跳过）；其 CLI 每次调用都打 `[createInstance] ... antigravityAnalytics NOT registered` stderr 警告——无害噪音，但会污染管道退出码（见 §6 验证纪律补强）。
- **混合配置判别补强**：Kiro 的 `settings.json` 是混合体（`kiroAgent.*` 自家项 + `editor.*`/`git.*`/`cSpell.*` 导入痕迹混杂）。判别法升级：**只要混入任何 `editor.*` / `workbench.*` / `git.*` 等 VSCode 通用项，即按导入配置整体重置**（出厂还原语义下，自家项会由 IDE 重建默认值）；纯自家前缀才豁免（案例 5 判别法只适用于纯净文件）。
- **Kiro 附带风险披露**：旧配置里 `kiroAgent.trustedCommands` 含裸通配 `"*"`（等于 agent 命令免审批白名单全开），重置后已消除——交付时主动向用户点出此类安全隐患。
- 边界：`~/.kiro` 有 agent 层（`hooks/`、`powers/`、`skills/`、`steering/`）、`~/.antigravity` 有相邻产品目录 `.antigravity_cockpit` / `.antigravity_tools` / `com.lbjlaq.antigravity-tools`（%APPDATA%），均未碰。
- 双目标四证据全绿：列表空（重定向后 exit 0）/ 目录只剩 `extensions.json` / settings `{}` / keybindings `[]`，两注册表 count 0。
