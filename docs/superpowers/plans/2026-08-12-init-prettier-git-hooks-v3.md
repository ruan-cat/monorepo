# init-prettier-git-hooks v3 实施计划

> **供代理执行：** 必须使用 `subagent-driven-development`（推荐）或 `executing-plans` 逐项实施。步骤使用复选框跟踪。

**目标：** 将 `init-prettier-git-hooks` 破坏性升级到 v3，以精确版本和顶层字符串插件恢复普通 CLI、experimental CLI 与 VSCode 的一致行为，并完整保存历史错误。

**架构：** 保留轻量的 AI 审计流程和五份配置模板，在技能内新增 `references/` 长期知识层。静态契约负责阻止错误写法回归，运行探针负责证明 lint-md 真实改变 Markdown 输出。

**技术栈：** Markdown skill、ESM Prettier 配置、Prettier 3、`prettier-plugin-lint-md@1.0.1`、Vitest、pnpm。

## 全局约束

- `prettier-plugin-lint-md` 必须精确锁定为 `1.0.1`，禁止任何 semver 范围。
- lint-md 必须使用顶层字符串 `plugins: ["prettier-plugin-lint-md"]`。
- 禁止顶层对象导入，禁止仅放入 Markdown override。
- experimental CLI 活动命令必须带且只带一个 `--no-parallel`；默认不重复传入 lint-md `--plugin`。
- 不创建迁移 CLI、`scripts/`、`src/` 或运行时证明层。
- 不修改、暂存或覆盖 `docs/prompts/release-ai-plugins/01.md`。
- 不执行 Git commit、push 或插件发布。

---

### 任务 1：建立 v3 RED 契约

**文件：**

- 修改：`tests/init-prettier-git-hooks/skill-behavior.test.ts`

**接口：**

- 输入：技能正文、五份模板和 `references/`。
- 输出：对 v3 版本、精确依赖、字符串插件、历史保留、命令参数和路径污染的静态断言。

- [ ] 将 v2 对象 import 和 `plugins: [prettierPluginLintMd]` 的正向断言改为禁止断言。
- [ ] 增加 `version: "3.0.0"`、精确 `1.0.1` 和顶层字符串的正向断言。
- [ ] 增加 references 文件清单、状态标签和关键错误演进断言。
- [ ] 增加紧邻 lint-md 顶层声明的完整 JSDoc 结构与内容断言。
- [ ] 增加 experimental CLI 命令的 `--no-parallel` 唯一性断言，并禁止默认命令重复传入 `--plugin`。
- [ ] 运行 `pnpm exec vitest run tests/init-prettier-git-hooks/skill-behavior.test.ts`，预期因技能仍为 v2 而失败。

### 任务 2：改写 v3 入口与模板

**文件：**

- 修改：`ai-plugins/common-tools/skills/init-prettier-git-hooks/SKILL.md`
- 修改：`ai-plugins/common-tools/skills/init-prettier-git-hooks/templates/prettier.config.mjs`
- 修改：`ai-plugins/common-tools/skills/init-prettier-git-hooks/templates/lint-staged.config.mjs`

**接口：**

- 输入：任务 1 的静态契约。
- 输出：future-agent 可执行的 v3 流程和正确配置模板。

- [ ] 把元数据提升到 `3.0.0`，将两条最高优先级契约放在正文前部。
- [ ] 删除 lint-md default import、对象迁移规则和所有兼容措辞。
- [ ] 在 lint-md 顶层字符串前写入完整 JSDoc，保留版本漂移、对象方案、override 方案、三条入口和最终纠偏，不允许压缩为普通行注释。
- [ ] 明确检查 `package.json`、lockfile、运行时解析版本三层一致。
- [ ] 分开普通 CLI、experimental CLI 与 VSCode 验证入口。
- [ ] 在验证剧本中增加显式 `--plugin` 的诊断 A/B，但不把它写入活动命令。
- [ ] 保留配置所有权、用户改动保护、LF 治理和副作用授权规则。

### 任务 3：保存错误历史与决策演进

**文件：**

- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/README.md`
- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/decision-evolution.md`
- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/runtime-loading-model.md`
- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/version-matrix.md`
- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/pnpm-resolution.md`
- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/crlf-and-hook-incidents.md`
- 新建：`ai-plugins/common-tools/skills/init-prettier-git-hooks/references/verification-playbook.md`

**接口：**

- 输入：三份事故报告和相关历史记忆中的已核验事实。
- 输出：去除内部标识、按状态组织且可供后续代理检索的长期知识层。

- [ ] 建立引用索引并规定“现行 / 已废弃 / 背景”状态。
- [ ] 记录从依赖可见性、CRLF、worker 崩溃、对象方案到双核心契约的演进。
- [ ] 明确对象方案、override 方案、`^1.0.1` 和单链路验证均已废弃。
- [ ] 记录普通 CLI、experimental CLI、VSCode 和 pnpm 的不同加载边界。
- [ ] 写出可复制的三链路真实输出验证剧本。
- [ ] 扫描并删除本机绝对路径、内部报告路径、内部测试路径和记忆编号。

### 任务 4：同步用户入口并转为 GREEN

**文件：**

- 修改：`ai-plugins/common-tools/README.md`
- 修改：`ai-plugins/common-tools/CHANGELOG.md`
- 修改：`tests/init-prettier-git-hooks/skill-behavior.test.ts`（仅在实现暴露断言缺口时定点修订）

**接口：**

- 输入：v3 技能和引用层。
- 输出：一致的分发说明与绿色静态测试。

- [ ] 把 README 的 v2 对象方案说明替换为 v3 两条硬契约和 references 入口。
- [ ] 在 CHANGELOG 的 Unreleased 中记录破坏性废弃和纠偏原因。
- [ ] 运行定向 Vitest，预期全部通过。

### 任务 5：运行验证与主代理复核

**文件：**

- 验证：上述全部目标文件，不新增长期探针文件。

**接口：**

- 输入：最终 v3 写集。
- 输出：可复现验证证据和干净的任务边界。

- [ ] 用临时目录或已有隔离探针验证 `1.0.1` 元数据以及普通 CLI、experimental CLI 的真实 Markdown 输出。
- [ ] 运行 `pnpm exec prettier --check` 检查本轮 Markdown 与模板文件。
- [ ] 运行 `git diff --check` 和路径污染扫描。
- [ ] 主代理阅读 `git diff --` 目标写集，确认每块 diff 都能追溯到规格。
- [ ] 运行 `git status --short`，确认用户已有文件未被纳入本轮变更。

## 自检结论

本计划覆盖规格中的两条最高优先级契约、轻量技能边界、references 知识保留、三链路验证、pnpm 解析、分发文档和工作区保护。未包含占位任务，不要求提交、发布或 worktree。
