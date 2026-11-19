# 平台、MCP 与启动链

本文件处理 MCP entry、mode、Node ABI、命令解析链、WorkBuddy 启动链，以及三套手工兼容器的既有差异。hooks 去噪见 setup 域。

## mode 与手工兼容器

Memorix MCP 的低上下文档位是 `micro`。手工兼容器只做一件事：把 entry 的 `--mode` 校准为 `micro`，不改 `command`、不改其他 server。

```json
{
	"mcpServers": {
		"memorix": {
			"command": "memorix",
			"args": ["serve", "--mode", "micro"]
		}
	}
}
```

TOML 形态：

```toml
[mcp_servers.memorix]
command = "memorix"
args = ["serve", "--mode", "micro"]
```

要点：

- 裸 `serve` 等价 `micro`，脚本判定为已满足，不产生无谓 diff。
- 只替换 args 里的 `--mode` 值；Codex 的 `["/c", "memorix.cmd", "serve", ...]` 启动器前缀必须保留。
- 写回按原文件的缩进、行尾与结尾换行序列化，避免大配置整文件 diff。
- 不写死工具数量。`micro` / `lite` / `team` / `full` 的精确工具面随版本漂移，以当前 `memorix serve --help` 与工具列表为准。
- 官方 setup 拥有安装权；手工兼容器只校准已存在的 entry，不替代官方 setup，也不在 setup 之后改写官方产物结构。

## 三套入口的既有差异（不得统一）

| 入口                       | 行为                                                                                   |
| :------------------------- | :------------------------------------------------------------------------------------- |
| `scripts/install-mcp.ts`   | 每个平台只处理**第一个存在**的配置文件；JSON 解析后重序列化                            |
| `fallback/install-mcp.ps1` | 遍历平台全部候选路径；**定点文本编辑**，不做 JSON 解析 + 重序列化；必须 UTF-8 with BOM |
| `fallback/install-mcp.sh`  | 遍历全部候选；有 `jq` 走 `process_json_jq`，无 `jq` 走 `process_json_fallback`         |

为什么保留差异：

- `~/.claude.json` 可能含仅大小写不同的重复键，PowerShell 5.1 的 `ConvertFrom-Json` 会直接报错。
- `ConvertTo-Json` 固定 4 空格 + CRLF，会把 2 空格 / LF 的配置整文件重排。
- 因此 PS 入口只做定点文本编辑。它靠 BOM 让 PS 5.1 正确按 UTF-8 解码中文注释；去掉 BOM 会报「表达式或语句中包含意外的标记」。
- no-jq 分支遇到无法安全解析的结构时拒绝修改，并输出 `refusing to modify existing JSON`，不能改成「尽力猜测」。

迁移或维护三入口时禁止重构、抽象或统一这些差异；只允许同步 `--mode` 目标值。

## 平台与键路径

| 平台        | 配置路径                                                    | 格式 | server 键路径             |
| :---------- | :---------------------------------------------------------- | :--- | :------------------------ |
| Codex       | `~/.codex/config.toml`, `~/.codex/config-2026-6-13-bg.toml` | TOML | `mcp_servers`（下划线）   |
| Claude Code | `~/.claude.json`                                            | JSON | `mcpServers`              |
| Cursor      | `~/.cursor/mcp.json`                                        | JSON | `mcpServers`              |
| WorkBuddy   | `~/.workbuddy/mcp.json`, `~/.workbuddy/.mcp.json`           | JSON | `mcpServers`              |
| ZCode       | `~/.zcode/cli/config.json`                                  | JSON | `mcp.servers`（嵌套两层） |
| Qoder       | `~/.qoder/mcp.json`                                         | JSON | `mcpServers`              |
| Kiro        | `~/.kiro/settings/mcp.json`                                 | JSON | `mcpServers`              |

键路径写错时，脚本找不到已有 entry，会在配置里新增一个目标程序不识别的键：表现为「脚本说改好了，但工具面没变化」。ZCode 与 Codex 是两个典型反例。

脚本输出状态词：

| 状态      | 含义                                            |
| :-------- | :---------------------------------------------- |
| `created` | 配置文件不存在，将创建；dry-run 下只预览        |
| `updated` | 存在 entry，需要校准 `--mode`；dry-run 下只预览 |
| `skipped` | 已满足要求，或 dry-run 跳过写入                 |
| `error`   | 解析、读写或格式处理失败，先排除该文件问题      |

## Node ABI 判定

排查顺序：

```bash
node -v
node -p "process.versions.modules"
```

规则：

- 先记录升级前后的 ABI 数值，再决定动作。
- 同 major 的 Node 版本通常共享同一 ABI，**不**建议盲目 rebuild `better-sqlite3`。
- 只有 ABI 实际变化（跨 major 升级或降级）时，才考虑 rebuild 或重装 Memorix 的本地依赖。
- 报错信息出现 `NODE_MODULE_VERSION` 不匹配时，先比对数值，不要直接删 `node_modules`。

## 命令解析链：裸命令与绝对路径

Memorix 启动失败分三层，先分层再动手：

| 根因层   | 典型信号                                                  | 处置                      |
| :------- | :-------------------------------------------------------- | :------------------------ |
| 进程层   | `NODE_OPTIONS` 注入、Node ABI 变化、`better-sqlite3` 报错 | 上文 ABI 与下文 WorkBuddy |
| 信任层   | `untrusted`、`not in enabled list`、审批 hash 不匹配      | 重新审批 + 完全重启       |
| 解析链层 | 裸命令失灵、`where` 第一命中可疑 shim、包本体与数据完好   | 本节                      |

判定：

```powershell
where.exe memorix
& "<PNPM_HOME>\bin\memorix.cmd" --version
```

| 现象                                | 结论                            |
| :---------------------------------- | :------------------------------ |
| 裸命令失败 + 绝对路径成功           | 坏 shim 劫持                    |
| 裸命令与绝对路径都失败              | 包本体问题，走 reinstall        |
| 裸命令成功 + `~/.memorix/` 数据完好 | CLI 健康，问题在宿主配置/信任层 |

机制：一台机器用过多个包管理器时，旧管理器的 shim 目录可能留下失效遗物。包管理器布局迁移（例如 pnpm 11+ 把全局 bin 迁到 `<PNPM_HOME>\bin`）会让好 shim 从 PATH 高位跌落，坏 shim 从被遮蔽翻转为劫持态。此时配置完全正确也会失败。

关键判据是**数据层与命令层分离**：`~/.memorix/` 与包管理器、PATH 完全解耦，进程起不来不等于数据丢失，不需要数据恢复动作。

修复路线：

1. 根治：删除 node 管理器 shim 目录里 memorix / memcode 的同名失效遗物（先列清单并获确认）。
2. 快速：MCP entry 的 `command` 改为绝对路径 `<PNPM_HOME>\bin\memorix.cmd`，去掉 PATH 依赖。entry 变化会变更信任 hash，需要重新审批并完全重启宿主。
3. 验证：`memorix --version` 正常、`where` 首命中正确、宿主完全重启后工具实际暴露且一次写入成功。

Git Bash 对 pnpm 侧无扩展名 sh shim 有 MSYS 路径转换污染（假性 `MODULE_NOT_FOUND`）；验证以 cmd / PowerShell 为准，不要把健康 shim 误判为损坏。

## WorkBuddy 启动链

- WorkBuddy 可能向 stdio MCP 子进程注入 `NODE_OPTIONS`；旧 Node 不识别 `--use-system-ca` 时子进程会在启动阶段退出。建议 entry 显式 `env.NODE_OPTIONS = ""`。
- 信任 key 形如 `${configHash}::${serverName}`；`configHash` 是对 server entry 做 `JSON.stringify` 后的 SHA-256，对象 key 顺序会影响 hash。
- 修改 entry 或审批文件后必须**完全重启** WorkBuddy；刷新窗口或重开会话可能仍读旧状态。
- 判断可用性看 `status=connected` 与工具是否暴露；`trustLevel=gray` 单独出现不是失败条件。
- 只有 `skipping untrusted server` / `not in enabled list` 才说明审批链仍有问题。
- `Connection closed` 要结合 `NODE_OPTIONS`、command/args 与 ABI 判断。

只读诊断入口：

```powershell
$mcp = Join-Path $env:USERPROFILE ".workbuddy\mcp.json"
node -e "const c=require('crypto'),f=require('fs');const m=JSON.parse(f.readFileSync(process.argv[1],'utf8'));for(const n of Object.keys(m.mcpServers||{})){const e=m.mcpServers[n];console.log(n,c.createHash('sha256').update(JSON.stringify(e)).digest('hex'))}" $mcp
```

日志位置 `~/.workbuddy/logs/{YYYY-MM-DD}/workbuddyMainThread__*.log`，重点搜索 `skipping untrusted server`、`not in enabled list`、`status=connected`、`Connection closed`。

## 修复边界

可以建议：补 `env.NODE_OPTIONS = ""`；校准 `--mode`；删除确认过的坏 shim；改绝对路径并重新审批；完全重启。

不要默认建议：重建 `better-sqlite3`；删生命周期 hooks；写包装脚本（除非已证明 `NODE_OPTIONS` 覆盖无效且绝对路径不适用）；未做 `where` / 绝对路径分叉判定就把裸命令失败归因到 Memorix 本体。
