# use-memorix 3.0 重构与发布实施计划

> **状态：已实施，本文已按 as-built 修订（2026-11-19）。** 复核或复用本计划时，以下约束以本修订为准：
>
> 1. cutover 提交粒度由「单笔原子提交」改为**按逻辑域拆分的 14 笔序列**；序列 tip 即 `CUTOVER_SHA`，
>    拆分前后最终树逐字节一致（`git diff <new-tip> <old-tip>` 为空）。
> 2. GitHub Actions 的 `shell` 字段**不接受** `matrix` 表达式；双 PowerShell 必须是两个显式 job。
> 3. `skill-transitions.ps1` 必须以 **UTF-8 BOM** 保存，并由 `PS-01` 断言锁定两个 `.ps1` 的 BOM。
> 4. 最终 `git diff --check` 段在 PS 5.1 下临时切 `$ErrorActionPreference = "Continue"`，只按退出码判定。
> 5. `SCOPE-04` 只对**新增行**告警；HEAD 已存在的历史主机路径行按基线精确豁免。
> 6. characterization 基线解析顺序：`PRE_CUTOVER_SHA` → `HEAD` → 「删除提交的父提交」。
> 7. 实际发布日为 2026-11-19；三平台 smoke 结果见 `handoff.md`。

> **For agentic workers：REQUIRED SUB-SKILL：** 使用 `superpowers:subagent-driven-development`（推荐）或
> `superpowers:executing-plans` 逐任务实施。失败定位使用 `superpowers:systematic-debugging`；完成前使用
> `superpowers:verification-before-completion`。只有用户明确授权，才允许 Apply、插件安装/卸载、提交与 push。

**Goal：** 将 `init-simple-memorix` 原子硬切为 common-tools 中的 `use-memorix` 3.0.0，保全旧能力，补齐记忆治理、黄金集与检索捕获，并以三个插件 14.0.0 和真实 Claude/Cursor/Codex 插件 smoke 完成发布闭环。

**Architecture：** `use-memorix/SKILL.md` 只做七域路由。项目黄金集是产品项目 canonical；自动/交互入口只写 ignored
candidate，accept 前必须 one-shot CLI 复跑。skill tree、versions、docs、manifest、CHANGELOG 与 registry 通过
**一组细粒度 cutover 提交**发布，每笔单一职责，序列最终树一致。

**Tech Stack：** Markdown/YAML、TypeScript/tsx、Node.js ESM、Vitest 4、严格 TypeScript、PowerShell 5.1/7、Bash、JSON/TOML、Prettier experimental CLI、Vercel `skills` CLI、Claude/Cursor/Codex 插件系统、Memorix CLI/MCP、Skill Router MCP。

**Spec：** `docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/spec.md`

## Global Constraints

- 硬切 `init-simple-memorix` → `use-memorix`，不保留兼容 skill、stub、导航壳或双 registry id。
- `use-memorix` 固定 `3.0.0`；三个插件固定 `14.0.0`。
- 三套 install-mcp 入口原样迁移，characterization 先行，不统一历史差异。
- 读自动、写确认；setup、probe、archive、cleanup、VACUUM、配置/索引修复、dashboard 启动、embedding 修复都确认。
- archive 只接受官方 archive-candidate 或明确 successor；弱信号不足；快照/预演后授权；优先 archived。
- 官方七个 `memorix-*` skills 保持可见，由官方 setup/升级拥有；同步器只读审计。
- WorkBuddy 无 hook；ZCode 是唯一自动 hook；其他 host 仅使用 `capture-interactive.mjs`。
- hook 只读 structuredContent、纯本地、fail-open、warm P95 `<100ms`，不调用 Memorix、不跑 shell、不联网、不起后台。
- 未审核 query 只存脱敏原文，top-N 只存元数据；accepted 前 CLI 复跑；联邦导出显式授权。
- `init-ai-md` 模板 12 不进入多选，每次强制增量补全并保护自定义。
- 测试必须通过 `tests/vitest.config.ts` 发现，根执行显式 `--reporter=default`。
- `pnpm run typecheck:ai-plugins` 只表示宽松配置可解析；严格类型门是 `ai-plugins/tsconfig.use-memorix.json`。
- Skill Router 只用 `pnpm --dir packages/skill-router-mcp run test:unit`。
- PowerShell transition tests 必须在 Windows PowerShell 5.1 与 PowerShell 7 CI 都通过。
- reviewer 生成且 ignored 的 `.vitest-reporter-html/` 不清理、不纳入状态 allowlist。
- 提交前记录 `PRE_CUTOVER_SHA`，提交后记录序列 tip 的 `CUTOVER_SHA`；回滚使用区间
  `git revert --no-commit <PRE_CUTOVER_SHA>..<CUTOVER_SHA>`，不逐笔挑拣。
- 所有 `.ps1` 必须带 UTF-8 BOM；PS 5.1 在 CI 会按 ANSI 解码无 BOM 文件，中文文本会被撕裂。
- 原生命令的退出码判定不得依赖 `$ErrorActionPreference = "Stop"`；stderr 警告应局部切 `Continue`。
- Claude、Cursor、Codex 必须做真实插件 smoke；任一环境不可用就标记 BLOCKED，不能用静态 JSON 或 `skills add` 替代。
- Task 12 的 `handoff.md` 回填是 cutover 后唯一允许的仓库修改。

## Review Focus

1. 三入口的候选路径、状态词、BOM、jq/no-jq 和行尾差异不得被统一。
2. structuredContent 缺字段时精确禁用对应规则；不得解析自然语言 content。
3. `.zcode/config.json`、`.gitignore`、AGENTS 自定义字段只能定点补全。
4. candidateId、signals 顺序、enabled/disabled 分区、时间和 GitHub identity 必须由 validator 重算/验证。
5. 一组 cutover 提交的每个中间工作树状态可以 dirty，但序列完成后 registry、版本和 active docs 必须一致；三平台 smoke 失败时发布状态保持 BLOCKED。

---

## 精确文件清单

### Create

```text
ai-plugins/tsconfig.use-memorix.json
ai-plugins/common-tools/skills/use-memorix/SKILL.md
ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.ps1
ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.sh
ai-plugins/common-tools/skills/use-memorix/references/setup-and-hooks.md
ai-plugins/common-tools/skills/use-memorix/references/platform-and-mcp.md
ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md
ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md
ai-plugins/common-tools/skills/use-memorix/references/retention-and-archive.md
ai-plugins/common-tools/skills/use-memorix/references/health-and-storage.md
ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md
ai-plugins/common-tools/skills/use-memorix/scripts/install-mcp.ts
ai-plugins/common-tools/skills/use-memorix/scripts/golden-set-operator.mjs
ai-plugins/common-tools/skills/use-memorix/scripts/install-zcode-hook.mjs
ai-plugins/common-tools/skills/use-memorix/scripts/capture-interactive.mjs
ai-plugins/common-tools/skills/use-memorix/scripts/zcode-retrieval-capture.mjs
ai-plugins/common-tools/skills/use-memorix/src/install-mcp.ts
ai-plugins/common-tools/skills/use-memorix/src/platforms.ts
ai-plugins/common-tools/skills/use-memorix/src/golden-set/contracts.mjs
ai-plugins/common-tools/skills/use-memorix/src/golden-set/redaction.mjs
ai-plugins/common-tools/skills/use-memorix/src/golden-set/capture.mjs
ai-plugins/common-tools/skills/use-memorix/src/golden-set/operator.mjs
ai-plugins/common-tools/skills/use-memorix/src/golden-set/zcode-install.mjs
ai-plugins/common-tools/skills/use-memorix/templates/golden-set/README.md
ai-plugins/common-tools/skills/use-memorix/templates/golden-set/cases.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks/antigravity.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks/claude-code.settings.local.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks/cursor.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks/gemini-cli.settings.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks/kiro.memorix-file-save.kiro.hook
ai-plugins/common-tools/skills/use-memorix/templates/hooks/windsurf.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/antigravity.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/claude.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/codex.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/cursor.hooks.json
ai-plugins/common-tools/skills/use-memorix/templates/zcode/config.fragment.json
ai-plugins/common-tools/skills/use-memorix/templates/zcode/retrieval-capture-launcher.mjs
ai-plugins/common-tools/skills/init-ai-md/templates/12.memorix-memory-governance.md
ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/audit-memorix-skills.ts
ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts
ai-plugins/common-tools/skills/release-ai-plugins/scripts/skill-transitions.ps1
tests/use-memorix/cutover-scope.mjs
tests/use-memorix/commands/task-01.txt
tests/use-memorix/commands/task-02.txt
tests/use-memorix/commands/task-03.txt
tests/use-memorix/commands/task-04.txt
tests/use-memorix/commands/task-05.txt
tests/use-memorix/commands/task-06.txt
tests/use-memorix/commands/task-07.txt
tests/use-memorix/commands/task-08.txt
tests/use-memorix/commands/task-09.txt
tests/use-memorix/commands/task-10.txt
tests/use-memorix/commands/task-11.txt
tests/use-memorix/commands/task-12.txt
tests/use-memorix/scope-gate.test.ts
tests/use-memorix/install-mcp.test.ts
tests/use-memorix/capability-matrix.test.ts
tests/use-memorix/golden-set-contracts.test.ts
tests/use-memorix/retrieval-capture.test.ts
tests/use-memorix/zcode-install-operator.test.ts
tests/use-memorix/release-surface.test.ts
tests/init-ai-md/memorix-governance.test.ts
tests/release-ai-plugins/skill-transitions.test.ts
```

### Delete

```text
ai-plugins/low-frequency-skill/skills/init-simple-memorix/SKILL.md
ai-plugins/low-frequency-skill/skills/init-simple-memorix/fallback/install-mcp.ps1
ai-plugins/low-frequency-skill/skills/init-simple-memorix/fallback/install-mcp.sh
ai-plugins/low-frequency-skill/skills/init-simple-memorix/references/hooks-reference.md
ai-plugins/low-frequency-skill/skills/init-simple-memorix/references/memorix-setup-notes.md
ai-plugins/low-frequency-skill/skills/init-simple-memorix/references/workbuddy-mcp-notes.md
ai-plugins/low-frequency-skill/skills/init-simple-memorix/scripts/install-mcp.ts
ai-plugins/low-frequency-skill/skills/init-simple-memorix/src/install-mcp.ts
ai-plugins/low-frequency-skill/skills/init-simple-memorix/src/platforms.ts
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates-global/antigravity.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates-global/claude.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates-global/codex.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates-global/cursor.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/antigravity.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/claude-code.settings.local.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/cursor.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/gemini-cli.settings.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/kiro.memorix-file-save.kiro.hook
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/windsurf.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/workbuddy.hooks.json
ai-plugins/low-frequency-skill/skills/init-simple-memorix/templates/zcode.config.json
ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts
ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts
tests/init-simple-memorix/install-mcp.test.ts
```

### Modify（现有文件与真实行范围）

```text
tests/vitest.config.ts:15-21
ai-plugins/common-tools/skills/init-ai-md/SKILL.md:62-167,263-310,330-378
ai-plugins/common-tools/skills/init-ai-md/references/execution-examples.md:19-50,72-87
ai-plugins/common-tools/skills/init-ai-md/references/step-details.md:82-106
ai-plugins/common-tools/skills/install-mcp/SKILL.md:16,136-142
ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md:23-78,81-95,123-184
ai-plugins/common-tools/skills/release-ai-plugins/README.md:1-45
ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md:2-96,97-144
ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1:59-69,103-241,305-330,385-470,585-669
ai-plugins/common-tools/skills/sync-local-global-agents-skills/SKILL.md:35-41,65-133
ai-plugins/common-tools/skills/sync-local-global-agents-skills/README.md:13-54
ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts:6-49,61-145
ai-plugins/common-tools/README.md:4-17
ai-plugins/dev-skills/README.md:4-16
ai-plugins/low-frequency-skill/README.md:1-22
ai-plugins/docs/README.md:4-37
ai-plugins/docs/use-vercel-skills-install.md:34-87
README.md:121-131
.claude-plugin/README.md:6-50
.cursor-plugin/README.md:4-25
.agents/plugins/README.md:10-50
ai-plugins/common-tools/CHANGELOG.md:1-30
ai-plugins/dev-skills/CHANGELOG.md:1-30
ai-plugins/low-frequency-skill/CHANGELOG.md:1-33
.claude-plugin/marketplace.json:10-52
.cursor-plugin/marketplace.json:8-31
.agents/plugins/marketplace.json:1-44
ai-plugins/common-tools/.claude-plugin/plugin.json:1-13
ai-plugins/common-tools/.cursor-plugin/plugin.json:1-16
ai-plugins/common-tools/.codex-plugin/plugin.json:1-29
ai-plugins/dev-skills/.claude-plugin/plugin.json:1-11
ai-plugins/dev-skills/.cursor-plugin/plugin.json:1-13
ai-plugins/dev-skills/.codex-plugin/plugin.json:1-26
ai-plugins/low-frequency-skill/.claude-plugin/plugin.json:1-11
ai-plugins/low-frequency-skill/.cursor-plugin/plugin.json:1-13
ai-plugins/low-frequency-skill/.codex-plugin/plugin.json:1-26
ai-plugins/skill-registry.json:138-145
packages/skill-router-mcp/tests/real-skill-resources.test.ts:72-102
tests/sync-local-global-agents-skills/memorix.test.ts:1-320
tests/sync-local-global-agents-skills/sync.test.ts:1-213
.github/workflows/ai-plugins-skill-registry-check.yml:6-55
AGENTS.md:60-81
```

### Runtime-only handoff change

```text
docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/handoff.md
```

该文件先随 cutover 提交“未实施”版本；Task 12 只允许回填它，不得再修改其他仓库文件。

## 冻结接口

以下共享类型与 spec §13 的 `GoldenSetFile`、`GoldenSetCase`、`RetrievalCandidate`、`FederatedGoldenSetBundle` 合并为同一类型声明；不生成第二份 schema。

```ts
interface CaptureInput {
	host: RetrievalCandidate["host"];
	captureMode: RetrievalCandidate["captureMode"];
	sourceProject: string;
	toolName: string;
	query: string;
	capturedAt: string;
	normalized: NormalizedSearchResult;
}
interface InteractiveIo {
	now(): Date;
	readText(path: string): string;
	writeText(path: string, text: string): unknown;
	stdout(text: string): unknown;
}
interface FileWrite {
	path: string;
	content: string;
	before: string | null;
}
interface FilePlan {
	writes: FileWrite[];
	blocked: string[];
}
interface InstallPlan extends FilePlan {
	launcherOnly: boolean;
}
interface InitInput {
	projectRoot: string;
	repository: string;
}
interface AcceptInput {
	goldenSet: GoldenSetFile;
	candidate: Pick<RetrievalCandidate, "query" | "signals">;
	rerun: { query: string; structuredContent: unknown };
	expected: GoldenSetCase["expected"];
	id: string;
	capturedAt: string;
}
interface CleanupInput {
	now: string;
	candidates: Array<{ path: string; capturedAt: string }>;
}
interface CleanupPlan {
	remove: string[];
	keep: string[];
	requiresConfirmation: true;
}
interface ExportInput {
	goldenSet: GoldenSetFile;
	caseId: string;
	projectId: string;
	sourceCommit: string;
	exportedAt: string;
}
```

```js
export const GOLDEN_SET_CASE_SCHEMA_VERSION = "memorix-golden-set-case/v1";
export const RETRIEVAL_CANDIDATE_SCHEMA_VERSION = "memorix-retrieval-candidate/v1";
export const FEDERATION_BUNDLE_SCHEMA_VERSION = "memorix-golden-set-bundle/v1";
```

```ts
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };
export type FailureKind = "zero-candidate" | "fuzzy-only" | "fallback-generation";
export interface RedactionOptions {
	homeDir: string;
	projectRoot: string;
}
export function redactQuery(value: string, options: RedactionOptions): string;
export function computeCandidateId(sourceProject: string, captureDate: string, query: string): string;
export function validateGoldenSetFile(value: unknown): ValidationResult<unknown>;
export function validateRetrievalCandidate(value: unknown): ValidationResult<unknown>;
export function validateFederatedBundle(value: unknown): ValidationResult<unknown>;
export function normalizeStructuredSearchResult(value: unknown): NormalizedSearchResult;
export function classifyRetrievalFailure(value: NormalizedSearchResult): FailureKind[];
```

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

---

### Task 1：冻结测试发现、严格类型与工作树 allowlist

**Files：**

- Create：`ai-plugins/tsconfig.use-memorix.json`
- Create：`tests/use-memorix/cutover-scope.mjs`
- Create：`tests/use-memorix/scope-gate.test.ts`
- Modify：`tests/vitest.config.ts:15-21`

**Interfaces：**

- Produces：`CUTOVER_PATHS`、`BASELINE_PATHS`、`statusPaths()`、`unexpectedPaths()`、`writePathspec()`。
- Task 12 runtime mode 先记录 cutover 后干净状态；执行 smoke/cleanup 后只允许 handoff 出现新修改。
- `unexpectedPaths(cwd, "runtime")` 必须在 status 中忽略 `BASELINE_PATHS`，并只额外允许 handoff。

- [ ] **Step 1：写完整 scope helper**

创建 `tests/use-memorix/cutover-scope.mjs`：

```js
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const BASELINE_PATHS = ["docs/prompts/release-ai-plugins/02.md"];
export const RUNTIME_PATH = "docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/handoff.md";

export const CUTOVER_PATHS = [
	"ai-plugins/tsconfig.use-memorix.json",
	"ai-plugins/common-tools/skills/use-memorix/SKILL.md",
	"ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.ps1",
	"ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.sh",
	"ai-plugins/common-tools/skills/use-memorix/references/setup-and-hooks.md",
	"ai-plugins/common-tools/skills/use-memorix/references/platform-and-mcp.md",
	"ai-plugins/common-tools/skills/use-memorix/references/memory-operations.md",
	"ai-plugins/common-tools/skills/use-memorix/references/session-and-reasoning.md",
	"ai-plugins/common-tools/skills/use-memorix/references/retention-and-archive.md",
	"ai-plugins/common-tools/skills/use-memorix/references/health-and-storage.md",
	"ai-plugins/common-tools/skills/use-memorix/references/retrieval-and-golden-set.md",
	"ai-plugins/common-tools/skills/use-memorix/scripts/install-mcp.ts",
	"ai-plugins/common-tools/skills/use-memorix/scripts/golden-set-operator.mjs",
	"ai-plugins/common-tools/skills/use-memorix/scripts/install-zcode-hook.mjs",
	"ai-plugins/common-tools/skills/use-memorix/scripts/capture-interactive.mjs",
	"ai-plugins/common-tools/skills/use-memorix/scripts/zcode-retrieval-capture.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/install-mcp.ts",
	"ai-plugins/common-tools/skills/use-memorix/src/platforms.ts",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/contracts.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/redaction.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/capture.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/operator.mjs",
	"ai-plugins/common-tools/skills/use-memorix/src/golden-set/zcode-install.mjs",
	"ai-plugins/common-tools/skills/use-memorix/templates/golden-set/README.md",
	"ai-plugins/common-tools/skills/use-memorix/templates/golden-set/cases.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/antigravity.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/claude-code.settings.local.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/cursor.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/gemini-cli.settings.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/kiro.memorix-file-save.kiro.hook",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks/windsurf.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/antigravity.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/claude.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/codex.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/hooks-global/cursor.hooks.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/zcode/config.fragment.json",
	"ai-plugins/common-tools/skills/use-memorix/templates/zcode/retrieval-capture-launcher.mjs",
	"ai-plugins/common-tools/skills/init-ai-md/SKILL.md",
	"ai-plugins/common-tools/skills/init-ai-md/references/execution-examples.md",
	"ai-plugins/common-tools/skills/init-ai-md/references/step-details.md",
	"ai-plugins/common-tools/skills/init-ai-md/templates/12.memorix-memory-governance.md",
	"ai-plugins/common-tools/skills/install-mcp/SKILL.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/README.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md",
	"ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1",
	"ai-plugins/common-tools/skills/release-ai-plugins/scripts/skill-transitions.ps1",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/SKILL.md",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/README.md",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/audit-memorix-skills.ts",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts",
	"tests/vitest.config.ts",
	"tests/use-memorix/cutover-scope.mjs",
	...Array.from(
		{ length: 12 },
		(_, index) => `tests/use-memorix/commands/task-${String(index + 1).padStart(2, "0")}.txt`,
	),
	"tests/use-memorix/scope-gate.test.ts",
	"tests/use-memorix/install-mcp.test.ts",
	"tests/use-memorix/capability-matrix.test.ts",
	"tests/use-memorix/golden-set-contracts.test.ts",
	"tests/use-memorix/retrieval-capture.test.ts",
	"tests/use-memorix/zcode-install-operator.test.ts",
	"tests/use-memorix/release-surface.test.ts",
	"tests/init-ai-md/memorix-governance.test.ts",
	"tests/release-ai-plugins/skill-transitions.test.ts",
	"tests/sync-local-global-agents-skills/memorix.test.ts",
	"tests/sync-local-global-agents-skills/sync.test.ts",
	"ai-plugins/common-tools/README.md",
	"ai-plugins/dev-skills/README.md",
	"ai-plugins/low-frequency-skill/README.md",
	"ai-plugins/docs/README.md",
	"ai-plugins/docs/use-vercel-skills-install.md",
	"README.md",
	".claude-plugin/README.md",
	".cursor-plugin/README.md",
	".agents/plugins/README.md",
	"ai-plugins/common-tools/CHANGELOG.md",
	"ai-plugins/dev-skills/CHANGELOG.md",
	"ai-plugins/low-frequency-skill/CHANGELOG.md",
	".claude-plugin/marketplace.json",
	".cursor-plugin/marketplace.json",
	".agents/plugins/marketplace.json",
	...["common-tools", "dev-skills", "low-frequency-skill"].flatMap((plugin) =>
		["claude", "cursor", "codex"].map((host) => `ai-plugins/${plugin}/.${host}-plugin/plugin.json`),
	),
	"ai-plugins/skill-registry.json",
	"packages/skill-router-mcp/tests/real-skill-resources.test.ts",
	".github/workflows/ai-plugins-skill-registry-check.yml",
	"AGENTS.md",
	"docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/spec.md",
	"docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/plan.md",
	RUNTIME_PATH,
];

const oldRoot = "ai-plugins/low-frequency-skill/skills/init-simple-memorix/";
export const DELETE_PATHS = [
	...[
		"SKILL.md",
		"fallback/install-mcp.ps1",
		"fallback/install-mcp.sh",
		"references/hooks-reference.md",
		"references/memorix-setup-notes.md",
		"references/workbuddy-mcp-notes.md",
		"scripts/install-mcp.ts",
		"src/install-mcp.ts",
		"src/platforms.ts",
		"templates-global/antigravity.hooks.json",
		"templates-global/claude.hooks.json",
		"templates-global/codex.hooks.json",
		"templates-global/cursor.hooks.json",
		"templates/antigravity.hooks.json",
		"templates/claude-code.settings.local.json",
		"templates/cursor.hooks.json",
		"templates/gemini-cli.settings.json",
		"templates/kiro.memorix-file-save.kiro.hook",
		"templates/windsurf.hooks.json",
		"templates/workbuddy.hooks.json",
		"templates/zcode.config.json",
	].map((file) => oldRoot + file),
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/fetch-memorix-skills.ts",
	"ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix.ts",
	"tests/init-simple-memorix/install-mcp.test.ts",
];

function runGit(repoRoot, args) {
	const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
	if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
	return result.stdout;
}

export function parseStatus(raw) {
	const parts = raw.split("\0");
	const rows = [];
	for (let i = 0; i < parts.length; i++) {
		if (!parts[i]) continue;
		const xy = parts[i].slice(0, 2);
		const path = parts[i].slice(3);
		if (/[RC]/.test(xy)) throw new Error("rename-status-rejected: use --no-renames");
		rows.push({ xy, path });
	}
	return rows;
}
export function statusPaths(repoRoot) {
	return parseStatus(runGit(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all", "--no-renames", "-z"]));
}
export function unexpectedRows(rows, mode = "implementation") {
	return rows.filter(({ path, xy }) => {
		if (BASELINE_PATHS.includes(path)) return xy !== " M";
		if (mode === "runtime") return path !== RUNTIME_PATH || ![" M", "M "].includes(xy);
		if (DELETE_PATHS.includes(path)) return ![" D", "D "].includes(xy);
		return !CUTOVER_PATHS.includes(path) || !["??", " M", "M ", "A ", "AM"].includes(xy);
	});
}
export function unexpectedPaths(repoRoot, mode = "implementation") {
	return unexpectedRows(statusPaths(repoRoot), mode);
}
export function assertStagedEqual(rows, expected) {
	const actual = rows
		.filter(({ xy }) => xy[0] !== " " && xy !== "??")
		.map(({ path }) => path)
		.sort();
	if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) throw new Error("staged-set-mismatch");
	if (rows.some(({ path, xy }) => !BASELINE_PATHS.includes(path) && xy[1] !== " "))
		throw new Error("unstaged-cutover-change");
}
export function writePathspec(cwd) {
	const rows = statusPaths(cwd);
	if (unexpectedRows(rows).length) throw new Error("unexpected-status");
	const changed = rows.filter(({ path }) => !BASELINE_PATHS.includes(path)).map(({ path }) => path);
	for (const path of DELETE_PATHS) {
		if (!changed.includes(path)) throw new Error(`missing-required-deletion: ${path}`);
	}
	const target = resolve(cwd, ".git/use-memorix-cutover.pathspec");
	writeFileSync(target, `${changed.join("\0")}\0`, "utf8");
	return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [action = "verify", mode = "implementation"] = process.argv.slice(2);
	const cwd = process.cwd();
	if (action === "pathspec") console.log(writePathspec(cwd));
	else if (action === "staged") {
		const expected = readFileSync(resolve(cwd, ".git/use-memorix-cutover.pathspec"), "utf8")
			.split("\0")
			.filter(Boolean);
		assertStagedEqual(statusPaths(cwd), expected);
		console.log("staged-equal");
	} else {
		const unexpected = unexpectedPaths(cwd, mode);
		if (unexpected.length) throw new Error(JSON.stringify(unexpected));
		console.log("scope-ok");
	}
}
```

注：allowlist 逐文件精确匹配，保留 porcelain XY。24 个精确删除路径只接受 `D`/`D`；runtime 不使用删除放行。pathspec 冻结全部实际预期变更（含 24 项删除），暂存后 `staged` 命令要求实际集合与冻结集合相等并拒绝残留未暂存改动。

- [ ] **Step 2：写完整 scope/config test**

创建 `tests/use-memorix/scope-gate.test.ts`：

```ts
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { CUTOVER_PATHS, DELETE_PATHS, unexpectedPaths } from "./cutover-scope.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const vitestConfig = resolve(repoRoot, "tests/vitest.config.ts");

function maxExecutableLineLength() {
	const commandFiles = [
		"tests/use-memorix/commands/task-01.txt",
		"tests/use-memorix/commands/task-02.txt",
		"tests/use-memorix/commands/task-03.txt",
		"tests/use-memorix/commands/task-04.txt",
		"tests/use-memorix/commands/task-05.txt",
		"tests/use-memorix/commands/task-06.txt",
		"tests/use-memorix/commands/task-07.txt",
		"tests/use-memorix/commands/task-08.txt",
		"tests/use-memorix/commands/task-09.txt",
		"tests/use-memorix/commands/task-10.txt",
		"tests/use-memorix/commands/task-11.txt",
		"tests/use-memorix/commands/task-12.txt",
	];
	return commandFiles
		.flatMap((path) => readFileSync(resolve(repoRoot, path), "utf8").split(/\r?\n/))
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
		.reduce((max, line) => Math.max(max, line.length), 0);
}

describe("use-memorix cutover scope", () => {
	test("SCOPE-01 accepts only baseline and frozen implementation paths", () => {
		expect(unexpectedPaths(repoRoot, "implementation")).toEqual([]);
		expect(CUTOVER_PATHS.every((path) => !path.endsWith("/") && path !== "tests/use-memorix")).toBe(true);
	});

	test("SCOPE-02 registers new suites and removes legacy discovery", () => {
		const source = readFileSync(vitestConfig, "utf8");
		for (const pattern of [
			"use-memorix/**/*.test.ts",
			"init-ai-md/**/*.test.ts",
			"release-ai-plugins/**/*.test.ts",
			"sync-local-global-agents-skills/**/*.test.ts",
		])
			expect(source).toContain(pattern);
		expect(source).not.toContain("init-simple-memorix/**/*.test.ts");
	});

	test("SCOPE-03 keeps executable shell lines within the Windows command limit", () => {
		expect(maxExecutableLineLength()).toBeLessThanOrEqual(200);
	});

	test("SCOPE-04 scans the implementation write set for secrets with exact fixture exceptions", () => {
		const pathspecPath = resolve(repoRoot, ".git/use-memorix-cutover.pathspec");
		const writeSet = existsSync(pathspecPath)
			? readFileSync(pathspecPath, "utf8").split("\0").filter(Boolean)
			: [...CUTOVER_PATHS, ...DELETE_PATHS];
		const patterns = [
			/AKIA[0-9A-Z]{16}/,
			/gh[pousr]_[A-Za-z0-9]{20,}/,
			/Bearer +[A-Za-z0-9._-]{16,}/,
			/C:[/\\]Users[/\\](?!alice\b)/,
		];
		// 历史基线豁免：只对「新增行」告警。HEAD 已存在的同一文本行属于既有历史记录
		// （例如 CHANGELOG 里可复现的旧报错日志），重写它们等于篡改历史证据，且并非本次新增泄露。
		const baselineLines = (relative: string): Set<string> => {
			const result = spawnSync("git", ["show", `HEAD:${relative}`], { cwd: repoRoot, encoding: "utf8" });
			if (result.status !== 0) return new Set();
			return new Set(result.stdout.split(/\r?\n/));
		};
		const violations: string[] = [];
		for (const relative of writeSet) {
			const absolute = resolve(repoRoot, relative);
			if (!existsSync(absolute)) continue;
			const baseline = baselineLines(relative);
			const lines = readFileSync(absolute, "utf8").split(/\r?\n/);
			lines.forEach((line, index) => {
				if (!patterns.some((pattern) => pattern.test(line))) return;
				if (baseline.has(line)) return;
				violations.push(`${relative}:${index + 1}`);
			});
		}
		expect(violations).toEqual([]);
	});
});
```

- [ ] **Step 3：确认测试先失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/scope-gate.test.ts
```

Expected：FAIL，至少因为新 include 尚未登记。

- [ ] **Step 4：修改发现配置与严格 tsconfig**

`tests/vitest.config.ts:1-24` 保留既有说明，配置改为以下完整模块；显式 root 为 tests，仓库根的过滤参数仍用 `tests/...`：

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
	root: fileURLToPath(new URL(".", import.meta.url)),
	test: {
		name: "tests-node",
		environment: "node",
		include: [
			"clean-vercel-deployment-storage/**/*.test.ts",
			"init-ai-md/**/*.test.ts",
			"init-prettier-git-hooks/**/*.test.ts",
			"init-shadcn-docs-nuxt/**/*.test.ts",
			"release-ai-plugins/**/*.test.ts",
			"sync-local-global-agents-skills/**/*.test.ts",
			"use-memorix/**/*.test.ts",
		],
	},
});
```

创建 `ai-plugins/tsconfig.use-memorix.json`：

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"strict": true,
		"noCheck": false,
		"noEmit": true,
		"allowImportingTsExtensions": true,
		"allowJs": true,
		"checkJs": false,
		"esModuleInterop": true,
		"resolveJsonModule": true,
		"types": ["node", "vitest/globals"]
	},
	"include": [
		"common-tools/skills/use-memorix/scripts/install-mcp.ts",
		"common-tools/skills/use-memorix/src/install-mcp.ts",
		"common-tools/skills/use-memorix/src/platforms.ts",
		"common-tools/skills/sync-local-global-agents-skills/scripts/audit-memorix-skills.ts",
		"common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts",
		"common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts",
		"common-tools/skills/sync-local-global-agents-skills/src/platforms.ts",
		"common-tools/skills/sync-local-global-agents-skills/src/sync.ts",
		"../tests/use-memorix/**/*.test.ts",
		"../tests/init-ai-md/**/*.test.ts",
		"../tests/release-ai-plugins/**/*.test.ts",
		"../tests/sync-local-global-agents-skills/**/*.test.ts"
	]
}
```

- [ ] **Step 5：验证**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/scope-gate.test.ts
```

Expected：PASS。`node tests/use-memorix/cutover-scope.mjs verify` 输出 `scope-ok`。创建 task-01～task-12 命令文件，
逐行复制各 Task 的可执行命令；续行保持独立物理行，注释以 `#` 开头。SCOPE-03 只检查这些命令文件，避免把测试夹具误判成 shell。

- [ ] **Step 6：提交门**

不提交。运行 scope helper；Task 11 统一完成细粒度提交序列。

### Task 2：迁移 MCP 三入口并锁定 characterization

**Files：**

- Create：`use-memorix/scripts/install-mcp.ts`、`src/install-mcp.ts`、`src/platforms.ts`、`fallback/*`
- Create：`tests/use-memorix/install-mcp.test.ts`
- Source：旧 skill 对应文件；Task 10 才删除。

**Interfaces：** 保持旧 `InstallMcpOptions`、`InstallMcpResult`、`McpPlatform` 和 `installMemorixMcp()` 签名。

- [ ] **Step 1：保留旧 19 测试并追加 characterization**

完整复制旧 `tests/init-simple-memorix/install-mcp.test.ts` 的 19 个测试到新路径，只改两个 import；不得用下面四例替换旧 19 例。下面代码作为独立 describe 追加，重名 imports 合并。原文件优先由 `git show PRE_CUTOVER_SHA:path` 取得；未注入 env 时依次回退到 HEAD 与「删除提交的父提交」，删除旧目录后仍可复验。

```ts
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { installMemorixMcp } from "../../ai-plugins/common-tools/skills/use-memorix/src/install-mcp.ts";
import type { McpPlatform } from "../../ai-plugins/common-tools/skills/use-memorix/src/platforms.ts";

const roots: string[] = [];
const repoRoot = resolve(import.meta.dirname, "../..");
const psPath = resolve(repoRoot, "ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.ps1");
const shPath = resolve(repoRoot, "ai-plugins/common-tools/skills/use-memorix/fallback/install-mcp.sh");

function temp(prefix: string) {
	const dir = mkdtempSync(join(tmpdir(), prefix));
	roots.push(dir);
	return dir;
}
function platform(path: string, format: "json" | "toml", serverPath?: string[]): McpPlatform {
	return { name: "fixture", configFiles: [path], format, serverPath };
}
afterEach(() => roots.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const legacyRelative = "ai-plugins/low-frequency-skill/skills/init-simple-memorix/";

/**
 * 解析旧技能字节基线。
 *
 * 顺序：显式 PRE_CUTOVER_SHA → 当前 HEAD（删除前）→ 「删除该路径的提交的父提交」。
 * 后两条回退保证 cutover 删除旧目录、CI 未注入 env 时仍能复验原字节，而不是靠 `test.skip` 绕过。
 */
function resolveBaselineSha(): string {
	const fromEnv = process.env.PRE_CUTOVER_SHA;
	if (fromEnv && /^[a-f0-9]{40}$/.test(fromEnv)) return fromEnv;
	const atHead = spawnSync("git", ["cat-file", "-e", `HEAD:${legacyRelative}SKILL.md`], { cwd: repoRoot });
	if (atHead.status === 0) return "HEAD";
	const deletion = spawnSync(
		"git",
		["log", "-1", "--format=%H", "--diff-filter=D", "--", `${legacyRelative}SKILL.md`],
		{
			cwd: repoRoot,
			encoding: "utf8",
		},
	);
	const sha = (deletion.stdout ?? "").trim();
	if (sha) return `${sha}^`;
	throw new Error("PRE_CUTOVER_SHA required: 无法从 git 历史解析旧技能基线");
}
const baselineSha = resolveBaselineSha();
function oldBytes(relative: string): Buffer {
	const path = `ai-plugins/low-frequency-skill/skills/init-simple-memorix/${relative}`;
	const result = spawnSync("git", ["show", `${baselineSha}:${path}`], { cwd: repoRoot });
	if (result.status !== 0) throw new Error(result.stderr.toString());
	return result.stdout;
}
function isolatedRun(bytes: Buffer, ext: string, executable: string) {
	const root = temp("compat-");
	const home = join(root, "home");
	mkdirSync(join(home, ".cursor"), { recursive: true });
	writeFileSync(
		join(home, ".cursor/mcp.json"),
		JSON.stringify({
			mcpServers: {
				other: { command: "keep" },
				memorix: { command: "cmd", args: ["/c", "memorix.cmd", "serve", "--mode", "full"] },
			},
		}),
	);
	const script = join(root, `install.${ext}`);
	writeFileSync(script, bytes);
	const args = ext === "ps1" ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script] : [script];
	const result = spawnSync(executable, args, {
		cwd: root,
		encoding: "utf8",
		timeout: 15000,
		env: { ...process.env, HOME: home, USERPROFILE: home },
	});
	if (result.error) throw result.error;
	const snapshot = (dir: string, prefix = ""): Record<string, string> =>
		Object.fromEntries(
			readdirSync(dir, { withFileTypes: true }).flatMap((entry): Array<[string, string]> => {
				const name = `${prefix}${entry.name}`;
				return entry.isDirectory()
					? Object.entries(snapshot(join(dir, entry.name), `${name}/`))
					: [[name, readFileSync(join(dir, entry.name)).toString("base64")]];
			}),
		);
	return { status: result.status, files: snapshot(home) };
}

describe("legacy MCP installer characterization", () => {
	test("MCP-01 preserves JSON and TOML installer behavior", () => {
		const dir = temp("memorix-mcp-");
		const json = join(dir, "mcp.json");
		const toml = join(dir, "mcp.toml");
		writeFileSync(
			json,
			JSON.stringify(
				{
					mcpServers: {
						other: { command: "x" },
						memorix: {
							command: "cmd",
							args: ["/c", "memorix.cmd", "serve", "--mode", "full"],
						},
					},
				},
				null,
				2,
			),
		);
		writeFileSync(
			toml,
			'[mcp_servers.memorix]\ncommand = "cmd"\nargs = ["/c", "memorix.cmd", "serve", "--mode", "team"]\n',
		);
		const results = installMemorixMcp([platform(json, "json"), platform(toml, "toml", ["mcp_servers"])]);
		expect(results.map((item) => item.status)).toEqual(["updated", "updated"]);
		const parsed = JSON.parse(readFileSync(json, "utf8"));
		expect(parsed.mcpServers.other).toEqual({ command: "x" });
		expect(parsed.mcpServers.memorix.command).toBe("cmd");
		expect(parsed.mcpServers.memorix.args).toEqual(["/c", "memorix.cmd", "serve", "--mode", "micro"]);
		expect(readFileSync(toml, "utf8")).toContain('["/c", "memorix.cmd", "serve", "--mode", "micro"]');
	});

	test("MCP-02 preserves PowerShell BOM targeted writes and status vocabulary", () => {
		const bytes = readFileSync(psPath);
		expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
		const source = bytes.toString("utf8");
		expect(source).toContain("Get-JsonBracketEnd");
		expect(source).toContain("Emit-Result");
		expect(source).toContain("-Status 'ok'");
		expect(bytes.equals(oldBytes("fallback/install-mcp.ps1"))).toBe(true);
		for (const exe of ["powershell.exe", "pwsh.exe"]) {
			expect(isolatedRun(bytes, "ps1", exe)).toEqual(isolatedRun(oldBytes("fallback/install-mcp.ps1"), "ps1", exe));
		}
	});

	test("MCP-03 preserves jq and no-jq fallback behavior", () => {
		const source = readFileSync(shPath, "utf8");
		expect(source).toContain("process_json_jq");
		expect(source).toContain("process_json_fallback");
		expect(source).toContain("refusing to modify existing JSON");
		expect(source).toContain("setpath($mp;");
		const bytes = readFileSync(shPath);
		expect(bytes.equals(oldBytes("fallback/install-mcp.sh"))).toBe(true);
		expect(isolatedRun(bytes, "sh", "bash")).toEqual(isolatedRun(oldBytes("fallback/install-mcp.sh"), "sh", "bash"));
	});

	test("MCP-04 handles only the first existing TypeScript candidate", () => {
		const dir = temp("memorix-candidates-");
		const first = join(dir, "first.json");
		const second = join(dir, "second.json");
		mkdirSync(dir, { recursive: true });
		writeFileSync(second, JSON.stringify({ mcpServers: {} }));
		const result = installMemorixMcp([{ name: "multi", configFiles: [first, second], format: "json" }]);
		expect(result).toHaveLength(1);
		expect(result[0].configFile).toBe(second);
		expect(JSON.parse(readFileSync(second, "utf8")).mcpServers.memorix).toBeDefined();
	});
});
```

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/install-mcp.test.ts
```

Expected：FAIL，新路径不存在。

- [ ] **Step 3：原字节迁移**

复制旧五个 runtime 文件；只调整脚本 import 相对路径。PowerShell 必须保留 BOM；不得改变候选遍历、状态词、micro 判断、JSON/TOML 写回和 no-jq 拒绝分支。

- [ ] **Step 4：验证**

重复 Step 2，Expected：PASS。再运行 strict tsc（Task 11 命令）。

- [ ] **Step 5：提交门**

运行 scope helper，不提交。

### Task 3：建立七域路由与表驱动能力矩阵

**Files：**

- Create：`use-memorix/SKILL.md`、7 references、有效 hooks templates
- Create：`tests/use-memorix/capability-matrix.test.ts`
- Exclude：WorkBuddy hooks 与旧 ZCode lifecycle template

**Interfaces：** 主 SKILL frontmatter `name: use-memorix`、`version: "3.0.0"`；references 名称与 spec 固定。

- [ ] **Step 1：写完整表驱动 contract test**

```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../../ai-plugins/common-tools/skills/use-memorix");
const read = (...parts: string[]) => readFileSync(resolve(root, ...parts), "utf8");
const contract = [
	[
		"CAP-03",
		"routes setup and upgrade to official Memorix with write confirmation",
		"references/setup-and-hooks.md",
		["官方", "setup", "升级", "确认"],
		["自动运行 setup"],
	],
	[
		"CAP-04",
		"keeps manual compatibility mode micro without rewriting official setup",
		"references/platform-and-mcp.md",
		["micro", "手工兼容器", "官方 setup"],
		["setup 后自动改 mode"],
	],
	[
		"CAP-05",
		"keeps ABI diagnosis and forbids same-major blind rebuild",
		"references/platform-and-mcp.md",
		["Node ABI", "同 major", "不"],
		[],
	],
	[
		"CAP-06",
		"keeps bare-command absolute-path and data-layer split",
		"references/platform-and-mcp.md",
		["裸命令", "绝对路径", "数据"],
		[],
	],
	[
		"CAP-07",
		"keeps NODE_OPTIONS trust hash restart and connected gates",
		"references/platform-and-mcp.md",
		["NODE_OPTIONS", "hash", "完全重启", "connected"],
		[],
	],
	[
		"CAP-08",
		"marks context search and detail as automatic reads",
		"references/memory-operations.md",
		["context", "search", "detail", "只读", "自动"],
		[],
	],
	[
		"CAP-09",
		"requires confirmation for store and resolve",
		"references/memory-operations.md",
		["store", "resolve", "确认"],
		["自动 store", "自动 resolve"],
	],
	[
		"CAP-10",
		"separates session reads from session and handoff writes",
		"references/session-and-reasoning.md",
		["session context", "start", "end", "handoff", "确认"],
		[],
	],
	[
		"CAP-11",
		"rejects weak archive signals and requires snapshot preview authorization successor",
		"references/retention-and-archive.md",
		["stale", "age", "low-evidence", "orphan", "successor", "快照", "预演", "授权"],
		[],
	],
	[
		"CAP-12",
		"keeps health reads automatic and gates WAL VACUUM and CodeGraph repair",
		"references/health-and-storage.md",
		["health", "WAL", "VACUUM", "CodeGraph", "确认"],
		[],
	],
	[
		"CAP-13",
		"requires authorization before dashboard start and records stop contract",
		"references/health-and-storage.md",
		["dashboard", "启动", "授权", "停止"],
		[],
	],
	[
		"CAP-14",
		"allows embedding diagnosis evaluation and gates repair",
		"references/retrieval-and-golden-set.md",
		["embedding", "诊断", "评测", "修复", "确认"],
		[],
	],
] as const;

describe("use-memorix capability matrix", () => {
	test("CAP-01 parses supported hook templates and excludes noisy events", () => {
		const jsonFiles = [
			"templates/hooks/antigravity.hooks.json",
			"templates/hooks/claude-code.settings.local.json",
			"templates/hooks/cursor.hooks.json",
			"templates/hooks/gemini-cli.settings.json",
			"templates/hooks-global/antigravity.hooks.json",
			"templates/hooks-global/claude.hooks.json",
			"templates/hooks-global/codex.hooks.json",
			"templates/hooks-global/cursor.hooks.json",
		];
		for (const file of jsonFiles) {
			const text = read(file);
			expect(() => JSON.parse(text), file).not.toThrow();
			expect(text, file).not.toMatch(/PreToolUse|PostToolUse|afterFileEdit|AfterTool/);
		}
		const windsurf = read("templates/hooks/windsurf.hooks.json");
		expect(windsurf).toContain("pre_user_prompt");
		expect(windsurf).toContain("post_cascade_response");
		expect(windsurf).not.toMatch(/post_write_code|post_run_command|post_mcp_tool_use/);
		const kiro = read("templates/hooks/kiro.memorix-file-save.kiro.hook");
		expect(kiro).toContain("enabled: false");
	});

	test("CAP-02 omits WorkBuddy hooks and legacy ZCode lifecycle template", () => {
		expect(existsSync(resolve(root, "templates/hooks/workbuddy.hooks.json"))).toBe(false);
		expect(existsSync(resolve(root, "templates/hooks/zcode.config.json"))).toBe(false);
	});

	test.each(contract)("%s %s", (_id, _name, file, required, forbidden) => {
		const text = read(file);
		for (const token of required) expect(text, `${file}: ${token}`).toContain(token);
		for (const token of forbidden) expect(text, `${file}: ${token}`).not.toContain(token);
	});

	test("CAP-15 keeps all seven official skills visible and routes v3 non-goals", () => {
		const text = read("SKILL.md");
		for (const skill of [
			"memorix-git-memory",
			"memorix-memory",
			"memorix-mini-skills",
			"memorix-orchestrate",
			"memorix-reasoning",
			"memorix-sessions",
			"memorix-troubleshooting",
		])
			expect(text).toContain(skill);
		for (const capability of ["long-term", "team", "orchestration", "transfer"])
			expect(text).toMatch(new RegExp(`${capability}.*官方|官方.*${capability}`, "i"));
	});
});
```

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/capability-matrix.test.ts
```

Expected：FAIL，新 skill/references/templates 尚未建立。

- [ ] **Step 3：实现完整七域与失败分支**

- `SKILL.md`：触发路由 → 读写门 → 七域表 → 官方技能路由 → runtime help 优先 → 禁止项 → resource index。
- `setup-and-hooks.md`：官方 setup/升级所有权；setup 写确认；只移除 Memorix 高频 hooks；未知字段保留；无 WorkBuddy hook。
- `platform-and-mcp.md`：micro 手工兼容器；三入口差异；ABI 同 major 不盲 rebuild；shim 三分流；WorkBuddy `NODE_OPTIONS`/hash/重启/connected。
- `memory-operations.md`：context/search/detail 自动只读；store/resolve 展示摘要后确认；工具缺失才走 CLI help 确认的兜底。
- `session-and-reasoning.md`：resume/context 只读；start/end/handoff 写确认；long-term/team/orchestration/transfer 官方路由。
- `retention-and-archive.md`：弱信号失败分支直接拒绝；只有 candidate/successor；无 preview 时导出脱敏清单；无授权不写。
- `health-and-storage.md`：doctor/status 只读；WAL 大不自动处理；VACUUM/checkpoint/repair/CodeGraph refresh/dashboard start 确认并记录停止方式。
- `retrieval-and-golden-set.md`：embedding 诊断/评测自动，provider/cache/reindex 修复确认；schema 路由和 host 边界。

- [ ] **Step 4：验证矩阵**

重复 Step 2；每个固定 test name 必须 PASS，禁止 `test.skip`。

- [ ] **Step 5：提交门**

运行 scope helper，不提交。

### Task 4：冻结 schemas、validator 与可注入脱敏器

**Files：**

- Create：`src/golden-set/contracts.mjs`、`redaction.mjs`、golden-set templates
- Create：`tests/use-memorix/golden-set-contracts.test.ts`

**Interfaces：** 使用“冻结接口”中的三个 schemaVersion 与函数签名。`redactQuery` 必须接收显式 `{ homeDir, projectRoot }`，禁止测试或实现依赖当前机器主目录。

- [ ] **Step 1：写完整 schema test**

```ts
import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
	computeCandidateId,
	validateFederatedBundle,
	validateGoldenSetFile,
	validateRetrievalCandidate,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/contracts.mjs";
import { redactQuery } from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/redaction.mjs";

const kinds = ["zero-candidate", "fuzzy-only", "fallback-generation"] as const;
const sourceProject = "owner/repository";
const captureDate = "2026-11-17";
const query = "find shim regression";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

function candidate() {
	return {
		schemaVersion: "memorix-retrieval-candidate/v1",
		candidateId: computeCandidateId(sourceProject, captureDate, query),
		sourceProject,
		host: "zcode",
		captureMode: "automatic-hook",
		toolName: "memorix_search",
		captureDate,
		capturedAt: "2026-11-17T01:02:03.000Z",
		query: { redactedOriginal: query, sha256: sha(query) },
		signals: [{ kind: "zero-candidate", reasons: ["candidateCount=0"] }],
		resultSummary: { candidateCount: 0, topN: [] },
		contract: { structuredContent: true, enabledRules: [...kinds], disabledRules: [] },
	};
}

function goldenSet() {
	return {
		schemaVersion: "memorix-golden-set-case/v1",
		project: { repository: sourceProject },
		cases: [
			{
				id: "shim-regression",
				query,
				capturedAt: "2026-11-17T01:02:03.000Z",
				failureKinds: ["zero-candidate"],
				expected: { mustMatch: [{ titleIncludes: ["shim"] }] },
				localHints: { observationIds: [42] },
			},
		],
	};
}

describe("golden set contracts", () => {
	test("GOLD-01 validates cases candidates bundles and redaction boundaries", () => {
		expect(validateGoldenSetFile(goldenSet()).ok).toBe(true);
		expect(validateRetrievalCandidate(candidate()).ok).toBe(true);
		const bundle = {
			schemaVersion: "memorix-golden-set-bundle/v1",
			sourceProject,
			projectId: "project-1",
			sourceCommit: "a".repeat(40),
			capturedAt: "2026-11-17T01:02:03.000Z",
			exportedAt: "2026-11-17T02:03:04.000Z",
			upstreamCaseId: "shim-regression",
			case: { ...goldenSet().cases[0], localHints: undefined },
		};
		expect(validateFederatedBundle(bundle).ok).toBe(true);
	});

	test("GOLD-02 redacts Windows POSIX and worktree paths deterministically", () => {
		expect(
			redactQuery("C:/Users/alice/token.txt", {
				homeDir: "C:/Users/alice",
				projectRoot: "D:/code/repo",
			}),
		).toBe("~/token.txt");
		expect(
			redactQuery("/home/alice/repo/src/a.ts", {
				homeDir: "/home/alice",
				projectRoot: "/home/alice/repo",
			}),
		).toBe("<project-root>/src/a.ts");
		expect(
			redactQuery("/Users/alice/worktrees/x/src/a.ts", {
				homeDir: "/Users/alice",
				projectRoot: "/Users/alice/worktrees/x",
			}),
		).toBe("<project-root>/src/a.ts");
	});

	test.each([
		[
			"candidate id",
			(value: any) => {
				value.candidateId = "0".repeat(64);
			},
		],
		[
			"signals order",
			(value: any) => {
				value.signals = [
					{ kind: "fallback-generation", reasons: ["x"] },
					{ kind: "fuzzy-only", reasons: ["y"] },
				];
			},
		],
		[
			"rule overlap",
			(value: any) => {
				value.contract.disabledRules = ["zero-candidate"];
			},
		],
		[
			"structuredContent",
			(value: any) => {
				value.contract.structuredContent = false;
			},
		],
		[
			"capture time",
			(value: any) => {
				value.capturedAt = "2026-11-18T00:00:00.000Z";
			},
		],
		[
			"GitHub identity",
			(value: any) => {
				value.sourceProject = "https://github.com/owner/repo";
			},
		],
	])("GOLD-03 rejects invalid %s", (_name, mutate) => {
		const value = candidate();
		mutate(value);
		expect(validateRetrievalCandidate(value).ok).toBe(false);
	});

	test("GOLD-04 rejects local hints and observation ids in bundles", () => {
		const value = goldenSet().cases[0] as any;
		const bundle = {
			schemaVersion: "memorix-golden-set-bundle/v1",
			sourceProject,
			projectId: "p",
			sourceCommit: "a".repeat(40),
			capturedAt: value.capturedAt,
			exportedAt: value.capturedAt,
			upstreamCaseId: value.id,
			case: value,
		};
		expect(validateFederatedBundle(bundle).ok).toBe(false);
	});
});
```

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/golden-set-contracts.test.ts
```

- [ ] **Step 3：实现关键函数与失败分支**

`redactQuery(value, { homeDir, projectRoot })` 必须先规范化斜杠，再按“projectRoot → `<project-root>`、homeDir → `~`、Bearer/key/email/URL query”顺序替换；projectRoot 若位于 homeDir 内仍优先 projectRoot。

`validateRetrievalCandidate` 必须：重算 SHA-256 query hash 与 candidateId；验证 UTC 日期一致；验证 GitHub identity；验证 signals 固定排序；验证 enabled/disabled 无重复、无交集且并集精确等于三规则；signal 只能来自 enabled；严格要求 structuredContent `true`。

- [ ] **Step 4：实现 tracked templates 并验证**

`cases.json` 使用 case schema v1、`owner/repository` 占位 identity 和空 cases；README 写 canonical/ignored、复跑、CI 禁止、hooks 保留、DATA_DIR 禁令。重复 Step 2，Expected：PASS。

- [ ] **Step 5：提交门**

运行 scope helper，不提交。

### Task 5：实现 ZCode 自动捕获与非 ZCode 交互入口

**Files：**

- Create：`src/golden-set/capture.mjs`
- Create：`scripts/zcode-retrieval-capture.mjs`
- Create：`scripts/capture-interactive.mjs`
- Create：`tests/use-memorix/retrieval-capture.test.ts`
- Modify：`references/retrieval-and-golden-set.md`（新文件，在本任务补全）

**Interfaces：**

```ts
export interface NormalizedSearchResult {
	candidateCount?: number;
	topN: Array<{ ref?: string; channel?: string; score?: number; matchedFields?: string[] }>;
	fallbackUsed?: boolean;
	generationStatus?: "fallback" | "generated" | "generation-error";
	enabledRules: FailureKind[];
	disabledRules: FailureKind[];
}
export function normalizeStructuredSearchResult(value: unknown): NormalizedSearchResult;
export function classifyRetrievalFailure(value: NormalizedSearchResult): FailureKind[];
export function buildCandidate(input: CaptureInput): RetrievalCandidate | null;
export async function writeCandidate(projectRoot: string, candidate: RetrievalCandidate): Promise<boolean>;
export async function runInteractiveCapture(args: string[], io: InteractiveIo): Promise<number>;
```

- [ ] **Step 1：写完整捕获 test**

```ts
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	buildCandidate,
	classifyRetrievalFailure,
	normalizeStructuredSearchResult,
	writeCandidate,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/capture.mjs";
import { runInteractiveCapture } from "../../ai-plugins/common-tools/skills/use-memorix/scripts/capture-interactive.mjs";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

const dirs: string[] = [];
function temp() {
	const dir = mkdtempSync(join(tmpdir(), "capture-"));
	dirs.push(dir);
	return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const full = {
	candidateCount: 2,
	results: [
		{ ref: "obs:1", channel: "fuzzy", score: 0.2, matchedFields: ["title"] },
		{ ref: "obs:2", channel: "fuzzy", score: 0.1, matchedFields: ["concepts"] },
	],
	fallbackUsed: true,
	generationStatus: "fallback",
};

describe("retrieval capture", () => {
	test("CAPTURE-01 partitions structured signals and fails open without text parsing", () => {
		const normalized = normalizeStructuredSearchResult(full);
		expect(normalized.enabledRules).toEqual(["zero-candidate", "fuzzy-only", "fallback-generation"]);
		expect(normalized.disabledRules).toEqual([]);
		expect(classifyRetrievalFailure(normalized)).toEqual(["fuzzy-only", "fallback-generation"]);
		const textOnly = normalizeStructuredSearchResult({ content: "0 candidates fuzzy fallback" });
		expect(textOnly.enabledRules).toEqual([]);
		expect(textOnly.disabledRules).toEqual(["zero-candidate", "fuzzy-only", "fallback-generation"]);
		expect(classifyRetrievalFailure(textOnly)).toEqual([]);
	});

	test("CAPTURE-02 creates interactive candidates for non-ZCode hosts without hook claims", async () => {
		const dir = temp();
		const resultPath = join(dir, "result.json");
		writeFileSync(resultPath, JSON.stringify(full));
		const output: string[] = [];
		const writes: Array<[string, string]> = [];
		const code = await runInteractiveCapture(
			[
				"--host",
				"codex",
				"--project-root",
				dir,
				"--repository",
				"owner/repo",
				"--query",
				"find regression",
				"--result-json",
				resultPath,
			],
			{
				now: () => new Date("2026-11-17T01:02:03.000Z"),
				readText: (path) => readFileSync(path, "utf8"),
				writeText: (path, text) => writes.push([path, text]),
				stdout: (text) => output.push(text),
			},
		);
		expect(code).toBe(0);
		expect(writes).toEqual([]);
		const preview = JSON.parse(output.join(""));
		expect(preview.host).toBe("codex");
		expect(preview.captureMode).toBe("interactive");
		expect(preview.signals.map((item: any) => item.kind)).toEqual(["fuzzy-only", "fallback-generation"]);
	});

	test("CAPTURE-03 freezes fuzzy and fallback structural rules", () => {
		const empty = normalizeStructuredSearchResult({ candidateCount: 0, results: [] });
		expect(classifyRetrievalFailure(empty)).toEqual(["zero-candidate"]);
		const mixed = normalizeStructuredSearchResult({
			candidateCount: 2,
			results: [{ channel: "fuzzy" }, { channel: "semantic" }],
		});
		expect(classifyRetrievalFailure(mixed)).toEqual([]);
		const missing = normalizeStructuredSearchResult({ candidateCount: 1, results: [{}] });
		expect(missing.disabledRules).toContain("fuzzy-only");
		expect(classifyRetrievalFailure(missing)).toEqual([]);
	});

	test("CAPTURE-04 builds sorted deduplicated candidate metadata only", () => {
		const value = buildCandidate({
			host: "zcode",
			captureMode: "automatic-hook",
			sourceProject: "owner/repo",
			toolName: "memorix_search",
			query: "find regression",
			capturedAt: "2026-11-17T01:02:03.000Z",
			normalized: normalizeStructuredSearchResult(full),
		});
		expect(value?.signals.map((item: any) => item.kind)).toEqual(["fuzzy-only", "fallback-generation"]);
		expect(value?.resultSummary.topN).toHaveLength(2);
		expect(value?.resultSummary.topN[0]).toEqual({
			ref: "obs:1",
			channel: "fuzzy",
			score: 0.2,
			matchedFields: ["title"],
		});
		expect(value?.query.redactedOriginal).toBe("find regression");
		expect(value?.query.sha256).toBe(sha("find regression"));
		expect(JSON.stringify(value)).not.toContain("observation body");
	});

	test("CAPTURE-05 writes deduplicated redacted candidates into ignored inbox", async () => {
		const dir = temp();
		const candidate = buildCandidate({
			host: "zcode",
			captureMode: "automatic-hook",
			sourceProject: "owner/repo",
			toolName: "memorix_search",
			query: "find regression",
			capturedAt: "2026-11-17T01:02:03.000Z",
			normalized: normalizeStructuredSearchResult(full),
		});
		expect(candidate).not.toBeNull();
		expect(await writeCandidate(dir, candidate!)).toBe(true);
		const storedPath = join(dir, ".memorix/golden-set/.local/inbox", `${candidate!.candidateId}.json`);
		const stored = JSON.parse(readFileSync(storedPath, "utf8"));
		expect(stored.schemaVersion).toBe("memorix-retrieval-candidate/v1");
		expect(stored.query.redactedOriginal).toBe("find regression");
		expect(stored.query.sha256).toBe(sha("find regression"));
		expect(JSON.stringify(stored)).not.toContain("observation body");
		expect(await writeCandidate(dir, candidate!)).toBe(false);
	});
});
```

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/retrieval-capture.test.ts
```

- [ ] **Step 3：实现结构判定**

- zero：只有 candidateCount 数字或 results 数组可推导时启用；值为 0 才命中。
- fuzzy：要求 candidateCount > 0 且每项 channel 均严格等于 `fuzzy`；空数组、缺 channel、混合/未知 channel 禁用或不命中。
- fallback-generation：只接受 `fallbackUsed === true` 或精确枚举 `fallback|generated|generation-error`；未知字符串禁用。
- enabled/disabled 按三规则固定顺序精确分区；全部禁用返回 null/exit 0。
- candidate top-N 截断 5，只复制四个元数据字段；signals 固定排序；写入已存在 ID 时跳过。

`CaptureInput.query` 的语义是调用方已用 `redactQuery` 脱敏后的原文；`zcode-retrieval-capture.mjs` 必须在构建
candidate 前先脱敏。`writeCandidate(projectRoot, candidate)` 只写
`.memorix/golden-set/.local/inbox/<candidateId>.json`：目标已存在时跳过并返回 `false`，新写返回 `true`；
目录不存在时创建；它不移动 promoted/rejected、不写 `cases.json`。hook 运行链因此固定为
normalize → redact → dedup/sort → write，链上每步都有对应测试。

`capture-interactive.mjs` 默认只输出 preview；只有 `--apply --approval-token CAPTURE_INTERACTIVE_CANDIDATE` 才写 inbox。任何参数/JSON/schema 错误输出脱敏 code 并返回非零；它不调用 Memorix、不安装 hook。

- [ ] **Step 4：性能与静态依赖测试加入同文件**

在上述文件追加：

```ts
import { performance } from "node:perf_hooks";
import { readFileSync as readSource } from "node:fs";
import { resolve } from "node:path";

test("PERF-01 keeps warm capture core P95 below 100ms without network shell or workers", () => {
	for (let i = 0; i < 50; i++) classifyRetrievalFailure(normalizeStructuredSearchResult(full));
	const samples = Array.from({ length: 1000 }, () => {
		const start = performance.now();
		classifyRetrievalFailure(normalizeStructuredSearchResult(full));
		return performance.now() - start;
	}).sort((a, b) => a - b);
	expect(samples[Math.ceil(samples.length * 0.95) - 1]).toBeLessThan(100);
	const sources = [
		"src/golden-set/capture.mjs",
		"scripts/zcode-retrieval-capture.mjs",
		"templates/zcode/retrieval-capture-launcher.mjs",
	].map((p) => readSource(resolve(import.meta.dirname, "../../ai-plugins/common-tools/skills/use-memorix", p), "utf8"));
	for (const forbidden of ["node:child_process", "node:worker_threads", "fetch(", "memorix serve"])
		for (const source of sources) expect(source).not.toContain(forbidden);
});
```

- [ ] **Step 5：验证并过 scope gate**

重复 Step 2。Expected：6 个测试均 PASS。运行 scope helper，不提交。

### Task 6：实现 ZCode 安装与黄金集 operator

**Files：**

- Create：`src/golden-set/zcode-install.mjs`、`operator.mjs`
- Create：`scripts/install-zcode-hook.mjs`、`golden-set-operator.mjs`
- Create：`templates/zcode/*`
- Create：`tests/use-memorix/zcode-install-operator.test.ts`

**Interfaces：**

```ts
export function planZCodeInstall(projectRoot: string): InstallPlan;
export function applyZCodeInstall(plan: InstallPlan, approvalToken?: string): void;
export function planGoldenSetInit(input: InitInput): FilePlan;
export function acceptCandidate(input: AcceptInput): GoldenSetFile;
export function cleanupCandidates(input: CleanupInput): CleanupPlan;
export function exportBundle(input: ExportInput): FederatedGoldenSetBundle;
```

- [ ] **Step 1：写完整 install/operator test**

```ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	applyZCodeInstall,
	planZCodeInstall,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/zcode-install.mjs";
import {
	acceptCandidate,
	cleanupCandidates,
	exportBundle,
	planGoldenSetInit,
} from "../../ai-plugins/common-tools/skills/use-memorix/src/golden-set/operator.mjs";

const dirs: string[] = [];
function temp() {
	const dir = mkdtempSync(join(tmpdir(), "zcode-install-"));
	dirs.push(dir);
	return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("ZCode install and golden set operator", () => {
	test("INSTALL-01 merges ZCode config and only auto-upgrades marked launcher", () => {
		const root = temp();
		const config = join(root, ".zcode/config.json");
		const launcher = join(root, ".zcode/hooks/use-memorix-retrieval.mjs");
		mkdirSync(join(root, ".zcode/hooks"), { recursive: true });
		writeFileSync(config, JSON.stringify({ custom: true, hooks: { enabled: true, events: { Stop: [] } } }));
		writeFileSync(launcher, "// user-owned\n");
		const blocked = planZCodeInstall(root);
		expect(blocked.blocked).toContain("launcher-marker-missing");
		expect(() => applyZCodeInstall(blocked, "INSTALL_ZCODE_RETRIEVAL_CAPTURE")).toThrow();
		writeFileSync(launcher, "// use-memorix:zcode-retrieval-launcher:v1\nold\n");
		const plan = planZCodeInstall(root);
		applyZCodeInstall(plan, "INSTALL_ZCODE_RETRIEVAL_CAPTURE");
		const merged = JSON.parse(readFileSync(config, "utf8"));
		expect(merged.custom).toBe(true);
		expect(merged.hooks.events.Stop).toEqual([]);
		expect(merged.hooks.events.PostToolUse).toHaveLength(1);
		expect(readFileSync(launcher, "utf8")).toContain("use-memorix:zcode-retrieval-launcher:v1");
	});

	test("INSTALL-02 previews golden set initialization without writing", () => {
		const root = temp();
		const plan = planGoldenSetInit({ projectRoot: root, repository: "owner/repo" });
		expect(plan.writes.map((item: any) => item.path)).toEqual([
			join(root, ".memorix/golden-set/README.md"),
			join(root, ".memorix/golden-set/cases.json"),
			join(root, ".gitignore"),
		]);
		expect(existsSync(join(root, ".memorix/golden-set/cases.json"))).toBe(false);
	});

	test("INSTALL-03 accepts only a rerun-backed candidate and exports no local hints", () => {
		const golden = acceptCandidate({
			goldenSet: { schemaVersion: "memorix-golden-set-case/v1", project: { repository: "owner/repo" }, cases: [] },
			candidate: { query: { redactedOriginal: "find shim" }, signals: [{ kind: "zero-candidate" }] },
			rerun: { query: "find shim", structuredContent: { candidateCount: 1, results: [{ ref: "obs:1" }] } },
			expected: { mustMatch: [{ titleIncludes: ["shim"] }] },
			id: "shim-regression",
			capturedAt: "2026-11-17T01:02:03.000Z",
		});
		expect(golden.cases).toHaveLength(1);
		const bundle = exportBundle({
			goldenSet: golden,
			caseId: "shim-regression",
			projectId: "p1",
			sourceCommit: "a".repeat(40),
			exportedAt: "2026-11-17T02:03:04.000Z",
		});
		expect(JSON.stringify(bundle)).not.toContain("localHints");
		expect(JSON.stringify(bundle)).not.toContain("observationIds");
	});

	test("INSTALL-04 previews retention cleanup limited to 30 days and 500 candidates", () => {
		const now = "2026-12-17T00:00:00.000Z";
		const expired = Array.from({ length: 520 }, (_, index) => ({
			path: `expired-${index}.json`,
			capturedAt: "2026-11-17T00:00:00.000Z",
		}));
		const fresh = { path: "fresh.json", capturedAt: "2026-12-16T00:00:00.000Z" };
		const plan = cleanupCandidates({ now, candidates: [...expired, fresh] });
		expect(plan.requiresConfirmation).toBe(true);
		expect(plan.remove).toHaveLength(500);
		expect(plan.keep).toContain("fresh.json");
		expect(plan.remove).not.toContain("fresh.json");
		expect(cleanupCandidates({ now, candidates: [fresh] }).remove).toEqual([]);
	});
});
```

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/zcode-install-operator.test.ts
```

- [ ] **Step 3：实现安装失败分支**

`planZCodeInstall` 必须解析合法 JSON、保留未知字段、幂等合并 PostToolUse；非法 JSON 返回 blocked。无 launcher 时首次安装需 token；有 canonical marker 时 launcher 内容可无条件升级但不能顺带写其他文件；无 marker 永不覆盖。

- [ ] **Step 4：实现 operator 失败分支**

所有写子命令默认 preview；init/accept/reject/cleanup/export 各自要求固定 approval token。accept 必须读取同 query one-shot rerun 的 structuredContent 且 expected validator 通过；operator 自身禁止调用 Memorix。cleanup 只生成预演计划：候选超过 30 天（按 UTC 日期比较）才进入 remove，单次最多 500 条（最旧优先），fresh 候选保留在 keep，`requiresConfirmation` 恒为 `true`，未确认不写盘；export 移除 localHints。

- [ ] **Step 5：验证并过 scope gate**

重复 Step 2，Expected：PASS。运行两个 CLI `--help`，不得写文件；运行 scope helper，不提交。

### Task 7：让 init-ai-md 强制增量合并模板 12

**Files：**

- Create：模板 12、`tests/init-ai-md/memorix-governance.test.ts`
- Modify：`SKILL.md:62-167,263-310,330-378`
- Modify：`execution-examples.md:19-50,72-87`
- Modify：`step-details.md:82-106`

- [ ] **Step 1：写完整 static contract test**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../../ai-plugins/common-tools/skills/init-ai-md");
const skill = readFileSync(resolve(root, "SKILL.md"), "utf8");
const template = readFileSync(resolve(root, "templates/12.memorix-memory-governance.md"), "utf8");
const examples = readFileSync(resolve(root, "references/execution-examples.md"), "utf8");
const details = readFileSync(resolve(root, "references/step-details.md"), "utf8");

describe("init-ai-md Memorix governance", () => {
	test("INIT-01 makes template 12 mandatory outside multi-select", () => {
		expect(skill).toContain("12.memorix-memory-governance.md");
		expect(skill).toMatch(/12.*不进入.*多选/s);
		expect(skill).toMatch(/每次.*强制.*增量/s);
		expect(details).toMatch(/AskUserQuestion.*排除.*12/s);
	});

	test("INIT-02 keeps the template short and points to use-memorix", () => {
		expect(template.match(/^## .+$/gm)).toEqual(["## Memorix 记忆治理"]);
		expect(template).toContain("use-memorix");
		expect(template).toContain(".memorix/golden-set/");
		expect(template).toContain(".memorix/hooks.json");
		expect(template).toContain("MEMORIX_DATA_DIR");
		expect(template).not.toContain("memorix serve");
	});

	test("INIT-03 documents custom-content preservation with concrete fixtures", () => {
		expect(examples).toContain("自定义 retention 规则保留");
		expect(examples).toContain("用户未选择任何可选模板");
		expect(skill).toMatch(/只补.*缺失.*不覆盖.*自定义/s);
	});
});
```

- [ ] **Step 2：确认失败、实现、验证**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/init-ai-md/memorix-governance.test.ts
```

Expected 首次 FAIL。实现模板和三处文档：扫描阶段标 mandatory；AskUserQuestion 排除；选择为空仍增量处理；同义规则不重复；用户自定义原文不替换。重复命令，Expected：PASS。

- [ ] **Step 3：提交门**

运行 scope helper，不提交。

### Task 8：把官方 Memorix skills 刷新改成只读审计

**Files：**

- Create：`src/memorix-audit.ts`、`scripts/audit-memorix-skills.ts`
- Modify：`scripts/sync.ts:6-49,61-145`、SKILL/README、两份现有 tests
- Delete：旧 refresh runtime

- [ ] **Step 1：用以下完整内容重写 memorix.test.ts**

```ts
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
	OFFICIAL_MEMORIX_SKILLS,
	auditOfficialMemorixSkills,
} from "../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts";

const dirs: string[] = [];
function temp() {
	const dir = mkdtempSync(join(tmpdir(), "memorix-audit-"));
	dirs.push(dir);
	return dir;
}
function writeSkill(root: string, name: string, declared = name) {
	const dir = join(root, name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), `---\nname: ${declared}\ndescription: fixture\n---\n`);
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("official Memorix skill audit", () => {
	test("AUDIT-01 reports present missing and invalid without writes", () => {
		const root = temp();
		writeSkill(root, OFFICIAL_MEMORIX_SKILLS[0]);
		writeSkill(root, OFFICIAL_MEMORIX_SKILLS[1], "wrong-name");
		writeSkill(root, "user-custom-skill");
		const before = readFileSync(join(root, "user-custom-skill/SKILL.md"), "utf8");
		const result = auditOfficialMemorixSkills(root);
		expect(result.find((item) => item.skill === OFFICIAL_MEMORIX_SKILLS[0])?.status).toBe("present");
		expect(result.find((item) => item.skill === OFFICIAL_MEMORIX_SKILLS[1])?.status).toBe("invalid");
		expect(result.find((item) => item.skill === OFFICIAL_MEMORIX_SKILLS[2])?.status).toBe("missing");
		expect(readFileSync(join(root, "user-custom-skill/SKILL.md"), "utf8")).toBe(before);
	});

	test("AUDIT-02 contains no network process or write primitive", () => {
		const source = readFileSync(
			new URL(
				"../../ai-plugins/common-tools/skills/sync-local-global-agents-skills/src/memorix-audit.ts",
				import.meta.url,
			),
			"utf8",
		);
		for (const token of ["fetch(", "execSync", "writeFile", "rename", "rmSync", "githubToken"])
			expect(source).not.toContain(token);
	});
});
```

- [ ] **Step 2：确认失败、实现、验证**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/sync-local-global-agents-skills/memorix.test.ts
```

实现只允许 exists/stat/read frontmatter name。删除四个 refresh 参数，新增 `--skip-memorix-audit`；missing/invalid 只提示官方 setup help，不修复。更新 `sync.test.ts:1-213`，保留现有 link tests 并新增 parse/help 不含旧参数的 test。重复命令并再单独运行 `sync.test.ts`，Expected：PASS。

- [ ] **Step 3：提交门**

运行 scope helper，不提交。

### Task 9：扩展 release transition 并加入 PS5.1/7 Windows CI

**Files：**

- Create：`scripts/skill-transitions.ps1`
- Create：`tests/release-ai-plugins/skill-transitions.test.ts`
- Modify：`release-ai-plugins.ps1:59-69,103-241,305-330,385-470,585-669`
- Modify：`release-ai-plugins/SKILL.md:23-78,81-95,123-184`
- Modify：`release-ai-plugins/README.md:1-45`
- Modify：`release-contract.md:2-144`
- Modify：`.github/workflows/ai-plugins-skill-registry-check.yml:6-55`

**Interfaces：**

```text
-RenameSkill old=new
-MoveSkill id=plugin
-RemoveSkill id
-SkillVersion id=x.y.z
-RepositoryRoot path        # 仅测试/显式仓库根注入；省略时保持现有向上发现
```

helper 提供 `Get-HeadSkillIndex`、`Get-WorkingSkillIndex`、`Resolve-SkillTransitions`，标准输出对象包含 kind/from/to。

- [ ] **Step 1：写完整 PowerShell integration test**

```ts
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const dirs: string[] = [];
const repoRoot = resolve(import.meta.dirname, "../..");
const script = resolve(repoRoot, "ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1");
const psExe = process.env.USE_MEMORIX_PS_EXE ?? (process.platform === "win32" ? "pwsh.exe" : "pwsh");
const powershellTest = process.platform === "win32" || process.env.USE_MEMORIX_ALLOW_PWSH === "1" ? test : test.skip;
function run(command: string, args: string[], cwd: string) {
	return spawnSync(command, args, { cwd, encoding: "utf8", env: process.env });
}
function json(path: string, value: unknown) {
	mkdirSync(resolve(path, ".."), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, 2));
}
function text(path: string, value: string) {
	mkdirSync(resolve(path, ".."), { recursive: true });
	writeFileSync(path, value);
}
function fixture() {
	const root = mkdtempSync(join(tmpdir(), "release-transition-"));
	dirs.push(root);
	run("git", ["init"], root);
	run("git", ["config", "user.email", "fixture@example.invalid"], root);
	run("git", ["config", "user.name", "Fixture"], root);
	text(join(root, "pnpm-workspace.yaml"), "packages: []\n");
	for (const plugin of ["common-tools", "dev-skills", "low-frequency-skill"]) {
		const old = plugin === "low-frequency-skill" ? "init-simple-memorix" : `fixture-${plugin}`;
		text(
			join(root, `ai-plugins/${plugin}/skills/${old}/SKILL.md`),
			`---\nname: ${old}\ndescription: fixture\nmetadata:\n  version: "1.0.0"\n---\n`,
		);
		text(join(root, `ai-plugins/${plugin}/README.md`), `# ${plugin}\n${old}\n`);
		text(join(root, `ai-plugins/${plugin}/CHANGELOG.md`), "# Changelog\n\n## [Unreleased]\n");
		for (const host of ["claude", "cursor", "codex"])
			json(join(root, `ai-plugins/${plugin}/.${host}-plugin/plugin.json`), {
				name: plugin,
				version: "13.4.0",
				skills: "./skills",
				description: "中文描述",
				interface: {
					displayName: "中文",
					shortDescription: "中文",
					longDescription: "中文",
					developerName: "中文",
					category: "工具",
					capabilities: ["技能"],
					defaultPrompt: ["中文"],
				},
			});
	}
	json(join(root, ".claude-plugin/marketplace.json"), { metadata: { version: "13.4.0" }, plugins: [] });
	json(join(root, ".cursor-plugin/marketplace.json"), { metadata: { version: "13.4.0" }, plugins: [] });
	json(join(root, ".agents/plugins/marketplace.json"), {
		plugins: [
			...["common-tools", "dev-skills", "low-frequency-skill"].map((name) => ({
				name,
				source: { source: "local", path: `./ai-plugins/${name}` },
				policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
				category: "tools",
			})),
		],
	});
	for (const file of [
		"ai-plugins/docs/README.md",
		"ai-plugins/docs/use-vercel-skills-install.md",
		".claude-plugin/README.md",
		".cursor-plugin/README.md",
		".agents/plugins/README.md",
		"README.md",
	])
		text(join(root, file), "ai-plugins/common-tools\n");
	text(
		join(root, ".github/workflows/ai-plugins-skill-registry-check.yml"),
		[
			"ai-plugins/common-tools/skills/**",
			"ai-plugins/dev-skills/skills/**",
			"ai-plugins/low-frequency-skill/skills/**",
			"ai-plugins/skill-registry.json",
			"generate-skill-registry.ps1",
			"skill-transitions.ps1",
			"-Check",
			"contents: read",
		].join("\n"),
	);
	const generator = join(root, "ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1");
	text(
		generator,
		[
			"param([switch]$Apply,[switch]$Check)",
			`$calls = Join-Path '${root.replaceAll("'", "''")}' 'calls.log'`,
			"Add-Content -Path $calls -Value $(if($Apply){'Apply'}else{'Check'})",
			`if($Apply){Set-Content -Path (Join-Path '${root.replaceAll("'", "''")}' 'ai-plugins/skill-registry.json') -Value '{\"schemaVersion\":\"1\",\"roots\":[],\"skills\":[]}'}`,
		].join("\n"),
	);
	cpSync(resolve(script, "../skill-transitions.ps1"), resolve(generator, "../skill-transitions.ps1"));
	run("git", ["add", "."], root);
	run("git", ["commit", "-m", "fixture"], root);
	rmSync(join(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix"), { recursive: true });
	text(
		join(root, "ai-plugins/common-tools/skills/use-memorix/SKILL.md"),
		'---\nname: use-memorix\ndescription: fixture\nmetadata:\n  version: "3.0.0"\n---\n',
	);
	return root;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe("release skill transitions", () => {
	powershellTest("TRANSITION-01 resolves rename-move and keeps DryRun byte-identical", () => {
		const root = fixture();
		const before = readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8");
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-RenameSkill",
				"init-simple-memorix=use-memorix",
				"-SkillVersion",
				"use-memorix=3.0.0",
				"-DryRun",
			],
			root,
		);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("rename-move");
		expect(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8")).toBe(before);
	});

	powershellTest("TRANSITION-02 rejects conflicts missing targets and old-directory residue", () => {
		const root = fixture();
		for (const args of [
			["-RenameSkill", "missing=use-memorix"],
			["-RenameSkill", "init-simple-memorix=use-memorix", "-MoveSkill", "use-memorix=dev-skills"],
		]) {
			const result = run(
				psExe,
				["-NoProfile", "-File", script, "-RepositoryRoot", root, "-Version", "14.0.0", ...args, "-DryRun"],
				root,
			);
			expect(result.status).not.toBe(0);
		}
		const residueArgs = ["-RenameSkill", "init-simple-memorix=use-memorix"];
		text(
			join(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix/SKILL.md"),
			'---\nname: init-simple-memorix\ndescription: fixture\nmetadata:\n  version: "1.0.0"\n---\n',
		);
		const residueResult = run(
			psExe,
			["-NoProfile", "-File", script, "-RepositoryRoot", root, "-Version", "14.0.0", ...residueArgs, "-DryRun"],
			root,
		);
		expect(residueResult.status).not.toBe(0);
	});

	powershellTest("TRANSITION-03 Apply calls registry Apply and Check exactly once", () => {
		const root = fixture();
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-RenameSkill",
				"init-simple-memorix=use-memorix",
				"-SkillVersion",
				"use-memorix=3.0.0",
				"-Apply",
			],
			root,
		);
		expect(result.status, result.stderr).toBe(0);
		expect(readFileSync(join(root, "calls.log"), "utf8").trim().split(/\r?\n/)).toEqual(["Apply", "Check"]);
		expect(JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8")).metadata.version).toBe(
			"14.0.0",
		);
		const tmpResidue: string[] = [];
		const walk = (dir: string) => {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (entry.name === ".git" || entry.name === "node_modules") continue;
				const full = join(dir, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith(".tmp")) tmpResidue.push(full);
			}
		};
		walk(root);
		expect(tmpResidue).toEqual([]);
	});

	powershellTest("TRANSITION-04 applies move keeping id and updates both plugins", () => {
		const root = fixture();
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-MoveSkill",
				"fixture-common-tools=dev-skills",
				"-Apply",
			],
			root,
		);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("move");
		expect(existsSync(join(root, "ai-plugins/dev-skills/skills/fixture-common-tools/SKILL.md"))).toBe(true);
		expect(existsSync(join(root, "ai-plugins/common-tools/skills/fixture-common-tools"))).toBe(false);
	});

	powershellTest("TRANSITION-05 applies remove and leaves no old directory", () => {
		const root = fixture();
		const result = run(
			psExe,
			[
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				script,
				"-RepositoryRoot",
				root,
				"-Version",
				"14.0.0",
				"-RemoveSkill",
				"fixture-dev-skills",
				"-Apply",
			],
			root,
		);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("remove");
		for (const plugin of ["common-tools", "dev-skills", "low-frequency-skill"])
			expect(existsSync(join(root, `ai-plugins/${plugin}/skills/fixture-dev-skills`))).toBe(false);
	});
});
```

实测补充（必须保留，否则 CI 会红）：

1. 增加 `PS-01`：断言 `release-ai-plugins.ps1` 与 `skill-transitions.ps1` 前三字节为 `EF BB BF`；该用例在所有平台执行。
2. `vi.setConfig({ testTimeout: 300000 })`：每例最多 spawn 3 个 PowerShell 进程，默认 5s 会超时。
3. 失败信息使用 `expect(result.status, result.stdout + result.stderr)`；脚本错误写 stdout，只带 stderr 会看不到原因。
4. fixture 的 workflow 只提供裸标记（`generate-skill-registry.ps1`、`skill-transitions.ps1`、
   `tests/release-ai-plugins`、`-Check`），主脚本 gate 不得要求完整仓库路径。

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/release-ai-plugins/skill-transitions.test.ts
```

- [ ] **Step 3：实现 helper 与主脚本分支**

`skill-transitions.ps1`：从 HEAD 三个 root 构建旧索引，从 working tree 构建新索引。rename 要求 from 只在 HEAD、to 只在
working；plugin 变化规范化为 rename-move。move 保持 id，Apply 时旧 plugin 目录移除、目标 plugin 目录出现且
registry/README/CHANGELOG 同步；remove 在 working 仍存在残留目录时由 Apply 删除。冲突、重复 id、
非法 plugin/semver、旧目录残留都在写入前 exit 1。

**文件编码硬要求：`skill-transitions.ps1` 与 `release-ai-plugins.ps1` 必须带 UTF-8 BOM。** Windows PowerShell 5.1
对无 BOM 的 UTF-8 按 ANSI 解码，中文报错文本会被撕裂成语法错误；必须新增 `PS-01` 断言锁定两个 `.ps1` 的前三字节为
`EF BB BF`，该断言在所有平台运行，不受 `powershellTest` 的 skip 影响。

主脚本新增 `-RepositoryRoot`；默认仍向上发现。`-SkillVersion` 精确设版本，不 bump；所有 `-SkillVersion` 条目都会进入
SkillChanges，无需额外 `-Skill`。`Write-Atomic` 目标存在用 `File.Replace`，不存在才 Move；中断不得留下目标丢失、
只剩 `.tmp` 的状态，TRANSITION-03 以"已存在 marketplace.json 被替换为 14.0.0 且全树无 `.tmp` 残留"锁定该行为。

**PS 5.1 错误处理硬要求：** 最终 `git diff --check` 段必须临时把 `$ErrorActionPreference` 切为 `Continue`，只按
`$LASTEXITCODE` 判定。PS 5.1 在 `Stop` 下会把原生命令 stderr（例如 git 的 CRLF 警告）升级为 `NativeCommandError`，
让本应通过的检查变成终止错误。

workflow 静态 gate 的必需字符串使用裸标记：`generate-skill-registry.ps1`、`skill-transitions.ps1`、
`tests/release-ai-plugins`、`-Check`、`contents: read`；不要要求完整仓库路径，测试 fixture 只提供裸名。

- [ ] **Step 4：增加 Windows 双 PS 5.1/7 CI**

在 `.github/workflows/ai-plugins-skill-registry-check.yml` 的 path filters 加 helper、release script、
`tests/release-ai-plugins/**` 与 `tests/vitest.config.ts`，并新增两个显式 job：

> 不要使用 `shell: ${{ matrix.shell }}`：GitHub Actions 会报
> `Unrecognized named-value: 'matrix'`，workflow 整体无法解析。矩阵只用于数据，shell 必须写死。

```yaml
transition-powershell:
  name: transition (PS 5.1)
  runs-on: windows-latest
  steps:
    - uses: actions/checkout@v6
    - uses: ./.github/actions/setup-monorepo
      with:
        node-version: "22.14.0"
        with-vercel: "false"
        install-flags: "--frozen-lockfile --ignore-scripts"
    - name: 运行 transition 集成测试
      shell: powershell
      env:
        USE_MEMORIX_PS_EXE: powershell.exe
        USE_MEMORIX_ALLOW_PWSH: "1"
      run: |
        pnpm exec vitest run `
          --config tests/vitest.config.ts `
          --reporter=default `
          tests/release-ai-plugins

transition-pwsh:
  name: transition (PS 7)
  runs-on: windows-latest
  steps:
    - uses: actions/checkout@v6
    - uses: ./.github/actions/setup-monorepo
      with:
        node-version: "22.14.0"
        with-vercel: "false"
        install-flags: "--frozen-lockfile --ignore-scripts"
    - name: 运行 transition 集成测试
      shell: pwsh
      env:
        USE_MEMORIX_PS_EXE: pwsh.exe
        USE_MEMORIX_ALLOW_PWSH: "1"
      run: |
        pnpm exec vitest run `
          --config tests/vitest.config.ts `
          --reporter=default `
          tests/release-ai-plugins
```

- [ ] **Step 5：验证并过 scope gate**

Task 9 只跑本机 PS5.1/7 并检查 workflow YAML，不等待尚未发布的 CI。Task 11 完成细粒度提交序列并 push 后，Task 12 验证
序列 tip（`CUTOVER_SHA`）的 Windows CI；CI 不得 skip，任一失败则阻止发布完成和卸旧。运行 scope helper，不提交。

### Task 10：执行硬切、版本 14.0.0 与 release surface test

**Files：**

- Delete：精确删除清单中的旧文件
- Modify：active docs、12 JSON、3 CHANGELOG、registry、router test、AGENTS
- Create：`tests/use-memorix/release-surface.test.ts`

- [ ] **Step 1：写完整 release surface test**

```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));
const manifests = [
	"ai-plugins/common-tools/.claude-plugin/plugin.json",
	"ai-plugins/common-tools/.cursor-plugin/plugin.json",
	"ai-plugins/common-tools/.codex-plugin/plugin.json",
	"ai-plugins/dev-skills/.claude-plugin/plugin.json",
	"ai-plugins/dev-skills/.cursor-plugin/plugin.json",
	"ai-plugins/dev-skills/.codex-plugin/plugin.json",
	"ai-plugins/low-frequency-skill/.claude-plugin/plugin.json",
	"ai-plugins/low-frequency-skill/.cursor-plugin/plugin.json",
	"ai-plugins/low-frequency-skill/.codex-plugin/plugin.json",
];

describe("use-memorix release surface", () => {
	test("RELEASE-01 hard-cuts the old tree and registry id", () => {
		expect(existsSync(resolve(root, "ai-plugins/low-frequency-skill/skills/init-simple-memorix"))).toBe(false);
		const registry = json("ai-plugins/skill-registry.json");
		expect(registry.skills.find((item: any) => item.id === "init-simple-memorix")).toBeUndefined();
		expect(registry.skills.find((item: any) => item.id === "use-memorix")).toMatchObject({
			plugin: "common-tools",
			version: "3.0.0",
			entry: "ai-plugins/common-tools/skills/use-memorix/SKILL.md",
		});
	});

	test("RELEASE-02 synchronizes plugin versions and Codex schema", () => {
		for (const file of manifests) expect(json(file).version, file).toBe("14.0.0");
		for (const file of [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"]) {
			const value = json(file);
			expect(value.metadata.version).toBe("14.0.0");
			expect(value.plugins.every((item: any) => item.version === "14.0.0")).toBe(true);
		}
		expect(json(".agents/plugins/marketplace.json")).not.toHaveProperty("version");
	});

	test("RELEASE-03 removes the old name from active surfaces", () => {
		for (const file of [
			"ai-plugins/common-tools/README.md",
			"ai-plugins/dev-skills/README.md",
			"ai-plugins/low-frequency-skill/README.md",
			"ai-plugins/docs/README.md",
			"ai-plugins/docs/use-vercel-skills-install.md",
			"README.md",
			"ai-plugins/common-tools/skills/install-mcp/SKILL.md",
			"AGENTS.md",
		])
			expect(read(file), file).not.toContain("init-simple-memorix");
	});
});
```

- [ ] **Step 2：确认失败**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix/release-surface.test.ts
```

- [ ] **Step 3：增量修改 active docs**

按精确行范围切新名/新路径；common/dev/low README 版本写 14.0.0；安装总览树迁移到 common；install-mcp 路由新 skill；AGENTS 只改 active 对外技能表，不做 2 号包历史 Markdown 改名。

- [ ] **Step 4：运行 release DryRun 与 Apply**

DryRun 前后运行 scope helper；确认零写入。Apply 只有用户明确授权才执行：

```powershell
$release = "ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1"
$versions = "use-memorix=3.0.0,init-ai-md=25.0.0,release-ai-plugins=2.2.0"
$more = "sync-local-global-agents-skills=1.0.0,install-mcp=1.4.2"
powershell -NoProfile -ExecutionPolicy Bypass -File $release `
  -Version 14.0.0 `
  -RenameSkill init-simple-memorix=use-memorix `
  -SkillVersion "$versions,$more" `
  -Summary "硬切 use-memorix 3.0 并收口 Memorix 治理" `
  -Date 2026-11-19 `
  -DryRun
```

审核 DryRun 后，把最后参数改为 `-Apply`。Expected：rename-move、五个固定 skill versions、9 manifests、2 versioned marketplaces、3 CHANGELOG；registry Apply/Check 各一次。

- [ ] **Step 5：更新 router resource test**

`packages/skill-router-mcp/tests/real-skill-resources.test.ts:72-102` 新增测试：registry.get(`use-memorix`) 并加载 `references/retrieval-and-golden-set.md`；断言 old id 抛 `SKILL_NOT_FOUND`。

- [ ] **Step 6：验证**

重复 Step 2，Expected：PASS。Skill Router 单独运行：

```bash
pnpm --dir packages/skill-router-mcp run test:unit
```

运行 scope helper，不提交。

### Task 11：全量验证、严格类型、范围门与细粒度 cutover 提交

**Files：** 本计划所有 source/test/docs/release 文件；不新增报告。

- [ ] **Step 1：运行 root skill tests（每条 1–2 路径）**

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/use-memorix
```

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/init-ai-md
```

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/release-ai-plugins
```

```bash
pnpm exec vitest run \
  --config tests/vitest.config.ts \
  --reporter=default \
  tests/sync-local-global-agents-skills
```

- [ ] **Step 2：运行严格类型与宽松解析检查**

```bash
pnpm exec tsc --noEmit -p ai-plugins/tsconfig.use-memorix.json
pnpm run typecheck:ai-plugins
```

Expected：两者 PASS；报告中分别标“严格类型通过”和“宽松 ai-plugins 配置可解析”，不得合并口径。

- [ ] **Step 3：运行 registry/router/scripts**

```bash
node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs \
  --check
pnpm --dir packages/skill-router-mcp run test:unit
```

帮助命令每次最多 2 个路径，均不得写配置：

```bash
pnpm exec tsx ai-plugins/common-tools/skills/use-memorix/scripts/install-mcp.ts --help
node ai-plugins/common-tools/skills/use-memorix/scripts/golden-set-operator.mjs --help
```

```bash
node ai-plugins/common-tools/skills/use-memorix/scripts/install-zcode-hook.mjs --help
node ai-plugins/common-tools/skills/use-memorix/scripts/capture-interactive.mjs --help
```

- [ ] **Step 4：仅格式化和检查受控文件**

按目录分开执行，每次一个路径：

```bash
pnpm exec prettier --experimental-cli --write --no-parallel \
  "ai-plugins/common-tools/skills/use-memorix/**/*.{md,mjs,ts,json}"
```

```bash
pnpm exec prettier --experimental-cli --write --no-parallel \
  "tests/use-memorix/**/*.{ts,mjs}"
```

对 init-ai-md、release、sync 各执行一条同结构命令；随后把 `--write` 改为 `--check` 重跑。禁止 `pnpm format`。

- [ ] **Step 5：冻结基线、allowlist 与 PRE SHA**

```bash
git status --porcelain=v1 --untracked-files=all
PRE_CUTOVER_SHA="$(git rev-parse HEAD)"
node tests/use-memorix/cutover-scope.mjs verify
node tests/use-memorix/cutover-scope.mjs pathspec
```

把 `PRE_CUTOVER_SHA` 回填 handoff 的对应栏。`.vitest-reporter-html/` 保持 ignored，不删除。

- [ ] **Step 6：精确暂存并覆盖 untracked whitespace**

```bash
git add \
  --pathspec-from-file=.git/use-memorix-cutover.pathspec \
  --pathspec-file-nul

git diff --cached --name-only
git diff --cached --check
```

人工把 cached 清单与 plan 精确文件清单逐行对照。出现 `docs/prompts/release-ai-plugins/02.md` 或计划外路径时：

```bash
git restore --staged docs/prompts/release-ai-plugins/02.md
```

不得修改其工作树内容。禁止 `git add .`、`git add -A`、宽目录 add。

- [ ] **Step 7：敏感、未决词与长命令 gate**

敏感扫描的主门是 `SCOPE-04`（随 `tests/use-memorix` 自动运行）：它在 pathspec 生成后扫描整个 staged 写集
（`.git/use-memorix-cutover.pathspec` 的每一行），生成前回退扫描 `CUTOVER_PATHS` + `DELETE_PATHS` 全集，
因此覆盖所有未来实现文件而不止三任务文档。唯一精确豁免是计划内脱敏 fixture 的假用户目录
`C:/Users/alice`（`tests/use-memorix/golden-set-contracts.test.ts` 的 `GOLD-02`）；其余任何
Windows 主目录前缀命中都视为违规。测试与本计划的模式字面量一律以字符类或拆分形式书写，避免自命中。
人工 rg 只作三任务文档的快速辅助：

```bash
rg -n "C:/Use|AKIA|gh[pou" \
  docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills
```

```bash
rg -n "Bearer +[A-Za-z0-9._-]{16,}" \
  docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills
```

人工 rg 命中的 `C:/Use` 行若属于 `GOLD-02` fixture（`alice`），核对后放行；其余命中立即阻塞。
未决词扫描使用拆分字符串，命令自身不会包含完整禁词：

```bash
node -e "const f=require('fs'),p=process.argv[1],w=['T'+'BD','TO'+'DO','implement '+'later','fill '+'in'];const s=f.readFileSync(p,'utf8');for(const x of w)if(s.includes(x))throw Error(x)" \
  docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/plan.md
```

长命令检查使用专用测试 `SCOPE-03`：读取 `tests/use-memorix/commands/task-01.txt`～`task-12.txt`，每个物理命令行（排除空行和注释）长度必须 `<=200`。这些文件是可执行命令的权威副本，Task 更新命令时必须同步更新对应文件；该测试已随 `tests/use-memorix` 运行。

- [ ] **Step 8：提交前本机双 PowerShell 门**

本机分别设置 `USE_MEMORIX_PS_EXE=powershell.exe` 和 `pwsh.exe` 运行 Task 9。本机缺少 `pwsh.exe` 时记录 BLOCKED，
以推送后 CI 的 `transition-pwsh` job 为准，不得 skip。此时只核验本机结果与 workflow 语法；新 CI 尚未推送，不得等待其运行。
Task 12 在 cutover push 后等待该 SHA 的 Windows CI 两格，通过后才可宣告发布完成或卸旧。

- [ ] **Step 9：细粒度 cutover 提交序列 + push**

仅在用户明确授权提交后，按逻辑域分笔提交。实测采用的 14 笔顺序（每笔单一职责，禁止 `git add .`）：

```text
1  🔨 build(ai-plugins): 严格类型与测试发现（tsconfig、vitest include、scope helper/tests/commands）
2  ✨ feat(use-memorix): MCP 三入口迁移 + characterization
3  ✨ feat(use-memorix): 七域路由 + 7 references + hooks 模板
4  ✨ feat(use-memorix): 黄金集 schema + 脱敏器
5  ✨ feat(use-memorix): ZCode 捕获 + 非 ZCode 交互采集
6  ✨ feat(use-memorix): ZCode 安装 + 黄金集 operator
7  ✨ feat(init-ai-md): 必选模板 12
8  ♻️ refactor(sync): 官方 Memorix skills 只读审计
9  ✨ feat(release-ai-plugins): transition + File.Replace 原子写
10 🔨 build(ci): PS 5.1/7 双 job
11 🔥 chore(ai-plugins)!: 删除旧 init-simple-memorix（BREAKING CHANGE 在此笔）
12 🔧 config(ai-plugins): 14.0.0 manifests/marketplace/CHANGELOG/registry + router test
13 📃 docs(ai-plugins): 活跃 README/AGENTS/install-mcp 路由
14 📃 docs(use-memorix): handoff 证据
```

- 每笔只暂存该职责的路径；提交前 `git diff --cached --check`。
- 拆分必须提供**最终树等价**证据：`git diff <series-tip> <拆分前同内容提交>` 为空。
- `CUTOVER_SHA` 取序列 tip；handoff 只在序列完成后回填一次，不得每笔都改。
- 若序列已 push 后仍需重写（例如首次粒度不合格）：必须单独取得用户 `force-with-lease` 授权，
  重写后重跑 CI、重新 `skills add`、更新 handoff 中的 SHA 引用。

```bash
git push
CUTOVER_SHA="$(git rev-parse HEAD)"
git status --porcelain=v1 --untracked-files=all
```

回填 handoff 的 `CUTOVER_SHA` 与 `CI_GREEN_SHA`；两者在本次执行中相同（序列 tip 的 CI 全绿）。

### Task 12：真实三平台插件 smoke、旧安装清理与唯一 handoff 回填

**Files：** runtime 唯一可修改 `handoff.md`；其他仓库文件只读。

- [ ] **Step 1：运行 runtime scope gate**

```bash
node tests/use-memorix/cutover-scope.mjs verify runtime
```

Expected：`scope-ok`。如果除 baseline dirty 和 handoff 外还有路径，BLOCKED。

先等待 CUTOVER_SHA 对应 Windows PS5.1/7 CI 都 PASS。然后在系统临时目录创建候选仓库副本（从 CUTOVER_SHA 导出），仅在副本中把三平台 marketplace name 改为 `use-memorix-smoke`。Claude 使用临时 `CLAUDE_CONFIG_DIR`，Codex 使用临时 `CODEX_HOME`，Cursor 使用 `--user-data-dir` 和 `--extensions-dir` 指向独立临时目录。参数仅给 smoke 子进程，不修改当前会话环境。先验证临时配置的 installed list 为空；隔离不成立即 BLOCKED。以下命令只在该临时副本和隔离配置运行，不得针对用户现有 `ruan-cat-tools` 执行卸载/删除。

- [ ] **Step 2：Claude Code 真实 plugin smoke**

先校验 manifest：

```bash
claude plugin validate --strict --json ai-plugins/common-tools
claude plugin marketplace add "$PWD"
claude plugin install common-tools@use-memorix-smoke --scope local -y
```

执行 `claude plugin details common-tools@use-memorix-smoke`，再启动隔离新 Claude session，验证 `use-memorix` 可发现、旧名不可发现。清理：

```bash
claude plugin uninstall common-tools --scope local -y
claude plugin marketplace remove use-memorix-smoke
```

命令缺失、登录/权限失败或新 session 无法验证时记录 Claude=`BLOCKED`；不得以 validate 通过替代安装。

- [ ] **Step 3：Cursor 真实 plugin smoke**

当前实测 `cursor 3.30.14` CLI 无 plugin 子命令，不能编造 CLI。使用 Cursor Marketplace/UI 安装本地或发布候选，Reload Window
后在新 Chat 验证新名存在、旧名消失，再由 UI 卸载并清理临时 marketplace/cache。UI 不可操作、未登录或不支持候选时记录
Cursor=`BLOCKED`；把版本与阻塞原因写入 handoff，整体发布保持 BLOCKED。

- [ ] **Step 4：Codex 真实 plugin smoke**

```bash
codex plugin marketplace add "$PWD" --json
codex plugin list --available --json --marketplace use-memorix-smoke
codex plugin add common-tools@use-memorix-smoke --json
```

新开 Codex task 验证 `use-memorix` 可发现、旧名不可发现。清理：

```bash
codex plugin remove common-tools@use-memorix-smoke --json
codex plugin marketplace remove use-memorix-smoke --json
```

任一步不可执行则 Codex=`BLOCKED`，不能以 manifest/registry 代替。

- [ ] **Step 5：正式安装并验证新入口，再卸旧**

三平台隔离 smoke、临时清理和 CUTOVER_SHA CI 全 PASS 后，恢复正常用户配置。经用户授权，从 exact SHA 正式安装；smoke 安装已经清理，不能据此卸旧。

```bash
SOURCE="https://github.com/ruan-cat/monorepo/tree/${CUTOVER_SHA}/ai-plugins/common-tools/skills"
skills add "$SOURCE" --skill use-memorix -g -y \
  -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
skills list -g --json
```

逐字节比对 `~/.agents/skills/use-memorix/SKILL.md` 与 CUTOVER_SHA，确认 version 3.0.0、七 references 和运行入口存在。在临时项目复制正式 launcher，输入缺失 structuredContent 的合法 envelope，验证 launcher 用 `os.homedir()` 加载**真实全局安装** runtime、exit 0 且无写入；另用合法脱敏 fixture 验证 inbox 写入。记录该模块路径和加载成功证据，不依赖已清理 smoke。

只有上述全部通过，才执行：

```bash
skills remove init-simple-memorix -g -y
skills list -g --json
```

清理失败或安装入口不完整时保留旧 skill，不开启下游门。隔离 smoke 中的旧名不可见仅说明候选插件，无权推断用户全局旧安装消失；正式 remove 后才检查全局旧名。

- [ ] **Step 6：唯一仓库改动——回填 handoff**

只回填 `handoff.md`：PRE/CUTOVER SHA、四组测试、PS5.1/7 CI、三平台 PASS/BLOCKED、清理结果、2/3 号包门。再运行：

```bash
git status --porcelain=v1 --untracked-files=all
node tests/use-memorix/cutover-scope.mjs verify runtime
git diff --check -- \
  docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/handoff.md
```

如用户明确授权提交：

```bash
git add -- \
  docs/prompts/release-ai-plugins/2026-11-16-remake-memorix-skills/handoff.md
git diff --cached --check
git commit \
  -m "docs(use-memorix): record cutover evidence" \
  -m "Record PRE/CUTOVER SHA, Windows CI, plugin smoke, cleanup, and downstream gates."
git push
```

### Task 12 本次执行结果（as-built）

| 项目             | 结果                                                                                          |
| :--------------- | :-------------------------------------------------------------------------------------------- |
| Claude Code      | PASS：`2.1.267` 隔离安装后 `Skills (17)` 含 `use-memorix`、无旧名；清理后零插件零 marketplace |
| Cursor           | BLOCKED：`3.30.14` CLI 无 `plugin` 子命令，UI 未自动化                                        |
| Codex            | BLOCKED：`0.149.1` marketplace/add/缓存校验/清理 PASS，但新 task 返回 401 `invalid_api_key`   |
| 正式安装         | PASS：与序列 tip 逐字节一致；7 references 齐全；薄启动器可加载真实全局 runtime 并写入候选     |
| 旧技能 remove    | **未执行**：三平台门未全绿，`init-simple-memorix` 全局安装保留                                |
| 下游 2/3 号包门  | 关闭                                                                                          |
| handoff 回填提交 | `8e77918a`（`HANDOFF_EVIDENCE_SHA` 栏说明以此提交自身为准）                                   |

因此本次任务状态是「已实施、发布闭环 BLOCKED」，不是「已实施并切换」。解除阻塞只需补 Cursor 可自动化入口
（或人工 UI smoke）与有效 Codex 凭据后的新 task 验证；两者通过后才执行 `skills remove`。

## 最终自检

- 12 个 Task 均有固定验证命令；测试任务均给出完整 imports、fixtures/helpers、describe/test 与断言。
- spec 能力矩阵每行都有固定 test name 与 Task owner，无 test name 即阻断。
- 所有现有 Modify 文件均有真实 line-range。
- schemaVersion 在 spec/plan/handoff 逐字一致。
- root tests 显式 `--reporter=default`；Skill Router 使用包脚本；严格 tsconfig 实际运行。
- scope gate 基于 porcelain v1 + allowlist；untracked 经 cached/no-index check；暂存无宽目录 add。
- 敏感扫描由 `SCOPE-04` 覆盖整个 staged 写集；只对新增行告警，HEAD 已有历史行按基线豁免，
  `GOLD-02` 的 fixture 主目录作为精确例外；模式字面量一律拆分书写避免自命中。
- PRE/CUTOVER SHA 分栏；回滚使用 `git revert --no-commit <PRE_CUTOVER_SHA>..<CUTOVER_SHA>` 的区间形式。
- `.ps1` 均带 UTF-8 BOM；`git diff --check` 段不依赖 `Stop` 捕获原生 stderr。
- 三平台 smoke 任一不可用均为 BLOCKED；不使用 `skills add` 冒充插件验证。
- `.vitest-reporter-html/` 保持 ignored，不清理。
