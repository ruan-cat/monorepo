# 提案：新增 low-frequency-skill 低频技能插件并集中迁移低频技能

## Why

随着开发推进，许多技能事实上是低频运行、低频维护的，却分散在 `common-tools`（20 个技能）与 `dev-skills`（7 个技能）两个插件中，甚至还有一个技能散落在外部项目 `D:\store\WorkBuddy\2026-6-30-common` 的 `docs/plan/` 下。低频技能与高频技能混编，导致插件 README、CHANGELOG、registry 的维护颗粒度不清，外部项目的技能也无法纳入统一的版本管理与发布流程。

本次变更新建 `ai-plugins/low-frequency-skill/` 插件目录，用剪切方式把 7 个低频技能集中迁移到此处，未来统一集中升级维护。这是 ai-plugins 插件体系从「双插件」到「三插件」的重大目录结构变更，所有硬编码双插件假设的基础设施必须同步适配。

## What Changes

1. **技能迁移（剪切）**：
   - 仓库内 5 个技能 `git mv` 到 `ai-plugins/low-frequency-skill/skills/`：`init-playwright`（来自 dev-skills）、`clone-ruancat-repo`、`get-git-branch`、`init-claude-code-statusline`、`init-simple-memorix`（来自 common-tools）。
   - 外部项目 2 个技能剪切入库：`init-tsconfig`、`factory-reset-vscode-fork-ide`（来自 `D:\store\WorkBuddy\2026-6-30-common`，该仓库侧删除文件并更新引用后提交推送）。
2. **新插件注册**：新建 3 份 plugin.json（Claude / Cursor / Codex），并在 3 份 marketplace.json 中追加插件条目；新建插件 README 与 CHANGELOG。
3. **基础设施三插件适配**：registry 生成器 roots、release 发布脚本、CI workflow paths、`packages/skill-router-mcp` 强校验与测试 fixture。
4. **文档同步**：`ai-plugins/docs/README.md` 目录树与可安装插件清单、三平台安装文档 README、`common-tools` / `dev-skills` 插件 README 的技能清单。
5. **跨仓库善后**：WorkBuddy 项目删除已迁移技能、更新文档引用、按 git-commit 技能分门别类提交并 push。

## Capabilities

### New Capabilities

- `low-frequency-skill-plugin`：定义 ai-plugins 第三插件目录的低频技能收纳边界、三平台 manifest/marketplace 注册契约、registry 三 roots 扫描契约、发布脚本与 CI 的多插件适配要求、跨仓库迁移善后要求。

### Modified Capabilities

<!-- 本次无既有主 spec 能力的修改：openspec/specs 下现有 automd-install-generator 与 changelog-parsing-verification 两个能力均不受影响 -->

## Impact

- **受影响代码**：`ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs`、`release-ai-plugins.ps1`、`.github/workflows/ai-plugins-skill-registry-check.yml`、`packages/skill-router-mcp/services/skill-registry.ts` 及 4 个测试文件。
- **受影响 manifest**：3 份 marketplace.json 追加条目；新增 3 份 plugin.json。全部版本保持 10.15.1 基线。
- **受影响文档**：`ai-plugins/docs/README.md`、三平台安装 README、`common-tools` / `dev-skills` README、新插件 README/CHANGELOG。
- **外部仓库**：`D:\store\WorkBuddy\2026-6-30-common` 删除 2 个技能目录并更新 3 个文件的引用，提交后 push。
- **明确不受影响**：`.github/workflows/skill-router-mcp.yml`（仅构建 `packages/skill-router-mcp`，不扫描技能目录）；`packages/skill-router-mcp` 运行时的 entry 路径校验（`isSafeSkillEntry` 对新插件路径天然放行）；根 `AGENTS.md`（技能间为名称引用，技能名未变）；`docs/prompts/**` 历史记录（不改写历史）。
- **已确认决策**：5 个既有技能 `metadata.version` 保持原值；全部版本保持 10.15.1 基线不 bump；`REQUIRED_REGISTRY_ROOTS` 纳入第三个 root。
