# use-memorix 3.0 重构与发布规格

> 状态：设计已实施；本文已按 as-built 修订（2026-11-19）。
>
> 修订记录（与初版设计的差异，均已由实现与 CI 验证）：
>
> 1. cutover 由「单笔原子提交」改为按逻辑域拆分的 14 笔序列（用户验收要求），拆分前后最终树逐字节一致。
> 2. GitHub Actions 的 `shell` 字段不接受 `matrix` 表达式，双 PowerShell 改为两个显式 job。
> 3. `skill-transitions.ps1` 必须带 UTF-8 BOM；PS 5.1 在 CI 按 ANSI 解码无 BOM 文件会撕裂中文。
> 4. 最终 `git diff --check` 段在 PS 5.1 下临时切 `$ErrorActionPreference = "Continue"`，只按退出码判定。
> 5. `SCOPE-04` 改为「仅对新增行告警」，HEAD 已存在的历史主机路径行做精确基线豁免。
> 6. characterization 基线解析增加「HEAD → 删除提交父提交」回退，cutover 后仍可复验原字节。
> 7. 实际发布日为 2026-11-19；三平台 smoke 结果以 `handoff.md` 为准（Claude PASS，Cursor/Codex 未执行）。
> 8. 删旧前置门由「三平台全 PASS」放宽为「全 PASS，或缺口来自环境/客户端能力且用户明确接受为已知风险」；
>    本次 Cursor 无插件 CLI、Codex 401 均属环境性缺口，经用户接受后删除旧技能并开启下游门，缺口不被写成 PASS。

## 1. 意图

将现有低频初始化技能 `use-memorix` 硬切为日常权威入口 `use-memorix` 3.0.0，并把它从 `low-frequency-skill` 迁入 `common-tools`。新技能既要无损继承现有 hooks、MCP、setup、mode、Node ABI、shim 与 WorkBuddy 启动链排障能力，也要新增基础记忆操作、会话交接、retention、health、WAL、CodeGraph、dashboard、embedding、项目黄金集和 ZCode 检索候选捕获治理。

这不是兼容迁移。旧技能目录、注册、README 活跃入口和本机安装均在新技能验收后删除，不保留同名兼容 skill、跳转壳或导航壳。

## 2. 目标

1. 新建 `ai-plugins/common-tools/skills/use-memorix/`，`metadata.version` 固定为 `3.0.0`。
2. 用七域渐进路由组织技能：setup、platform、memory、session、retention、health、retrieval。
3. 以 characterization test 证明旧能力完整迁移；三套 `install-mcp` TypeScript、PowerShell、Bash 入口原样迁移，不在搬家时统一既有差异。
4. 为 context、search、detail、store、resolve、session handoff 提供权威、自包含的基本操作入口，同时保留官方七个 `memorix-*` 技能可见并按边界路由。
5. 建立“读自动、写确认”的统一安全门；setup、probe、archive、cleanup、VACUUM、配置修改、索引修复、dashboard 启动、embedding 修复均须明确授权。
6. 建立严格的归档硬门、retention、health、WAL 与 CodeGraph 纪律。
7. 在普通项目首次出现真实检索失效时，初始化项目 canonical 黄金集；首版自动捕获只支持 ZCode，其他 host 仅交互式采集，WorkBuddy 不提供 hook。
8. 冻结项目 case、ZCode inbox candidate 和 common 联邦 bundle 的 schemaVersion，供 3 号包消费。
9. 修改 `init-ai-md`，新增不可取消的必选模板 `templates/12.memorix-memory-governance.md`，每次执行强制增量合并且保护项目自定义内容。
10. 修改 `sync-local-global-agents-skills`，删除官方 Memorix skills 的下载、覆盖和刷新所有权，只保留只读审计；官方 setup/升级是唯一安装与升级所有者。
11. 修改 `release-ai-plugins`，支持 rename、move、remove 以及组合 rename-move 的发布语义、DryRun、校验和测试。
12. 将三个插件的 Claude、Cursor、Codex manifest 统一到 `14.0.0`，Claude/Cursor marketplace 同步到 `14.0.0`；Codex marketplace 保持其 schema 不含版本字段。
13. 完整发布后，在本机先安装并验证 `use-memorix`，再通过官方 `skills remove` 删除 `use-memorix`。
14. 覆盖官方七技能、基本 memory/session、retention/health、dashboard/embedding、ZCode 自动捕获与非 ZCode `capture-interactive` 的能力矩阵测试全部通过后，产出可供 2 号包消费的 cutover commit SHA，以及可供 3 号包消费的 schemaVersion 与同一 cutover SHA。

## 3. 非目标

### 3.1 v3 不吸收的高级能力

以下能力继续路由 Memorix 官方技能，不复制其完整操作细节：

- long-term memory；
- team；
- orchestration；
- transfer。

`use-memorix` 3.0 的高级能力只包含 dashboard 与 embedding。

### 3.2 本包不做的工作

- 不执行 2 号包的五仓 Markdown 全量改名。
- 不建设 3 号包的 common 联邦导入器、统一 runner、历史结果重判或当前本机数据库评测。
- 不将产品项目黄金集接入 GitHub CI；产品项目 CI 完全不读取、生成或修改黄金集。
- 不把 Memorix 数据库、query 原文、结果正文、token、header 或连接串上传到 common 或 CI。
- 不把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`。
- 不统一三套 `install-mcp` 实现的历史差异。
- 不为 WorkBuddy 发明不存在的 hook surface。
- 不锁定随 Memorix 版本漂移的工具数量、默认端口、内部路径或具体 runtime 输出。
- 不自动执行 setup、probe、archive、cleanup、VACUUM、配置修复、索引修复、dashboard 启动或 embedding 修复。

## 4. 反目标

以下做法即使“能跑”也视为规格失败：

1. 在任何 skill root 保留 `use-memorix` 目录或兼容壳。
2. 让 registry 同时出现 `use-memorix` 与 `use-memorix`。
3. 把旧技能仅改名却丢失 hooks、MCP、setup、mode、Node ABI、shim 或 WorkBuddy 启动链能力。
4. 在迁移三套 MCP 兼容器时顺手重写、抽象或统一差异。
5. 让 `sync-local-global-agents-skills` 继续联网下载、覆盖、备份或刷新官方 `memorix-*` skills。
6. 隐藏官方七个技能，或把官方 setup/升级所有权移交给 `use-memorix`。
7. 以 stale、年龄大、低证据或 orphan 任一单项直接归档。
8. 未快照/预演、未授权就 archive、cleanup、purge、VACUUM 或物理删除。
9. 从 MCP 文本响应中用正则猜测检索质量；候选捕获必须只消费已验证的 `structuredContent`。
10. 缺少结构化字段时继续猜测或阻断主任务；必须 fail-open 并禁用对应规则。
11. hook 调用 Memorix、启动 shell、联网、启动后台进程或写入 tracked case。
12. 把 observationId 当成跨项目稳定期望，或把本地 observationId 导出进联邦 bundle。
13. 在首次真实检索失效前预创建所有产品项目的黄金集。
14. 覆盖现有 `.zcode/config.json`、`.gitignore` 或 `AGENTS.md` 自定义内容。
15. 把短治理模板扩张为完整技能正文副本。
16. 静态 JSON 校验通过就声称插件发布完成；必须完成真实本机安装和新旧技能切换验证。

## 5. 架构总览

### 5.1 单一权威与所有权

| 资产                        | 权威所有者                                | 本包中的行为                              |
| --------------------------- | ----------------------------------------- | ----------------------------------------- |
| `use-memorix` 执行纪律      | `use-memorix` 3.0                         | 权威入口，自包含基本兜底                  |
| 官方七个 `memorix-*` skills | Memorix 官方 setup/升级                   | 保持可见，按边界路由，不复制、不覆盖      |
| MCP 手工兼容器              | `use-memorix`                             | 默认 micro，三入口原样迁移                |
| 项目 case                   | 产品项目 `.memorix/golden-set/cases.json` | 项目 canonical                            |
| 未审核候选                  | 产品项目 `.memorix/golden-set/.local/`    | 本地 ignored，不是事实源                  |
| 联邦 bundle schema          | `use-memorix`                             | 冻结导出契约，不自动跨仓写                |
| common 联邦镜像与 runner    | 3 号包                                    | 本包只提供 schema 与 cutover SHA          |
| 项目 AGENTS 高频治理摘要    | `init-ai-md` 模板 12                      | 短规则和技能指针，强制增量合并            |
| skill discovery registry    | `ai-plugins/skill-registry.json`          | Node generator 唯一生成者，schema 仍为 v1 |

### 5.2 七域渐进路由

`SKILL.md` 只保留触发、决策路由、全局安全门和 reference 索引。执行时只加载命中的 reference；不得一次性加载全部七域。

| 域        | reference                                | 职责                                                                      |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| setup     | `references/setup-and-hooks.md`          | 官方 setup/升级边界、hooks 降噪、实验模板删除、授权门                     |
| platform  | `references/platform-and-mcp.md`         | MCP、mode、Node ABI、shim、WorkBuddy 启动链、三兼容器                     |
| memory    | `references/memory-operations.md`        | context/search/detail/store/resolve 的 MCP 与 CLI 路由                    |
| session   | `references/session-and-reasoning.md`    | session start/context/end、handoff；高级 team/orchestration/transfer 路由 |
| retention | `references/retention-and-archive.md`    | stale 检查、archive-candidate、后继替代、快照/预演、cleanup               |
| health    | `references/health-and-storage.md`       | doctor/status、WAL、VACUUM、CodeGraph、dashboard、存储健康                |
| retrieval | `references/retrieval-and-golden-set.md` | embedding、项目黄金集、ZCode 捕获、审核、联邦导出                         |

### 5.3 运行时事实来源优先级

1. 当前安装包的 `memorix --version`。
2. 当前命令的 `memorix <command> --help`。
3. 当前安装包内文档与官方七个技能。
4. `use-memorix` 中不易漂移的治理规则。
5. 历史报告或旧输出仅作背景，不作为当前命令合同。

实现文档不得写死当前安装版本、工具数量、dashboard 默认端口、setup 检查项数量或其他易漂移数字。只有本规格冻结的技能版本、插件版本和 schemaVersion 可写死。

### 5.4 测试发现与严格类型检查

- 根 `tests/vitest.config.ts` 是 skill tests 的发现权威：删除 `use-memorix/**/*.test.ts`，精确加入 `use-memorix/**/*.test.ts`、`init-ai-md/**/*.test.ts`、`release-ai-plugins/**/*.test.ts`，保留 `sync-local-global-agents-skills/**/*.test.ts`。
- 从仓库根运行 skill tests 时必须显式 `--config tests/vitest.config.ts --reporter=default`，避免根 `vitest.config.ts` 的 HTML reporter 写入影响验收；reviewer 已生成且被 ignore 的 `.vitest-reporter-html/` 不清理、不纳入状态判断。
- Skill Router 不走根 Vitest 发现，唯一单测命令是 `pnpm --dir packages/skill-router-mcp run test:unit`。
- 新建 `ai-plugins/tsconfig.use-memorix.json`，`noCheck: false`、`strict: true`、`noEmit: true`，`include` 只列本包新增/修改的真实 TypeScript runtime；`pnpm run typecheck:ai-plugins` 仍只证明宽松配置可解析，不能冒充类型安全。
- PowerShell transition integration tests 必须在 Windows CI 同时使用 Windows PowerShell 5.1（`powershell.exe`）与 PowerShell 7（`pwsh.exe`）运行；任一链路失败即阻塞发布。

## 6. 目标文件树

```text
ai-plugins/common-tools/skills/use-memorix/
├── SKILL.md
├── fallback/
│   ├── install-mcp.ps1
│   └── install-mcp.sh
├── references/
│   ├── setup-and-hooks.md
│   ├── platform-and-mcp.md
│   ├── memory-operations.md
│   ├── session-and-reasoning.md
│   ├── retention-and-archive.md
│   ├── health-and-storage.md
│   └── retrieval-and-golden-set.md
├── scripts/
│   ├── install-mcp.ts
│   ├── golden-set-operator.mjs
│   ├── install-zcode-hook.mjs
│   ├── capture-interactive.mjs
│   └── zcode-retrieval-capture.mjs
├── src/
│   ├── install-mcp.ts
│   ├── platforms.ts
│   └── golden-set/
│       ├── contracts.mjs
│       ├── redaction.mjs
│       ├── capture.mjs
│       ├── zcode-install.mjs
│       └── operator.mjs
└── templates/
    ├── golden-set/
    │   ├── README.md
    │   └── cases.json
    ├── hooks/
    │   ├── antigravity.hooks.json
    │   ├── claude-code.settings.local.json
    │   ├── cursor.hooks.json
    │   ├── gemini-cli.settings.json
    │   ├── kiro.memorix-file-save.kiro.hook
    │   └── windsurf.hooks.json
    ├── hooks-global/
    │   ├── antigravity.hooks.json
    │   ├── claude.hooks.json
    │   ├── codex.hooks.json
    │   └── cursor.hooks.json
    └── zcode/
        ├── config.fragment.json
        └── retrieval-capture-launcher.mjs
```

明确删除且不迁移：

```text
ai-plugins/common-tools/skills/use-memorix/templates/workbuddy.hooks.json
```

旧模板中的 `templates/zcode.config.json` 不作为 lifecycle 模板迁移。ZCode 的新模板只用于经授权安装检索候选捕获 hook；原有 lifecycle setup/升级由官方集成负责。

## 7. 能力矩阵硬门

删除旧目录前，以下每一行必须有固定 test name、Task owner 和自动证据。实现者在 `tests/use-memorix/capability-matrix.test.ts` 中使用表驱动 `describe.each`/`test.each` 锁定所有文档与模板合同；三入口 runtime 行再由 characterization test 补强。任一 test name 缺失、被 skip 或失败即阻塞硬切，文本 `rg` 只能辅助定位，不能代替测试。

| 矩阵行                                                 | 新落点                                   | 固定自动测试名                                                                              | Task |
| ------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ---- |
| hooks 高频降噪与模板解析                               | `setup-and-hooks.md`、`templates/hooks*` | `CAP-01 parses supported hook templates and excludes noisy events`                          | 3    |
| 无 WorkBuddy/ZCode lifecycle 模板                      | 新模板树                                 | `CAP-02 omits WorkBuddy hooks and legacy ZCode lifecycle template`                          | 3    |
| MCP JSON/TOML 写入                                     | `src/install-mcp.ts`                     | `MCP-01 preserves JSON and TOML installer behavior`                                         | 1–2  |
| PowerShell 兼容器                                      | `fallback/install-mcp.ps1`               | `MCP-02 preserves PowerShell BOM targeted writes and status vocabulary`                     | 1–2  |
| Bash 兼容器                                            | `fallback/install-mcp.sh`                | `MCP-03 preserves jq and no-jq fallback behavior`                                           | 1–2  |
| setup/升级官方所有权                                   | `setup-and-hooks.md`                     | `CAP-03 routes setup and upgrade to official Memorix with write confirmation`               | 3    |
| mode 默认 micro                                        | `platform-and-mcp.md` 与三入口           | `CAP-04 keeps manual compatibility mode micro without rewriting official setup`             | 2–3  |
| Node ABI                                               | `platform-and-mcp.md`                    | `CAP-05 keeps ABI diagnosis and forbids same-major blind rebuild`                           | 3    |
| shim 劫持                                              | `platform-and-mcp.md`                    | `CAP-06 keeps bare-command absolute-path and data-layer split`                              | 3    |
| WorkBuddy 启动链                                       | `platform-and-mcp.md`                    | `CAP-07 keeps NODE_OPTIONS trust hash restart and connected gates`                          | 3    |
| context/search/detail 只读自动                         | `memory-operations.md`                   | `CAP-08 marks context search and detail as automatic reads`                                 | 3    |
| store/resolve 写确认                                   | `memory-operations.md`                   | `CAP-09 requires confirmation for store and resolve`                                        | 3    |
| session resume/context 只读与 start/end/handoff 写确认 | `session-and-reasoning.md`               | `CAP-10 separates session reads from session and handoff writes`                            | 3    |
| retention/archive                                      | `retention-and-archive.md`               | `CAP-11 rejects weak archive signals and requires snapshot preview authorization successor` | 3    |
| health/WAL/CodeGraph                                   | `health-and-storage.md`                  | `CAP-12 keeps health reads automatic and gates WAL VACUUM and CodeGraph repair`             | 3    |
| dashboard                                              | `health-and-storage.md`                  | `CAP-13 requires authorization before dashboard start and records stop contract`            | 3    |
| embedding                                              | `retrieval-and-golden-set.md`            | `CAP-14 allows embedding diagnosis evaluation and gates repair`                             | 3    |
| 黄金集 schema/脱敏                                     | contracts、templates                     | `GOLD-01 validates cases candidates bundles and redaction boundaries`                       | 4    |
| ZCode structuredContent/fail-open                      | capture runtime                          | `CAPTURE-01 partitions structured signals and fails open without text parsing`              | 5    |
| 非 ZCode 交互式采集                                    | `capture-interactive.mjs`                | `CAPTURE-02 creates interactive candidates for non-ZCode hosts without hook claims`         | 5    |
| ZCode 安装与 launcher 升级                             | install runtime、templates               | `INSTALL-01 merges ZCode config and only auto-upgrades marked launcher`                     | 6    |
| candidate 落盘/去重/脱敏链                             | capture runtime                          | `CAPTURE-05 writes deduplicated redacted candidates into ignored inbox`                     | 5    |
| 30 天/500 条留存预演                                   | `operator.mjs`                           | `INSTALL-04 previews retention cleanup limited to 30 days and 500 candidates`               | 6    |
| P95/本地依赖门                                         | capture runtime                          | `PERF-01 keeps warm capture core P95 below 100ms without network shell or workers`          | 5    |

## 8. 基本操作合同

### 8.1 工具路由

| 用户意图           | 首选 MCP 能力                | CLI 兜底                                     | 是否自动                           |
| ------------------ | ---------------------------- | -------------------------------------------- | ---------------------------------- |
| 获取项目工作上下文 | project context/context pack | `memorix context`                            | 是，只读                           |
| 搜索记忆           | search                       | `memorix search --query ... --json`          | 是，只读                           |
| 查看单条详情       | detail                       | `memorix memory detail --id ...`             | 是，只读                           |
| 存储记忆           | store                        | `memorix memory store ...`                   | 否，写前确认                       |
| resolve/archived   | resolve                      | `memorix memory resolve ...`                 | 否，写前确认；archive 另受硬门约束 |
| 恢复会话           | session context/resume       | `memorix session context` / `memorix resume` | 是，只读                           |
| 开始/结束 session  | session start/end            | `memorix session start/end`                  | 否，创建或更新状态前确认           |
| 生成 handoff       | handoff/receipt              | 以当前 help 暴露的 handoff/receipt 命令为准  | 否，写前确认                       |

MCP 工具的实际名字、参数和可用性以当前 host 暴露的 schema 为准。reference 只能描述决策与安全门，不复制易漂移的完整 tool schema。

### 8.2 官方技能可见性与优先级

必须保留并只读审计以下七个官方技能：

- `memorix-git-memory`；
- `memorix-memory`；
- `memorix-mini-skills`；
- `memorix-orchestrate`；
- `memorix-reasoning`；
- `memorix-sessions`；
- `memorix-troubleshooting`。

路由规则：

1. `use-memorix` 是本仓库用户的权威入口，负责先判断领域和安全门。
2. 官方技能存在且适合当前场景时，`use-memorix` 指向官方技能，不隐藏其名称。
3. 官方技能缺失、不可读或 host 不支持 skill 路由时，`use-memorix` 使用自身 reference 提供基本操作兜底。
4. long-term、team/orchestration、transfer 必须路由官方技能/当前 runtime help；`use-memorix` 不复制详细流程。
5. 官方 setup/升级负责安装和升级七技能；`sync-local-global-agents-skills` 只能报告 present/missing/invalid，不能写入。

## 9. 写操作与授权矩阵

| 操作                                         | 默认行为             | 授权粒度                                                         |
| -------------------------------------------- | -------------------- | ---------------------------------------------------------------- |
| context/search/detail/status/doctor 的纯读取 | 自动                 | 无需确认                                                         |
| embedding 诊断与黄金集评测                   | 自动，只读           | 无需确认                                                         |
| store/resolve/session start/end/handoff      | 先展示目标与载荷摘要 | 每次写入确认                                                     |
| setup/upgrade                                | 不自动执行           | 每次确认；官方命令拥有执行权                                     |
| probe                                        | 不自动执行           | 每次确认，即使预期只读                                           |
| archive                                      | 不自动执行           | 候选硬门、快照/预演、最终确认三重门                              |
| cleanup/purge                                | 不自动执行           | 预演后单独确认                                                   |
| VACUUM/WAL checkpoint/存储修复               | 不自动执行           | 显示数据库与影响后确认                                           |
| config 修改                                  | 不自动执行           | 精确字段级确认                                                   |
| embedding provider、缓存、索引修复           | 不自动执行           | 精确动作级确认                                                   |
| dashboard 启动                               | 不自动启动常驻进程   | 每次启动确认；启动后报告端口、PID/停止方式                       |
| 项目黄金集初始化                             | 首次真实失效时提出   | 创建 tracked 文件与 `.gitignore` 合并前确认                      |
| ZCode hook 首次安装                          | 不自动安装           | `.zcode/config.json`、薄启动器和 `.gitignore` 变更一起展示并确认 |
| 已安装薄启动器升级                           | 无条件自动升级       | 冻结的唯一写确认例外；只可替换带 canonical marker 的薄启动器     |
| 联邦 bundle 导出/跨仓回流                    | 不自动               | 每个 bundle 显式确认；跨仓写入由 3 号包再确认                    |

## 10. Retention 与归档硬门

### 10.1 形成 archive candidate 的唯一条件

满足以下任一条件才能进入候选：

1. 当前 Memorix runtime 明确返回官方 `archive-candidate`；
2. 操作者能给出明确后继替代关系，包括被替代 ref、后继 ref 和替代理由。

以下任一单项都不足以形成候选：

- stale；
- age；
- low-evidence；
- orphan。

多个弱信号叠加也不自动等价于后继替代；仍需官方候选或明确 successor。

### 10.2 执行顺序

1. 只读列出候选及证据。
2. 生成可恢复快照或执行官方 dry-run/preview；如果当前命令没有 preview，则导出候选 ID、状态和后继关系的脱敏清单。
3. 向用户展示将从 active retrieval 退出的记录。
4. 获得明确授权。
5. 优先将状态标为 `archived`，不物理删除。
6. 回读验证 archived 状态和 active 搜索结果。
7. 物理删除仅在用户另行明确要求且已有恢复点时考虑。

cleanup、purge 和 VACUUM 不得伪装成 archive 的实现细节。

## 11. Health、WAL、CodeGraph、dashboard 与 embedding

### 11.1 Health

- 自动读取当前 runtime version/help、项目绑定、doctor/status、数据库可访问性和 embedding 状态。
- 诊断可以自动；任何 repair、配置写入、缓存清除或索引重建都必须确认。
- 不以历史报告中的版本号或检查项数量判断当前健康。

### 11.2 WAL 与存储

- 只读检查数据库主文件、`-wal`、`-shm` 的存在性、大小和最近修改时间。
- 不因 WAL 文件大就自动 checkpoint、VACUUM 或删除。
- checkpoint/VACUUM 前必须明确目标数据库、可恢复点、预计锁行为和停止条件，并取得授权。
- 禁止把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`；项目 `.memorix/` 只承载 `.memorix/hooks.json` 软保留文件与本规格的 `.memorix/golden-set/`。

### 11.3 CodeGraph

- 代码问题先使用项目 CodeGraph 索引；Memory Autopilot 只提供相关历史与 freshness 提示。
- CodeGraph 缺失或 stale 时可以只读报告；refresh、重建或修索引前确认。
- 不把 CodeGraph 事实和普通 observation 混为同一来源。

### 11.4 Dashboard

- 按需启动，不常驻自动启动。
- 启动前读取当前 `memorix dashboard --help`，展示选定端口和停止方式并确认。
- 启动后验证可访问性；结束任务时按用户要求关闭，不遗留未经说明的后台进程。

### 11.5 Embedding

- 诊断、黄金集评测和结果解释可自动执行。
- provider 配置、模型下载、缓存清理、索引重建、repair 均须确认。
- 不因 lexical 命中失败就自动改 provider；先用黄金集区分数据缺失、项目绑定、索引健康、fuzzy-only 与 fallback/generation。

## 12. 项目黄金集

### 12.1 创建时机

普通项目首次出现“真实检索失效”后，`use-memorix` 才提出初始化：

```text
.memorix/golden-set/README.md
.memorix/golden-set/cases.json
```

真实检索失效是用户或 agent 对一次真实 query 的结果作出可复核判断，不是空想例子。创建前仍遵守写确认。

### 12.2 项目目录合同

```text
.memorix/
├── hooks.json                         # Memorix 既有软保留路径，必须保留
└── golden-set/
    ├── README.md                      # tracked
    ├── cases.json                     # tracked；项目 canonical
    └── .local/                        # ignored
        ├── inbox/
        ├── promoted/
        ├── rejected/
        └── logs/
```

`.gitignore` 必须增量加入：

```gitignore
.memorix/golden-set/.local/
```

不得忽略 `.memorix/golden-set/README.md` 或 `cases.json`，不得忽略或删除 `.memorix/hooks.json`。

### 12.3 case 最小化

- query 保存脱敏后的原文。
- 期望以 topicKey、entity、type、标题关键词、concept 关键词等语义锚点为主。
- observationId 只能放在 `localHints.observationIds`，仅用于本机提示。
- case 不保存结果正文、完整 observation、token、header、绝对主目录或数据库路径。
- 产品项目的 `cases.json` 是 canonical；common 只保存经授权导出的不可变镜像。

## 13. 冻结 schema

以下三个 schemaVersion 在 `use-memorix` 3.0 发布时冻结。3 号包必须逐字消费，不得自创平行版本。

```js
export const GOLDEN_SET_CASE_SCHEMA_VERSION = "memorix-golden-set-case/v1";
export const RETRIEVAL_CANDIDATE_SCHEMA_VERSION = "memorix-retrieval-candidate/v1";
export const FEDERATION_BUNDLE_SCHEMA_VERSION = "memorix-golden-set-bundle/v1";
```

### 13.1 项目 case schema

```ts
export type FailureKind = "zero-candidate" | "fuzzy-only" | "fallback-generation";

export interface SemanticAnchor {
	topicKey?: string;
	entity?: string;
	type?: string;
	titleIncludes?: string[];
	conceptsAny?: string[];
}

export interface GoldenSetCase {
	id: string;
	query: string;
	capturedAt: string;
	failureKinds: FailureKind[];
	expected: {
		mustMatch: SemanticAnchor[];
		mustNotMatch?: SemanticAnchor[];
		notes?: string;
	};
	localHints?: {
		observationIds?: number[];
	};
}

export interface GoldenSetFile {
	schemaVersion: "memorix-golden-set-case/v1";
	project: {
		repository: string;
	};
	cases: GoldenSetCase[];
}
```

约束：

- `project.repository` 必须是 GitHub identity `owner/repository`，不是本机路径。
- `id` 在单项目内唯一，使用小写 kebab-case。
- 每个 `SemanticAnchor` 至少包含一个非空字段。
- `expected.mustMatch` 至少一项。
- `failureKinds` 至少一项且不得重复；一个 accepted case 可以同时记录多个真实失效信号。
- `query` 必须通过脱敏器。
- accepted 前必须用 one-shot CLI 复跑同一脱敏 query，再由人或 agent 基于真实结果补充 expected。

### 13.2 ZCode inbox candidate schema

```ts
export interface RetrievalCandidate {
	schemaVersion: "memorix-retrieval-candidate/v1";
	candidateId: string;
	sourceProject: string;
	host: "zcode" | "claude-code" | "codex" | "cursor" | "antigravity" | "trae" | "qoder" | "workbuddy" | "other";
	captureMode: "automatic-hook" | "interactive";
	toolName: string;
	captureDate: string;
	capturedAt: string;
	query: {
		redactedOriginal: string;
		sha256: string;
	};
	signals: Array<{
		kind: "zero-candidate" | "fuzzy-only" | "fallback-generation";
		reasons: string[];
	}>;
	resultSummary: {
		candidateCount: number;
		topN: Array<{
			ref?: string;
			channel?: string;
			score?: number;
			matchedFields?: string[];
		}>;
		fallbackUsed?: boolean;
		generationStatus?: string;
	};
	contract: {
		structuredContent: true;
		enabledRules: Array<"zero-candidate" | "fuzzy-only" | "fallback-generation">;
		disabledRules: Array<"zero-candidate" | "fuzzy-only" | "fallback-generation">;
	};
}
```

约束：

- 自动 hook 产物必须是 `host: "zcode"` + `captureMode: "automatic-hook"`；其他 host 只能由交互式流程写 `captureMode: "interactive"`，WorkBuddy 同样不得声称有 hook。
- `candidateId` 必须由 validator 重算并逐字比较：`sha256(sourceProject + "\n" + captureDate + "\n" + query.redactedOriginal)`；同项目、同脱敏 query、同捕获日天然去重。
- `captureDate` 必须是 `YYYY-MM-DD`，`capturedAt` 必须是可解析 ISO 8601，且两者 UTC 日期一致。
- `sourceProject` 必须符合 GitHub `owner/repository` identity，不得是 URL、本机路径或任意字符串。
- `signals` 至少一项，按 `zero-candidate`、`fuzzy-only`、`fallback-generation` 固定顺序排列且 kind 不重复；同一次搜索可同时产生 fuzzy-only 与 fallback-generation。
- `contract.enabledRules` 与 `disabledRules` 都按同一固定顺序排列、无重复、互不相交，二者并集必须精确等于三个规则。
- 每个 signal kind 必须属于 enabledRules；disabledRules 中的规则不得出现在 signals。
- `contract.structuredContent` 必须严格为 `true`；不得接受字符串、文本 content 或缺字段兜底。
- top-N 最大 5，只保存 ref、channel、score、matchedFields 元数据，不保存正文、snippet 或完整 structuredContent。
- query 即使尚未审核也只保存脱敏原文。
- 写入 `.local/inbox/<candidateId>.json`；目标已存在即跳过。
- hook 不移动 candidate 到 promoted/rejected，不写 `cases.json`。

### 13.3 联邦单 case bundle schema

```ts
export interface FederatedGoldenSetBundle {
	schemaVersion: "memorix-golden-set-bundle/v1";
	sourceProject: string;
	projectId: string;
	sourceCommit: string;
	capturedAt: string;
	exportedAt: string;
	upstreamCaseId: string;
	case: Omit<GoldenSetCase, "localHints">;
}
```

约束：

- 一个文件只导出一个 accepted case。
- `sourceProject` 是 `owner/repository`。
- `sourceCommit` 是导出时产品项目的完整 Git commit SHA。
- `localHints`、observationId、候选日志、绝对路径和结果正文禁止进入 bundle。
- 导出与跨仓回流都须显式授权；本包只生成 bundle，不写 common。
- 3 号包导入后补充自身不可变镜像元数据，但不得改变以上字段含义。

## 14. ZCode 捕获合同

### 14.1 首版 host 范围

- 自动 hook：仅 ZCode。
- 非 ZCode host 使用独立 `scripts/capture-interactive.mjs`，由用户/agent 提供 `--host`、`--project-root`、`--query`、`--result-json`，先输出脱敏 candidate preview；只有 `--apply --approval-token CAPTURE_INTERACTIVE_CANDIDATE` 才写同一 `.local/inbox/` schema。
- `capture-interactive.mjs` 不安装 hook、不调用 Memorix、不运行 shell；`--result-json` 必须通过与 ZCode 相同的 `normalizeStructuredSearchResult()`，因此同样只接受结构化 JSON。
- WorkBuddy 可作为 `host: "workbuddy"` 走交互式 preview/apply，但没有 hook、不安装模板、不宣称自动支持。

### 14.1.1 结构判定冻结

归一化后的结构固定为 `candidateCount`、`topN[].channel`、`fallbackUsed`、`generationStatus`。规则判定固定如下：

```ts
zeroCandidate = enabled(candidateCount) && candidateCount === 0;
fuzzyOnly = enabled(topN.channel) && candidateCount > 0 && topN.every((item) => item.channel === "fuzzy");
fallbackGeneration =
	enabled(fallbackUsed, generationStatus) &&
	(fallbackUsed === true || ["fallback", "generated", "generation-error"].includes(generationStatus));
```

- fuzzy-only 必须有至少一个 candidate；空集合不得因 `every()` 真空真而误判。
- channel 缺失、混合 channel 或未知 channel 时禁用 fuzzy-only，不猜测。
- fallback-generation 只接受上述布尔/枚举；未知字符串禁用该规则，不按 substring 匹配。
- enabled/disabled 精确分区先于 signal 计算；所有规则禁用时不产生 candidate，exit 0。

### 14.2 安装资产

经用户授权后，项目新增或增量合并：

```text
.zcode/config.json
.zcode/hooks/use-memorix-retrieval.mjs
.gitignore
```

`.zcode/config.json` 只增加 `PostToolUse` 条目，命令只引用项目相对启动器：

```json
{
	"hooks": {
		"enabled": true,
		"events": {
			"PostToolUse": [
				{
					"matcher": "^(mcp__memorix__memorix_search|memorix_search)$",
					"hooks": [
						{
							"type": "command",
							"command": "node .zcode/hooks/use-memorix-retrieval.mjs",
							"timeout": 1,
							"description": "Capture redacted Memorix retrieval candidates"
						}
					]
				}
			]
		}
	}
}
```

合并时保留所有未知字段、其他事件和其他 hook。若现有配置不是合法 JSON，停止并报告，不覆盖。

### 14.3 薄启动器

项目 tracked 启动器只做四件事：

1. 使用 `os.homedir()`；
2. 定位 `~/.agents/skills/use-memorix/scripts/zcode-retrieval-capture.mjs`；
3. 动态 import；
4. 把 stdin/stdout/stderr 交给该模块的 `main()`。

启动器不得复制捕获算法，不得写死用户名，不得在项目中 vend 整个 skill。文件含固定 marker：

```js
// use-memorix:zcode-retrieval-launcher:v1
```

`use-memorix` 每次命中 retrieval 域时，如已存在带该 marker 的旧启动器，必须无条件替换为技能内 canonical 模板；这是唯一无需再次确认的写操作。没有 marker 的用户文件不得自动覆盖。

### 14.4 structuredContent 隔离探针

启用捕获规则前必须在隔离夹具中验证 ZCode `PostToolUse` envelope 至少能提供：

```ts
interface ZCodePostToolUseEnvelope {
	hook_event_name: "PostToolUse";
	tool_name: string;
	tool_input?: unknown;
	tool_response?: {
		structuredContent?: unknown;
	};
	cwd?: string;
}
```

探针只输出字段名、JSON 类型、数组计数和规则启用状态，不输出 query、结果正文或完整 payload。

标准化器只读取 `tool_response.structuredContent`。每条规则独立检查所需字段：

- zero-candidate：需要结构化结果数组或明确 `candidateCount`；
- fuzzy-only：需要每个候选的结构化 `channel`；
- fallback-generation：需要结构化 `fallbackUsed` 或 `generationStatus`。

缺字段时只禁用对应规则；三条均不可用时 hook 整体 fail-open 停用。禁止回退到 `tool_response.content`、console 文本或正则解析自然语言。

### 14.5 性能、失败与依赖

hook runtime：

- 纯本地；
- 不调用 Memorix；
- 不使用 `fetch`；
- 不导入 `node:child_process`、`node:worker_threads` 或第三方包；
- 不运行 shell；
- 不启动后台进程；
- 单次处理目标 P95 `< 100ms`；
- 所有异常返回 exit code 0，写最小脱敏诊断到 `.local/logs/`，不得阻断原搜索或主任务。

性能测试使用至少 1000 次隔离夹具调用，报告 warm P95；磁盘写入使用确定性 candidate 文件名，已存在时不重写。

### 14.6 留存

- 本地 candidate 保留 30 天，最多 500 条。
- hook 达到 500 条时停止新增并 fail-open，不自动删除。
- 清理由 `use-memorix` 先预演、展示删除数量与日期边界，再获得确认后执行。
- accepted/rejected 只在审核动作中移动；promoted 仍不是项目 canonical，真正 accepted 内容写入 tracked `cases.json`。

## 15. `init-ai-md` 同包治理

新增：

```text
ai-plugins/common-tools/skills/init-ai-md/templates/12.memorix-memory-governance.md
```

模板只包含一个短章节，必须覆盖：

1. 高频场景优先使用 `use-memorix`；
2. 读自动、写确认；
3. 归档必须有 archive-candidate 或明确后继、先快照/预演、先 archived 不物理删；
4. 项目黄金集相对路径 `.memorix/golden-set/`；
5. 不把 `MEMORIX_DATA_DIR` 指向项目 `.memorix/`，保留 `.memorix/hooks.json`；
6. common 联邦入口用 GitHub repository identity 描述，不写本机物理路径；
7. 详细命令、算法和版本统一指向 `use-memorix`，不复制正文。

模板 12 不进入步骤 3 的多选选项。每次 `init-ai-md` 执行均在既有增量补全流程中强制处理该模板；只补缺失内容，不覆盖用户自定义段落。强制模板仍遵守“禁止脚本批处理”和“保护自定义”。

## 16. `sync-local-global-agents-skills` 只读审计

删除：

```text
ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts
ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts
```

新增：

```text
ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/audit-memorix-skills.ts
ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts
```

只读接口：

```ts
export const OFFICIAL_MEMORIX_SKILLS = [
	"memorix-git-memory",
	"memorix-memory",
	"memorix-mini-skills",
	"memorix-orchestrate",
	"memorix-reasoning",
	"memorix-sessions",
	"memorix-troubleshooting",
] as const;

export interface MemorixSkillAuditResult {
	skill: (typeof OFFICIAL_MEMORIX_SKILLS)[number];
	path: string;
	status: "present" | "missing" | "invalid";
	reason?: string;
}

export function auditOfficialMemorixSkills(skillsRoot?: string): MemorixSkillAuditResult[];
```

审计只能执行 `exists/stat/read SKILL.md frontmatter name`。禁止网络、CLI 安装、copy、rename、rm、backup、metadata 写入或官方 skills 内容比较。同步器可继续把 `~/.agents/skills` 整体链接到已验证平台；它不能改变源目录中的官方 Memorix skills。

删除旧 CLI 参数：

- `--skip-memorix-refresh`；
- `--force-memorix-refresh`；
- `--memorix-source`；
- `--memorix-agent`。

新增 `--skip-memorix-audit` 只用于跳过只读报告。默认先审计再执行平台链接同步；缺失/invalid 只给出官方 setup/升级路由，不自动修复。

## 17. `release-ai-plugins` transition 合同

### 17.1 新 CLI 参数

现有参数保持兼容，新增：

```text
-RenameSkill old-id=new-id
-MoveSkill skill-id=target-plugin
-RemoveSkill skill-id
-SkillVersion skill-id=x.y.z
```

四类参数均可重复或传逗号分隔值。plugin 只允许 `common-tools`、`dev-skills`、`low-frequency-skill`。

### 17.2 transition 模型

```ts
type PluginId = "common-tools" | "dev-skills" | "low-frequency-skill";

type SkillEndpoint = {
	id: string;
	plugin: PluginId;
	entry: string;
	version: string;
};

type SkillTransition =
	| { kind: "rename" | "rename-move"; from: SkillEndpoint; to: SkillEndpoint }
	| { kind: "move"; from: SkillEndpoint; to: SkillEndpoint }
	| { kind: "remove"; from: SkillEndpoint; to: null };
```

解析事实源：

- `from` 必须来自当前 HEAD 的 skill tree；
- `to` 必须来自当前 working tree；
- rename 要求旧 id 在 working tree 消失、新 id 存在；plugin 同时变化则规范化为 `rename-move`；
- move 要求 id 不变、旧 plugin 中消失、目标 plugin 中存在；
- remove 要求旧 id 在 HEAD 存在、working tree 三个 root 都不存在；
- 同一 id 不能出现在冲突 transition；
- target version 可由 `-SkillVersion` 固定；未给出时才沿用现有 `-ChangeType` 计算。

本包的实际 transition：

```text
-RenameSkill use-memorix=use-memorix
-SkillVersion use-memorix=3.0.0
```

脚本从 HEAD/working tree 解析出 `low-frequency-skill -> common-tools`，因此记录为 `rename-move`。不得再额外传一个与它冲突的 `-MoveSkill`。

### 17.3 发布输出

- DryRun 列出旧 entry 删除、新 entry 添加、plugin 出入、版本、README、CHANGELOG、registry 变化，零写入。
- common CHANGELOG 记录 `use-memorix` 3.0.0 的新增与迁入。
- low-frequency CHANGELOG 记录 `use-memorix` 的硬切迁出/删除，不宣称兼容。
- dev-skills CHANGELOG 只记录插件版本同步。
- transition 完成后 Node registry generator 只 Apply 一次、Check 一次。
- registry schema 保持 `"1"`；只改变 entry：旧 id 消失，新 id 指向 common-tools。
- `scripts/skill-transitions.ps1` 承担 transition 索引与解析，主发布脚本只消费标准化对象；helper 与主脚本同版本、同 commit，并纳入 workflow path filter。
- transition tests 必须覆盖 rename、move、remove、rename-move、冲突、target 缺失、旧目录残留和 DryRun 零写入；
  Apply 后以"已存在目标被替换为 14.0.0 且全树无 `.tmp` 残留"锁定 §17.4 的中断恢复行为。

### 17.4 原子写

现有 `Write-Atomic` 的 `Move-Item -Force` 必须在本次修改中替换为真正的原子替换：目标存在时使用 `[System.IO.File]::Replace`，目标不存在时才 `Move-Item`。中断不得留下目标丢失、只剩 `.tmp` 的状态。

## 18. 版本与发布

### 18.1 固定版本

| 组件                              | 目标版本 |
| --------------------------------- | -------- |
| `use-memorix`                     | `3.0.0`  |
| `init-ai-md`                      | `25.0.0` |
| `release-ai-plugins`              | `2.2.0`  |
| `sync-local-global-agents-skills` | `1.0.0`  |
| `install-mcp`                     | `1.4.2`  |
| common-tools plugin               | `14.0.0` |
| dev-skills plugin                 | `14.0.0` |
| low-frequency-skill plugin        | `14.0.0` |

`install-mcp` 只更新 Memorix 路由名称与边界，故为 patch；`init-ai-md` 的必选模板和 sync 的所有权收缩均为破坏性 major；release 新增向后兼容参数和 transition 语义，为 minor。

### 18.2 版本文件

必须同步：

- 九份 `ai-plugins/{plugin}/.{claude,cursor,codex}-plugin/plugin.json`；
- `.claude-plugin/marketplace.json` 的 metadata 与三插件版本；
- `.cursor-plugin/marketplace.json` 的 metadata 与三插件版本；
- `.agents/plugins/marketplace.json` 只做字段合同校验，不新增 version；
- 三份 plugin CHANGELOG；
- common-tools、dev-skills、low-frequency-skill、总览、技能安装说明、根 README 和多平台安装/卸载活跃 README；
- `ai-plugins/skill-registry.json`。

### 18.3 完整发布顺序

1. capability matrix 全绿；transition 本机 PowerShell 5.1/7 双链路全绿（新增 Windows CI 尚未推送，不等待）。
2. transition DryRun 全绿且零写入。
3. release Apply 将插件统一到 14.0.0，registry Apply/Check 全绿。
4. 三平台 manifest/schema、README、CHANGELOG、registry、skill-router tests 全绿。
5. 记录 `PRE_CUTOVER_SHA`，完成按逻辑域拆分的 cutover 提交序列并 push `dev`。序列内每笔保持单一职责，
   最终树必须与拆分前一致；如需重写已推送历史，必须单独取得用户的 `force-with-lease` 授权，不得默认 force push。
6. 等待序列 tip（`CUTOVER_SHA`）触发的 Windows PowerShell 5.1/7 CI 两格全绿；该 CI 属新增 workflow，push 前不存在，禁止提前等待。
7. 从已 push 的 `CUTOVER_SHA` 执行 Claude Code、Cursor、Codex 三平台真实插件 smoke（隔离配置/临时 marketplace）；
   任一 BLOCKED 时暂停「发布完成」声明，除非缺口属于环境/客户端能力且用户明确接受为已知风险并如实记录。
8. 三平台隔离 smoke 清理完成后，经用户授权从 exact `CUTOVER_SHA` 正式安装 `use-memorix`，逐字节比对 `~/.agents/skills/use-memorix/SKILL.md` 与 `CUTOVER_SHA`，确认七 references 存在、薄启动器可加载真实全局 runtime；隔离 smoke 中的旧名不可见仅说明候选插件，无权推断用户全局旧安装消失。
9. 三平台 smoke 记录齐全（全 PASS，或缺口为环境性且用户明确接受为已知风险）与正式安装验证通过后，
   通过官方 `skills remove use-memorix -g -y` 清理旧独立安装。
10. 验证旧技能在规范源和所有已验证派生目标中消失，common-tools 插件中的新技能仍可见。
11. 记录 `CUTOVER_SHA`，交给 2/3 号包。

### 18.4 三平台真实插件 smoke

发布完成条件必须分别取得真实客户端证据，不能用 `skills add` 或静态 JSON 替代：

- Claude Code：在系统临时目录的仓库副本中把 marketplace 名改为 `use-memorix-smoke`，使用临时 `CLAUDE_CONFIG_DIR` 隔离配置安装 `common-tools`，新会话确认 `use-memorix` 可发现且 `use-memorix` 不可发现，随后卸载插件并删除临时 marketplace。
- Cursor：使用当前 Cursor 官方插件安装入口或 Marketplace UI/CLI 在独立用户数据目录（`--user-data-dir`/`--extensions-dir` 指向临时目录）安装本地/发布候选 `common-tools`，重载窗口后确认新 skill 可发现、旧 skill 不可发现，随后卸载并清理临时 marketplace/cache；必须记录实际客户端版本与操作证据。
- Codex：使用临时 `CODEX_HOME` 隔离配置，`codex plugin marketplace add <repo-root> --json`、`codex plugin add common-tools@use-memorix-smoke --json`、新 task 验证，再 remove plugin 和 marketplace。
- 所有 smoke 只在隔离副本与隔离配置中执行，不得对用户既有 `ruan-cat-tools` 安装执行卸载/删除；隔离 smoke 的旧名不可见只代表候选插件，正式 remove 后才检查全局旧安装。

某一客户端在当前环境未安装、未登录或不支持本地候选安装时，该平台结果必须标为 `BLOCKED`，记录具体命令/版本/缺失条件；整体发布验收保持 BLOCKED，不得用 manifest 可解析、registry 可加载或 `skills add` 冒充该平台 smoke。

## 19. 破坏性变更

1. `use-memorix` 名称、目录、registry id、安装入口全部删除。
2. skill 从 low-frequency-skill 迁到 common-tools。
3. `sync-local-global-agents-skills` 删除四个 Memorix 刷新参数和独立刷新脚本，不再安装/升级官方 skills。
4. `init-ai-md` 每次执行强制增量合并 Memorix 治理模板 12，不允许用户从多选中取消。
5. WorkBuddy 实验 hooks 模板删除；WorkBuddy 仅保留 MCP 与 AGENTS guidance。
6. ZCode lifecycle 模板不再由本技能维护；新 ZCode 资产仅用于检索候选捕获。
7. 三插件统一提升到 14.0.0。
8. 本机确认新技能可用后，官方删除旧技能安装。

## 20. 风险与缓解

- 任务开始时冻结 `git status --porcelain=v1 --untracked-files=all`，记录 `PRE_CUTOVER_SHA`，并生成逐文件 allowlist；reviewer 已生成且 ignored 的 `.vitest-reporter-html/` 不清理，也不加入 allowlist。
- 每个任务结束都用同一 status 命令，将新增/修改/删除路径与 allowlist 做集合比较；存在计划外路径立即阻塞。
- untracked 文件不能靠普通 `git diff --check` 验收：提交前逐文件精确暂存后运行 `git diff --cached --check`，或在暂存前逐文件使用 `git diff --no-index --check -- /dev/null <file>`。
- 暂存只能逐文件或使用本计划生成并人工复核的受控 pathspec file：`git add --pathspec-from-file=.git/use-memorix-cutover.pathspec --pathspec-file-nul`。禁止 `git add .`、`git add -A` 和宽目录暂存。
- 敏感扫描必须覆盖整个 staged 写集（pathspec 清单逐文件，`SCOPE-04` 自动执行），不只扫描三任务文档；唯一精确豁免是计划内脱敏 fixture 的假用户目录（`GOLD-02` 的 `C:/Users/alice`），其余 Windows 主目录前缀命中一律阻塞；模式字面量在文档与测试中一律拆分书写，避免自命中。
- Task 12 的 `handoff.md` 回填是 cutover 后唯一允许的仓库改动，必须单独加入运行时 allowlist；其他证据写入对话/CI artifact，不创建报告文件。

### 20.1 风险表

| 风险                        | 缓解                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| 搬家时丢旧能力              | capability matrix + characterization 先行，最后删旧目录                 |
| 三入口被“统一”后回归        | 原字节复制，行为差异写入测试，迁移任务禁止重构                          |
| 官方 skills 被同步器覆盖    | 删除 refresh 实现与写能力，加入静态 no-write 测试                       |
| hook 依赖未知 ZCode payload | 隔离 structuredContent probe；逐规则 enable；缺字段 fail-open           |
| hook 泄露 query/正文        | query 脱敏、top-N 元数据、schema validator、敏感夹具测试                |
| hook 拖慢工具链             | 无网络/子进程/后台，1000 次 benchmark，P95 `<100ms`                     |
| candidate 污染事实源        | 只写 ignored inbox；accepted 前 CLI 复跑；tracked cases 人工确认        |
| archive 误删                | 两类候选来源、快照/预演、明确授权、优先 archived                        |
| launcher 更新覆盖用户文件   | 只自动替换固定 marker 文件；无 marker 停止                              |
| release 漏掉旧 id           | transition gate + registry generator + skill-router real resource tests |
| 原子写中断丢目标            | 使用 File.Replace，不再 Move-Item -Force 覆盖                           |
| 插件发布后本机不可用        | 新技能先安装验证，再官方 remove 旧技能                                  |
| 后续包使用错误 schema       | 三个 schemaVersion 在本规格冻结，handoff 逐字交接                       |

## 21. 验收标准

### 21.1 源码与能力

- [ ] `use-memorix/SKILL.md` frontmatter name 为 `use-memorix`，version 为 `3.0.0`。
- [ ] 七个 reference 均存在，SKILL 只做渐进路由。
- [ ] capability matrix 每行都有自动测试和文档证据。
- [ ] 三套 install-mcp 入口原样迁移，旧行为 characterization 全绿。
- [ ] `templates/workbuddy.hooks.json` 不存在于新技能。
- [ ] 基本 memory/session 操作可路由；官方七技能可见且仅官方 setup/升级拥有。
- [ ] retention/archive、health/WAL/CodeGraph、dashboard、embedding 安全门均被行为测试锁定。

### 21.2 黄金集与 hook

- [ ] 三个 schemaVersion 与本规格逐字一致。
- [ ] project case validator 拒绝无语义锚点、未脱敏 query 和 bundle 中的 localHints。
- [ ] structuredContent 夹具能独立启用/禁用三类规则；缺字段不解析文本并 exit 0。
- [ ] hook 无 `fetch`、child process、worker、shell、后台进程或 Memorix 调用。
- [ ] 1000 次 warm benchmark 的 P95 `<100ms`。
- [ ] 未审核 query 仅保存脱敏原文；top-N 只存元数据且最多 5。
- [ ] 同项目+query+捕获日去重；达到 500 条不自动删除。
- [ ] 30 天/500 条 cleanup 只有预演后确认才能执行。
- [ ] accepted 前 one-shot CLI 复跑；联邦导出显式授权且不含 observationId。
- [ ] tracked/ignored 文件边界和 `.memorix/hooks.json` 保留测试通过。

### 21.3 上下游治理

- [ ] `init-ai-md` 模板 12 存在，不进入多选，每次强制增量合并且保护自定义。
- [ ] `sync-local-global-agents-skills` 无官方 skills 下载/覆盖路径，只输出审计结果。
- [ ] release transition 的 rename/move/remove/rename-move/失败场景测试全绿。
- [ ] `use-memorix` 旧目录、active README entry、registry entry 和本机安装均消失。
- [ ] `use-memorix` registry entry 指向 common-tools，skill-router 能按 exact commit 加载 SKILL 与 references。

### 21.4 发布与切换

- [ ] 九份 plugin manifest 和 Claude/Cursor marketplace 均为 14.0.0；Codex marketplace 无 version。
- [ ] 三份 CHANGELOG 记录职责正确，未把历史内容压成错误兼容叙事。
- [ ] release DryRun 零写入，Apply 后 registry 只生成/检查各一次。
- [ ] JSON、Markdown、Prettier、`git diff --check`、相关 Vitest 和 PowerShell/Bash characterization 全绿。
- [ ] 真实 Claude Code、Cursor、Codex 插件 smoke 记录齐全（全 PASS，或缺口为环境性且用户明确接受为已知风险）；
      静态 JSON 与 `skills add` 不得替代插件 smoke，也不得把缺口写成 PASS。
- [ ] 本机插件 smoke 后，再通过官方 `skills remove` 清理旧的独立 `use-memorix` 安装；`use-memorix` 由 common-tools 插件提供且保持可见。
- [ ] 提交前记录 `PRE_CUTOVER_SHA`，提交/push 后记录序列 tip 的 `CUTOVER_SHA`；2/3 号包不得使用分支名或混淆两个 SHA。

## 22. 回滚策略

### 22.1 发布前

- 未提交变更按精确 pathspec 恢复，不触碰用户原有 dirty 文件。
- 未经用户明确授权不使用 `git reset --hard`、不清空整个工作树、不 force push；本任务实际在用户授权后
  以 `--force-with-lease` 重写过一次已推送的 cutover 历史，仅用于满足细粒度提交验收。
- registry 重新由基线树的 Node generator 生成，不手工拼接。

### 22.2 已提交或已 push

1. 使用区间回滚撤销整个 cutover 序列：`git revert --no-commit <PRE_CUTOVER_SHA>..<CUTOVER_SHA>` 后单笔提交；
   不得只 revert 序列 tip，也不手工挑文件。
2. 正常 push revert commit；除用户明确授权的历史重写外，不改写历史。
3. 从已记录的 `PRE_CUTOVER_SHA` 恢复/安装 `use-memorix`。
4. 验证旧技能和三平台插件回到 pre-cutover 状态后，再通过官方 remove 清理 `use-memorix` 的独立残留（若存在）。
5. 恢复后的 registry、manifest、README 和三个插件版本必须来自同一 revert 状态。

### 22.3 项目 hook 回滚

- 删除 `.zcode/config.json` 中仅属于 `use-memorix` 的 PostToolUse 条目，保留其他字段。
- 删除带 canonical marker 的 `.zcode/hooks/use-memorix-retrieval.mjs`；无 marker 文件不自动删除。
- 保留项目 `.memorix/golden-set/README.md`、`cases.json` 和 `.memorix/hooks.json`；候选 `.local/` 是否清理由用户另行确认。

## 23. 与 2/3 号包的依赖

### 23.1 交给 2 号包

必须同时提供：

- 已 push 的 1 号包 cutover exact commit SHA；
- registry 中仅有 `use-memorix`、无 `use-memorix` 的证据；
- 本机新技能安装成功、旧技能官方卸载成功的证据；
- active surface 已切换到新名的文件清单。

2 号包在以上四项齐全前阻塞，不得开始五仓 Markdown 全量改名。

### 23.2 交给 3 号包

必须同时提供：

- 同一个 cutover exact commit SHA；
- `memorix-golden-set-case/v1`；
- `memorix-retrieval-candidate/v1`；
- `memorix-golden-set-bundle/v1`；
- `src/golden-set/contracts.mjs` 的 validator 测试证据；
- 一份完全脱敏、无 observationId 的合法 bundle fixture；
- 一份应被拒绝的泄露/非法 fixture。

3 号包只能消费以上冻结合同，不得把项目 `.local/` 目录或 ZCode hook runtime 复制进 common runner。
