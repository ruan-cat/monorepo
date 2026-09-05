# 清理审计日志（C 盘处理路径追踪）

> 本文件记录出厂还原任务实际处理过的**全部** C 盘路径，供用户追踪与后续模仿参考。
> 清理方式统一为：Windows 回收站（`SendToRecycleBin`），无物理粉碎、无任何备份产物。
> 数据来源：2026-08-31 三次实战执行记录。

## 一、Qoder CN IDE（安装目录 `D:\dev-tool\ai-ide\Qoder CN IDE`）

### 扩展插件文件夹

| 路径                                                                                 | 处理内容                                                     | 状态      |
| :----------------------------------------------------------------------------------- | :----------------------------------------------------------- | :-------- |
| `C:\Users\pc\.qoder-cn\extensions\`                                                  | CLI 强制卸载 5 个导入扩展（basedpyright + ms-python 四件套） | ✅ 完成   |
| `C:\Users\pc\.qoder-cn\extensions\*.GUID\`（11 个）                                  | 卸载临时目录，回收站                                         | ✅ 已回收 |
| `C:\Users\pc\.qoder-cn\extensions\detachhead.basedpyright-1.31.6\` 等 5 个扩展壳目录 | 物理残留，回收站                                             | ✅ 已回收 |
| `C:\Users\pc\.qoder-cn\extensions\mrmlnc.vscode-scss-0.10.0\`                        | 历史遗留残留，回收站                                         | ✅ 已回收 |
| `C:\Users\pc\.qoder-cn\extensions\.obsolete`                                         | 卸载标记文件，回收站                                         | ✅ 已回收 |

⚠️ 备注：清理后该 IDE 被启动过一次，5 个 Built-in Python 扩展被**自动重新下发**（文件夹与注册表复活）。用户裁定：豁免不处理（见 SKILL.md「豁免条款」）。当前该目录内存在这 5 个自动内置件，属预期状态。

### 个人配置（三件套）

| 路径                                                            | 原状态         | 处理                         |
| :-------------------------------------------------------------- | :------------- | :--------------------------- |
| `C:\Users\pc\AppData\Roaming\QoderCN\User\settings.json`        | 旧导入配置     | 原件进回收站 → 重置为 `{}`   |
| `C:\Users\pc\AppData\Roaming\QoderCN\User\keybindings.json`     | 旧导入配置     | 原件进回收站 → 重置为 `[]`   |
| `C:\Users\pc\AppData\Roaming\QoderCN\User\snippets\`            | 旧片段         | 整目录进回收站 → 重建空目录  |
| `C:\Users\pc\AppData\Roaming\QoderCN\User.bak-20260831-014207\` | 中途产生的备份 | 用户拒留备份，整目录进回收站 |

## 二、Qoder IDE（安装目录 `D:\dev-tool\ai-ide\Qoder IDE`）

### 扩展插件文件夹

| 路径                                              | 处理内容                                                            | 状态      |
| :------------------------------------------------ | :------------------------------------------------------------------ | :-------- |
| `C:\Users\pc\.qoder\extensions\`                  | CLI 强制卸载 79 个导入扩展（75 一次过 + 3 依赖/进程问题重试后清完） | ✅ 完成   |
| `C:\Users\pc\.qoder\extensions\` 下 79 个扩展目录 | 物理残留，回收站                                                    | ✅ 已回收 |
| `C:\Users\pc\.qoder\extensions\.obsolete`         | 卸载标记文件，回收站                                                | ✅ 已回收 |

⚠️ 边界说明：`C:\Users\pc\.qoder\` 同时是 Qoder agent 运行时目录（`memory\`、`agents\`、`bin\`、`mcp.json` 等），**只动了 `extensions\` 子目录**，agent 层一个字节未碰。

### 个人配置（三件套）

| 路径                                                      | 原状态           | 处理                        |
| :-------------------------------------------------------- | :--------------- | :-------------------------- |
| `C:\Users\pc\AppData\Roaming\Qoder\User\settings.json`    | 692 行旧导入配置 | 原件进回收站 → 重置为 `{}`  |
| `C:\Users\pc\AppData\Roaming\Qoder\User\keybindings.json` | 42 行旧配置      | 原件进回收站 → 重置为 `[]`  |
| `C:\Users\pc\AppData\Roaming\Qoder\User\snippets\`        | 旧片段           | 整目录进回收站 → 重建空目录 |

## 三、Trae EN（安装目录 `D:\dev-tool\ai-ide\trae-en`）

### 扩展插件文件夹

| 路径                                              | 处理内容                                                                       | 状态      |
| :------------------------------------------------ | :----------------------------------------------------------------------------- | :-------- |
| `C:\Users\pc\.trae\extensions\`                   | CLI 卸载路径损坏（铁律 9），注册表直改：`extensions.json` 写 `[]`（原 122 项） | ✅ 完成   |
| `C:\Users\pc\.trae\extensions\` 下 149 个扩展目录 | 物理残留，回收站                                                               | ✅ 已回收 |

⚠️ 边界说明：`C:\Users\pc\.trae\` 下还有 `agent-extensions\`、`rules\`、`skills\` 等 Trae agent 层，**只动了 `extensions\` 子目录**。

### 个人配置（三件套）

| 路径                                                     | 原状态           | 处理                        |
| :------------------------------------------------------- | :--------------- | :-------------------------- |
| `C:\Users\pc\AppData\Roaming\Trae\User\settings.json`    | 654 行旧导入配置 | 原件进回收站 → 重置为 `{}`  |
| `C:\Users\pc\AppData\Roaming\Trae\User\keybindings.json` | 80 行旧配置      | 原件进回收站 → 重置为 `[]`  |
| `C:\Users\pc\AppData\Roaming\Trae\User\snippets\`        | 旧片段           | 整目录进回收站 → 重建空目录 |

## 三·补、Trae CN（安装目录 `D:\dev-tool\ai-agent\trae-code-cn`）

> 插件层与个人配置**已是出厂态**（列表空、注册表 `[]`、无 settings/keybindings），未执行卸载与重置。按用户裁定仅清缓存层。

### 已处理

| 路径                                                         | 处理内容     | 状态      |
| :----------------------------------------------------------- | :----------- | :-------- |
| `C:\Users\pc\AppData\Roaming\Trae CN\User\History\`          | 缓存，回收站 | ✅ 已回收 |
| `C:\Users\pc\AppData\Roaming\Trae CN\User\globalStorage\`    | 缓存，回收站 | ✅ 已回收 |
| `C:\Users\pc\AppData\Roaming\Trae CN\User\workspaceStorage\` | 缓存，回收站 | ✅ 已回收 |

### 明确保留（用户裁定不动）

| 路径                                                   | 说明                                                                                                                              |
| :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `C:\Users\pc\.trae-cn\`（134M）                        | Trae CN agent/内置资产层：`builtin\`(68M)、`plugins\`(52M)、`design_libraries\`(15M)、`skills\`、`toolhost\`、`trae-jwt-token` 等 |
| `C:\Users\pc\AppData\Roaming\Trae CN\` 顶层（约 127M） | Electron 运行缓存：`CachedData\`(100M)、`Cache\`(8M)、`ModularData\`、`logs\`、`GPUCache\` 等——已列清单交用户，未拍板不擅动       |
| `C:\Users\pc\AppData\Roaming\Trae CN\User\snippets\`   | 空目录，保留                                                                                                                      |

### 备注

- `D:\dev-tool\ai-ide\trae-cn` 是**空壳目录**（无 exe、无 product.json），不是安装位置；真本体在 `D:\dev-tool\ai-agent\trae-code-cn`。
- Trae CN 的 CLI（`trae-cn.cmd`）卸载路径正常，与 Trae EN（损坏）不同。

## 三·补 2、CodeBuddy CN（安装目录 `D:\dev-tool\ai-ide\codebuddy-cn`）

> 与 Trae CN 同型：插件层与编辑器配置**开箱即出厂态**（列表空、注册表 `[]`、无 keybindings、snippets 空）；`settings.json` 仅 14 行 CodeBuddy 自家 AI 配置（`CodeBuddy.*` / `codingcopilot.*`），非导入配置，按豁免保留。用户裁定照例清缓存层。

### 已处理

| 路径                                                              | 处理内容             | 状态      |
| :---------------------------------------------------------------- | :------------------- | :-------- |
| `C:\Users\pc\AppData\Roaming\CodeBuddy CN\User\History\`          | 缓存（28K），回收站  | ✅ 已回收 |
| `C:\Users\pc\AppData\Roaming\CodeBuddy CN\User\globalStorage\`    | 缓存（1.8M），回收站 | ✅ 已回收 |
| `C:\Users\pc\AppData\Roaming\CodeBuddy CN\User\workspaceStorage\` | 缓存（262K），回收站 | ✅ 已回收 |

### 明确保留

| 路径                                                                | 说明                                       |
| :------------------------------------------------------------------ | :----------------------------------------- |
| `C:\Users\pc\AppData\Roaming\CodeBuddy CN\User\settings.json`       | CodeBuddy 自家 AI 配置（非导入），保留     |
| `C:\Users\pc\AppData\Roaming\CodeBuddy CN\User\snippets\`           | 空目录，保留                               |
| `C:\Users\pc\.codebuddycn\`                                         | 仅 `argv.json` + 空 extensions，无处理必要 |
| `C:\Users\pc\.codebuddy\`、`C:\Users\pc\AppData\Roaming\CodeBuddy\` | CodeBuddy 国际版（同门产品），未碰         |

## 三·补 3、Kiro（安装目录 `D:\dev-tool\ai-ide\kiro`）

### 扩展插件文件夹

| 路径                                           | 处理内容                                 | 状态      |
| :--------------------------------------------- | :--------------------------------------- | :-------- |
| `C:\Users\pc\.kiro\extensions\`                | CLI 强制卸载 46 个导入扩展（46/46 成功） | ✅ 完成   |
| `C:\Users\pc\.kiro\extensions\` 下全部扩展目录 | 物理残留，回收站                         | ✅ 已回收 |

### 个人配置（三件套）

| 路径                                                     | 原状态                                                                                                               | 处理                        |
| :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| `C:\Users\pc\AppData\Roaming\Kiro\User\settings.json`    | 35 行混合配置（`kiroAgent.*` 自家项 + `editor.*`/`git.*`/`cSpell.*` 导入痕迹），含 `trustedCommands: "*"` 高危白名单 | 原件进回收站 → 重置为 `{}`  |
| `C:\Users\pc\AppData\Roaming\Kiro\User\keybindings.json` | 43 行                                                                                                                | 原件进回收站 → 重置为 `[]`  |
| `C:\Users\pc\AppData\Roaming\Kiro\User\snippets\`        | 空目录                                                                                                               | 整目录进回收站 → 重建空目录 |

边界：`~/.kiro` 的 `hooks/`、`powers/`、`skills/`、`steering/` agent 层未碰。

## 三·补 4、Antigravity（安装目录 `D:\dev-tool\ai-ide\antigravity`）

### 扩展插件文件夹

| 路径                                                  | 处理内容                                                                                  | 状态      |
| :---------------------------------------------------- | :---------------------------------------------------------------------------------------- | :-------- |
| `C:\Users\pc\.antigravity\extensions\`                | CLI 强制卸载 79 个导入扩展（77 成功 + 2 个 `ms-vscode.remote-*` 幻影 not installed 跳过） | ✅ 完成   |
| `C:\Users\pc\.antigravity\extensions\` 下全部扩展目录 | 物理残留，回收站                                                                          | ✅ 已回收 |

### 个人配置（三件套）

| 路径                                                            | 原状态                                             | 处理                        |
| :-------------------------------------------------------------- | :------------------------------------------------- | :-------------------------- |
| `C:\Users\pc\AppData\Roaming\Antigravity\User\settings.json`    | 846 行旧导入配置（中文注释版，与 Qoder/Trae 同款） | 原件进回收站 → 重置为 `{}`  |
| `C:\Users\pc\AppData\Roaming\Antigravity\User\keybindings.json` | 43 行                                              | 原件进回收站 → 重置为 `[]`  |
| `C:\Users\pc\AppData\Roaming\Antigravity\User\snippets\`        | 1 个片段文件                                       | 整目录进回收站 → 重建空目录 |

边界：`%APPDATA%\Antigravity\User` 之外的 `~/.antigravity_cockpit`、`~/.antigravity_tools`、`%APPDATA%\com.lbjlaq.antigravity-tools` 为相邻产品，未碰。

## 四、其他删除项

| 路径                                                                                                             | 说明                                   |
| :--------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `D:\store\WorkBuddy\2026-6-30-common\docs\plan\2026-8-27-try-vscode\qoder-cn-ide-extensions-backup-20260831.txt` | 扩展清单备份文件，用户拒留备份，回收站 |

## 五、明确未动的相邻目录（防误伤清单）

| 路径                                                                              | 归属                     |
| :-------------------------------------------------------------------------------- | :----------------------- |
| `C:\Users\pc\.qoder-cli\`                                                         | Qoder CLI agent          |
| `C:\Users\pc\.qoderwork\`                                                         | QoderWork                |
| `C:\Users\pc\.qoderworkcn\`                                                       | QoderWork CN             |
| `C:\Users\pc\.trae-cn\`                                                           | Trae CN（另一产品）      |
| `C:\Users\pc\.trae-aicc\`                                                         | Trae AICC（另一产品）    |
| `C:\Users\pc\.codebuddy\`                                                         | CodeBuddy 国际版         |
| `C:\Users\pc\AppData\Roaming\CodeBuddy\`                                          | CodeBuddy 国际版         |
| `C:\Users\pc\.antigravity_cockpit\`、`C:\Users\pc\.antigravity_tools\`            | Antigravity 相邻工具     |
| `C:\Users\pc\AppData\Roaming\com.lbjlaq.antigravity-tools\`                       | Antigravity 第三方工具   |
| `C:\Users\pc\AppData\Roaming\Trae CN\`、`TRAE SOLO CN\`                           | Trae 同门产品            |
| `C:\Users\pc\AppData\Roaming\QoderWork CN\`、`com.qoder.app.stable\`              | Qoder 同门产品           |
| 各 `%APPDATA%\<IDE>\User\` 下的 `mcp.json`、`globalStorage\`、`workspaceStorage\` | IDE 自身状态，非导入配置 |

## 六、恢复指引

所有被删内容均在 **Windows 回收站**内（除非用户已自行清空）。恢复时按原路径还原即可；三件套的重置文件（`{}` / `[]`）可直接覆盖。
