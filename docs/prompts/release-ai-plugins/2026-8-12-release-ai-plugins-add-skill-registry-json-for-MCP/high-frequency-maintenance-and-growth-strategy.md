# `release-ai-plugins` 高频维护与轻量增长策略

## 1. 设计前提

本方案不是按“Skill 数量无限增长”设计，而是按真实工作负载设计：

```text
Skill 数量：中等、可人工理解
Skill 更新频率：高
单次更新：可能同时修改多个 Skill / reference / template
发布频率：高
主要风险：漏版本、漏 registry、跨 commit 混读、维护步骤越来越重
```

因此优化目标不是极端横向扩展，而是：

```text
高频变更时仍然低摩擦
>
发布状态确定性
>
Git commit 可复现
>
实现简单、容易诊断
>
只有出现真实瓶颈后才优化性能
```

---

# 2. 核心决策：保持全量生成，不做增量 Registry 状态机

`skill-registry.json` 每次都从两个 Skill roots 的当前 working tree 全量重建：

```text
common-tools/skills/*
dev-skills/skills/*
        |
        v
full scan
        |
        v
canonical registry
```

即使一次只改一个 Skill，也不要做：

```text
old registry
+
patch changed entry
```

原因：

- 当前 Skill 总量不会大到让 O（N） 扫描成为主要成本。
- 高频更新时，增量状态反而增加 stale/orphan/rename/delete 风险。
- 全量扫描天然处理新增、删除、重命名。
- CI 与本地生成行为完全一致。
- 不需要 registry database、state file、change journal。

这是本项目有意采用的“轻度增长”策略。

---

# 3. 批量更新时 Generator 只运行一次

高频维护常见场景：

```text
Skill A 修改
Skill B 修改
Skill C 新增 reference
Skill D 更新 description
```

`release-ai-plugins` 应允许一次 release 处理多个 changed Skill，但 Registry generator 不应按 Skill 循环执行。

正确顺序：

```text
发现/确认全部 changed Skill
        |
逐个完成 metadata.version / release 状态更新
        |
完成 manifest / marketplace / CHANGELOG / README 工作
        |
只运行一次 generator -Apply
        |
只运行一次最终 generator -Check
```

禁止：

```text
for each skill -> regenerate whole registry
```

这样高频批量维护仍只有一次完整扫描和一次最终校验。

---

# 4. Registry v1 必须低 churn

Registry 只保存发现与定位所需的稳定字段：

```text
id
plugin
name
description
version
entry
```

第一版不枚举：

```text
references
templates
examples
keywords
tags
content hash
```

原因：

- `list_skills` / `search_skills` 不需要这些字段。
- `load_skill` 只需要 `entry` 定位 `SKILL.md`。
- references/templates/examples 属于被选中 Skill 的内容图，应在运行时按 exact commit SHA 按需读取。
- 高频增删 reference 不应产生无必要的 registry churn。
- 更小的 registry 让 Git diff、CI、GitHub 下载和调试更简单。

如果未来出现明确消费者需求，再以真实 use case 增加字段；不要为“可能以后有用”预填 schema。

---

# 5. Skill 正文高频变化的处理

Registry 不复制 `SKILL.md` 正文，因此正文大幅修改不会导致 registry 大面积 diff。

标准流程：

```text
修改 SKILL.md body / reference / template
        |
release-ai-plugins 按现有规则 bump 该 Skill metadata.version
        |
generator 更新该 Skill registry entry 的 version（如其他 discovery 字段未变）
        |
Skill 正文仍只保存在真实文件中
```

Cloud MCP 使用同一 commit SHA 读取正文，因此没有“registry 正文副本 stale”问题。

---

# 6. 新增、删除、重命名的轻量策略

不引入新的 registry 增量命令。

## 新增

```text
目录出现 -> full scan 自动新增 entry
```

## 删除

```text
目录消失 -> full scan 自动移除 entry
```

## 重命名

```text
old id 消失 + new id 出现
```

Generator 不做 Git rename detection。

Release orchestration 如果未来需要更漂亮的 CHANGELOG rename 表达，可以单独增强；不要把 rename 历史状态塞入 registry generator。

---

# 7. 不扩大 `release-ai-plugins` CLI 表面积

第一版不要因为 registry 增加大量新参数，例如：

```text
-RegistryMode
-RegistryVersion
-RegistryCommit
-ReferenceChanged
-RegistryCache
```

主流程继续保持：

```text
DryRun 默认只读
Apply 才写入
changed Skill 由现有参数/自动发现表示
registry 由最终 working tree 自动生成
```

如果删除/重命名的 release UX 以后真的成为高频痛点，再以最小参数扩展解决；不要提前设计复杂事件模型。

---

# 8. CI 保持轻量、只读、path-scoped

Registry gate 只需要证明：

```text
current working tree
        =>
expected canonical registry
        ==
committed registry
```

CI 不负责：

- 完整 release。
- 自动 version bump。
- 自动 commit。
- Cloudflare 同步。
- MCP 部署。

推荐只在 Skill roots、generator、registry 自身相关路径变化时运行。

对高频更新而言，这比每次都启动完整发布或云部署链更适合。

---

# 9. 高频维护时的输出必须可快速诊断

Generator / release 日志建议提供摘要，而不是输出完整 Registry：

```text
common-tools skills: N
dev-skills skills: M
total skills: X
registry status: current | stale
```

Apply 时可以额外报告：

```text
added: A
removed: B
changed discovery entries: C
```

这些只是诊断输出，不写进 registry。

不要求建立额外 metrics database。

---

# 10. Schema 演进策略

高频内容更新不等于高频 schema 更新。

`schemaVersion` 应非常稳定。

原则：

- Skill body/version 高频变化：不升级 schema。
- 增加不影响旧消费者的可选字段：先评估是否真的需要。
- 删除/重命名字段、改变字段语义：才考虑 schema major 变化。
- 不因为云 MCP 内部实现变化修改 registry schema。

Release 与 MCP 通过最小 schema + Git commit semantics 解耦。

---

# 11. 什么时候才需要优化 Full Scan

不要设置一个臆测的“Skill 超过多少个就重构”阈值。

只在真实指标出现问题时优化，例如：

- generator / CI 时间成为明显瓶颈。
- registry 文件增长到影响 GitHub 下载或 MCP P95。
- 单次 release 的 registry 阶段明显拖慢工作流。

在此之前继续使用全量扫描。

第一优化方向也应是：

```text
减少重复文件读取
优化 parser
避免无关目录扫描
```

而不是立刻引入数据库、增量索引服务或 Cloudflare storage。

---

# 12. 与 Cloud MCP 的共同维护模型

发布侧优化“高频写”：

```text
many local changes
 -> one release orchestration
 -> one deterministic registry generation
 -> one Git commit snapshot
```

运行时优化“高频读”：

```text
one tool call
 -> resolve/ref or pinned exact SHA
 -> one registry read
 -> selected Skill only
```

二者通过 Git commit 连接，不需要额外同步协议。

---

# 13. 明确不做的过度设计

当前阶段不引入：

- 增量 Registry DB。
- KV/R2/D1/DO 作为发布依赖。
- webhook registry sync。
- registry event log。
- per-Skill cloud cache invalidation。
- embedding/vector database。
- 自动 AI 生成 keywords/tags。
- 后台 bot 自动修 registry。
- 为 reference 列表维护第二份索引。

---

# 14. Definition of Done

- [ ] 中等 Skill 数量下继续使用全量 deterministic scan。
- [ ] 多 Skill release 只生成一次 registry。
- [ ] Registry v1 仅保留低 churn discovery 字段。
- [ ] reference/template/example 变化不要求 registry 枚举同步。
- [ ] 新增/删除/重命名仍由 full scan 自然处理。
- [ ] CI gate 轻量、只读、path-scoped。
- [ ] schemaVersion 不随 Skill 高频更新频繁变化。
- [ ] 没有新增数据库、Cloudflare storage 或同步状态机。
- [ ] 性能优化由真实指标触发，而不是提前复杂化架构。
