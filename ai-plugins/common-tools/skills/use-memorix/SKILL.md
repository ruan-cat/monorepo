---
name: use-memorix
user-invocable: true
description: >-
  Use when 用户要在日常开发中真正用起 Memorix：读写记忆、恢复会话与交接、准备归档或清理、检查 health 与存储、
  排查 CodeGraph / dashboard / embedding、初始化项目黄金集、审核或捕获检索候选、精简 Memorix hooks，
  以及排障 MCP 工具缺失、mode 选择、Node ABI、shim 劫持、WorkBuddy 启动链。
metadata:
  version: "3.0.2"
---

# use-memorix

## 定位

`use-memorix` 是本仓库的 Memorix 日常权威入口：先判断领域与安全门，再按需加载一个 reference 执行。

- 它不取代 Memorix 官方 setup/升级：安装与七技能升级由官方负责。
- 它不复制官方七技能的全部流程：`long-term`、`team`、`orchestration`、`transfer` 一律路由官方。
- 它只外包「安装与升级」，保留「日常使用 + 治理 + 捕获」的自包含兜底。

## 触发路由

| 用户信号                                                     | 进入域    |
| :----------------------------------------------------------- | :-------- |
| 想精简 hooks、setup 后降噪、问哪些事件该删                   | setup     |
| MCP 工具缺失、mode 不对、Node ABI、shim 劫持、WorkBuddy 断连 | platform  |
| 存一条记忆、搜记忆、看详情、resolve                          | memory    |
| 恢复上次会话、开始/结束 session、交接、handoff               | session   |
| 准备归档、清理候选、判断 stale / orphan                      | retention |
| doctor、WAL、VACUUM、CodeGraph、dashboard、数据库大小        | health    |
| embedding 评测、黄金集、检索失效、ZCode 候选捕获、联邦导出   | retrieval |

一次只进一个域；跨域时按「先诊断、再写入」顺序拆成两轮，不把多个写操作混在一次确认里。

## 全局安全门：读自动，写确认

| 操作                                               | 默认行为             | 授权粒度                         |
| :------------------------------------------------- | :------------------- | :------------------------------- |
| context / search / detail / status / doctor 纯读取 | 自动                 | 无需确认                         |
| embedding 诊断与黄金集评测                         | 自动，只读           | 无需确认                         |
| store / resolve / session start / end / handoff    | 先展示目标与载荷摘要 | 每次写入确认                     |
| setup / upgrade                                    | 不自动执行           | 每次确认，官方命令拥有执行权     |
| probe                                              | 不自动执行           | 每次确认，即使预期只读           |
| archive                                            | 不自动执行           | 候选硬门 + 快照/预演 + 最终确认  |
| cleanup / purge                                    | 不自动执行           | 预演后单独确认                   |
| VACUUM / WAL checkpoint / 存储修复                 | 不自动执行           | 展示数据库与影响后确认           |
| config 修改、embedding provider/缓存/索引修复      | 不自动执行           | 精确字段级或动作级确认           |
| dashboard 启动                                     | 不常驻自动启动       | 每次启动确认，并报告停止方式     |
| 项目黄金集初始化、ZCode hook 首次安装              | 不自动               | 展示将写入的文件后确认           |
| 已安装薄启动器升级                                 | 无条件自动升级       | 仅限带 canonical marker 的启动器 |

写操作前必须能回答三件事：写哪个库/哪个文件、写什么内容摘要、如何回滚或验证。答不出就不要写。

平台事实：项目绑定硬门。活动会话存在不能跳过 MCP 根目录核对。不一致时先确认，再把当前工作区绝对路径传给 `projectRoot`。

1. 在当前工作区运行 `memorix session context`，记下 CLI 项目 id 和根目录。
2. 读取 MCP `memorix_project_context`，记下它绑定的项目 id 和根目录。
3. 两边都必须等于当前工作区。CLI 报本项目已有活动会话，不能代替这次核对。
4. 有一边不是，停止 `memorix_store` 和 `memorix_resolve`。向用户展示两边的项目 id 与根目录，确认后第一件 MCP 调用才是 `memorix_session_start`，`projectRoot` 传当前工作区绝对路径。
5. `session_start` 会关闭该项目上一个活动会话。确认前不调用。
6. 绑定成功后再次核对。仍不一致就停止，不写。
7. 只有 `session_start` 失败，才走 CLI 兜底。CLI 的工作目录必须是当前工作区。

没有活动会话时，只读 `memorix session context` 仍然有效，MCP 写入不可用。这时只确认要不要新建会话，不要在同一条消息里同时确认 `store`、`session end` 或 `archive`。`0 active` 本身不是索引错误，也不是归档失败。归档是否成立只看 retention 域的候选硬门。本对话没有调用过 `session start` 时，不得声称自己的会话被其他代理关掉。说法和分轮见 `references/session-and-reasoning.md` 的「收尾时没有活动会话」。

## 七域渐进路由

| 域        | reference                                | 何时加载                                              |
| :-------- | :--------------------------------------- | :---------------------------------------------------- |
| setup     | `references/setup-and-hooks.md`          | hooks 降噪、setup/升级后的回归检查                    |
| platform  | `references/platform-and-mcp.md`         | MCP 配置、mode、ABI、shim、WorkBuddy 启动链、三兼容器 |
| memory    | `references/memory-operations.md`        | context/search/detail/store/resolve 的读写与判读      |
| session   | `references/session-and-reasoning.md`    | session 生命周期、handoff、reasoning 路由             |
| retention | `references/retention-and-archive.md`    | 归档候选、快照/预演、cleanup 边界                     |
| health    | `references/health-and-storage.md`       | doctor/status、WAL、VACUUM、CodeGraph、dashboard      |
| retrieval | `references/retrieval-and-golden-set.md` | embedding、黄金集、ZCode 捕获、审核、联邦导出         |

不要一次性加载七个 reference；先按上表选一个，执行后再决定是否需要第二个。

## 官方 Memorix 技能路由

以下七个官方技能必须保持可见，本技能只做边界路由与只读审计，不复制、不覆盖、不隐藏：

| 官方技能                  | 职责                           | 本技能的路由方式                     |
| :------------------------ | :----------------------------- | :----------------------------------- |
| `memorix-memory`          | 基础记忆读写与长期记忆         | 基础操作用本技能兜底，高级用法交官方 |
| `memorix-sessions`        | 会话生命周期与 handoff 细节    | 结构交给官方，安全门由本技能把守     |
| `memorix-reasoning`       | reasoning 记录与审阅           | 直接路由官方                         |
| `memorix-orchestrate`     | orchestration 编排与多技能协同 | 直接路由官方                         |
| `memorix-git-memory`      | Git 事实与提交派生记忆         | 直接路由官方                         |
| `memorix-mini-skills`     | 轻量技能组合                   | 直接路由官方                         |
| `memorix-troubleshooting` | 官方排障流程                   | 本技能 platform 域不足以定位时路由   |

高级能力归属：

| 高级能力                 | 权威所有者                 | 边界                               |
| :----------------------- | :------------------------- | :--------------------------------- |
| long-term 长期记忆沉淀   | 官方 `memorix-memory`      | 本技能只讲何时该用，不复述官方步骤 |
| team 团队协作记忆        | 官方 `memorix-orchestrate` | 需要团队空间、共享可见性时路由官方 |
| orchestration 多技能编排 | 官方 `memorix-orchestrate` | 编排协议、角色划分不在本技能复制   |
| transfer 跨项目/跨库迁移 | 官方 `memorix-sessions`    | 搬运策略与校验由官方技能给出       |

官方技能缺失、不可读，或宿主不支持 skill 路由时，本技能用自身 reference 提供基本操作兜底，并明确告知「这是兜底，不是官方完整流程」。

## 运行时事实来源优先级

1. 当前安装包的 `memorix --version`。
2. 当前命令的 `memorix <command> --help`。
   主题键更新不从 `memorix remember --help` 推断，也不从缺少 `--topic-key` 的 `memorix memory store --help` 推断。CLI 存储以 `references/memory-operations.md` 的存储命令为准。其它命令仍以当前 `--help` 为准。
3. 当前安装包内文档与官方七技能。
4. 本技能中不易漂移的治理规则（安全门、归档硬门、host 边界）。
5. 历史报告或旧输出只作背景，不作为当前命令合同。

本技能不写死当前安装版本、工具数量、dashboard 默认端口或 setup 检查项数量；这些一律以当前 runtime 输出为准。

## 硬性禁止

- 不自动执行 setup、probe、archive、cleanup、VACUUM、配置修复、索引修复、dashboard 常驻启动、embedding 修复。
- 不用 stale / age / low-evidence / orphan 任一单项发起归档。
- 不把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`；项目 `.memorix/` 只承载 `hooks.json` 与 `golden-set/`。
- 不在 hook 链上调用 Memorix、跑 shell、联网、起后台进程或写 tracked case。
- 不把 query 正文、结果正文、observationId、凭据或用户主目录写进 tracked 资产。
- 不隐藏或改写官方七技能，不声称本技能拥有官方 setup/升级所有权。
- 不用静态 JSON、registry 或 `skills add` 冒充插件真假验证。

## Resource Index

| 路径                                          | 用途                                   |
| :-------------------------------------------- | :------------------------------------- |
| `references/`                                 | 七域渐进路由明细                       |
| `scripts/install-mcp.ts`                      | MCP 配置检查与安装 CLI 入口            |
| `fallback/install-mcp.ps1`                    | Windows PowerShell 兜底入口（含 BOM）  |
| `fallback/install-mcp.sh`                     | Bash 兜底入口（jq / no-jq）            |
| `scripts/golden-set-operator.mjs`             | 黄金集 init/accept/cleanup/export      |
| `scripts/install-zcode-hook.mjs`              | ZCode 检索候选捕获安装（需授权）       |
| `scripts/capture-interactive.mjs`             | 非 ZCode 宿主的交互式候选采集          |
| `scripts/zcode-retrieval-capture.mjs`         | ZCode PostToolUse 捕获 runtime         |
| `src/golden-set/contracts.mjs`                | 三个冻结 schemaVersion 与 validator    |
| `src/golden-set/redaction.mjs`                | 可注入 `{ homeDir, projectRoot }` 脱敏 |
| `src/golden-set/capture.mjs`                  | structuredContent 归一化与候选构建     |
| `src/golden-set/operator.mjs`                 | init/accept/cleanup/export 纯函数      |
| `src/golden-set/zcode-install.mjs`            | `.zcode/config.json` 定点合并          |
| `templates/hooks/`、`templates/hooks-global/` | 去噪后的 hooks 模板                    |
| `templates/golden-set/`                       | 项目黄金集 tracked 模板                |
| `templates/zcode/`                            | 检索捕获配置片段与薄启动器模板         |
