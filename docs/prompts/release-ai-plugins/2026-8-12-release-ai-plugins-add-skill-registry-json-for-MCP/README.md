# release-ai-plugins 增加 `skill-registry.json` 以支持 Skill Router MCP

## 文档定位

本目录是一套独立实施提示词/工程规格包，用于指导 AI Agent 改造现有：

```text
ai-plugins/common-tools/skills/release-ai-plugins
```

使其在保留 DryRun/Apply、严格写入白名单、PowerShell 5.1 兼容和原发布一致性规则的前提下，新增：

```text
ai-plugins/skill-registry.json
```

的确定性生成与 stale 校验能力，为 `Skill-Router-MCP` 云 MCP 提供 Git-native、machine-readable、commit-versioned 的 Skill Discovery Index。

本方案按真实维护习惯设计：**Skill 数量中等，但 Skill 内容、references、templates 等会高频更新**。因此重点是降低维护摩擦、stale 风险和测试回归成本，而不是提前建设大型索引系统。

---

# 1. 为什么需要 Registry

云 MCP 第一版架构：

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
    +-- selected SKILL.md / related files @ same SHA
```

约束：

- GitHub `ai-plugins` 是唯一 Skill Source of Truth。
- 第一版不要求 KV、R2、D1、Durable Objects。
- registry 与 Skill 必须处于同一个 Git commit。
- 高频修改 skills 后不需要 Cloudflare storage sync，也不需要 Worker redeploy。

Registry 让 MCP 的 `list_skills` / `search_skills` 不必遍历所有 Skill 目录逐个读取 `SKILL.md`。

---

# 2. `skill-registry.json` 的准确定位

它是：

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
- references/templates/examples 的目录镜像。

Registry v1 只保留：

```text
id
plugin
name
description
version
entry
```

这足够支持 discovery/search 和定位 `SKILL.md`，同时避免深层文件高频变化造成额外 registry churn。

---

# 3. 为什么由 `release-ai-plugins` 集成生成

现有 `release-ai-plugins` 已负责：

- changed Skill `metadata.version`。
- 六个 plugin manifest。
- 三个平台 marketplace。
- 两个 CHANGELOG。
- 新增 Skill README 一致性。
- 严格写入白名单。
- DryRun / Apply。
- 最终发布验收。

Registry 描述“当前发布状态下机器可发现的 Skill 集合”，属于发布一致性产物。

但 generator 必须独立存在，由主 release 脚本 orchestration 调用，同时允许 CI 独立执行 `-Check`。

---

# 4. 高频维护下的核心增长策略

```text
Skill 数量中等
+
更新频率高
=
全量 deterministic scan + 低 churn schema
```

规则：

- Registry 每次从两个 Skill roots 全量重建，不维护增量 state/database。
- 一次 release 即使修改多个 Skill，也只运行一次 generator Apply + 一次最终 Check。
- v1 不枚举 references/templates/examples。
- Skill body/reference/template 高频变化由 Skill `metadata.version` + Git commit SHA 表达。
- CI 只做轻量 stale check，不跑 Cloudflare 同步。
- schemaVersion 保持稳定，不随 Skill 内容高频更新变化。
- 只有真实指标证明 full scan/registry/GitHub 读取成为瓶颈时才优化。

详见：

```text
high-frequency-maintenance-and-growth-strategy.md
```

---

# 5. 合理改造的目标文件

后续实际实现预计修改：

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

根据仓库现有 CI 组织方式，再新增或修改轻量 registry stale-check workflow/job。

不要为了 registry 引入 Node/Python runtime 或第三方 PowerShell module。

---

# 6. 测试 Runtime 决策

`release-ai-plugins` / registry generator 的关键风险属于真实 PowerShell runtime，因此不强制把它们包装成 Vitest 主测试。

正确分工：

```text
Generator / release behavior
  -> Windows PowerShell 5.1
  -> PowerShell 7

Cloud MCP registry consumer
  -> Vitest / workerd / Worker integration
```

至少验证：

```text
same fixture
PS5.1 output == pwsh7 output byte-for-byte
```

详细见：

```text
test-runtime-and-ci-matrix.md
```

这避免为了“统一测试工具”反而漏掉 PowerShell 5.1 encoding/path/exit-code 的真实风险。

---

# 7. 强制阅读顺序

```text
README.md
  ↓
implementation-plan.md
  ↓
high-frequency-maintenance-and-growth-strategy.md
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
test-runtime-and-ci-matrix.md
  ↓
testing-and-acceptance.md
  ↓
agent-handoff-checklist.md
```

没有完成上述阅读前，不要直接修改 `release-ai-plugins.ps1`。

---

# 8. 不允许改变的关键决策

## Registry 与 Skill 必须同 commit

不要：

```text
commit A: skill
commit B: bot 补 registry
```

必须一起提交。

## Registry 不写自己的 commit SHA

Cloud MCP 运行时把 exact commit SHA 与 registry 组合为 `SourceSnapshot`。

## 输出必须确定性

相同 working tree：

```text
byte-for-byte identical
```

禁止 timestamp、随机值、本机绝对路径和不稳定排序。

## CI 只校验，不自动写回

CI stale -> fail，并给出修复命令；不自动 commit/push。

## 不引入 Cloudflare 存储发布步骤

`release-ai-plugins` 不负责 KV/R2/Worker deploy/cache invalidation。

## Registry v1 不枚举深层文件

references/templates/examples 由云 MCP 在选中 Skill 后按 exact SHA 按需读取，不在 registry 维护第二份文件清单。

---

# 9. 最终数据链路

发布侧：

```text
修改多个 Skill
        |
release-ai-plugins 完成全部 version/release state
        |
一次 generator -Apply
        |
一次 generator -Check
        |
ai-plugins/skill-registry.json
        |
同一 Git commit
        |
push
```

云 MCP：

```text
GITHUB_REF=dev
      |
resolve HEAD -> abc123
      |
      +-- registry @ abc123
      +-- selected SKILL.md @ abc123
      +-- related files on demand @ abc123
```

---

# 10. 本目录 Definition of Done

本提示词包应让独立 AI Agent 能正确实施：

- minimal Registry schema。
- 两个 Skill roots 的 deterministic full scan。
- 多 Skill release 只生成一次 registry。
- generator Check/Apply。
- release 白名单与调用顺序。
- add/modify/delete/rename 语义。
- CI stale gate。
- PS5.1 / pwsh7 cross-runtime deterministic test。
- 高频 reference/template 变化为什么不进入 registry v1。
- Cloud MCP exact-commit + optional snapshot pin 消费方式。
- 为什么当前不需要 KV/R2/增量数据库/vector index。
- 何时才根据真实指标进一步优化。
