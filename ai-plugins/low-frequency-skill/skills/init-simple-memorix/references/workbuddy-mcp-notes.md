# WorkBuddy MCP Notes

本文件只用于 WorkBuddy 中 Memorix MCP 的连接、信任审批、Node 环境和工具暴露问题。若用户只是抱怨 hooks 噪音或记忆太杂，先读取 `references/hooks-reference.md`，不要把 MCP 信任链路作为主路径。

## 何时读取

读取本文件的典型信号：

- WorkBuddy 中 memorix MCP 没有工具暴露。
- WorkBuddy 日志出现 `Connection closed`、`untrusted`、`disabled`、`not in enabled list`。
- 用户提到 Node 版本切换、ABI、`better-sqlite3`、`NODE_OPTIONS`。
- 用户审批过 MCP，但重启后仍不可用。
- 需要解释 `trustLevel=gray` 与 `status=connected` 的关系。
- memorix 裸命令报「不是内部或外部命令」、`where memorix` 第一命中可疑 shim，或包管理器迁移（如 pnpm 布局变更）后 memorix MCP 突然失联但 `~/.memorix/` 数据完好。

## 只读优先

如果用户只要求检查或诊断，不要修改：

- `~/.workbuddy/mcp.json`
- `~/.workbuddy/.mcp.json`
- `~/.workbuddy/mcp-approvals.json`
- WorkBuddy hooks 文件
- 全局 Node 包或 memorix 安装

需要修复时，先列出将修改的文件和备份策略，获得用户明确授权后再写入。

## 快速分流

| 用户症状                          | 首选分支                                             |
| :-------------------------------- | :--------------------------------------------------- |
| 记忆太多、每次工具调用都记录      | hooks 分支，读取 `references/hooks-reference.md`。   |
| MCP 工具没出来、server 断开       | WorkBuddy MCP 分支，检查配置和日志。                 |
| Node 升级后 `Connection closed`   | 先查 ABI 与 `NODE_OPTIONS`，不要默认 rebuild。       |
| `untrusted` / `disabled`          | 查审批 hash 和 WorkBuddy 是否完整重启。              |
| `trustLevel=gray` 但工具可用      | 看 `status=connected` 和工具是否暴露，不要只看颜色。 |
| 裸命令 `memorix` 失灵、包数据完好 | shim 劫持分支，见下文「命令解析链劫持」。            |

## 已知关键事实

- WorkBuddy 可能向 stdio MCP 子进程注入 `NODE_OPTIONS`。
- 旧 Node 22 版本不允许 `--use-system-ca` 出现在 `NODE_OPTIONS` 中，子进程会在启动阶段退出。
- 对 memorix MCP entry 建议显式设置 `env.NODE_OPTIONS = ""`，即使当前 Node 版本已支持该参数，也可防止未来回归。
- Node 22.x 的 ABI 均为 `127`。同 major 内升级通常不需要重建 `better-sqlite3`。
- 只有跨 major 升级或降级导致 ABI 改变时，才优先考虑 rebuild 本地依赖。
- WorkBuddy 自定义 MCP 的信任 key 形态是 `${configHash}::${serverName}`。
- `configHash` 计算方式是对当前 server entry 执行 `JSON.stringify(serverEntry)` 后再做 SHA-256；对象 key 顺序会影响 hash。
- `mcp-approvals.json` 通常在 WorkBuddy 启动时加载一次。手动修改审批文件后，需要完全退出并重启 WorkBuddy。
- 裸命令 `"command": "memorix"` 的解析结果取决于运行时 PATH，宿主配置正确不能保证 spawn 成功；机器级配置中的全局命令可改绝对路径摆脱 PATH 顺序依赖。
- 包管理器布局迁移（pnpm 11+ 全局 bin 从 `PNPM_HOME` 根迁到 `<PNPM_HOME>\bin`）会让该 shim 的 PATH 解析序跌落，是 memorix MCP 突然失联的已实证触发器。
- memorix 的 SQLite 数据存于 `~/.memorix/`，与包管理器、PATH 完全解耦；进程失败不等于数据丢失。

## 检查顺序

### 1. 确认 memorix 可独立启动

```bash
memorix --version
memorix serve --mode full --help
```

只需要确认 CLI 存在和 serve 命令可解析。不要让长驻 server 阻塞会话。

若第 1 条失败（报「不是内部或外部命令」或启动即退出），先做解析链分叉判定，再进入下方「命令解析链劫持」小节：

```powershell
where.exe memorix                          # 第一命中是谁？
& "<PNPM_HOME>\bin\memorix.cmd" --version  # 绝对路径直接调用
```

判定矩阵：

| 现象                                | 结论                             |
| :---------------------------------- | :------------------------------- |
| 裸命令失败 + 绝对路径成功           | 坏 shim 劫持，进入 shim 劫持小节 |
| 裸命令与绝对路径都失败              | 包本体问题，走 reinstall 路线    |
| 裸命令成功 + `~/.memorix/` 数据完好 | CLI 健康，问题在宿主配置/信任层  |

### 2. 检查 Node ABI

```bash
node -v
node -p "process.versions.modules"
```

解释规则：

- Node 22.x 通常返回 ABI `127`。
- 若升级前后 ABI 相同，不要建议重建 `better-sqlite3`。
- 若 ABI 不同，再考虑 rebuild 或重新安装 memorix 的本地依赖。

### 3. 检查 MCP 配置

WorkBuddy 常见配置文件：

```text
~/.workbuddy/mcp.json
~/.workbuddy/.mcp.json
```

memorix entry 的目标形态：

```json
{
	"command": "memorix",
	"args": ["serve", "--mode", "full"],
	"env": {
		"NODE_OPTIONS": ""
	}
}
```

说明：

- `serve --mode full` 负责工具面完整性。
- `env.NODE_OPTIONS = ""` 负责覆盖 WorkBuddy 注入的 Node 参数。
- 当前 `scripts/install-mcp.ts` 的主责是校准 full mode；不要声称它一定会补齐 WorkBuddy 的 `env.NODE_OPTIONS`。

### 4. 计算审批 hash

可用 Node 读取 WorkBuddy MCP 配置并计算 hash。示例只读文件，不写配置：

```powershell
$mcp = Join-Path $env:USERPROFILE ".workbuddy\mcp.json"
node -e "const c=require('crypto'),f=require('fs');const m=JSON.parse(f.readFileSync(process.argv[1],'utf8'));for(const n of Object.keys(m.mcpServers||{})){const e=m.mcpServers[n];console.log(n,c.createHash('sha256').update(JSON.stringify(e)).digest('hex'))}" $mcp
```

把输出 hash 与 `~/.workbuddy/mcp-approvals.json` 中的 `${hash}::memorix` 比对。

若不匹配，通常说明 `mcp.json` 在审批后又被改过；追加新 hash 后也必须完全重启 WorkBuddy 才会生效。

### 5. 检查 WorkBuddy 日志

按日期目录找到最新主线程日志：

```text
~/.workbuddy/logs/{YYYY-MM-DD}/workbuddyMainThread__*.log
```

重点搜索：

```text
skipping untrusted server
not in enabled list
trustLevel=gray
status=disabled
status=connected
Connected to custom-mcp:memorix
Connection closed
```

判断优先级：

1. `status=connected` 且工具暴露，说明 MCP 可用。
2. `trustLevel=gray` 单独出现不是充分失败条件。
3. `skipping untrusted server` 或 `not in enabled list` 才说明审批链路仍有问题。
4. `Connection closed` 需要结合 `NODE_OPTIONS`、command/args、Node ABI 判断。

## 命令解析链劫持（第三类启动失败根因）

memorix MCP 启动失败有三类根因，排查时按层分流，不要混在一起：

| 根因层   | 典型信号                                                  | 处置入口    |
| :------- | :-------------------------------------------------------- | :---------- |
| 进程层   | `NODE_OPTIONS` 注入、Node ABI 变化、`better-sqlite3` 报错 | 上文第 2 节 |
| 信任层   | `untrusted`、`not in enabled list`、审批 hash 不匹配      | 上文第 4 节 |
| 解析链层 | 裸命令失灵、`where` 第一命中可疑 shim、包本体与数据完好   | 本节        |

解析链层机制：一台机器先后用过多个包管理器时，旧管理器会在自己的 shim 目录留下失效遗物。包管理器布局迁移（如 pnpm 11+ 把全局 bin 从 `PNPM_HOME` 根迁到 `<PNPM_HOME>\bin`）让 memorix 的好 shim 从 PATH 高位跌落到低位，历史坏 shim 从**被遮蔽的潜伏态**翻转为**劫持态**。宿主按 `"command": "memorix"` 裸命令 spawn 子进程时命中坏 shim，MCP 连接关闭——**配置本身完全正确也没用**，坏在它依赖的 PATH 解析环境。

关键判据：**进程起不来，但 `~/.memorix/` 数据目录完好无损**——数据层与包管理器、PATH 完全解耦，这是「启动链路问题」区别于「memorix 内部故障」的核心信号，不需要任何数据恢复动作。

修复路线（推荐组合）：

1. **根治**：删除 node 管理器 shim 目录里的 memorix/memcode 同名失效遗物（`.cmd`/`.exe` 成对，需用户确认后执行）。一次修复所有按裸命令调用 memorix 的宿主。memorix 不经 corepack 分发，这类遗物删除后没有复活机制。
2. **快速**：mcp.json 的 memorix entry 改用绝对路径 `"command": "<PNPM_HOME>\bin\memorix.cmd"`，把 PATH 顺序从依赖里去掉。注意 entry 变化会变更信任 hash——需要重新审批并完全重启宿主（见上文第 4 节）。

验证口径：

```log
1. memorix --version 正常输出版本号（不再报「不是内部或外部命令」）
2. where memorix 第一命中 <PNPM_HOME>\bin（或坏 shim 已删除后唯一命中）
3. 宿主完全重启 + 重新信任 memorix server
4. 新会话内 memorix 工具实际暴露，且任一写入调用成功、数据目录有新写入痕迹
```

多 shell 提示：Git Bash 对 pnpm 侧无扩展名 sh shim 存在 MSYS 路径转换污染（假性 `MODULE_NOT_FOUND`），验证时以 cmd/PowerShell 与宿主（Windows 原生进程，走 cmd shim）为准，不要把健康 shim 误判为损坏。

## 修复建议边界

可以建议：

- 为 memorix entry 增加或保留 `env.NODE_OPTIONS = ""`。
- 将 memorix args 收敛为 `["serve", "--mode", "full"]`。
- 解析链劫持实锤后（裸命令失败 + 绝对路径成功 + 数据完好），删除 node 管理器 shim 目录里的 memorix/memcode 失效遗物——先列出待删文件清单并获用户确认。
- 将 memorix entry 的 `command` 改为 `<PNPM_HOME>\bin\memorix.cmd` 绝对路径，并同步说明会触发重新审批。
- 重新计算当前 entry hash，并在用户授权后更新审批文件。
- 完全退出并重启 WorkBuddy。

不要默认建议：

- 重建 `better-sqlite3`。
- 删除生命周期 hooks。
- 改用包装脚本，除非已证明 `env.NODE_OPTIONS` 覆盖无效且绝对路径方案不适用。
- 未经 `where`/绝对路径分叉判定就把裸命令失败归因到 memorix 本体或审批链路。
- 修改 `mcp-approvals.json` 后声称立即生效；必须重启。

## 与 hooks 分支的关系

hooks 噪音和 MCP 连接是两条链路：

- 记忆噪音：检查 hooks 文件是否包含高频事件。
- 工具缺失：检查 MCP full mode、启动环境、审批和日志。

用户只问 hooks 时，不要把审批 hash 不匹配写成主结论。最多把它列为“非本次焦点的附带发现”。
