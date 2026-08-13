# 长任务 checkpoint 清单

> 本文件是本 change 的唯一执行任务源。`agent-progress.md` 与 `agent-findings.md` 仅记录摘要、证据索引和风险，不能替代本清单。CP-00 的部分审计任务已经完成；后续每次只选择一个未完成 task，并在切换 task 前刷新本 change 的工件与状态文件。

## 详细约束源与恢复读取门禁

本 change 的 OpenSpec 工件不是原始设计目录的替代品。详细业务、技术、测试、部署和验收约束的主来源仍是：

`docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/`

恢复或开始任何新的 checkpoint 时，必须先读取该目录的 `README.md` 与 `ai-agent-implementation-plan.md`，再按当前 task 对照 [源上下文索引](evidence/2026-08-13-source-context-index.md) 读取对应主题文件；不能只读取 `specs/remote-skill-router-mcp/spec.md` 就开始实现。`spec.md` 是本 change 的用户可见行为契约，`design.md` 是已确认的技术取舍，`tasks.md` 是唯一执行清单；它们负责把原始 prompt 约束转成可验收 checkpoint，但不删除未映射的原始约束。

若原始 prompt、OpenSpec 工件、当前用户决定或实施当日官方资料之间出现冲突，必须暂停该 task 的实现，把冲突、来源和选择写入 `agent-findings.md`，先更新 `proposal.md`/`design.md`/`specs/*`/`tasks.md`，不得静默忽略或凭聊天记忆猜测。详细 source index 是恢复入口的一部分，若目录新增文件，先补 index 和对应 task。

## 工期、模型与 token 成本规划

| Checkpoint                       | 预估有效工作时间 | 建议思考/模型投入                | 主要边界                                    |
| -------------------------------- | ---------------: | -------------------------------- | ------------------------------------------- |
| CP-00 工件与兼容基线审核         |         2–4 小时 | 高；`gpt-5.6-terra` 复核官方资料 | 当前 OpenAI/Nitro/Cloudflare 事实可能已变化 |
| CP-01 试点：最小 MCP Runtime     |        6–10 小时 | 高；先 TDD，再实现               | Streamable HTTP 与 Nitro Worker adapter API |
| CP-02 Skill source 与核心 tools  |       12–20 小时 | 高；逐项 unit test               | exact SHA、一致性、路径和 credential 边界   |
| CP-03 workerd/production harness |        8–14 小时 | 中高；独立复核契约               | package-local Vitest、真实 Worker 语义      |
| CP-04 CI、文档与候选发布         |        6–12 小时 | 中；外部证据优先                 | 单一部署 authority、candidate version       |
| CP-05 ChatGPT/生产验收与回滚     |        4–10 小时 | 高；需要账户和可见产品状态       | Developer Mode、Workspace 审核与真实 smoke  |

预计总量为 **38–70 小时有效工作**，适合按 checkpoint 中断和恢复。若上下文压缩、会话中断或连续两次失败，先重读本文件、`agent-progress.md`、`agent-findings.md` 与相关工件；不要凭聊天记忆继续。

## 0. CP-00：工件与实施基线审核

> 完成标准：当前官方兼容路径、已有 registry 前置条件和包落点均有可复读证据；若事实使规格/设计失效，先更新 OpenSpec 工件，不修改 runtime 源码。

- [x] 0.1 [验证] `docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/chatgpt-web-mcp-compatibility-profile.md` - 对照实施当日 OpenAI 官方 Build an MCP server 文档，记录当前受支持的 SDK、`McpServer`、Streamable HTTP 与 ChatGPT refresh 规则；若有冲突，先更新 `design.md`、`specs/remote-skill-router-mcp/spec.md` 和本文件。
- [x] 0.2 [验证] `ai-plugins/skill-registry.json` - 运行既有 generator `-Check` 并抽查 roots、schemaVersion、entry 与 `SKILL.md`，确认 registry 是可消费前置契约；失败时创建独立 release/registry change，不在本 change 偷改 generator。
- [x] 0.3 [验证] `packages/skill-router-mcp/package.json` - 创建前检查 package 不存在、`pnpm-workspace.yaml` 覆盖 `packages/*`、根 Vitest 保持 3.x，以及现有 CI/workflow 的 path filter 与发布 authority；将发现摘要写入 `agent-findings.md`。
- [x] 0.4 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp00-compatibility-and-prerequisite-audit.md` - 保存官方链接、实际版本、registry check 输出摘要、确定的 package/CI 落点和未验证外部权限；不得写入 secret。
- [x] 0.5 [验证] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/tasks.md` - 在 CP-00 证据完成后运行 `openspec validate make-skill-router-mcp-for-chatgpt-web --strict`，只有工件与当前事实一致才允许开始 CP-01。
- [x] 0.6 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-source-context-index.md` - 建立原始 prompt 目录的完整文件索引、强制阅读顺序、task 到主题文件映射和冲突处理规则；恢复时先读取该索引，不得把 OpenSpec spec 当成原始约束的完整副本。

## 1. CP-01：试点批次（Pilot Batch）——最小兼容 MCP Runtime

> 目的：以最小 package、SDK identity 和外部客户端 contract 证明当前兼容路径可在目标工程中成立，避免在 SourceSnapshot/tool 业务实现前押注错误 adapter。完成标准：最小 `get_server_info` 通过 Node contract 与所选 MCP SDK 的 initialization/tools discovery；不接触真实 GitHub 或 Cloudflare production。

- [x] 1.1 [新增] `packages/skill-router-mcp/package.json` - 定义独立名称、SemVer、Nitro、实施日 OpenAI-compatible MCP SDK、zod、wrangler 与 package-local test scripts；保持根 Vitest 3.x 不变，并由 lockfile 固化精确依赖。
- [x] 1.2 [新增] `packages/skill-router-mcp/tsconfig.json` - 建立符合仓库 TypeScript 基线的严格编译、路径和产物配置；禁止把 Worker runtime 当 Node-only 程序配置。
- [x] 1.3 [新增] `packages/skill-router-mcp/mcp/tool-definitions.ts` - 声明四个只读核心 tool 的唯一 typed metadata/source，至少能为 SDK 注册、`tools/list` 期望目录与 `get_server_info` 摘要投影服务。
- [x] 1.4 [新增] `packages/skill-router-mcp/mcp/create-server.ts` - 用 package.json 的唯一 SemVer 创建 `McpServer` 并从 `toolDefinitions` 注册最小可调用 handler；不手写 JSON-RPC lifecycle。
- [x] 1.5 [新增] `packages/skill-router-mcp/tests/mcp-server.test.ts` - 使用与生产锁定相同 SDK 的 client/contract test 验证 initialization identity、tools/list 与 canonical definition 一致，并覆盖两个客户端并发/多次 POST 不共享 transport 或 `McpServer` 状态；先确认失败，再让实现通过。
- [x] 1.6 [验证] `packages/skill-router-mcp/package.json` - 运行本 package 的 typecheck、定向 MCP contract test 与 lockfile 版本检查；记录上游 v2 与 OpenAI 当前 v1 baseline 的差异，失败证据写入 `agent-findings.md`，通过后才勾选试点内任务。
- [x] 1.7 [验证] `packages/skill-router-mcp/server/api/mcp.post.ts` 与 MCP transport 配置 - 在 Inspector/最小客户端中确认 stateless、JSON response、session ID 选项以及 POST-only 是否满足当前 ChatGPT/Inspector；若需要 GET/DELETE/SSE，再追加对应 route 与测试任务，不凭文件命名预设协议动词。

## 2. CP-02：Runtime 元数据、GitHub SourceSnapshot 与 Skill tools

> 前置：CP-01 全部通过。完成标准：每一条读取路径均能用 fake transport 证明 exact-SHA 一致、pin 不重新解析 branch、错误无敏感信息；未接入真实 Cloudflare/ChatGPT 账号。

- [x] 2.1 [新增] `packages/skill-router-mcp/runtime/build-info.generated.ts` - 提供构建期注入的 build Git SHA 导出与测试可替换输入；运行时不得读取 Git 或工作区 filesystem 推断版本。
- [x] 2.2 [新增] `packages/skill-router-mcp/runtime/deployment-info.ts` - 将 `CF_VERSION_METADATA` 转换为安全的 Worker ID/tag/timestamp 与 build SHA；不把它与 MCP SemVer 或 source commit 混用。
- [x] 2.3 [新增] `packages/skill-router-mcp/runtime/bindings.ts` - 以实施时 Nitro v3 Cloudflare request runtime API 提取 public source vars、secret 和 version metadata，并只向 repository adapter 暴露 token。
- [x] 2.4 [新增] `packages/skill-router-mcp/repositories/github-skill-source.ts` - 实现 configured owner/repo 的 ref resolve、exact SHA 内容读取、GitHub HTTP 错误映射及 token-only auth boundary；禁止 caller 覆盖 source repository。
- [x] 2.5 [新增] `packages/skill-router-mcp/services/source-snapshot.ts` - 实现 unpinned resolve-once 和 pinned validate-only 的 request-local SourceSnapshot，向下游只暴露 exact SHA。
- [x] 2.6 [新增] `packages/skill-router-mcp/services/skill-registry.ts` - 校验 registry v1、全局唯一 id 和安全 POSIX entry；在 registry 缺失、不支持或 entry 无效时返回领域错误而不 fallback 全仓扫描。
- [x] 2.7 [新增] `packages/skill-router-mcp/services/skill-search.ts` - 对 registry 的 id/name/description/plugin 实现标准化关键词匹配和稳定排序；不读取每个 `SKILL.md`，不引入 vector/database。
- [x] 2.8 [新增] `packages/skill-router-mcp/services/skill-router.ts` - 编排 list/search/load，保证 registry、selected `SKILL.md` 与按需关联文件使用同一个 snapshot，并拒绝选中 Skill 根目录外路径。
- [x] 2.9 [新增] `packages/skill-router-mcp/mcp/tools/get-server-info.ts` - 返回安全 server/deployment/source/registry/tool metadata，且不解析 GitHub HEAD、不读取 token。
- [x] 2.10 [新增] `packages/skill-router-mcp/mcp/tools/list-skills.ts` - 基于单次 SourceSnapshot 返回 registry summaries 与 `sourceCommitSha`。
- [x] 2.11 [新增] `packages/skill-router-mcp/mcp/tools/search-skills.ts` - 返回确定性 search candidates 与 `sourceCommitSha`，并保留 empty-query/no-match 的安全输入错误。
- [x] 2.12 [新增] `packages/skill-router-mcp/mcp/tools/load-skill.ts` - 支持 latest 与可选 sourceCommitSha pin，并只从 configured repository 的同一 SHA 返回 Skill content/metadata。
- [x] 2.13 [修改] `packages/skill-router-mcp/mcp/tool-definitions.ts` - 将四个真实 handler、schema 与准确只读 annotation 接入 canonical registry；禁止另建手写 tools array。
- [x] 2.14 [新增] `packages/skill-router-mcp/tests/source-snapshot.test.ts` - 覆盖 resolve A 后 branch 变 B 仍读 A、pinned A 不 resolve mutable ref、next unpinned call 可读 B，以及 owner/repo 不可覆盖。
- [x] 2.15 [新增] `packages/skill-router-mcp/tests/skill-registry.test.ts` - 覆盖 schema、duplicate id、非法 entry、missing registry、unsupported schema 和 v1 不依赖 deep-file list。
- [x] 2.16 [新增] `packages/skill-router-mcp/tests/skill-router.test.ts` - 用 fake GitHub transport 覆盖 list/search/load、pinned search-to-load、非法路径、unknown skill、401/403/404/rate limit，断言 token/authorization 不出现在错误中。
- [x] 2.17 [新增] `packages/skill-router-mcp/tests/server-info.test.ts` - 验证 package SemVer、build info、Worker metadata 与 canonical tool summary 一致，并断言诊断调用不访问 GitHub source。

## 3. CP-03：Nitro/Worker adapter 与生产构建闭环

> 前置：CP-02 单元测试通过。完成标准：从外部 HTTP/MCP client 验证最终 Nitro Cloudflare build 产物；测试仍使用 mock GitHub，不把本地 fixture 误报为 production 版本。

- [x] 3.1 [新增] `packages/skill-router-mcp/nitro.config.ts` - 配置 Nitro v3 Cloudflare preset、routes/build 输出与 build-time SHA 注入，不在此文件管理 Cloudflare secret、domain 或 storage lifecycle。
- [x] 3.2 [新增] `packages/skill-router-mcp/server/api/mcp.post.ts` - 实现 thin request/runtime-context 到当前 MCP SDK Streamable HTTP transport 的适配，允许 SDK 自身维持协议合规所需 transport/session 生命周期，但禁止自定义 Skill snapshot server session、search 逻辑或 Authorization header。
- [x] 3.3 [新增] `packages/skill-router-mcp/server/api/health.get.ts` - 返回只读、安全的应用/部署诊断信息，复用 `DeploymentInfo` 和 build info，不返回 raw env。
- [x] 3.4 [新增] `packages/skill-router-mcp/wrangler.toml` - 声明 Worker name、compatibility date、public GitHub source vars 与 `CF_VERSION_METADATA` binding，并为匿名端点设置可验证的请求/响应边界；不提交 `GITHUB_TOKEN`、KV/R2/D1/DO binding 或假定 domain credentials。
- [x] 3.5 [新增] `packages/skill-router-mcp/vitest.unit.config.ts` - 将 pure Node unit tests 与 Worker runtime 分开执行，固定 package-local test 环境。
- [x] 3.6 [新增] `packages/skill-router-mcp/vitest.worker.config.ts` - 配置与 package-local Vitest 兼容的 `@cloudflare/vitest-pool-workers`/workerd 项目，不叠加 Node runner 伪造 Worker 语义。
- [x] 3.7 [新增] `packages/skill-router-mcp/vitest.integration.config.ts` - 配置 Nitro Cloudflare production build 与 Wrangler `createTestHarness()` 的外部 HTTP/MCP contract 测试。
- [x] 3.8 [新增] `packages/skill-router-mcp/tests/worker-runtime.test.ts` - 验证 bindings 提取、`CF_VERSION_METADATA`、MCP endpoint initialization、malformed request 与只读安全边界在 workerd 中成立，并覆盖多请求/并发下 transport 与 server 实例不跨客户端泄露状态。
- [x] 3.9 [新增] `packages/skill-router-mcp/tests/production-harness.test.ts` - 从外部 client 覆盖 health、initialize、tools/list、get_server_info、list/search/load latest+pin 与典型错误路径，并使用 mock GitHub transport。
- [x] 3.10 [修改] `packages/skill-router-mcp/package.json` - 接入 `test:unit`、`test:worker`、`test:integration`、`test:all`、typecheck、build 和本地 wrangler scripts；每个脚本可在 Windows PowerShell 无交互执行。

## 4. CP-04：CI、运行手册与候选版本发布

> 前置：CP-03 自动化验证全绿。完成标准：代码和文档明确单一生产部署 authority、Skill-only 排除和 candidate -> exact promote -> smoke 流程；候选部署只在账户/权限真实可用时执行。

- [x] 4.1 [新增] `packages/skill-router-mcp/README.md` - 说明本地运行、必需 vars/secret、测试命令、MCP/Worker/Skill 三种版本含义、Skill-only 不部署 Worker、Tool Contract 变更的 ChatGPT gate 与安全边界。
- [x] 4.2 [新增] `packages/skill-router-mcp/.dev.vars.example` - 提供无 secret 的本地 binding 模板与 `GITHUB_TOKEN` 获取方式说明；实际 `.dev.vars` 必须被 gitignore 且不纳入 commit。
- [x] 4.3 [新增] `.github/workflows/skill-router-mcp.yml` - 如保留 GitHub workflow，仅为 package runtime/config/build inputs 建立无部署权限的 typecheck、unit、workerd 与 production harness 检查；明确排除仅 `ai-plugins/**` 与普通 docs 变更，不执行 Wrangler deploy/promotion，不保存 Cloudflare production credentials，避免与 Cloudflare Git Integration 形成双部署。
- [x] 4.4 [新增] `packages/skill-router-mcp/scripts/smoke-mcp.ts` - 实现对给定 HTTPS endpoint 的只读 smoke：health、initialize、tools/list、get_server_info、known-skill search、pinned load，并精确断言 MCP SemVer/Worker metadata/build SHA。
- [x] 4.5 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp04-candidate-release.md` - 在 Cloudflare Workers Builds Git Integration 产生真实 candidate build/preview 后记录 immutable Worker ID/tag、Preview URL、执行的 smoke、预期和实际版本；无 Cloudflare 权限时记录阻断原因，不伪造结果。
- [x] 4.6 [验证] `packages/skill-router-mcp/wrangler.toml` 与 Cloudflare Builds 配置 - 以 Cloudflare Git Integration 作为唯一 production deploy authority，root directory 使用仓库根目录；核对 Wrangler build/deploy/preview 配置、`GITHUB_TOKEN` secret 配置、Build Watch Paths（包含 `packages/skill-router-mcp/**`、`pnpm-lock.yaml`、`pnpm-workspace.yaml` 与必要共享配置，排除 `ai-plugins/**` 与普通 docs），并将实际 dashboard/命令证据写入 CP-04 evidence。
- [x] 4.7 [验证] `packages/skill-router-mcp/scripts/smoke-mcp.ts` - 对 candidate Preview URL 运行 smoke，只有 health、MCP 初始化、tools/list、server info、known Skill search 和 pinned load 均通过才能进入 production promote。
- [x] 4.8 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp04-cloudflare-builds-config.md` - 保存 Cloudflare Workers Builds Git Integration 的仓库、root directory、build/deploy/preview 命令、include/exclude watch paths、secret 配置与“GitHub Actions 不负责生产部署”的确认；不得写入 secret。

## 5. CP-05：生产、ChatGPT Web 与回滚证据

> 前置：CP-04 candidate smoke 已记录成功。完成标准：生产使用已验证的 exact Worker version；若本次 tool contract 变化，ChatGPT Developer Mode refresh/rescan、用例和适用的 Workspace 审核均有真实证据。任何缺少账号权限的外部 task 保持未完成。

- [x] 5.1 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp05-production-smoke.md` - 在 exact candidate promote 后记录 production endpoint、MCP SemVer、Worker ID/tag、build SHA、health 和只读 smoke 输出摘要及已知 rollback target。
- [x] 5.2 [验证] `packages/skill-router-mcp/scripts/smoke-mcp.ts` - 对 active production endpoint 运行只读 smoke，确认线上 metadata 与 candidate evidence 的 exact Worker version 相同；失败时不勾选 production task，先按记录的 stable version 回滚。
- [x] 5.3 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp05-chatgpt-developer-mode.md` - 在 ChatGPT Web Developer Mode 中保存实际连接、`get_server_info` 和 search->pinned-load 用例证据；无权限时仅记录阻断与所需授权。
- [x] 5.4 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp05-tool-contract-review.md` - 当 tool name/schema/description/annotation 有变化时，记录 Inspector、Developer Mode refresh/rescan、重新评估及适用 Workspace review/publish；没有变化时记录差异审计和不需要该 gate 的证据。
- [x] 5.5 [新增] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/evidence/2026-08-13-cp05-rollback-exercise.md` - 在预发或获准窗口记录一次 stable Worker rollback 和 health/initialize/tools/server-info 复验；Skill 内容故障必须另以 Git revert/fix 验证，不能误用 Worker rollback。
- [x] 5.6 [验证] `openspec/changes/make-skill-router-mcp-for-chatgpt-web/tasks.md` - 全部计划任务完成后运行 strict validation、全量 package tests/typecheck/build、registry check、workflow contract 检查与 scope-only git diff review；仅在外部证据齐备或显式标记的非自动项均获得处理后勾选最终 checkpoint。

## 动态补全规则

- 实施、复核或验证发现同一能力缺漏时，先在本文件相应 checkpoint 追加精确的 `[新增]`、`[修改]`、`[删除]` 或 `[验证]` 文件级任务，再运行 `openspec validate make-skill-router-mcp-for-chatgpt-web --strict`。
- 改变用户可见行为先更新 `specs/remote-skill-router-mcp/spec.md`；改变技术路线先更新 `design.md`；超出本 change 的 registry generator、Skill 发布或无关 monorepo 升级另开 change。
- 详细官方阅读、命令输出、preview/production/ChatGPT 证据只能保存为本文件引用的 `evidence/YYYY-MM-DD-*.md`；根目录的 `agent-progress.md`、`agent-findings.md` 只保留摘要和索引。
