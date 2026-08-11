# `release-ai-plugins` 改造规格

## 1. 目标

本文规定现有 `release-ai-plugins` 技能为了支持 `ai-plugins/skill-registry.json` 应如何改造。

原则：

> 增加 registry 发布一致性能力，但不改变现有“单一发布入口、严格白名单、DryRun 默认、Apply 才写入、失败即停止”的安全模型。

真实工作负载是 Skill 数量中等但更新频率高，因此还必须保证多 Skill 批量维护不会让 registry 阶段线性重复执行。

---

# 2. 当前职责与新增职责

现有核心职责：

```text
版本号管理
CHANGELOG 维护
三平台清单校验
README / 安装文档同步
```

新增第五项：

```text
Skill Registry 生成与一致性校验
```

因此 SKILL.md 中“核心职责固定为四项”的描述必须更新。

---

# 3. `SKILL.md` 应修改什么

## 3.1 description

加入可检索触发词，例如：

```text
skill-registry.json
Skill Router MCP
MCP skill registry
registry stale
skill discovery manifest
```

但 description 不应膨胀成实现文档。

## 3.2 强制执行顺序

Registry 阶段放在所有 Skill version 已完成更新之后、最终 `git diff --check` 之前。

推荐：

```text
1. input / changed skill validation
2. bump all changed Skill metadata.version
3. update plugin manifests / marketplaces
4. update CHANGELOG
5. validate new-skill README
6. run generator -Apply once
7. run generator -Check once
8. existing JSON/version/release validations
9. git diff --check
```

关键：即使一次 release 修改多个 Skill，也只能在所有 Skill 修改完成后集中生成一次 registry；禁止在 changed-Skill 循环内反复 full scan。

## 3.3 版本与文件契约

将 `ai-plugins/skill-registry.json` 声明为 generated release artifact。

必须声明：

- 只允许 generator 生成，不人工维护。
- 不包含 timestamp/current commit SHA。
- 同一 working tree 输出 deterministic。
- Registry stale 为阻断错误。
- v1 只保存 discovery/search/entry 定位字段，不枚举 reference/template/example 文件。

## 3.4 禁止完成条件

增加：

- Skill tree 已变更但 registry stale。
- Registry 中 version 与 `SKILL.md` 不一致。
- Registry entry 指向不存在的 `SKILL.md`。
- Registry 不是 generator 当前 canonical 输出。
- 多 Skill release 在循环中重复生成 registry。

---

# 4. `README.md` 应修改什么

README 保持短小，但至少说明发布现在会：

```text
更新版本/marketplace/changelog
+
生成并验证 ai-plugins/skill-registry.json
```

并给出 standalone 诊断命令：

```powershell
./scripts/generate-skill-registry.ps1 -Check
```

README 不复制完整 schema。

---

# 5. `references/release-contract.md` 应修改什么

新增 Registry Contract 小节，覆盖：

- generator path。
- output path。
- source roots。
- minimal v1 schema。
- deterministic requirements。
- Check/Apply behavior。
- full-scan deletion/rename semantics。
- 多 Skill release 只生成一次 registry。
- Cloud MCP exact-commit semantics。
- CI stale gate。

这份 reference 负责字段级约束；SKILL.md 只保留执行摘要。

---

# 6. `release-ai-plugins.ps1` 写入白名单

新增：

```text
ai-plugins/skill-registry.json
```

到允许写入集合。

注意：

- 该文件只由 generator 负责实际序列化。
- 主脚本只允许它成为预期 diff。
- 不因为 registry 放宽整个 `ai-plugins/**` 写权限。

推荐显式变量：

```powershell
$SkillRegistry = "ai-plugins/skill-registry.json"
```

---

# 7. 主脚本如何调用 Generator

推荐独立 helper：

```text
Invoke-SkillRegistryGenerator
```

## DryRun

如果 metadata.version 尚未实际写入 working tree，主 release DryRun 不需要伪造未来 registry bytes。

推荐行为：

```text
报告：registry will be regenerated on Apply
不写 registry
```

standalone CI/诊断继续使用 generator `-Check` 校验当前 working tree。

## Apply

所有 Skill / manifest / changelog 变更写入后：

```text
generator -Apply
        ↓
generator -Check
```

Generator failure 必须阻断 release。

---

# 8. 高频批量维护调用规则

这是本改造的重要维护约束。

一次 release 可能同时包含：

```text
Skill A body 修改
Skill B description 修改
Skill C 新增
Skill D reference/template 修改
```

主脚本应：

1. 先完成全部 Skill version 计划/写入。
2. 再完成共享 manifest / changelog 等工作。
3. 最后只生成一次完整 registry。

禁止：

```text
foreach ($SkillChanges) {
  generate registry
}
```

Generator 的 O(N) full scan 是有意设计；Skill 总量中等时，一次 full scan 比维护增量状态机更可靠。

---

# 9. `metadata.version` 与 Registry 的关系

Registry 复制每个 Skill 自己的：

```yaml
metadata:
  version: "x.y.z"
```

不是 plugin 主版本。

正文/reference/template 发生真实行为变化时，按现有 release 规则升级该 Skill version；registry 通常只需要反映新的 version，而不复制深层文件清单。

---

# 10. 新增 Skill

完整链路：

```text
new skill directory
  ↓
README entry exists
  ↓
initialize metadata.version if needed
  ↓
release consistency updates
  ↓
final full-scan generator discovers new directory
  ↓
new registry entry
```

Generator 不接收 `-NewSkill` 参数。

---

# 11. 修改 Skill

```text
body/reference/template change
  ↓
release-ai-plugins bumps metadata.version
  ↓
final generator regenerates registry
```

因为 v1 不枚举 references/templates/examples，附属文件变化不会额外改变 registry 文件列表；Skill version + exact commit SHA 已足以表达“这是新的一版 Skill 内容”。

---

# 12. 删除 Skill

Generator 基于当前目录全量重建，因此删除目录后 entry 自动消失。

主 release script 至少保证 Apply 后 generator 能清理 entry。

如果当前参数模型无法显式表达删除，不必立刻增加复杂 CLI；优先让 full scan + CI stale check 正确工作。

---

# 13. 重命名 Skill

Registry 语义：

```text
remove old id
+
add new id
```

Generator 不做 Git rename detection，只输出当前树最终状态。

CHANGELOG 如何表达 rename 属于 release orchestration 层。

---

# 14. 错误信息要求

Stale：

```text
[ERROR] skill-registry.json 已过期。
Run:
  powershell ... generate-skill-registry.ps1 -Apply
```

字段错误：

```text
[ERROR] Skill `foo` 缺少 metadata.version: .../foo/SKILL.md
```

重复 id：

```text
[ERROR] Duplicate skill id `foo` found in common-tools and dev-skills.
```

不要只输出 `registry invalid`。

---

# 15. 不应加入的职责

不要让 `release-ai-plugins`：

- resolve GitHub remote branch HEAD。
- 获取 commit SHA 后写回 registry。
- 上传 Cloudflare KV/R2。
- 部署 Worker。
- 调用 ChatGPT MCP endpoint。
- 维护 MCP session/cache。
- 维护增量 registry state/database。
- 为 references/templates/examples 维护第二份文件索引。

职责止于：

```text
working tree release state -> deterministic committed registry
```

---

# 16. Skill 自身版本升级

实际实现本改造时，`release-ai-plugins` 自身发生功能扩展，应按仓库既有 SemVer 规则升级其 `metadata.version`，并进入正常 CHANGELOG / plugin release 流程。

Generator 在最终 full scan 时自然读取新 version。

---

# 17. 性能与增长边界

不要提前根据 Skill 数量设计复杂阈值。

只在真实测量显示 generator/CI full scan 成为明显瓶颈时优化。

优先：

- 避免重复读取同一 `SKILL.md`。
- 避免对每个 Skill 启动外部进程。
- 保持扫描范围严格限制两个 roots。

不要直接升级为数据库、增量索引服务或 Cloudflare storage。

详细策略见 `high-frequency-maintenance-and-growth-strategy.md`。

---

# 18. Definition of Done

- [ ] SKILL.md 职责更新。
- [ ] README 增加 registry 行为说明。
- [ ] release-contract 增加 minimal registry 契约。
- [ ] 主脚本白名单包含 registry。
- [ ] DryRun 零写入。
- [ ] Apply 在所有 Skill 更新后只运行一次 generator Apply。
- [ ] 最终只运行一次 generator Check。
- [ ] 新增 Skill 自动出现。
- [ ] 删除 Skill 自动消失。
- [ ] 重命名得到最终树状态。
- [ ] Skill version 与 registry 一致。
- [ ] Registry v1 不枚举 references/templates/examples。
- [ ] 原 release 安全模型未被削弱。
- [ ] 高频批量维护没有引入增量状态机或重复 full scan。
