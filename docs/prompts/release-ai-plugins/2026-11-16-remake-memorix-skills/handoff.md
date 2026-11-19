# use-memorix 3.0 任务包交接

## 状态

**已实施并切换（含两项已知风险）。**

1 号包的技能重构、测试、发布、14 笔细粒度 cutover、CI 双 PS 与 `use-memorix` 正式安装均已完成；
`init-simple-memorix` 已通过 `skills remove init-simple-memorix -g -y` 删除，CLI 注册表与 8 个目标目录双重验收均为 0。
2/3 号包门已开启；Cursor 插件 UI smoke 与 Codex 新会话验证未执行，作为**已知风险**随门传递，未伪造成三平台 PASS。

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
PRE_CUTOVER_SHA=f0da7be276776f6db3ad934d626009b19ef4275e
CUTOVER_SHA=5a60652bcf4299c3fb770a9d4c4e4bf3458a458b
HANDOFF_EVIDENCE_SHA=未产生
CI_GREEN_SHA=5a60652bcf4299c3fb770a9d4c4e4bf3458a458b
```

- `PRE_CUTOVER_SHA`：拆分序列起点之前的 HEAD。
- `CUTOVER_SHA`：14 笔细粒度 cutover 序列的 tip，也是发布树 SHA；实现内容以此为准。
- `CI_GREEN_SHA`：该 tip 的 `AI Plugins Skill Registry Check`（registry ubuntu/windows +
  transition PS 5.1/7）与根 `CI` 全绿。
- `HANDOFF_EVIDENCE_SHA`：本回填提交自身（`git log -1 -- <本文件>` 可查）。
- 历史说明：早期单笔 `07c1f44…` 与其后的 3 个修复提交已按用户要求重写为 14 笔；
  `07c1f44`、`9c961e47`、`2d7ec831` 在远端不再可达，任何下游引用一律作废。

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
- [ ] 三平台 smoke 记录齐全（全 PASS，或缺口属于环境/客户端能力且经用户明确接受为已知风险）且正式安装验证通过后，才执行官方 `skills remove init-simple-memorix -g -y`；未隔离验证前不得声称全局旧名不可见。
- [ ] 任一平台不可执行就标 BLOCKED；静态 JSON、registry、Skill Router、`skills add` 均不能替代。

### 2/3 号包门

- [ ] 只使用 `CUTOVER_SHA`，不使用 PRE/HANDOFF SHA。
- [ ] registry 只有新 id，active surface 无旧名。
- [ ] 三平台 smoke 记录齐全（PASS 或已记录并接受的风险缺口），旧独立安装已清理。
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
- 在未取得用户对剩余验证缺口的明确风险接受前 remove 旧独立 skill。
- 以「原子性」为由拒绝细粒度拆分；回滚必须按区间整体撤销。

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

| Gate                          | 结果    | SHA/证据                                                      |
| :---------------------------- | :------ | :------------------------------------------------------------ |
| scope/Vitest discovery/长命令 | PASS    | SCOPE-01～04；108 个 staged 文件；`staged-equal`              |
| MCP-01～04                    | PASS    | `tests/use-memorix/install-mcp.test.ts` 23 tests              |
| CAP-01～15                    | PASS    | `tests/use-memorix/capability-matrix.test.ts` 15 tests        |
| GOLD-01～04                   | PASS    | `tests/use-memorix/golden-set-contracts.test.ts` 9 tests      |
| CAPTURE-01～05/PERF-01        | PASS    | `retrieval-capture.test.ts` 6 tests；warm P95 < 100ms         |
| INSTALL-01～04                | PASS    | `zcode-install-operator.test.ts` 4 tests                      |
| INIT-01～03                   | PASS    | `tests/init-ai-md/memorix-governance.test.ts` 3 tests         |
| AUDIT-01～02 + sync           | PASS    | `tests/sync-local-global-agents-skills` 11 tests              |
| TRANSITION-01～05 本机        | PASS    | PS 5.1 链路 6 tests；本机无 `pwsh.exe`                        |
| Windows PS5.1 CI              | PASS    | run 44540508766 / CI_GREEN_SHA                                |
| Windows PS7 CI                | PASS    | run 44540508766 / CI_GREEN_SHA                                |
| RELEASE-01～03                | PASS    | `release-surface.test.ts` 3 tests                             |
| Skill Router unit             | PASS    | `pnpm --dir packages/skill-router-mcp run test:unit` 41 tests |
| strict tsc                    | PASS    | `tsc --noEmit -p ai-plugins/tsconfig.use-memorix.json`        |
| 宽松 ai-plugins 配置解析      | PASS    | `pnpm run typecheck:ai-plugins`（仅证明配置可解析）           |
| registry/Prettier/cached diff | PASS    | generator `--check` current；受控 glob `--check` 全绿         |
| 敏感/未决词（含 SCOPE-04）    | PASS    | SCOPE-04 覆盖 pathspec 全写集；plan/handoff 未决词扫描通过    |
| Claude plugin smoke/cleanup   | PASS    | `claude 2.1.267`；Skills （17） 含 `use-memorix`；已清理      |
| Cursor plugin smoke/cleanup   | BLOCKED | `cursor 3.30.14` CLI 无 plugin 子命令；UI 未自动化            |
| Codex plugin smoke/cleanup    | BLOCKED | `codex-cli 0.149.1` 安装/缓存/清理 PASS；新 task 401 无效 key |
| 正式安装 use-memorix 验证     | PASS    | 与 `CUTOVER_SHA` 逐字节一致；7 references；launcher 写入成功  |
| 旧独立 skill remove           | PASS    | CLI `MATCH_COUNT=0`；`.agents` + 7 个平台目标 `old=0/new=1`   |
| Task 12 runtime scope         | PASS    | 除 baseline 与 handoff 外无改动                               |

## 三平台 BLOCKED 记录

| 平台        | 状态     | 客户端版本 | 真实动作                                                                           | 阻塞/清理证据                                                                                |
| ----------- | -------- | ---------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Claude Code | PASS     | `2.1.267`  | marketplace add / install / enable / details / 清理                                | 隔离 `CLAUDE_CONFIG_DIR`；Skills （17） 含 `use-memorix`、无旧名；清理后零插件零 marketplace |
| Cursor      | 已知风险 | `3.30.14`  | CLI `--help` 无 `plugin` 子命令；`~/.cursor/skills` 不存在，旧全局技能从未对其生效 | 插件 UI smoke 未执行；删旧不影响 Cursor；不得用静态 JSON 或 `skills add` 冒充                |
| Codex       | 已知风险 | `0.149.1`  | marketplace add / list / add / cache 校验 / 清理 PASS                              | `codex exec` 新 task 返回 401 `invalid_api_key`，新会话验证未执行；文件级与插件安装级已验    |

三平台判定规则（本任务最终采用）：真实 smoke 全 PASS 可直接切换；若缺口来自环境/客户端能力而非技能缺陷，
且用户明确接受为已知风险、文档如实记录并给出恢复命令，也允许切换并开启下游门。禁止把缺口写成 PASS。

## 回滚顺序

### 未提交

按 allowlist 精确恢复本任务文件；不触碰基线 dirty。registry 由 pre-cutover tree 的 generator 重建，不手工拼接。

### 已提交未 push / 已 push

cutover 已是 14 笔序列，回滚按区间整体撤销，不逐笔挑拣：

```bash
git revert --no-commit f0da7be2..5a60652b
git commit -m "revert: 回滚 use-memorix 3.0 cutover 序列"
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

只有 12 个 Task 全有真实证据、cutover 序列已 push、三个插件 smoke 记录齐全（全 PASS 或已接受的风险缺口）、
旧独立 skill 已官方 remove、handoff 已唯一回填、2/3 号包收到 CUTOVER SHA 与三个 schemaVersion，
状态才可改为“已实施并切换”。风险缺口的接受必须由用户明确作出，并在本文与 spec/plan 中如实记录，不得改写为 PASS。

## 当前结论

- 12 个 Task 的实现与本地/CI 证据齐全；14 笔 cutover 序列已 push，`CUTOVER_SHA = CI_GREEN_SHA = 5a60652b`。
- 旧 `init-simple-memorix` 已删除：CLI `MATCH_COUNT=0`，`.agents/skills` 与 7 个 `DEFAULT_PLATFORMS` 目标均为
  `old=0/new=1`，源目录无坏链，官方七个 `memorix-*` 保持不变。
- `use-memorix` 就绪：与 dev tip 逐字节一致、7 references、5 scripts、`version 3.0.0`；WorkBuddy/Qoder 目录级软链自动可见。
- Claude Code PASS；Cursor 与 Codex 的插件 UI / 新会话验证未执行，作为**已知风险**接受（用户 2026-11-19 决策）。
- 2/3 号包门**已开启**；下游若遇到 Memorix 相关异常，先按下方恢复命令回装旧技能再定位。

## 卸载记录（2026-11-19）

契约：卸载 `init-simple-memorix`；验收 pattern `^init-simple-memorix$`；必须从 CLI 注册表、`~/.agents/skills`
与全部已验证同步目标消失；保留官方七个 `memorix-*` 技能；物理删除只作残留兜底，本次未使用。

```bash
skills remove init-simple-memorix -g -y
# Successfully removed 1 skill(s)
```

| 验收项                                 | 结果                     |
| :------------------------------------- | :----------------------- |
| CLI 注册表 `MATCH_COUNT`               | 0（技能总数 82 → 81）    |
| `~/.agents/skills/init-simple-memorix` | 不存在                   |
| 8 个目录（源 + 7 平台目标）            | `old=0 / new=1` 全部一致 |
| 官方 `memorix-*`                       | 7 个保持不变             |
| 源目录坏链                             | 0                        |

恢复命令（旧技能随 `PRE_CUTOVER_SHA` 永久可达）：

```bash
skills add https://github.com/ruan-cat/monorepo/tree/f0da7be2/ai-plugins/low-frequency-skill/skills \
  --skill init-simple-memorix -g -y -a claude-code -a codex
```

## 实施偏差与补充（均为证据驱动的必要调整）

1. **workflow 不能用 `shell: ${{ matrix.shell }}`**：GitHub Actions 报 `Unrecognized named-value: 'matrix'`；改为 `transition-powershell` 与 `transition-pwsh` 两个显式 job，门禁等价。
2. **`skill-transitions.ps1` 必须带 UTF-8 BOM**：CI 的 PS 5.1 按 ANSI 解码无 BOM 文件，中文报错文本撕裂脚本；已补 BOM 并新增 `PS-01` 回归断言。
3. **PS 5.1 的 NativeCommandError**：`$ErrorActionPreference="Stop"` 会把 git 的 CRLF stderr 升级为终止错误；最终 `git diff --check` 段临时切回 `Continue`，只按退出码判定。
4. **SCOPE-04 只对新增行告警**：仓库历史 CHANGELOG/README 已存在带主机路径的旧日志行；改写它们等于篡改历史证据，故以 HEAD 基线行做精确豁免，新增行仍严格阻塞。
5. **characterization 基线解析**：`PRE_CUTOVER_SHA` 之外增加 HEAD 与「删除提交的父提交」回退，保证 cutover 删除旧目录后测试仍能复验原字节，CI 不因缺 env 而红。
6. **发布日期用 2026-11-19**：实际执行日，未沿用设计稿的 2026-11-17。
7. **先发布后三平台 smoke**：按用户流水线授权执行 Apply 与 push；旧技能卸载严格保持未执行。
8. **单笔原子 cutover 改为 14 笔细粒度提交**：用户验收认为单笔 108 文件过粗；在不改变最终树的前提下，
   按「严格类型/测试门 → 三入口 → 七域 → schema → 捕获 → operator → init-ai-md → sync 审计 →
   release transition → CI → 删除旧技能 → 发布面 → 文档 → handoff」拆分为 14 笔，
   `git diff 5a60652b 原 2d7ec831` 为空证明内容等价；远端历史已用 force-with-lease 重写。
9. **删旧前置门由「三平台全 PASS」改为「全 PASS 或用户明确接受环境性风险缺口」**：Cursor 无插件 CLI、
   Codex 新会话因 401 无法执行，二者均非技能缺陷；用户在 2026-11-19 明确接受为已知风险后执行删旧并开启下游门。
   本文与 spec/plan 如实保留缺口，不写成 PASS。
