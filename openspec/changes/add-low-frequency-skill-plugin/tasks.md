# 任务清单：add-low-frequency-skill-plugin

> 执行约定：文件级粒度，每完成一项立即勾选；发现遗漏先回写本清单再继续实现。monorepo 侧改动不做 git commit（等用户明确指示）；WorkBuddy 侧按任务要求提交并 push。

## 试点批次（迁移核心，先验证方向）

- [x] [移动] `ai-plugins/dev-skills/skills/init-playwright` → `ai-plugins/low-frequency-skill/skills/init-playwright`（git mv 整目录，SKILL.md）
- [x] [移动] `ai-plugins/common-tools/skills/clone-ruancat-repo` → `ai-plugins/low-frequency-skill/skills/clone-ruancat-repo`（git mv，SKILL.md + references/clone-commands.md）
- [x] [移动] `ai-plugins/common-tools/skills/get-git-branch` → `ai-plugins/low-frequency-skill/skills/get-git-branch`（git mv，SKILL.md）
- [x] [移动] `ai-plugins/common-tools/skills/init-claude-code-statusline` → `ai-plugins/low-frequency-skill/skills/init-claude-code-statusline`（git mv，SKILL.md + templates/ 两个模板）
- [x] [移动] `ai-plugins/common-tools/skills/init-simple-memorix` → `ai-plugins/low-frequency-skill/skills/init-simple-memorix`（git mv 整目录，21 个文件 7 个子目录）
- [x] [新增] `ai-plugins/low-frequency-skill/skills/init-tsconfig/`（从 `D:\store\WorkBuddy\2026-6-30-common\docs\plan\2026-8-27-try-vscode\init-tsconfig` 剪切：SKILL.md + references/strategy-matrix.md；补 YAML frontmatter `name`/`description`/`user-invocable: true`/`metadata.version: "1.0.0"`；strategy-matrix.md 内 `D:\code\ruan-cat` 本机路径脱敏为通用表述）
- [x] [新增] `ai-plugins/low-frequency-skill/skills/factory-reset-vscode-fork-ide/`（从同项目 `clean-skills\factory-reset-vscode-fork-ide` 剪切：SKILL.md + references/cleanup-audit-log.md；仅补 `metadata.version: "1.0.0"`，既有 name/description 不动）
- [x] [新增] `ai-plugins/low-frequency-skill/.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`、`.codex-plugin/plugin.json`（字段结构对照 `ai-plugins/dev-skills/` 同名清单，版本 10.15.1）
- [x] [修改] `.claude-plugin/marketplace.json`、`.cursor-plugin/marketplace.json`、`.agents/plugins/marketplace.json` — 各追加 `low-frequency-skill` 插件条目（source 分别为 `./ai-plugins/low-frequency-skill`、`low-frequency-skill`、`{source:"local", path:"./ai-plugins/low-frequency-skill"}`；Codex 条目不带 version）
- [x] [新增] `ai-plugins/low-frequency-skill/README.md`（插件简介 + `### Skills （技能）` 清单覆盖 7 个技能）
- [x] [新增] `ai-plugins/low-frequency-skill/CHANGELOG.md`（初始建档条目，说明迁移来源）
- [x] [修改] `ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs` — roots 数组追加 `ai-plugins/low-frequency-skill/skills`，按插件计数输出扩展为三插件
- [x] [清理] `ai-plugins/dev-skills/skills/use-agent-browser` 空占位目录 — 执行中发现的既有阻塞：git 不跟踪空目录但会阻断本地 registry 扫描；已确认目录为空后移除（TODO 089 的技能意图保留在 `docs/prompts/release-ai-plugins/02.md`）
- [x] [验证] `node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply` 成功，随后 `--check` 通过；registry 顶层 roots 为 3 项、skills 共 29 条（16+6+7）、无跨插件 id 重复

## 主体任务（基础设施与文档同步）

- [x] [修改] `ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1` — 双插件硬编码扩为三插件：plugin.json 清单 6→9（约 105-110 行）、CHANGELOG 2→3（约 118-119）、README 2→3（约 122-123）、技能根 2→3（约 134-135）、glob 清单（约 156-157）、git 扫描正则与目录（约 189-192）、报错文案（约 233）、插件名推断覆盖 low-frequency-skill（约 238-240）、Codex marketplace 期望插件名数组 2→3（约 509）、文件头注释数字；另修复 NewSkill README gate 与 CHANGELOG 插件标签推断对第三插件的误指
- [x] [修改] `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md` — 契约文案同步：description、六个 plugin.json→九个、两个 CHANGELOG→三个、两个插件 README→三个、两个 Skill roots→三个、Codex marketplace 两条目→三条目、验收清单「九个 JSON」→「十二个 JSON」；`metadata.version` 2.0.0→2.1.0（技能自身行为变更）
- [x] [修改] `.github/workflows/ai-plugins-skill-registry-check.yml` — pull_request 与 push 两处 paths 各追加 `"ai-plugins/low-frequency-skill/skills/**"`
- [x] [确认] `.github/workflows/skill-router-mcp.yml` 不做修改（design.md 已记录理由，作为「无需改动」结论归档）
- [x] [修改] `packages/skill-router-mcp/services/skill-registry.ts` — `REQUIRED_REGISTRY_ROOTS` 追加 `"ai-plugins/low-frequency-skill/skills"`
- [x] [修改] `packages/skill-router-mcp/tests/production-harness.test.ts`、`tests/resource-pagination-race.test.ts`、`tests/skill-registry.test.ts`、`tests/skill-router.test.ts` — fixture 的 roots 数组同步改为三项；grep 复核其余测试无 roots 硬编码需同步
- [x] [修改] `ai-plugins/docs/README.md` — `## 目录结构` 树追加 low-frequency-skill 分支，`## 可安装插件` 清单追加条目
- [x] [修改] `.claude-plugin/README.md`、`.cursor-plugin/README.md`、`.agents/plugins/README.md` — 安装/更新/卸载文档的插件清单追加 low-frequency-skill（含对应安装命令示例）
- [x] [修改] `ai-plugins/common-tools/README.md` — Skills 清单移除 `get-git-branch`、`init-claude-code-statusline` 条目，目录树移除对应两行（约 163、168、493、498 行）
- [x] [确认] `ai-plugins/dev-skills/README.md` — grep `init-playwright` 零命中，无需修改
- [x] [验证] `pnpm --dir packages/skill-router-mcp run typecheck` 通过；`pnpm --dir packages/skill-router-mcp run test:all` 全部通过（unit 14 文件 40 用例 + worker 2 用例 + integration 4 用例）
- [x] [验证] release 脚本 DryRun 零写入且计划覆盖新插件相关文件（实际执行：`-Version 10.16.0 -ChangeType patch -Skill get-git-branch`；10.15.1 因 CHANGELOG 已存在该版本条目被正确拒绝，改用未发布的 10.16.0 完成计划校验。证据：9 份 plugin.json 计划、12 份 JSON 可解析、Codex 三 manifest + marketplace 通过、`升级技能: get-git-branch（low-frequency-skill）` 插件归属推断正确、git diff --check 通过）
- [x] [验证] registry 在 SKILL.md 版本升 2.1.0 后重新 `--apply` + `--check` 通过（29 条 / 3 roots）

## 善后任务（WorkBuddy 跨仓库）

- [x] [删除] `D:\store\WorkBuddy\2026-6-30-common\docs\plan\2026-8-27-try-vscode\init-tsconfig\`（git rm，2 个文件）
- [x] [删除] `D:\store\WorkBuddy\2026-6-30-common\docs\plan\2026-8-27-try-vscode\clean-skills\factory-reset-vscode-fork-ide\`（git rm，2 个文件；clean-skills 空目录一并清理）
- [x] [修改] WorkBuddy `docs/plan/2026-8-27-try-vscode/README.md` — 目录树移除 `init-tsconfig/` 行并补迁移说明（技能已迁至 ruan-cat/monorepo 的 ai-plugins/low-frequency-skill）
- [x] [修改] WorkBuddy `01.md` — 8 处 `factory-reset-vscode-fork-ide` 路径引用更新为迁移后位置并附迁移说明
- [x] [修改] WorkBuddy `.workbuddy/memory/2026-09-05.md` — 文末追加迁移注记指向新位置，不改写既有历史行
- [x] [提交] WorkBuddy 仓库按全局 git-commit 技能分门别类提交并 push：已先读 git-commit 技能并抓取 commit-types.ts 确认 emoji 映射（delete→🔪、docs→📃）；3 个提交 `7e37451`（用户日志改动先行独立提交）/ `4253200`（删除两个技能目录 + README 树更新）/ `0f4826a`（引用更新 + memory 善后注记），均含 `Assisted-by: ZCode / GLM-5.3-Flash` trailer；push 成功 `e6649ba..0f4826a dev -> dev`
- [x] [验证] WorkBuddy 项目内 grep `init-tsconfig`、`factory-reset-vscode-fork-ide` 无指向已删除路径的断链引用（残留提及均为历史记录原文或本次新增注记，已逐条说明）；push 后工作区干净

## 终审修复（复核子代理发现的回归）

- [x] [修改] `tests/init-simple-memorix/install-mcp.test.ts` 第 6-7 行 — 两行 import 指向旧路径 `ai-plugins/common-tools/skills/init-simple-memorix/src/`（迁移引入的真实回归，根级 `pnpm test` 收集即失败），改为 `ai-plugins/low-frequency-skill/skills/init-simple-memorix/src/`；验证：`pnpm exec vitest run tests/init-simple-memorix/install-mcp.test.ts` 19/19 通过（exit 0）
