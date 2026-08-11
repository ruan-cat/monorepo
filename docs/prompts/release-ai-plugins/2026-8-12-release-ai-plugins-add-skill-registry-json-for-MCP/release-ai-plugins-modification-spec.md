# `release-ai-plugins` 改造规格

## 1. 目标

本文规定现有 `release-ai-plugins` 技能为了支持 `ai-plugins/skill-registry.json` 应如何改造。

原则：

> 增加 registry 发布一致性能力，但不改变现有“单一发布入口、严格白名单、DryRun 默认、Apply 才写入、失败即停止”的安全模型。

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

因此 SKILL.md 中“核心职责固定为四项”的描述必须更新，不得继续留下旧契约。

---

# 3. `SKILL.md` 应修改什么

## 3.1 description

需要加入可检索触发词，例如：

```text
skill-registry.json
Skill Router MCP
MCP skill registry
registry stale
skill discovery manifest
```

但 description 不应膨胀成实现文档。

## 3.2 强制执行顺序

新增 registry 阶段，放在 Skill version 已完成更新之后、最终 `git diff --check` 之前。

推荐：

```text
1. input / changed skill validation
2. bump changed Skill metadata.version
3. update plugin manifests / marketplaces
4. update CHANGELOG
5. validate new-skill README
6. generate ai-plugins/skill-registry.json
7. validate registry freshness/schema/paths
8. existing JSON/version/release validations
9. git diff --check
```

实际编号可按当前脚本结构调整，但数据依赖顺序不能改变。

## 3.3 版本与文件契约

将：

```text
skill-registry.json
```

声明为 generated release artifact。

必须同时声明：

- 只允许 generator 生成，不人工维护。
- 不包含 timestamp/current commit SHA。
- 同一 working tree 输出 deterministic。
- Registry stale 为阻断错误。

## 3.4 禁止完成条件

增加：

- Skill tree 已变更但 registry stale。
- Registry 中的 version 与 `SKILL.md` 不一致。
- Registry 指向不存在的 entry/reference path。
- Registry 不是 generator 当前输出。

---

# 4. `README.md` 应修改什么

README 保持短小，但至少说明发布现在会：

```text
更新版本/marketplace/changelog
+
生成并验证 ai-plugins/skill-registry.json
```

并给出：

```powershell
./scripts/generate-skill-registry.ps1 -Check
```

作为 standalone registry diagnosis 命令。

README 不需要复制完整 schema。

---

# 5. `references/release-contract.md` 应修改什么

新增完整 Registry Contract 小节，覆盖：

- generator path。
- output path。
- source roots。
- schema version。
- deterministic requirements。
- Check/Apply behavior。
- deletion/rename semantics。
- Cloud MCP exact-commit semantics。
- CI stale gate。

这份 reference 负责字段级约束；SKILL.md 只保留执行摘要。

---

# 6. `release-ai-plugins.ps1` 写入白名单

现有脚本明确维护允许写入集合。

新增：

```text
ai-plugins/skill-registry.json
```

但注意：

- 该文件只由 generator 负责实际序列化。
- 主脚本负责允许它作为本次 release 的预期 diff。
- 不要因为新增 registry 而放宽整个 `ai-plugins/**` 写权限。

推荐显式变量：

```powershell
$SkillRegistry = "ai-plugins/skill-registry.json"
```

最终 expected-file / whitelist 检查应包含它。

---

# 7. 主脚本如何调用 Generator

推荐独立 helper：

```text
Invoke-SkillRegistryGenerator
```

语义：

## DryRun

```text
build expected registry
compare current committed/working file
report expected change
DO NOT write
```

这里有两个合理实现：

### 方案 A：generator `-Check` 仅判断当前文件是否匹配

如果 release DryRun 前 metadata.version 尚未实际写入 working tree，那么 generator 无法看到“拟更新后的版本”。此时主脚本需要先在内存里完成 planned content，再将计划后的 Skill 数据传给 generator，会明显增加耦合。

### 方案 B：主 release DryRun 继续只报告“registry will be regenerated”，最终 Apply 后才执行真实 generator，然后再 Check

这是更简单、更符合现有脚本安全模型的方案。

因此推荐：

> DryRun 不伪造未来 registry bytes，只报告 registry 为预期写入项；Apply 完成 Skill version 写入后真实运行 generator，再执行 Check。

同时 standalone CI 使用 generator `-Check` 校验当前 working tree。

---

# 8. Apply 顺序

Apply 模式必须遵循：

```text
write changed SKILL.md versions
write plugin / marketplace / changelog changes
validate README
run generator -Apply
run generator -Check
run all existing release validation
run git diff --check
```

Generator failure 应直接使主 release 非零退出。

---

# 9. `metadata.version` 与 Registry 的关系

Registry 复制的是 Skill 自己的：

```yaml
metadata:
  version: "x.y.z"
```

不是 plugin 主版本。

因此一个 plugin release 可以产生：

```text
plugin version: 9.1.0
skill A: 1.4.2
skill B: 0.8.0
skill C: 3.0.1
```

Registry 对每个 skill 保存自己的 version。

禁止把所有 Skill registry version 强行改成 plugin version。

---

# 10. 新增 Skill

`-NewSkill` 当前已有 README 阻断行为，应保留。

新的完整链路：

```text
new skill directory
  ↓
README entry exists
  ↓
initialize metadata.version if needed
  ↓
release consistency updates
  ↓
generator discovers new directory
  ↓
new registry entry
```

Generator 不需要接收 `-NewSkill` 参数；它只扫描当前树。

---

# 11. 修改 Skill

修改一个 Skill：

```text
body/reference change
  ↓
release-ai-plugins bumps metadata.version
  ↓
generator regenerates registry
```

即使 registry 不复制正文，version 变化也会体现 Skill 发布状态；正文由云 MCP 按同一 commit SHA 直接加载。

---

# 12. 删除 Skill

Generator 必须基于当前目录实际存在情况全量重建，所以删除目录后 entry 自动消失。

主 release script 需要至少做到：

- 不因为旧 registry entry 不存在对应目录而静默成功。
- Apply 后 generator 能清理 entry。
- README / marketplace 是否需同步由现有发布契约决定。

如果当前 release 参数模型无法显式表达删除，不必立刻新增复杂 CLI；可以优先让全量 generator + CI stale check 正确工作，再单独增强删除发布体验。

---

# 13. 重命名 Skill

Git 层面的 rename 在 registry 语义上等价于：

```text
remove old id
+
add new id
```

如果 `id` 来源是目录名，则 generator 不需要做 rename detection。

它只应输出当前树的最终状态。

若需要 CHANGELOG 显示 rename，属于 release orchestration 层，不应污染 generator。

---

# 14. 错误信息要求

Registry 相关错误必须能直接指导修复。

推荐格式：

```text
[ERROR] skill-registry.json 已过期。
Expected registry differs from ai-plugins/skill-registry.json.
Run:
  powershell ... generate-skill-registry.ps1 -Apply
```

字段错误：

```text
[ERROR] Skill `foo` 缺少 metadata.version: ai-plugins/dev-skills/skills/foo/SKILL.md
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

它的职责止于：

```text
working tree release state -> deterministic committed registry
```

---

# 16. Skill 自身版本升级

实际实现本改造时，`release-ai-plugins` 自身发生功能性扩展，因此应按仓库既有 SemVer 规则升级该 Skill 的 `metadata.version`，并进入正常 CHANGELOG / plugin release 流程。

不要为了避免 registry 自己出现在 registry 中而跳过 version bump。

正确做法是：

```text
修改 release-ai-plugins Skill
  ↓
按现有规则 bump version
  ↓
生成 registry
  ↓
registry 中 release-ai-plugins entry 自动得到新 version
```

---

# 17. Definition of Done

- [ ] SKILL.md 职责更新。
- [ ] README 增加 registry 行为说明。
- [ ] release-contract 增加 registry 契约。
- [ ] 主脚本白名单包含 registry。
- [ ] 主脚本 Apply 顺序正确。
- [ ] 主脚本最终执行 generator Check。
- [ ] 新增 Skill 自动出现。
- [ ] 删除 Skill 自动消失。
- [ ] 重命名得到最终树状态。
- [ ] Skill version 与 registry 一致。
- [ ] 现有 release 安全模型未被削弱。
