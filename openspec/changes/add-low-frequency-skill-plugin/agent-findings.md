# 已确认事实与发现（agent-findings）

## 目录与清单事实

- `ai-plugins/low-frequency-skill/` 为空目录（用户预建，git 未跟踪）。
- 全仓库 3 份 marketplace.json：`.claude-plugin/marketplace.json`（metadata.version 10.15.1，source `./ai-plugins/<x>`）、`.cursor-plugin/marketplace.json`（pluginRoot `ai-plugins`，source 为插件名）、`.agents/plugins/marketplace.json`（Codex，source 为 local 对象，无 version 字段）。
- 6 份 plugin.json：common-tools 与 dev-skills 各有 `.claude-plugin/`、`.cursor-plugin/`、`.codex-plugin/` 三份；Cursor/Codex 用 `"skills": "./skills"`。
- `ai-plugins/skill-registry.json`：27 条 skills，roots 2 项；每条字段 `id/plugin/name/description/version/entry`。

## 硬编码位置（需改动）

- `generate-skill-registry.mjs`：头部 roots 数组；约 246-250 行按插件计数（commonCount/devCount/total）。
- `release-ai-plugins.ps1`：105-110（6 份 plugin.json）、118-119（2 CHANGELOG）、122-123（2 README）、134-135（2 技能根）、156-157（glob）、189-192（git 扫描正则 `^ai-plugins/(common-tools|dev-skills)/skills/([^/]+)/`）、233（报错文案）、238-240（插件名推断兜底）、约 509（`$expectedNames = @("common-tools","dev-skills")`）。
- `.github/workflows/ai-plugins-skill-registry-check.yml`：pull_request 与 push 各 6 条 paths，含两个 skills 目录。
- `packages/skill-router-mcp/services/skill-registry.ts:18`：`REQUIRED_REGISTRY_ROOTS` 双 roots 超集校验。
- 测试 fixture 双 roots：`tests/production-harness.test.ts:23`、`tests/resource-pagination-race.test.ts:11`、`tests/skill-registry.test.ts:16`、`tests/skill-router.test.ts:8`；`tests/real-skill-resources.test.ts:21` 读真实 registry。

## 无需改动（已核实）

- `.github/workflows/skill-router-mcp.yml`：仅对 `packages/skill-router-mcp` 跑 typecheck/test/build，与技能目录无关。
- `packages/skill-router-mcp` 运行时 `isSafeSkillEntry`：entry 形如 `ai-plugins/<x>/skills/<name>/SKILL.md` 即合法，新插件天然放行。
- 根 `AGENTS.md`、`.workbuddy/memory/2026-06-30.md`、`docs/prompts/**`、`docs/plan/ai-plugins-multi-marketplace-refactor.md`：历史记录或名称引用，技能名未变，不改写。
- `install-mcp` SKILL.md 对 `init-simple-memorix` 为名称引用，技能名未变，无需改。

## 待迁移技能档案

| 技能                          | 来源                | 文件构成                                   | frontmatter 状态                                           | metadata.version |
| ----------------------------- | ------------------- | ------------------------------------------ | ---------------------------------------------------------- | ---------------- |
| init-playwright               | dev-skills/skills   | 1 文件                                     | 完整                                                       | 1.1.0            |
| clone-ruancat-repo            | common-tools/skills | SKILL.md + references/clone-commands.md    | 完整                                                       | 0.2.1            |
| get-git-branch                | common-tools/skills | 1 文件                                     | 完整                                                       | 0.1.0            |
| init-claude-code-statusline   | common-tools/skills | SKILL.md + templates/×2                    | 完整                                                       | 0.15.0           |
| init-simple-memorix           | common-tools/skills | 21 文件 7 子目录                           | 完整                                                       | 2.4.0            |
| init-tsconfig                 | WorkBuddy           | SKILL.md + references/strategy-matrix.md   | **完全缺失**，需补 name/description/user-invocable/version | 1.0.0（新）      |
| factory-reset-vscode-fork-ide | WorkBuddy           | SKILL.md + references/cleanup-audit-log.md | 缺 metadata.version                                        | 1.0.0（新）      |

- WorkBuddy 两个技能目录均被 git 追踪、工作区对该两目录无未提交改动，git rm 可行。
- 本机路径命中：仅 `init-tsconfig/references/strategy-matrix.md:3` 的 `D:\code\ruan-cat`（需脱敏）。
- WorkBuddy 引用清单：`docs/plan/2026-8-27-try-vscode/README.md:14`（必改）、`01.md` 8 处（改路径+注记）、`.workbuddy/memory/2026-09-05.md:101,103`（追加注记，不改历史）。
- WorkBuddy 仓库：分支 dev，已有用户暂存改动 `01.md`、`index.md`（提交时一并审视归类）。

## 历史经验引用

- 发布脚本 Apply 会重排 JSON 产生噪音 → 本次只 DryRun 不 Apply，版本同步留给后续发布（来自记忆：release-ai-plugins 脚本坑）。
- git-commit 前必须读 commit-types.ts 确认 emoji/type 映射，禁止凭记忆（来自记忆与 2026-07-02 事故案例）；本次 WorkBuddy 提交前实际抓取远程 raw commit-types.ts 确认 delete→🔪、docs→📃。
- registry 改动后必须重跑 generate-skill-registry --apply，README/CHANGELOG 同步（来自记忆：ai-plugins skill registry 校验坑）。

## 终审新发现（2026-09-05）

1. **Critical（已修复）**：根级测试 `tests/init-simple-memorix/install-mcp.test.ts:6-7` 直接 import 技能源码 `ai-plugins/common-tools/skills/init-simple-memorix/src/`，迁移后断链、根级 `pnpm test` 收集即失败。教训：**迁移 ai-plugins 技能目录时，grep 影响面必须包含根级 `tests/` 目录**（此前探索只覆盖了 packages/skill-router-mcp 的测试）。已改 import 指向新路径并验证 19/19 通过。
2. **Parked Minor（保留原样）**：`factory-reset-vscode-fork-ide/SKILL.md:39` 示例值 `D:/dev-tool/ai-ide/Qoder CN IDE` 为本机盘符风格路径。裁定：保留。理由：该技能的主题就是操作目标机器的 IDE 安装目录，示例路径与 references/cleanup-audit-log.md 的 C 盘审计路径同属用户刻意保留的领域内容；用户指示该技能「原样迁移仅补 metadata.version」，skill-hardening 的路径脱敏约束与技能领域语义冲突时按用户当前指示收敛。若未来要对外公开发布该插件，再统一泛化示例路径。
3. **既有阻塞（已处置）**：`dev-skills/skills/use-agent-browser` 空占位目录使本地 registry 生成失败（git 不跟踪空目录，CI 不可见）；移除后 TODO 089 意图仍保留于 `docs/prompts/release-ai-plugins/02.md`。
