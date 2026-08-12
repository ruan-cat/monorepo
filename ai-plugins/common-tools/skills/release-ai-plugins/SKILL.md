---
name: release-ai-plugins
description: >-
  Use when releasing or upgrading the common-tools or dev-skills plugins, synchronizing
  Claude/Cursor/Codex manifests and marketplaces, updating CHANGELOG files, validating
  README and installation-document consistency, or generating/checking the
  skill-registry.json discovery manifest for Skill Router MCP.
  当用户要求插件发布、版本升级、更新日志、manifest、marketplace、README 一致性、
  skill-registry.json、MCP skill registry 或 registry stale 校验时使用。
metadata:
  version: "1.0.0"
---

# AI Plugins 发布流程

这是一个高频、可复现的发布入口。必须使用同目录的
`scripts/release-ai-plugins.ps1`；默认 DryRun，只有显式 `-Apply` 才允许写文件。
独立的 `scripts/generate-skill-registry.ps1` 是
`ai-plugins/skill-registry.json` 的唯一生成入口。任一脚本失败，或最终验收未通过，
都不得声称发布完成。

## 固定输入

- `-Version`：插件主版本，必须为 `MAJOR.MINOR.PATCH`。
- `-Skill`：确实修改过的 skill 名称，可重复或逗号分隔；省略时由脚本根据 Git 变更自动发现。
- `-ChangeType`：`added`、`major`、`minor` 或 `patch`，用于升级每个被修改 skill 的
  `metadata.version`。
- `-Summary`：写入两个 CHANGELOG 的简短说明。
- `-NewSkill`：新增 skill 名称；对应插件根 README 必须先包含该名称。
- `-Apply`：明确允许写文件；未指定时为 DryRun。

## 强制执行顺序

1. 核对输入、Skill 所属 root 及每个 `SKILL.md` 的 frontmatter。
2. 只升级本次确实变更的 Skill `metadata.version`，不得顺手升级其他 Skill。
3. 同步六个 `plugin.json`、Claude/Cursor 两个带版本 marketplace；校验 Codex marketplace 和两个 Codex manifest 的专属字段。
4. 更新两个插件 CHANGELOG；新增 Skill 先通过对应插件 README 阻断校验。
5. Apply 时，在所有 Skill 版本和发布文件完成后只调用一次
   `generate-skill-registry.ps1 -Apply`，随后只调用一次 `-Check`。
6. 完成既有 JSON、版本、README、CHANGELOG、安装文档和 `git diff --check` 验收。

多 Skill 批量发布不得在 changed-Skill 循环中重复生成 registry。Generator 始终从两个
Skill roots 全量扫描当前 working tree；新增、删除、重命名分别表现为 entry 增加、消失和
旧 id 消失/新 id 出现。

## Registry 文件契约

`ai-plugins/skill-registry.json` 是与 Skill tree 同一 Git commit 提交的 generated discovery
manifest，不是人工维护的第二真源。v1 只包含 `schemaVersion`、固定 `roots` 和每个 Skill 的
`id`、`plugin`、`name`、`description`、`version`、`entry`。

- 输出必须确定性：UTF-8 无 BOM、LF、两空格缩进、固定属性顺序、固定 id 排序和末尾一个换行。
- 不得写入时间戳、当前分支、commit SHA、绝对路径、Cloudflare 字段或正文副本。
- 不枚举 `references`、`templates`、`examples`；这些文件由云 MCP 在选中 Skill 后按同一 exact commit SHA 按需读取。
- `-Check` 只比较 generator 的 canonical 文本，不写文件；stale、缺失、重复 id、非法 frontmatter、
  版本不合法或 entry 无效都必须非零失败，并输出 `-Apply` 修复命令。
- Skill registry stale、entry/version 与 `SKILL.md` 不一致，或批量发布重复调用 generator，均属于禁止完成条件。

## CI Workflow 维护契约

固定维护入口是 `.github/workflows/ai-plugins-skill-registry-check.yml`。它只读执行 generator
`-Check`，并覆盖两个 Skill roots、registry、generator 路径和 workflow 自身；不允许 `-Apply`、commit 或 push。

- 只修改 Skill 正文、`metadata.version`、reference/template/example 时，不需要改 workflow；path filter
  会触发检查，registry 由 release Apply 集中生成。
- 修改 generator 路径、CLI 参数、扫描 roots、registry schema、CI 权限或触发范围时，必须在同一变更中
  更新该 workflow，并通过 release 主脚本的 workflow contract gate。
- workflow 缺失、漏掉任一关键 path、改成写回模式或不再调用 `-Check`，release DryRun/Apply 都会阻断。

因此未来维护不依赖“记住一个文件”：常规 Skill 更新由 path-scoped CI 自动覆盖，基础设施契约变化由
发布脚本静态门禁拦截；治理层仍需把该 workflow 与 Skill/registry 变更放在同一提交中。

独立诊断命令：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/generate-skill-registry.ps1 -Check
```

## 使用边界

本技能负责插件版本号、CHANGELOG、三平台清单、README/安装文档同步，以及本地 working tree
到 deterministic registry 的生成与校验。它不负责 GitHub commit SHA 解析、Cloudflare KV/R2
发布、Worker 部署、MCP session/cache 或增量 registry 数据库。

涉及 marketplace 时，先建立“客户端 → marketplace → plugin manifest → 已发布组件 → 安装/更新/卸载文档
→ 真实验证命令 → 清理动作”的映射。Claude Code、Cursor、Codex 的 schema、hooks、commands、agents、
路径和安装命令必须分别核对，不能互相复制。静态 JSON/schema 校验只是前置门禁；取得真实客户端
CLI 或官方安装验证后才能标记已验证。受账号、客户端或环境限制无法取得证据时，必须明确记录“未验证”。

## 版本与文件契约

- 插件主版本来源是 `.claude-plugin/marketplace.json` 的 `metadata.version`，必须同步到 Cursor marketplace
  与六个 `plugin.json`；Codex marketplace 不得虚构版本字段。
- Skill 的 `metadata.version` 独立演进，只在该 Skill 确实变化时升级。
- Generator 是 registry 的唯一写入者；release 主脚本只把 registry 作为严格白名单中的预期产物。
- 参考字段矩阵、CHANGELOG 格式、Codex smoke test 和 exact-commit 规则见
  [`references/release-contract.md`](references/release-contract.md)。

## 唯一入口

在仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1 `
  -Version 10.1.0 -ChangeType minor -Skill release-ai-plugins `
  -Summary "强化发布流程并生成 Skill Registry" -DryRun
```

确认 DryRun 输出后，追加 `-Apply` 才允许写入。对于本 Skill 自身的行为大变更，
`-ChangeType major` 升级本 Skill；插件主版本仍按整个插件系统的发布级别单独决定。

## README 与安装文档

发布时至少检查：

- `ai-plugins/docs/README.md`
- `ai-plugins/docs/use-vercel-skills-install.md`
- `.claude-plugin/README.md`
- `.cursor-plugin/README.md`
- `.agents/plugins/README.md`
- 根 `README.md`

安装命令和 source 路径必须使用 `ai-plugins/...`，不得残留 `claude-code-marketplace/`；新增 Skill
还必须出现在对应插件根 README。

## 禁止完成条件

- 漏改任一 manifest、marketplace、CHANGELOG 或新增 Skill README。
- Skill tree 已变更但 registry stale、registry 不是 generator canonical 输出，或 entry/version 与真实 `SKILL.md` 不一致。
- 仅凭构建成功、JSON 解析、口头说明或 `git status` 声称完成。
- 用 registry 自身字段冒充 source commit，或把 CI 自动修复/Cloudflare 同步当作 release 步骤。

## 验收清单

- [ ] DryRun 输出 Skill、九个 JSON、两个 CHANGELOG、README、registry 计划且零写入。
- [ ] Apply 后 generator `-Apply` 与最终 `-Check` 均通过，且批量只各调用一次。
- [ ] `.github/workflows/ai-plugins-skill-registry-check.yml` contract gate 通过；若基础设施契约变化，workflow 与其同提交。
- [ ] registry 可解析、确定性重生成无 diff，entry 均为有效 POSIX repo-relative `SKILL.md` 路径。
- [ ] Codex/Claude/Cursor 字段矩阵、安装文档和真实 smoke test 证据已核对；无法取得的证据标为“未验证”。
- [ ] `git diff --check` 通过，工作区只包含本次预期文件。

## 相关资源

- [`scripts/release-ai-plugins.ps1`](scripts/release-ai-plugins.ps1)：主发布入口。
- [`scripts/generate-skill-registry.ps1`](scripts/generate-skill-registry.ps1)：registry 唯一生成入口。
- [`references/release-contract.md`](references/release-contract.md)：字段矩阵、CHANGELOG 和 smoke test 契约。
- [Semantic Versioning](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/)
