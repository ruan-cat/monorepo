# release-ai-plugins 增加 `skill-registry.json` 以支持 Skill Router MCP

## 文档定位

本目录是一套独立的实施提示词/工程规格包，用于指导后续 AI Agent 改造现有：

```text
ai-plugins/common-tools/skills/release-ai-plugins
```

使 `release-ai-plugins` 在保持现有发布职责、DryRun/Apply 安全模型、严格写入白名单和 PowerShell 5.1 兼容性的前提下，新增对：

```text
ai-plugins/skill-registry.json
```

的确定性生成与一致性校验能力，从而为 `Skill-Router-MCP` 云 MCP 提供 Git-native、machine-readable、commit-versioned 的 Skill Discovery Index。

本文档包只规定**合理改造方案和实施契约**。除非用户明确要求进入实现阶段，否则不要在阅读本目录时擅自改写现有发布脚本。

---

# 1. 为什么需要这次改造

`Skill-Router-MCP` 第一版架构已经确定：

```text
ChatGPT Web
    |
Remote MCP / Streamable HTTP
    |
Cloudflare Worker
    |
Nitro v3 Runtime
    |
MCP TypeScript SDK
    |
Skill Router
    |
GitHub Repository Adapter
    |
resolve GITHUB_REF -> exact commit SHA
    |
    +-- ai-plugins/skill-registry.json @ SHA
    +-- SKILL.md / references @ same SHA
```

核心约束：

- GitHub `ai-plugins` 是唯一 Skill Source of Truth。
- 第一版不要求 Cloudflare KV、R2、D1、Durable Objects。
- 每次 MCP tool call 先把 `GITHUB_REF` 解析为 exact commit SHA。
- registry 和 skill 内容必须从同一个 commit SHA 读取。
- 高频修改 skills 后，不需要同步 Cloudflare storage，也不需要重新部署 Worker。

因此需要一份已经跟随 Git commit 版本化的机器索引，让 MCP 不必为了发现技能而逐目录扫描全部 `SKILL.md`。

---

# 2. `skill-registry.json` 的准确定位

`ai-plugins/skill-registry.json` 是：

```text
Generated Discovery Manifest
```

它不是：

- 数据库。
- 缓存。
- Cloudflare KV dump。
- 第二个 Source of Truth。
- 人工维护配置。
- Skill 正文副本。

Skill 真源仍然是各 skill 目录中的 `SKILL.md` 和 references/templates/examples 等真实文件。

Registry 只提供足以支持：

```text
list_skills
search_skills
get_skill_metadata
```

的机器发现信息，以及让 `load_skill` 精确定位入口文件的 repo-relative path。

---

# 3. 为什么由 `release-ai-plugins` 集成生成

现有 `release-ai-plugins` 已经负责：

- changed skill 的 `metadata.version`。
- 六个 plugin manifest。
- 三个平台 marketplace。
- 两个 CHANGELOG。
- 新增 skill 的 README 一致性。
- 严格写入白名单。
- DryRun / Apply。
- `git diff --check` 与最终发布验收。

`skill-registry.json` 描述的是“当前发布状态下机器可发现的 skill 集合”，因此属于发布一致性产物。

但是 registry 生成逻辑不应直接堆入主发布脚本。推荐新增独立 generator，由 `release-ai-plugins.ps1` orchestration 调用，同时允许 CI 独立执行 check。

---

# 4. 本次合理改造的目标文件

后续实现 PR 预计修改：

```text
ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md
ai-plugins/common-tools/skills/release-ai-plugins/README.md
ai-plugins/common-tools/skills/release-ai-plugins/references/release-contract.md
ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1
```

新增：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
ai-plugins/skill-registry.json
```

根据仓库现有 CI 组织方式，再新增或修改 registry stale-check workflow / job。

不要为了 registry 引入新的 Node/Python runtime 或第三方 PowerShell module；优先复用现有 PowerShell 5.1 工具链。

---

# 5. 强制阅读顺序

后续实施 Agent 必须依次阅读：

```text
README.md
  ↓
implementation-plan.md
  ↓
release-ai-plugins-modification-spec.md
  ↓
registry-generator-spec.md
  ↓
skill-registry-contract.md
  ↓
cloud-mcp-integration-contract.md
  ↓
ci-stale-registry-gate.md
  ↓
testing-and-acceptance.md
```

在没有完成上述阅读前，不要直接修改 `release-ai-plugins.ps1`。

---

# 6. 不允许改变的关键决策

## 6.1 Registry 与 Skill 必须同 commit

不要采用：

```text
commit A: skill 改动
commit B: bot 补 registry
```

必须让 registry 与对应 Skill tree 一起进入同一个开发者提交/发布提交。

## 6.2 Registry 不写自己的 commit SHA

禁止：

```json
{"sourceCommitSha":"<current commit>"}
```

因为文件内容参与 commit hash，会形成自引用问题。

Cloud MCP 在运行时把：

```text
exact commit SHA + registry content
```

组合为 `SourceSnapshot`。

## 6.3 输出必须确定性

相同 working tree 重复生成：

```text
byte-for-byte identical
```

禁止 timestamp、随机值、本机绝对路径和非稳定枚举顺序。

## 6.4 CI 只校验，不自动写回

CI 可以：

```text
generate expected registry in memory/temp file
compare committed registry
stale -> fail
```

CI 不应该拥有为了补 registry 而写入仓库的权限。

## 6.5 不引入 Cloudflare 存储发布步骤

`release-ai-plugins` 不负责：

- KV publish。
- R2 upload。
- Worker deploy。
- MCP cache invalidation。

Skill 发布和 Worker 部署保持解耦。

---

# 7. 最终数据链路

开发/发布侧：

```text
修改 SKILL.md / references
        |
release-ai-plugins
        |
更新 metadata.version 等发布状态
        |
generate-skill-registry.ps1
        |
ai-plugins/skill-registry.json
        |
同一个 Git commit
        |
push
```

云 MCP 侧：

```text
GITHUB_REF=dev
      |
resolve HEAD -> abc123
      |
      +-- skill-registry.json @ abc123
      +-- selected SKILL.md @ abc123
      +-- selected references @ abc123
```

---

# 8. 本目录 Definition of Done

本提示词包完整时，应让独立 AI Agent 能回答并实施：

- Registry schema 是什么。
- Registry 如何从两个 skill roots 生成。
- 为什么不能写 `generatedAt` / current commit SHA。
- generator 的 Check/DryRun/Apply 行为是什么。
- 主 release script 在哪个阶段调用 generator。
- 写入白名单怎样扩展。
- 新增/修改/删除/重命名 skill 如何反映到 registry。
- CI 如何阻止 stale registry。
- Cloud MCP 如何按 exact commit snapshot 使用 registry。
- 如何证明相同 working tree 输出 byte-identical。
- 如何在不引入 KV/R2 的情况下完成发布和运行时闭环。
