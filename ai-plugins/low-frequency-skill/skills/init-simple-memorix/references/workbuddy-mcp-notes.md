# WorkBuddy MCP Notes

本文件只用于 WorkBuddy 中 Memorix MCP 的连接、信任审批、Node 环境和工具暴露问题。若用户只是抱怨 hooks 噪音或记忆太杂，先读取 `references/hooks-reference.md`，不要把 MCP 信任链路作为主路径。

## 何时读取

读取本文件的典型信号：

- WorkBuddy 中 memorix MCP 没有工具暴露。
- WorkBuddy 日志出现 `Connection closed`、`untrusted`、`disabled`、`not in enabled list`。
- 用户提到 Node 版本切换、ABI、`better-sqlite3`、`NODE_OPTIONS`。
- 用户审批过 MCP，但重启后仍不可用。
- 需要解释 `trustLevel=gray` 与 `status=connected` 的关系。

## 只读优先

如果用户只要求检查或诊断，不要修改：

- `~/.workbuddy/mcp.json`
- `~/.workbuddy/.mcp.json`
- `~/.workbuddy/mcp-approvals.json`
- WorkBuddy hooks 文件
- 全局 Node 包或 memorix 安装

需要修复时，先列出将修改的文件和备份策略，获得用户明确授权后再写入。

## 快速分流

| 用户症状                        | 首选分支                                             |
| :------------------------------ | :--------------------------------------------------- |
| 记忆太多、每次工具调用都记录    | hooks 分支，读取 `references/hooks-reference.md`。   |
| MCP 工具没出来、server 断开     | WorkBuddy MCP 分支，检查配置和日志。                 |
| Node 升级后 `Connection closed` | 先查 ABI 与 `NODE_OPTIONS`，不要默认 rebuild。       |
| `untrusted` / `disabled`        | 查审批 hash 和 WorkBuddy 是否完整重启。              |
| `trustLevel=gray` 但工具可用    | 看 `status=connected` 和工具是否暴露，不要只看颜色。 |

## 已知关键事实

- WorkBuddy 可能向 stdio MCP 子进程注入 `NODE_OPTIONS`。
- 旧 Node 22 版本不允许 `--use-system-ca` 出现在 `NODE_OPTIONS` 中，子进程会在启动阶段退出。
- 对 memorix MCP entry 建议显式设置 `env.NODE_OPTIONS = ""`，即使当前 Node 版本已支持该参数，也可防止未来回归。
- Node 22.x 的 ABI 均为 `127`。同 major 内升级通常不需要重建 `better-sqlite3`。
- 只有跨 major 升级或降级导致 ABI 改变时，才优先考虑 rebuild 本地依赖。
- WorkBuddy 自定义 MCP 的信任 key 形态是 `${configHash}::${serverName}`。
- `configHash` 计算方式是对当前 server entry 执行 `JSON.stringify(serverEntry)` 后再做 SHA-256；对象 key 顺序会影响 hash。
- `mcp-approvals.json` 通常在 WorkBuddy 启动时加载一次。手动修改审批文件后，需要完全退出并重启 WorkBuddy。

## 检查顺序

### 1. 确认 memorix 可独立启动

```bash
memorix --version
memorix serve --mode full --help
```

只需要确认 CLI 存在和 serve 命令可解析。不要让长驻 server 阻塞会话。

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

## 修复建议边界

可以建议：

- 为 memorix entry 增加或保留 `env.NODE_OPTIONS = ""`。
- 将 memorix args 收敛为 `["serve", "--mode", "full"]`。
- 重新计算当前 entry hash，并在用户授权后更新审批文件。
- 完全退出并重启 WorkBuddy。

不要默认建议：

- 重建 `better-sqlite3`。
- 删除生命周期 hooks。
- 改用包装脚本，除非已证明 `env.NODE_OPTIONS` 覆盖无效。
- 修改 `mcp-approvals.json` 后声称立即生效；必须重启。

## 与 hooks 分支的关系

hooks 噪音和 MCP 连接是两条链路：

- 记忆噪音：检查 hooks 文件是否包含高频事件。
- 工具缺失：检查 MCP full mode、启动环境、审批和日志。

用户只问 hooks 时，不要把审批 hash 不匹配写成主结论。最多把它列为“非本次焦点的附带发现”。
