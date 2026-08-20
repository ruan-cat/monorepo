# 2026-08-13 原始 Skill Router MCP 约束源索引

## 1. 权威层级

1. 当前用户在本会话中明确确认的决策，优先于旧 prompt 中尚未确认或已被否定的选择。
2. 详细业务、技术、测试、部署和验收约束：
   `docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/`
3. 当前 OpenSpec 工件：`proposal.md`、`design.md`、`specs/*/spec.md`、`tasks.md`。它们是经过整理的执行契约；`tasks.md` 是唯一任务源，但不是原始 prompt 的完整替代。
4. 实施当日官方资料和真实外部系统状态，用于覆盖会漂移的 SDK、ChatGPT、Cloudflare 和 Wrangler 事实；证据必须回写 change 的 `evidence/`。

发生冲突时，先记录来源、冲突内容和选择理由，再更新 OpenSpec 工件；禁止静默选择或只凭聊天记忆继续。

## 2. 每次恢复的最小读取顺序

1. `README.md`：产品目标、核心决策、官方强制阅读顺序和三类 freshness。
2. `ai-agent-implementation-plan.md`：阶段顺序、禁止项、推荐编码顺序和发布 gates。
3. 当前 change 的 `agent-progress.md`、`agent-findings.md`、`proposal.md`、`design.md`、`specs/remote-skill-router-mcp/spec.md`、`tasks.md`。
4. 按当前 task 对照下表读取主题文件；若 task 涉及多个主题，全部读取，不以 OpenSpec 摘要代替原文。

## 3. 原始 prompt 目录完整文件清单

### 总体目标、执行与交接

- `README.md`
- `ai-agent-implementation-plan.md`
- `agent-execution-guide.md`
- `agent-handoff-checklist.md`

### 架构、实现与协议

- `architecture.md`
- `implementation-spec.md`
- `mcp-server-framework-selection.md`
- `mcp-protocol-design.md`
- `mcp-client-validation-guide.md`
- `chatgpt-web-mcp-compatibility-profile.md`

### Skill、Registry 与高频更新

- `high-frequency-skill-churn-strategy.md`
- `skill-registry-schema.md`
- `release-ai-plugins-registry-integration.md`

### Nitro、Runtime、依赖与安全

- `nitro-v3-development-guide.md`
- `nitro-v3-cloudflare-integration.md`
- `runtime-binding-contract.md`
- `runtime-dependency-version-policy.md`
- `security-model.md`

### Cloudflare 部署与发布维护

- `cloudflare-worker-deployment.md`
- `cloudflare-worker-production-testing-strategy.md`
- `deployment-runbook.md`
- `mcp-release-versioning-and-production-maintenance.md`
- `cloudflare-ai-gateway-strategy.md`

### 测试

- `vitest-development-testing-strategy.md`
- `testing-plan.md`

当前索引覆盖目录中的全部 25 个 Markdown 文件。若 `rg --files docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web` 发现新增文件，必须先把它加入本索引，再继续实现。

## 4. Task 到主题文件映射

| Task 范围                               | 恢复时必须读取的原始文件                                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CP-00 / 兼容基线                        | `README.md`、`ai-agent-implementation-plan.md`、`chatgpt-web-mcp-compatibility-profile.md`、`mcp-server-framework-selection.md`、`mcp-client-validation-guide.md`                                                                      |
| CP-01 / 最小 Runtime 与 SDK             | `architecture.md`、`implementation-spec.md`、`mcp-server-framework-selection.md`、`mcp-protocol-design.md`、`nitro-v3-development-guide.md`、`runtime-dependency-version-policy.md`                                                    |
| CP-02 / SourceSnapshot、Registry、tools | `high-frequency-skill-churn-strategy.md`、`skill-registry-schema.md`、`release-ai-plugins-registry-integration.md`、`implementation-spec.md`、`mcp-protocol-design.md`、`security-model.md`                                            |
| CP-03 / Nitro、workerd、构建            | `nitro-v3-development-guide.md`、`nitro-v3-cloudflare-integration.md`、`runtime-binding-contract.md`、`vitest-development-testing-strategy.md`、`testing-plan.md`                                                                      |
| CP-04 / CI、Cloudflare candidate        | `cloudflare-worker-deployment.md`、`cloudflare-worker-production-testing-strategy.md`、`deployment-runbook.md`、`mcp-release-versioning-and-production-maintenance.md`、`agent-execution-guide.md`、`agent-handoff-checklist.md`       |
| CP-05 / ChatGPT、生产、回滚             | `chatgpt-web-mcp-compatibility-profile.md`、`mcp-client-validation-guide.md`、`cloudflare-worker-production-testing-strategy.md`、`deployment-runbook.md`、`mcp-release-versioning-and-production-maintenance.md`、`security-model.md` |

## 5. 明确排除但仍需保留的边界

- `cloudflare-ai-gateway-strategy.md` 明确 MVP 不使用 AI Gateway；除非用户另开需求，不得因为看到该文件就新增 AI Gateway 链路。
- `../2026-8-12-release-ai-plugins-add-skill-registry-json-for-MCP/` 是 registry generator/release-side 的独立 change 上下文；本 change 只消费其已生成契约，若需修改 generator 必须另开 change。
- OpenSpec `spec.md` 中已确认的匿名只读、Cloudflare Git Integration 单一生产 authority、仓库根目录 root directory 和 Build Watch Paths，是本会话对原始方案的明确收敛，后续实现按这些用户确认执行。
