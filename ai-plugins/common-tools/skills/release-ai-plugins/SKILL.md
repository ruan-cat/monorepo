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
  version: "2.0.0"
---

# AI Plugins 发布流程

这是一个高频、可复现的发布入口。发布编排仍使用同目录的
`scripts/release-ai-plugins.ps1`；默认 DryRun，只有显式 `-Apply` 才允许写文件。
`ai-plugins/skill-registry.json` 的唯一 canonical authority 是
`scripts/generate-skill-registry.mjs`。兼容入口 `scripts/generate-skill-registry.ps1`
只把既有 `-Check/-Apply` 参数转发给 Node，不得再包含 SKILL.md 解析、JSON 序列化、缩进、
转义或行尾规范化逻辑。任一脚本失败，或最终验收未通过，都不得声称发布完成。

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
5. Apply 时，在所有 Skill 版本和发布文件完成后只调用一次 registry Apply，再只调用一次 Check。
   release 主脚本可继续通过 PowerShell 兼容入口调用；实际生成和比较必须由 Node `.mjs` 完成。
6. 完成既有 JSON、版本、README、CHANGELOG、安装文档和 `git diff --check` 验收。

多 Skill 批量发布不得在 changed-Skill 循环中重复生成 registry。Generator 始终从两个
Skill roots 全量扫描当前 working tree；新增、删除、重命名分别表现为 entry 增加、消失和
旧 id 消失/新 id 出现。

## Registry 文件契约

`ai-plugins/skill-registry.json` 是与 Skill tree 同一 Git commit 提交的 generated discovery
manifest，不是人工维护的第二真源。v1 只包含 `schemaVersion`、固定 `roots` 和每个 Skill 的
`id`、`plugin`、`name`、`description`、`version`、`entry`。

- Node generator 只使用内置模块，不依赖 pnpm install 或第三方 serializer。
- 读取 `SKILL.md` 后先把 CRLF/CR 统一为 LF；frontmatter parser 只支持本技能实际使用的窄子集，
  不尝试实现通用 YAML。未知或非法结构直接失败。
- 为避免基础设施迁移同时改变既有 discovery 文本，`description` 的 `>` / `>-` / `|` / `|-` block
  都沿用当前 registry 的折叠语义：普通行以空格连接，空段落保留一个换行标记；这不是通用 YAML literal-block 实现。
- Skill id 仅允许 `[a-z0-9-]`，因此固定排序使用直接字符串比较，不使用 locale-sensitive 排序。
- canonical JSON 唯一定义是 `JSON.stringify(registry, null, 2) + "\n"`；不再为 Windows PowerShell
  5.1、PowerShell 7 或 HTML-sensitive 字符维护 serializer 补丁。
- 输出必须确定性：UTF-8 无 BOM、LF、两空格缩进、固定属性顺序、固定 id 排序和末尾一个换行。
- 不得写入时间戳、当前分支、commit SHA、绝对路径、Cloudflare 字段或正文副本。
- 不枚举 `references`、`templates`、`examples`；这些文件由云 MCP 在选中 Skill 后按同一 exact commit SHA 按需读取。
- Node `--check` 只比较 generator 的 canonical 文本，不写文件；stale、缺失、重复 id、非法 frontmatter、
  版本不合法或 entry 无效都必须非零失败，并输出 `--apply` 修复命令；stale 时打印首个差异行便于定位。
- PowerShell `-Check/-Apply` 仅是兼容别名，必须转发到 Node `--check/--apply`，不得形成第二套生成逻辑。
- Skill registry stale、entry/version 与 `SKILL.md` 不一致，或批量发布重复调用 generator，均属于禁止完成条件。

## CI Workflow 维护契约

固定维护入口是 `.github/workflows/ai-plugins-skill-registry-check.yml`。它保持只读 `-Check` 契约，
并覆盖两个 Skill roots、registry、`.ps1` 兼容入口、`.mjs` generator 和 workflow 自身；不允许 Apply、commit 或 push。

- CI 在 Ubuntu 与 Windows 上运行同一 Node generator，验证 canonical output 不依赖操作系统。
- CI 固定使用仓库 `engines.node` 的最低支持版本；generator 只使用 Node 内置模块，不安装项目依赖。
- 只修改 Skill 正文、`metadata.version`、reference/template/example 时，不需要改 workflow；path filter
  会触发检查，registry 由 release Apply 集中生成。
- 修改 generator 路径、CLI 参数、扫描 roots、registry schema、Node 最低版本、CI 权限或触发范围时，必须在同一变更中更新该 workflow。
- release 主脚本的既有静态 gate 继续校验 wrapper 路径、只读 `-Check` 与 `contents: read` 等核心契约；
  `.mjs` 自身路径由 workflow 显式列入触发范围，wrapper 在 generator 缺失时也必须非零失败。

因此未来维护不依赖“记住一个文件”：常规 Skill 更新由 path-scoped CI 自动覆盖；基础设施契约变化必须把
workflow、wrapper、Node generator 与 registry 放在同一变更中。这里不扩张 release 主脚本的职责去解析 Node 实现细节。

独立诊断优先直接执行 Node generator：

```bash
node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --check
```

兼容旧调用方：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1 -Check
```

## 使用边界

本技能负责插件版本号、CHANGELOG、三平台清单、README/安装文档同步，以及本地 working tree
到 deterministic registry 的生成与校验。PowerShell 继续负责发布编排；Node 只接管 Skill Registry
的文本解析与 JSON canonical ownership。本次边界不扩展为重写整个 release 脚本，也不把其他 manifest
JSON 顺手迁移到新框架。

它不负责 GitHub commit SHA 解析、Cloudflare KV/R2 发布、Worker 部署、MCP session/cache 或增量 registry 数据库。

涉及 marketplace 时，先建立“客户端 → marketplace → plugin manifest → 已发布组件 → 安装/更新/卸载文档
→ 真实验证命令 → 清理动作”的映射。Claude Code、Cursor、Codex 的 schema、hooks、commands、agents、
路径和安装命令必须分别核对，不能互相复制。静态 JSON/schema 校验只是前置门禁；取得真实客户端
CLI 或官方安装验证后才能标记已验证。受账号、客户端或环境限制无法取得证据时，必须明确记录“未验证”。

## 版本与文件契约

- 插件主版本来源是 `.claude-plugin/marketplace.json` 的 `metadata.version`，必须同步到 Cursor marketplace
  与六个 `plugin.json`；Codex marketplace 不得虚构版本字段。
- Skill 的 `metadata.version` 独立演进，只在该 Skill 确实变化时升级。
- Node `.mjs` generator 是 registry 的唯一 canonical 写入者；PowerShell wrapper 只是兼容适配器；release 主脚本只把 registry 作为严格白名单中的预期产物。
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
- Skill tree 已变更但 registry stale、registry 不是 Node generator canonical 输出，或 entry/version 与真实 `SKILL.md` 不一致。
- PowerShell wrapper 再次出现 JSON serializer、HTML escape、缩进重算或 CRLF canonicalization 逻辑。
- 仅凭构建成功、JSON 解析、口头说明或 `git status` 声称完成。
- 用 registry 自身字段冒充 source commit，或把 CI 自动修复/Cloudflare 同步当作 release 步骤。

## 验收清单

- [ ] DryRun 输出 Skill、九个 JSON、两个 CHANGELOG、README、registry 计划且零写入。
- [ ] Apply 后 Node generator Apply 与最终 Check 均通过，且批量只各调用一次。
- [ ] PowerShell 兼容入口只转发参数，不含任何 registry 文本/JSON 处理逻辑。
- [ ] `.github/workflows/ai-plugins-skill-registry-check.yml` 保持只读核心 contract，且显式监听 `.mjs` generator。
- [ ] Ubuntu 与 Windows 使用同一 Node 版本执行 registry Check 均通过。
- [ ] registry 可解析、确定性重生成无 diff，entry 均为有效 POSIX repo-relative `SKILL.md` 路径。
- [ ] Codex/Claude/Cursor 字段矩阵、安装文档和真实 smoke test 证据已核对；无法取得的证据标为“未验证”。
- [ ] `git diff --check` 通过，工作区只包含本次预期文件。

## 相关资源

- [`scripts/release-ai-plugins.ps1`](scripts/release-ai-plugins.ps1)：主发布入口。
- [`scripts/generate-skill-registry.mjs`](scripts/generate-skill-registry.mjs)：registry 唯一 canonical generator。
- [`scripts/generate-skill-registry.ps1`](scripts/generate-skill-registry.ps1)：兼容旧 `-Check/-Apply` CLI 的薄适配器。
- [`references/release-contract.md`](references/release-contract.md)：字段矩阵、CHANGELOG 和 smoke test 契约。
- [Semantic Versioning](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/)
