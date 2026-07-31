# Codex 插件市场 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有 `common-tools` 与 `dev-skills` 建立可安装、可卸载的 Codex 插件市场。

**Architecture:** 在仓库根新增 `.agents/plugins/marketplace.json`，由 Codex 从仓库根发现并解析到 `ai-plugins` 下的两个插件目录。每个插件新增一份只声明共享 `skills/` 树的 `.codex-plugin/plugin.json`；平台专属配置保持隔离。

**Tech Stack:** JSON、Markdown、Codex CLI、Python plugin validator。

## Global Constraints

- marketplace 名称固定为 `ruan-cat-tools`，展示名为“阮喵喵开发工具集”。
- 两个 Codex manifest 的 `name` 和 `version` 分别与现有插件目录及 `8.0.1` 一致。
- marketplace source 以仓库根解析，固定为 `./ai-plugins/common-tools` 与 `./ai-plugins/dev-skills`。
- Codex manifest 只公开 `skills: "./skills"`，不得声明 Claude 专用 `hooks`、`commands` 或 `agents`。
- 每个市场条目必须包含 `AVAILABLE`、`ON_INSTALL` 和“开发工具”分类。
- 验收必须使用真实 Codex CLI，且测试安装完成后必须通过 CLI 卸载清理。

---

### Task 1: 建立 Codex 市场与插件清单

**Files:**

- Create: `.agents/plugins/marketplace.json`
- Create: `ai-plugins/common-tools/.codex-plugin/plugin.json`
- Create: `ai-plugins/dev-skills/.codex-plugin/plugin.json`

**Produces:** 名为 `ruan-cat-tools` 的市场，提供两个“开发工具”类别插件。

- [x] **Step 1: 创建 marketplace JSON**

写入 `name`、`interface.displayName` 和两个 source 条目；每个条目显式写入政策字段。

- [x] **Step 2: 创建两个 Codex manifest**

写入现有名称、版本、作者、仓库、许可、关键词、`skills` 和 Codex `interface` 必填字段；不写入不兼容字段。

- [x] **Step 3: 解析 JSON**

Run: `Get-Content -Raw <file> | ConvertFrom-Json`

Expected: 三个文件均可解析，且没有额外输出错误。

### Task 2: 同步安装说明、变更记录与维护规则

**Files:**

- Create: `.agents/plugins/README.md`
- Modify: `README.md`
- Modify: `ai-plugins/docs/README.md`
- Modify: `ai-plugins/docs/use-vercel-skills-install.md`
- Modify: `.claude-plugin/README.md`
- Modify: `.cursor-plugin/README.md`
- Modify: `ai-plugins/common-tools/README.md`
- Modify: `ai-plugins/dev-skills/README.md`
- Modify: `ai-plugins/common-tools/CHANGELOG.md`
- Modify: `ai-plugins/dev-skills/CHANGELOG.md`
- Modify: `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
- Modify: `ai-plugins/common-tools/skills/init-ai-md/templates/09.Karpathy Guidelines.md`
- Modify: `.agents/skills/skill-hardening-from-incidents/SKILL.md`

**Produces:** 用户可按 Codex CLI 安装/更新/卸载，维护者在下次发版或 skill 加固时不会遗漏 Codex。

- [x] **Step 1: 添加 Codex 专属说明和入口链接**

说明远程安装、更新、卸载命令，并在多平台文档中将 Codex 与 Claude Code、Cursor 并列。

- [x] **Step 2: 说明插件能力边界**

两个插件 README 的目录树增加 `.codex-plugin/plugin.json`；`common-tools` 说明 Codex 只加载共享技能，Claude 专用命令、代理和 hooks 不会被加载。

- [x] **Step 3: 写入 Unreleased changelog**

两个 CHANGELOG 顶部各增加简短条目，记录 Codex marketplace 和 manifest 支持。

- [x] **Step 4: 更新维护技能**

发版技能将三平台清单和 CLI smoke test 纳入流程；加固规则与 AI 记忆模板要求清单、文档、平台边界和真实验证同步。

### Task 3: 验证安装并清除测试状态

**Files:** 无源代码新增；仅暂时写入和清理 Codex 用户配置与缓存。

**Consumes:** Task 1 的 marketplace 与 manifest。

- [x] **Step 1: 执行静态校验**

Run: `python C:\\Users\\pc\\.codex\\skills\\.system\\plugin-creator\\scripts\\validate_plugin.py ai-plugins\\common-tools`，随后对 `dev-skills` 重复。

Expected: 两次均输出 `Plugin validation passed`。

- [x] **Step 2: 添加本地 marketplace 并枚举可用插件**

Run: `codex plugin marketplace add D:\\code\\ruan-cat\\monorepo --json`，再运行 `codex plugin list --available --json --marketplace ruan-cat-tools`。

Expected: 结果包含 marketplace `ruan-cat-tools` 以及两个未安装插件。

- [x] **Step 3: 安装两个插件并检查状态**

Run: `codex plugin add common-tools@ruan-cat-tools --json` 和 `codex plugin add dev-skills@ruan-cat-tools --json`，再运行 `codex plugin list --json`。

Expected: 两个 `pluginId` 均为已安装状态。

- [x] **Step 4: 卸载测试插件与 marketplace**

Run: 两次 `codex plugin remove <plugin>@ruan-cat-tools --json`，再运行 `codex plugin marketplace remove ruan-cat-tools --json`。

Expected: 最终 `codex plugin marketplace list --json` 和 `codex plugin list --json` 中没有 `ruan-cat-tools`、`common-tools@ruan-cat-tools` 或 `dev-skills@ruan-cat-tools`。

- [x] **Step 5: 进行 diff 收口检查**

Run: `git diff --check`

Expected: exit code `0`。
