# 技术设计：low-frequency-skill 三插件体系

## 设计目标

把 ai-plugins 从「双插件（common-tools + dev-skills）」扩展为「三插件（+ low-frequency-skill）」，同时把 7 个低频技能集中迁移到新插件，保证 registry 生成、发布编排、CI 校验、MCP 强校验、文档清单五条链路对三插件的一致性。

## 当前事实基线（探索结论）

- 全仓库现有 **3 份 marketplace.json**（`.claude-plugin/`、`.cursor-plugin/`、`.agents/plugins/`）与 **6 份 plugin.json**（common-tools、dev-skills 各三平台），全部版本 10.15.1。三份 marketplace 均不含 skills 数组；skills 引用只出现在 plugin.json（Cursor/Codex 用 `"skills": "./skills"` 目录引用）。
- `ai-plugins/skill-registry.json` 当前 27 条 skills（common-tools 20 + dev-skills 7），roots 为 2 个字符串。
- `generate-skill-registry.mjs` 硬编码 roots（文件头部）与按插件计数输出（`commonCount`/`devCount`/`total`，约 246-250 行）；frontmatter 硬校验 `name` + `description` + `metadata.version`（`^\d+\.\d+\.\d+$`）。
- `release-ai-plugins.ps1`（约 31KB）硬编码：6 份 plugin.json（105-110）、2 份 CHANGELOG（118-119）、2 份 README（122-123）、2 个技能根（134-135）、glob 清单（156-157）、git 扫描正则 `^ai-plugins/(common-tools|dev-skills)/skills/([^/]+)/`（189-192）、报错文案（233）、插件名推断兜底（238-240）、Codex marketplace 期望插件名 `$expectedNames = @("common-tools","dev-skills")`（约 509）。
- CI workflow `ai-plugins-skill-registry-check.yml` 的 paths 过滤列出两个 skills 目录。
- `packages/skill-router-mcp`：`services/skill-registry.ts:18` `REQUIRED_REGISTRY_ROOTS` 为超集校验；`isSafeSkillEntry` 要求 entry 形如 `ai-plugins/<x>/skills/<name>/SKILL.md`（新插件天然合法）；4 个测试文件 fixture 硬编码双 roots；`tests/real-skill-resources.test.ts` 读取真实 registry。
- `.github/workflows/skill-router-mcp.yml` 是可复用 workflow，仅对 `packages/skill-router-mcp` 跑 typecheck/test/build，**与技能目录无关，无需修改**。

## 关键决策（已与用户确认）

| 决策                              | 结论             | 理由                                                                                            |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| 5 个既有技能的 `metadata.version` | 保持原值         | 内容未变仅目录迁移，diff 最小，符合精准修改原则；release 脚本仅在技能内容确实变化时升级版本     |
| 新插件版本基线                    | 全部保持 10.15.1 | 发布级版本升级（如 10.16.0）留给后续用 release 脚本统一执行，本次迁移与发版解耦                 |
| `REQUIRED_REGISTRY_ROOTS`         | 纳入第三个 root  | 超集校验语义不变、防护更强；同步更新 4 个测试 fixture，避免未来漏配新插件                       |
| `skill-router-mcp.yml`            | 不修改           | 该 workflow 与技能目录无任何关系；真正需要扩展 paths 的是 `ai-plugins-skill-registry-check.yml` |
| `docs/prompts/**` 历史记录        | 不改写           | 历史开发记录保持原貌；`02.md`（本任务提示词）是用户工作区脏文件，严禁触碰                       |

## 新插件结构设计

```plain
ai-plugins/low-frequency-skill/
├── .claude-plugin/plugin.json      # name/version/description/homepage/author/license（对照 dev-skills）
├── .cursor-plugin/plugin.json      # 含 "skills": "./skills"
├── .codex-plugin/plugin.json       # 含 interface 展示元数据 + "skills": "./skills"
├── README.md                       # 插件简介 + ### Skills （技能） 清单（7 项）
├── CHANGELOG.md                    # 初始条目：迁移建档
└── skills/
    ├── init-playwright/            # 自 dev-skills 剪切（SKILL.md）
    ├── clone-ruancat-repo/         # 自 common-tools 剪切（SKILL.md + references/）
    ├── get-git-branch/             # 自 common-tools 剪切（SKILL.md）
    ├── init-claude-code-statusline/ # 自 common-tools 剪切（SKILL.md + templates/）
    ├── init-simple-memorix/        # 自 common-tools 剪切（21 文件 7 子目录，整体随迁）
    ├── init-tsconfig/              # 自 WorkBuddy 剪切（SKILL.md + references/，补 frontmatter）
    └── factory-reset-vscode-fork-ide/ # 自 WorkBuddy 剪切（SKILL.md + references/，补 metadata.version）
```

- 三份 marketplace 各追加一个插件条目，字段逐一对照既有两个条目：Claude 用 `source: "./ai-plugins/low-frequency-skill"`，Cursor 用 `source: "low-frequency-skill"`（相对 `pluginRoot: "ai-plugins"`），Codex 用 `source: { source: "local", path: "./ai-plugins/low-frequency-skill" }` 且不得带 version。
- 新插件不包含 agents/、commands/、hooks/、scripts/ 等目录（7 个技能均为纯 SKILL.md + 附属资源形态）。

## 外部技能 frontmatter 补齐方案

- `init-tsconfig`：全新起草 frontmatter —— `name: init-tsconfig`、`description`（概述「用 tsconfig.json 降低 tsserver 内存」用途与触发时机）、`user-invocable: true`、`metadata.version: "1.0.0"`。
- `factory-reset-vscode-fork-ide`：仅补 `metadata.version: "1.0.0"`（既有 name/description 保留原样，不擅自新增 user-invocable 改变行为）。
- `init-tsconfig/references/strategy-matrix.md` 第 3 行的 `D:\code\ruan-cat` 本机盘符路径改为通用表述（如「ruan-cat monorepo 仓库」）。

## 基础设施改动点清单

1. `generate-skill-registry.mjs`：roots 数组追加第三项；计数输出从 `commonCount/devCount` 扩展为三插件计数（保持输出文案风格一致）。
2. `release-ai-plugins.ps1`：全部双插件清单扩为三插件（见事实基线的行号清单）；`$expectedNames` 扩为 3 项；git 扫描正则扩为 `^ai-plugins/(common-tools|dev-skills|low-frequency-skill)/skills/([^/]+)/`；插件名推断按路径第二段映射，兜底逻辑保持。
3. `ai-plugins-skill-registry-check.yml`：paths 追加 `"ai-plugins/low-frequency-skill/skills/**"`（pull_request 与 push 两处）。
4. `services/skill-registry.ts`：`REQUIRED_REGISTRY_ROOTS` 追加第三项；4 个测试 fixture 的 roots 数组同步改为三项。
5. 文档：`ai-plugins/docs/README.md`（目录树 + 可安装插件）、三平台安装 README、`common-tools/README.md`（移除 2 项清单 + 目录树 2 行）、`dev-skills/README.md`（移除 init-playwright 相关行，若有）。

## 验证方式

- Registry：`node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply` 后 `--check` 通过（确定性、29 条、3 roots）。
- 发布脚本：`release-ai-plugins.ps1 -Version 10.15.1 -ChangeType patch -Skill get-git-branch -Summary "<迁移说明>" -DryRun` 零写入且计划覆盖新插件文件（仅作静态 gate 证据）。
- MCP 包：`pnpm --dir packages/skill-router-mcp run test:all`（含 registry 强校验与真实 registry 读取测试）通过。
- OpenSpec：`openspec validate add-low-frequency-skill-plugin --strict` 通过。
- 工作区：`git diff --check` 干净。
- WorkBuddy 侧：删除后 grep 两个技能名无断链引用；提交后 push 成功。

## 风险与未验证项

- **未验证**：三平台真实客户端（Claude Code / Cursor / Codex CLI）的安装 smoke test 无法在本地取得证据，按 release 技能契约明确记录为「未验证」，不由静态 JSON 校验替代。
- **噪音风险**：release 脚本 Apply 会重排 JSON（历史经验），本次只 DryRun 不 Apply，版本同步留给后续发布。
- **`init-simple-memorix` 体积大**：21 个文件 7 个子目录，`git mv` 整目录迁移，迁移后用文件计数验证完整性。
- **跨插件 id 冲突**：7 个技能名均为新增 root 独有，无跨插件重复。
