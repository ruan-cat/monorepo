# use-memorix 3.0 任务包交接

## 状态

**未实施。**

截至 2026-11-17，本目录只完成设计工件。尚未进行技能重构、迁移、测试、registry 生成、版本升级、插件安装/卸载、发布、暂存、提交、推送或记忆写入。

## 当前 Git 基线

| 项目                      | 实测值                                             |
| ------------------------- | -------------------------------------------------- |
| 分支                      | `dev`                                              |
| 设计接入 HEAD             | `ccc63e92ae79a986d8715be8b1ab2852d0a39f07`         |
| 既有 dirty                | `M docs/prompts/release-ai-plugins/02.md`          |
| index                     | 空                                                 |
| reviewer ignored artifact | `.vitest-reporter-html/`；不清理、不纳入 allowlist |

接入前 `02.md` 不属于 1 号包，禁止覆盖、恢复、暂存或提交。

### SHA 回填栏

```text
PRE_CUTOVER_SHA=未产生
CUTOVER_SHA=未产生
HANDOFF_EVIDENCE_SHA=未产生
```

- `PRE_CUTOVER_SHA`：Task 11 暂存/提交前的 HEAD。
- `CUTOVER_SHA`：单笔原子 cutover commit push 后的 HEAD，供 2/3 号包消费。
- `HANDOFF_EVIDENCE_SHA`：Task 12 只回填 handoff 后的可选 docs commit；不得冒充 cutover SHA。

### 执行者第一条命令

```bash
git status --porcelain=v1 --untracked-files=all
git diff --cached --name-only
git rev-parse HEAD
git branch --show-current
```

若 HEAD、dirty 或 index 与记录冲突，先更新基线并让用户决定；禁止 reset、checkout、stash 或覆盖用户文件。

## 冻结接口

```text
GOLDEN_SET_CASE_SCHEMA_VERSION=memorix-golden-set-case/v1
RETRIEVAL_CANDIDATE_SCHEMA_VERSION=memorix-retrieval-candidate/v1
FEDERATION_BUNDLE_SCHEMA_VERSION=memorix-golden-set-bundle/v1
```

必须从 `CUTOVER_SHA` 的 `ai-plugins/common-tools/skills/use-memorix/src/golden-set/contracts.mjs` 消费；不得从 handoff docs commit 或浮动分支推断。

共享 TypeScript 接口（`CaptureInput`、`InteractiveIo`、`InstallPlan`、`AcceptInput`、`CleanupInput`、`ExportInput`、`NormalizedSearchResult` 等）以 `plan.md`「冻结接口」章节为唯一权威定义；实施者不得自创、改名或留空这些接口。

## 冻结 allowlist 合同

- 逐文件 allowlist 权威：未来实现的 `tests/use-memorix/cutover-scope.mjs` 中 `CUTOVER_PATHS`。
- 受控删除是精确 24 项清单（`DELETE_PATHS`），不是前缀放行：旧 `init-simple-memorix/` 的 21 个 tracked 文件、
  旧 sync refresh 两个文件（`fetch-memorix-skills.ts`、`src/memorix.ts`）、旧 `tests/init-simple-memorix/install-mcp.test.ts`；
  porcelain 状态只接受 `D`/`D`，任何删除项缺失、改名或出现其他删除都阻塞。
- `writePathspec` 把全部预期变更（含 24 项删除）冻结进 `.git/use-memorix-cutover.pathspec`；暂存后必须断言
  「实际 staged 集合 == pathspec 冻结集合」的精确相等（非超集检查），并拒绝任何残留未暂存改动。
- 已知基线 dirty 只允许 `docs/prompts/release-ai-plugins/02.md`。
- runtime 模式只允许 `handoff.md`；Task 12 其他仓库改动一律阻塞。
- 状态检查固定使用 `git status --porcelain=v1 --untracked-files=all`，并保留 porcelain XY 状态码用于逐类判定。
- untracked whitespace 必须经 `git diff --no-index --check -- /dev/null <file>`，或逐文件精确暂存后 `git diff --cached --check`。
- 暂存只允许 NUL pathspec file 或逐文件路径；禁止 `git add .`、`git add -A`、宽目录 add。
- `.vitest-reporter-html/` 是 reviewer 生成的 ignored artifact；不删除、不暂存、不把它当计划外 dirty。

## 冻结任务与测试门

| 能力/发布门                                                              | 固定测试或命令                                 | Task |
| ------------------------------------------------------------------------ | ---------------------------------------------- | ---- |
| 测试发现与范围                                                           | `SCOPE-01`、`SCOPE-02`、`SCOPE-03`             | 1    |
| MCP 三入口                                                               | `MCP-01`～`MCP-04`                             | 2    |
| hooks/setup/platform/memory/session/retention/health/dashboard/embedding | `CAP-01`～`CAP-15`                             | 3    |
| schemas/redactor                                                         | `GOLD-01`～`GOLD-04`                           | 4    |
| 自动/交互捕获与结构判定                                                  | `CAPTURE-01`～`CAPTURE-05`、`PERF-01`          | 5    |
| ZCode install/operator                                                   | `INSTALL-01`～`INSTALL-04`                     | 6    |
| init-ai-md 必选增量                                                      | `INIT-01`～`INIT-03`                           | 7    |
| 官方七技能只读审计                                                       | `AUDIT-01`、`AUDIT-02` + sync tests            | 8    |
| release transitions                                                      | `TRANSITION-01`～`TRANSITION-05`，PS5.1/7 CI   | 9    |
| active release surface                                                   | `RELEASE-01`～`RELEASE-03` + Skill Router unit | 10   |
| 全量/类型/格式/范围/提交                                                 | Task 11 全部命令                               | 11   |
| Claude/Cursor/Codex 真插件 smoke、remove、handoff                        | Task 12                                        | 12   |

能力矩阵任一固定测试名缺失、skip 或失败即阻塞；`rg` 不能替代测试。

## 依赖门

### 开始实施前

- [ ] 用户在未来实施会话明确授权实施。
- [ ] status/index/HEAD 已重新读取并冻结 allowlist。
- [ ] spec、plan、handoff 已完整阅读。
- [ ] 当前 Memorix 与各插件 CLI 的 version/help 已读取。

### 删除旧目录前

- [ ] Task 1–3 完成。
- [ ] `MCP-01`～`MCP-04` 与 `CAP-01`～`CAP-15` 全绿。
- [ ] 无 WorkBuddy hook 与旧 ZCode lifecycle 模板。

### release Apply 前

- [ ] Task 4–9 完成。
- [ ] candidateId/time/GitHub identity/signals/rules/structuredContent 负例全绿。
- [ ] 非 ZCode `capture-interactive` 可执行且默认 preview。
- [ ] init-ai-md、只读审计、transition tests 全绿。
- [ ] 本机 `powershell.exe` 5.1 与 `pwsh.exe` 7 双链路全绿，且 workflow YAML 语法校验通过；新增 Windows CI 在 cutover push 前不存在，本阶段禁止等待其结果。
- [ ] DryRun 零写入；用户明确授权 Apply。

### 原子 commit 前

- [ ] root tests 均以 `--reporter=default` 运行。
- [ ] strict `tsconfig.use-memorix.json` 通过；宽松 typecheck 仅标“配置可解析”。
- [ ] Skill Router 使用 `pnpm --dir packages/skill-router-mcp run test:unit` 通过。
- [ ] registry、Prettier、cached diff check、敏感（`SCOPE-04` 覆盖整个 staged 写集，仅精确豁免 `GOLD-02` 的 `C:/Users/alice` fixture）、未决词、长命令检查通过。
- [ ] `PRE_CUTOVER_SHA` 已回填。
- [ ] cached 文件逐行符合 allowlist 且不含 `02.md`。
- [ ] 用户明确授权 commit；commit 使用 plan 中三段 `-m`，随后正常 push。

### 发布完成前

- [ ] `CUTOVER_SHA` 已回填且远端可见。
- [ ] `CUTOVER_SHA` 触发的 Windows `powershell.exe` 5.1 与 `pwsh.exe` 7 CI 两格全绿；任一失败即停止发布完成声明。
- [ ] 三平台 smoke 均在隔离配置/临时 marketplace 的仓库副本中执行，未对用户既有 `ruan-cat-tools` 安装执行任何卸载/删除。
- [ ] Claude Code 真实 marketplace/install/new-session/uninstall 清理 PASS。
- [ ] Cursor 真实 Marketplace/UI install/reload/new-chat/uninstall 清理 PASS。
- [ ] Codex 真实 marketplace/add/new-task/remove 清理 PASS。
- [ ] 隔离 smoke 清理后，经用户授权从 exact `CUTOVER_SHA` 正式安装 `use-memorix`，并验证 `~/.agents/skills/use-memorix/` 实际入口（逐字节比对 SKILL.md、七 references、薄启动器加载真实全局 runtime）PASS。
- [ ] 三平台全绿且正式安装验证通过后，才执行官方 `skills remove init-simple-memorix -g -y`；未隔离验证前不得声称全局旧名不可见。
- [ ] 任一平台不可执行就标 BLOCKED；静态 JSON、registry、Skill Router、`skills add` 均不能替代。

### 2/3 号包门

- [ ] 只使用 `CUTOVER_SHA`，不使用 PRE/HANDOFF SHA。
- [ ] registry 只有新 id，active surface 无旧名。
- [ ] 三平台真实 smoke 全 PASS，旧独立安装已清理。
- [ ] schemas validator、合法/非法 bundle fixtures 全绿。

## 禁止动作

- 修改冻结设计以绕过测试。
- 修改、暂存或提交 `docs/prompts/release-ai-plugins/02.md`。
- 清理 ignored `.vitest-reporter-html/`。
- 用宽目录或全仓暂存。
- 在三入口搬家时统一算法差异。
- 从文本猜 structuredContent 字段。
- 将 query 正文、结果正文、bundle observationId、凭据或用户主目录写入 tracked 资产。
- 让产品项目 CI 访问黄金集。
- 将根宽松 `typecheck:ai-plugins` 声称为类型安全。
- 用 `skills add` 冒充 Claude/Cursor/Codex 插件 smoke。
- 在三平台全绿前 remove 旧独立 skill。
- 多笔拆分 cutover commit，或按内部职责拆分回滚。

## 预期文件矩阵

详细逐文件列表与现有文件 line-range 见 `plan.md`。

| 领域             | Create/modify/delete                                               | 验收                                    |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------- |
| 测试/类型/范围   | strict tsconfig、Vitest include、scope helper/tests                | reporter default、strict tsc、allowlist |
| use-memorix      | SKILL、7 references、三入口、schemas、capture、operator、templates | MCP/CAP/GOLD/CAPTURE/INSTALL/PERF       |
| init-ai-md       | 模板 12 与三处文档                                                 | INIT tests                              |
| sync             | audit runtime，删除 refresh runtime                                | AUDIT + sync tests                      |
| release          | transition helper、主脚本、CI、测试                                | TRANSITION + PS5.1/7                    |
| release surface  | active docs、12 JSON、3 CHANGELOG、registry/router                 | RELEASE + router unit                   |
| runtime evidence | 只回填 handoff                                                     | runtime scope gate                      |

### 版本矩阵

| 资产                              | 目标          |
| --------------------------------- | ------------- |
| `use-memorix`                     | `3.0.0`       |
| `init-ai-md`                      | `25.0.0`      |
| `release-ai-plugins`              | `2.2.0`       |
| `sync-local-global-agents-skills` | `1.0.0`       |
| `install-mcp`                     | `1.4.2`       |
| 三插件                            | `14.0.0`      |
| registry schema                   | `1`（不升级） |

## 验收回填表

当前均为未执行，不得填“应该通过”。

| Gate                          | 结果   | SHA/证据 |
| ----------------------------- | ------ | -------- |
| scope/Vitest discovery/长命令 | 未执行 | 未产生   |
| MCP-01～04                    | 未执行 | 未产生   |
| CAP-01～15                    | 未执行 | 未产生   |
| GOLD-01～04                   | 未执行 | 未产生   |
| CAPTURE-01～05/PERF-01        | 未执行 | 未产生   |
| INSTALL-01～04                | 未执行 | 未产生   |
| INIT-01～03                   | 未执行 | 未产生   |
| AUDIT-01～02 + sync           | 未执行 | 未产生   |
| TRANSITION-01～05 本机        | 未执行 | 未产生   |
| Windows PS5.1 CI              | 未执行 | 未产生   |
| Windows PS7 CI                | 未执行 | 未产生   |
| RELEASE-01～03                | 未执行 | 未产生   |
| Skill Router unit             | 未执行 | 未产生   |
| strict tsc                    | 未执行 | 未产生   |
| 宽松 ai-plugins 配置解析      | 未执行 | 未产生   |
| registry/Prettier/cached diff | 未执行 | 未产生   |
| 敏感/未决词（含 SCOPE-04）    | 未执行 | 未产生   |
| Claude plugin smoke/cleanup   | 未执行 | 未产生   |
| Cursor plugin smoke/cleanup   | 未执行 | 未产生   |
| Codex plugin smoke/cleanup    | 未执行 | 未产生   |
| 正式安装 use-memorix 验证     | 未执行 | 未产生   |
| 旧独立 skill remove           | 未执行 | 未产生   |
| Task 12 runtime scope         | 未执行 | 未产生   |

## 三平台 BLOCKED 记录

| 平台        | 状态   | 客户端版本                           | 真实动作                                         | 阻塞/清理证据                                       |
| ----------- | ------ | ------------------------------------ | ------------------------------------------------ | --------------------------------------------------- |
| Claude Code | 未执行 | 未记录                               | marketplace/install/new session/uninstall        | 未记录                                              |
| Cursor      | 未执行 | 当前设计期实测 `3.30.14`；实施时重测 | Marketplace/UI install/reload/new chat/uninstall | 当前 CLI 无 plugin 子命令；若 UI 不可操作则 BLOCKED |
| Codex       | 未执行 | 未记录                               | marketplace/add/new task/remove                  | 未记录                                              |

任一行为 BLOCKED 时，任务状态不得改成“已实施并切换”，2/3 号包门保持关闭，旧独立 skill 不 remove。

## 回滚顺序

### 未提交

按 allowlist 精确恢复本任务文件；不触碰基线 dirty。registry 由 pre-cutover tree 的 generator 重建，不手工拼接。

### 已提交未 push / 已 push

统一：

```bash
git revert <CUTOVER_SHA>
git push
```

不按职责拆分、不 reset、不 force push。用 `PRE_CUTOVER_SHA` 验证 registry/manifests/docs/旧技能恢复；完成真实三平台回滚 smoke 后，再清理新 skill 的独立残留（若有）。

### 项目 ZCode hook

定点移除 use-memorix PostToolUse 条目；只删除带 canonical marker 的 launcher；保留 `.memorix/hooks.json` 与 tracked golden set，`.local/` 清理另授权。

## 阻塞条件

1. status/index/HEAD 与基线冲突且用户未决定。
2. allowlist 外路径出现，或宽目录暂存污染 cached 清单。
3. 能力矩阵固定测试名缺失、skip 或失败。
4. strict tsc、root tests、router unit、registry、format/diff/sensitive/placeholder/length 任一失败。
5. candidateId、signals/rules、time、identity、structuredContent 负例未锁定。
6. 非 ZCode 交互入口不可执行。
7. PS5.1 或 PS7 Windows CI 任一缺失/失败。
8. DryRun 写文件、Apply 原子写或 registry 调用次数异常。
9. 用户未授权 Apply/commit/push/plugin install/remove。
10. Claude/Cursor/Codex 任一真实 smoke BLOCKED/FAIL。
11. PRE/CUTOVER SHA 未分别产生或无法验证。
12. Task 12 除 handoff 外修改了仓库文件。

## 交接完成定义

只有 12 个 Task 全有真实证据、单笔 cutover commit 已 push、三个插件 smoke 全 PASS 且清理完成、旧独立 skill 已官方 remove、handoff 已唯一回填、2/3 号包收到 CUTOVER SHA 与三个 schemaVersion，状态才可改为“已实施并切换”。
