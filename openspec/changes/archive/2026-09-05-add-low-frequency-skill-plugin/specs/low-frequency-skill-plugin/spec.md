# 低频技能插件

## ADDED Requirements

### Requirement: 低频技能插件目录与迁移清单

系统 SHALL 在 `ai-plugins/low-frequency-skill/` 下维护第三插件目录，收纳低频运行、低频维护的技能；迁移后的技能目录结构 MUST 与既有插件一致（`skills/<skill-name>/SKILL.md` 为入口，附属目录整体随迁）。

#### 场景：迁移仓库内既有技能

- **当** 执行技能迁移时，
- **则** `init-playwright`、`clone-ruancat-repo`、`get-git-branch`、`init-claude-code-statusline`、`init-simple-memorix` 五个技能目录整体（含 references/、templates/、scripts/、src/、fallback/、templates-global/ 等附属目录）从原插件剪切到 `ai-plugins/low-frequency-skill/skills/` 下，且原位置不再保留任何文件，
- **并且** 5 个技能的 `metadata.version` 保持原值不变（1.1.0、0.2.1、0.1.0、0.15.0、2.4.0）。

#### 场景：剪切外部项目技能入库

- **当** 从 `D:\store\WorkBuddy\2026-6-30-common` 剪切 `init-tsconfig` 与 `factory-reset-vscode-fork-ide` 两个技能时，
- **则** 两个技能在 `ai-plugins/low-frequency-skill/skills/` 下落位并补齐本仓库规范的 YAML frontmatter（`name`、`description`、`metadata.version`，新起草的 frontmatter 附带 `user-invocable`），`metadata.version` 从 `1.0.0` 起步，
- **并且** 技能文件内不得残留本机盘符绝对路径（如 `D:\code\ruan-cat`），需改为通用表述。

### Requirement: 三平台 manifest 与 marketplace 注册

系统 SHALL 为 `ai-plugins/low-frequency-skill/` 提供 Claude、Cursor、Codex 三平台 plugin.json，并在三份 marketplace.json 中注册插件条目；全部版本 MUST 与当前插件体系基线（10.15.1）保持一致，不得顺手升级版本。

#### 场景：新增插件 manifest

- **当** 创建新插件的平台清单时，
- **则** `ai-plugins/low-frequency-skill/` 下存在 `.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`、`.codex-plugin/plugin.json`，字段结构对照 `ai-plugins/dev-skills/` 的同名清单，`skills` 指向 `./skills`，
- **并且** `.claude-plugin/marketplace.json`、`.cursor-plugin/marketplace.json`、`.agents/plugins/marketplace.json` 各追加一个 `low-frequency-skill` 插件条目，Codex marketplace 条目不得携带 version 字段。

#### 场景：插件 README 与 CHANGELOG 建档

- **当** 新插件进入发布体系时，
- **则** `ai-plugins/low-frequency-skill/README.md` 的 Skills 清单覆盖全部 7 个迁移技能，`ai-plugins/low-frequency-skill/CHANGELOG.md` 建档记录迁移初始版本，
- **并且** 既有 `common-tools` 与 `dev-skills` 的 README Skills 清单、目录树中不再出现已迁出技能。

### Requirement: skill-registry 三 roots 扫描与生成

`ai-plugins/skill-registry.json` 的唯一 canonical 写入者 SHALL 扫描三个技能根目录，新插件技能 MUST 与既有技能同规则收录。

#### 场景：生成器纳入第三个 root

- **当** `generate-skill-registry.mjs` 扫描技能根时，
- **则** roots 数组包含 `ai-plugins/common-tools/skills`、`ai-plugins/dev-skills/skills`、`ai-plugins/low-frequency-skill/skills` 三项，产出的 registry 顶层 `roots` 为这三个字符串、`skills` 共 29 条（16 + 6 + 7），
- **并且** `node generate-skill-registry.mjs --apply` 后立即执行 `--check` 通过，输出确定性（UTF-8 无 BOM、LF、固定排序）。

#### 场景：frontmatter 校验对新技能生效

- **当** 新插件技能的 frontmatter 缺失 `name`、`description` 或合法 `metadata.version` 时，
- **则** 生成器必须非零失败并指出具体技能，
- **并且** `init-tsconfig`、`factory-reset-vscode-fork-ide` 入库后 frontmatter 完整，跨插件技能 id 无重复。

### Requirement: 发布脚本与 CI 的多插件适配

发布编排与 CI 校验 SHALL 覆盖三个插件，任何单插件硬编码清单 MUST 更新为三插件清单。

#### 场景：发布脚本覆盖三插件

- **当** 运行 `release-ai-plugins.ps1` 时，
- **则** 脚本扫描与同步的 plugin.json 为 9 份、CHANGELOG 为 3 份、插件 README 为 3 份、技能根为 3 个，git 变更扫描正则与插件名推断覆盖 `low-frequency-skill`，Codex marketplace 校验的期望插件名数组为 3 项，
- **并且** DryRun 模式零写入且计划清单包含新插件相关文件。

#### 场景：CI registry 校验覆盖新插件

- **当** 新插件下技能文件发生变更时，
- **则** `.github/workflows/ai-plugins-skill-registry-check.yml` 的 paths 过滤包含 `ai-plugins/low-frequency-skill/skills/**`，registry check 在 Ubuntu 与 Windows 上均通过，
- **并且** `.github/workflows/skill-router-mcp.yml` 保持不变（它仅构建 `packages/skill-router-mcp`，不扫描技能目录）。

### Requirement: skill-router-mcp 强校验对齐

Skill Router MCP 的 registry 解析强校验 SHALL 要求三个 roots 齐备，测试 fixture MUST 与强校验同步更新。

#### 场景：强校验纳入第三个 root

- **当** Worker 解析 `ai-plugins/skill-registry.json` 时，
- **则** `services/skill-registry.ts` 的 `REQUIRED_REGISTRY_ROOTS` 包含 `ai-plugins/low-frequency-skill/skills`，缺失任一 root 的 registry 被拒绝，
- **并且** `packages/skill-router-mcp` 的测试 fixture（production-harness、resource-pagination-race、skill-registry、skill-router 等）同步改为三 roots 后全部测试通过。

### Requirement: 跨仓库迁移善后

从外部项目剪切技能后，外部项目 SHALL 删除源文件、更新全部文档引用并完成分类提交与推送。

#### 场景：WorkBuddy 项目引用更新

- **当** `D:\store\WorkBuddy\2026-6-30-common` 的两个技能目录被删除后，
- **则** 该项目 `docs/plan/2026-8-27-try-vscode/README.md` 目录树不再引用 `init-tsconfig/`，`01.md` 中的 8 处技能路径引用更新为迁移后的统一位置并附迁移说明，`.workbuddy/memory/2026-09-05.md` 以追加注记方式指向新位置而不改写历史记录，
- **并且** 项目内 grep 两个技能名不再出现指向已删除路径的断链引用。

#### 场景：善后提交与推送

- **当** WorkBuddy 项目完成文件删除与引用更新后，
- **则** 按全局 git-commit 技能的 type/emoji 映射分门别类编写提交信息并 push 到其远程分支，
- **并且** 提交前已核对 commit-types.ts 的 emoji/type 映射，不得凭记忆选取。
