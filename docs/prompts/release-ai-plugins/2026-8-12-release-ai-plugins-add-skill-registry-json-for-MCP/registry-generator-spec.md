# `generate-skill-registry.ps1` 实施规格

## 1. 目标

新增独立脚本：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

该脚本是 `ai-plugins/skill-registry.json` 的**唯一生成入口**。

职责：

```text
scan
→ parse
→ validate
→ normalize
→ sort
→ serialize
→ compare/write
```

不负责 release orchestration。

本生成器按“Skill 数量中等、更新频率高”设计：保持无状态、全量重建、低 churn schema，不引入增量索引复杂度。

---

# 2. Runtime 约束

必须：

- Windows PowerShell 5.1 兼容。
- PowerShell 7 可运行。
- 不依赖第三方 PowerShell module。
- 不要求 Node/Python。
- 从脚本路径向上自动定位仓库根。

与当前 `release-ai-plugins.ps1` 的工具链保持一致。

---

# 3. CLI 设计

推荐：

```powershell
generate-skill-registry.ps1 -Check
generate-skill-registry.ps1 -Apply
```

## `-Check`

- 生成 expected registry 到内存/临时字符串。
- 读取当前 `ai-plugins/skill-registry.json`。
- 比较 canonical text。
- 一致 -> exit 0。
- stale/missing/invalid -> exit non-zero。
- 不写文件。

## `-Apply`

- 生成 expected registry。
- 写入目标文件。
- 再执行等价 Check。
- 成功 -> exit 0。

`-Check` 与 `-Apply` 互斥。

若未指定模式，推荐默认 `-Check`，符合现有“默认不写”的安全哲学。

---

# 4. 固定扫描范围

第一版固定扫描：

```text
ai-plugins/common-tools/skills/*/SKILL.md
ai-plugins/dev-skills/skills/*/SKILL.md
```

只认直接子目录作为一个 Skill。

禁止递归把 `references/`、`templates/`、`examples/` 中的 Markdown 当成独立 Skill。

同时，第一版 registry 不枚举这些附属目录的文件列表，因此 generator 无需递归扫描它们。

---

# 5. Skill ID

第一版：

```text
id = skill directory name
```

目录名必须满足：

```regex
^[a-z0-9][a-z0-9-]*$
```

如果两个 plugin roots 出现相同 id，generator 必须失败，不允许通过 `plugin/id` 自动消歧。

---

# 6. Frontmatter 解析

必须从 `SKILL.md` 顶部 YAML frontmatter 获取：

```text
name
description
metadata.version
```

第一版不要为了完整 YAML 支持引入第三方 parser。

可以沿用当前 release 脚本的受约束 frontmatter 解析策略，但 generator parser 必须有专门测试。

要求：

- 识别 `---` 开闭边界。
- `name` 必填。
- `description` 必填。
- `metadata.version` 必填。
- version 必须为 `MAJOR.MINOR.PATCH`。
- 不因为正文中出现 `version:` 误解析。

---

# 7. Description 规范化

Frontmatter description 可以是单行或 folded YAML。

Registry 输出标准 JSON string：

- folded 内容语义折叠为空格。
- 去除首尾无意义空白。
- 不复制 YAML 标记。
- 不保留平台相关换行差异。

同一 frontmatter 在 Windows/Linux 生成结果一致。

---

# 8. Plugin 字段

根据 root 派生：

```text
common-tools
或
dev-skills
```

禁止从 marketplace/plugin.json 反向推断。

---

# 9. Entry Path

固定为 repo-relative POSIX path：

```text
ai-plugins/<plugin>/skills/<id>/SKILL.md
```

即使 generator 在 Windows 上运行，也必须输出 `/`，不能输出 `\`。

禁止绝对路径。

---

# 10. 第一版不扫描/枚举附属文件

Registry v1 不包含：

```text
references
templates
examples
```

因此 generator 不需要：

- 递归枚举 references。
- 递归枚举 templates/examples。
- 为附属文件生成 path list/hash。

原因：

- 这些字段不是 discovery/search 必需。
- 高频维护时它们变化频繁，会产生无意义 registry churn。
- Cloud MCP 在 Skill 被选中后按 exact commit SHA 从 `SKILL.md` 的真实引用按需加载即可。

不要因为旧设计曾包含 `references[]` 而重新加回。

---

# 11. 不生成动态字段

严禁：

```text
generatedAt
updatedAt
hostname
username
absolutePath
branch HEAD
current commit SHA
random UUID
```

这些字段破坏 deterministic output 或制造环境/commit 耦合。

---

# 12. 排序规则

固定：

1. roots 使用 schema 契约固定顺序。
2. `skills` 按 `id` ordinal/ASCII 升序。
3. JSON object 属性使用固定手写顺序。

不要依赖普通 hashtable 默认遍历顺序作为序列化契约。

建议使用 `[ordered]` hashtable 或显式对象构造。

---

# 13. JSON 序列化

必须明确：

- UTF-8。
- 无 BOM（若仓库统一规范另有要求，应同步修改契约）。
- 2 空格 indentation。
- LF line ending。
- 文件末尾一个 newline。
- 无 trailing whitespace。

PowerShell 5.1 默认编码容易产生 UTF-16/BOM，不得依赖未经控制的 `Out-File` 默认行为。

---

# 14. Deterministic Test

必须证明：

```text
run generator
hash output = X
run generator again
hash output = X
```

并覆盖 CRLF/LF 输入差异不改变 registry semantic/canonical output。

---

# 15. Check 比较策略

比较最终 canonical text，而不是只 parse JSON 后比较对象。

这样 CI 同时约束：

- 排序。
- indentation。
- encoding/line ending contract。
- final newline。

```text
expected canonical text == committed text
```

才是 PASS。

---

# 16. Missing Registry

`-Check` 时目标文件不存在应失败并提示：

```text
Run generate-skill-registry.ps1 -Apply
```

`-Apply` 允许首次创建。

---

# 17. Path Validation

生成前/后必须保证：

- 每个 `entry` path 存在。
- entry 位于对应 Skill 目录内。
- 不允许 `..` path escape。
- 不引用仓库外文件。

第一版无需为附属文件目录建立第二套 path validation/index。

---

# 18. Duplicate / Invalid Skill

以下必须阻断：

- duplicate id。
- invalid directory name。
- missing SKILL.md。
- missing frontmatter。
- missing name。
- missing description。
- missing metadata.version。
- invalid semver。
- entry path 逃逸。

不要“尽量生成部分 registry”。发布索引必须是完整闭包。

---

# 19. 删除与重命名

Generator 永远从当前 tree 全量重建，old registry 不作为输入。

因此：

- 删除 Skill -> entry 自动消失。
- 重命名 -> old id 消失/new id 出现。

不做 Git rename detection，不维护增量 state。

---

# 20. 高频批量发布调用规则

Generator 可以独立运行，但被 `release-ai-plugins.ps1` 调用时必须避免 per-Skill 重复执行。

正确：

```text
all Skill version/content updates
        |
        v
one generator -Apply
        |
        v
one final generator -Check
```

错误：

```text
for each changed Skill -> generator -Apply
```

中等 Skill 数量下，一次 O(N) full scan 比增量状态机更简单可靠。

---

# 21. 日志输出

建议：

```text
[INFO] common-tools skills: N
[INFO] dev-skills skills: M
[INFO] total skills: X
[OK] registry is current
```

Apply 可额外报告 added/removed/changed discovery entry 数量，但不要把完整 Skill 正文/完整 registry 输出到日志。

---

# 22. 与主 release 脚本的调用契约

Generator 必须可被：

```text
release-ai-plugins.ps1
CI
developer/manual debugging
```

独立复用。

不要依赖主脚本进程中的隐式 global state。

主 release Apply 推荐：

```powershell
& $GeneratorPath -Apply
if ($LASTEXITCODE -ne 0) { Fail ... }

& $GeneratorPath -Check
if ($LASTEXITCODE -ne 0) { Fail ... }
```

实际错误处理方式与现有脚本风格统一。

---

# 23. 何时才优化 Full Scan

不要预先设置 Skill 数量阈值。

只有真实性能数据证明 generator/CI 扫描成为明显瓶颈时才优化。

优先优化：

- 避免重复读取同一 SKILL.md。
- 优化 frontmatter parser。
- 严格限制扫描两个 Skill roots。

不要直接升级为数据库/增量索引服务。

---

# 24. Definition of Done

- [ ] PowerShell 5.1 / 7 兼容设计。
- [ ] Check 默认只读。
- [ ] Apply 唯一目标是 registry。
- [ ] 两个 roots 全量扫描。
- [ ] duplicate id 阻断。
- [ ] frontmatter 三字段正确解析。
- [ ] POSIX repo-relative entry path。
- [ ] 不枚举 references/templates/examples。
- [ ] deterministic 排序和序列化。
- [ ] UTF-8/LF/final newline 明确。
- [ ] 无动态字段。
- [ ] 删除/重命名通过 full scan 自然处理。
- [ ] 多 Skill release 只运行一次 Apply + 一次最终 Check。
- [ ] CI 可独立调用。
- [ ] 不存在增量 registry state/database。
